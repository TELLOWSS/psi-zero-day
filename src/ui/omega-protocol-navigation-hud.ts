import {
 OMEGA_FIELD_HEIGHT,
 OMEGA_FIELD_WIDTH,
 omegaFieldCurrentStep,
 type OmegaFieldPlan,
 type OmegaFieldPoint,
 type OmegaFieldProgress,
} from '../domain/omega-protocol-field';
import { omegaFieldNextRoute } from '../domain/omega-protocol-navigation';
import type { Hazard } from '../domain/patrol-survivors';
import type { OmegaCameraState } from './omega-protocol-camera';

function clamp(v: number, lo: number, hi: number): number {
 return v < lo ? lo : v > hi ? hi : v;
}

/** Browser- and mock-safe rounded rectangle path builder (never relies on ctx.roundRect). */
export function traceRoundedRect(
 ctx: CanvasRenderingContext2D,
 x: number,
 y: number,
 w: number,
 h: number,
 r: number,
): void {
 const rr = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
 ctx.beginPath();
 ctx.moveTo(x + rr, y);
 ctx.lineTo(x + w - rr, y);
 ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
 ctx.lineTo(x + w, y + h - rr);
 ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
 ctx.lineTo(x + rr, y + h);
 ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
 ctx.lineTo(x, y + rr);
 ctx.quadraticCurveTo(x, y, x + rr, y);
 ctx.closePath();
}

/** Projects a local field coordinate into screen pixel space using the live quarter-view camera. */
export function omegaProjectWorldToScreen(
 point: OmegaFieldPoint,
 camera: Pick<
  OmegaCameraState,
  'scale' | 'skewX' | 'groundYScale' | 'projectedOffsetX' | 'projectedOffsetY'
 >,
 fieldElevation = 0,
): OmegaFieldPoint {
 const mx = point.x + camera.skewX * point.y;
 const my = camera.groundYScale * (point.y - fieldElevation);
 return {
  x: (mx + camera.projectedOffsetX) * camera.scale,
  y: (my + camera.projectedOffsetY) * camera.scale,
 };
}

export interface OmegaTacticalRadarOptions {
 readonly width: number;
 readonly height: number;
 readonly field: Readonly<{ plan: OmegaFieldPlan; progress: OmegaFieldProgress }> | null;
 readonly hazards: readonly Hazard[];
 readonly player: OmegaFieldPoint;
 readonly facing: OmegaFieldPoint;
 readonly seconds: number;
 readonly compact: boolean;
 readonly canvasScale: number;
 readonly cleanHud: boolean;
 readonly worldWidth: number;
 readonly worldHeight: number;
}

/**
 * Renders the upgraded translucent glass tactical mini-radar with obstacle silhouettes,
 * active visibility-graph route overlay, rotating scan sweep, facing FOV cone, and threat blips.
 */
export function drawOmegaTacticalRadar(
 ctx: CanvasRenderingContext2D,
 opts: OmegaTacticalRadarOptions,
): void {
 const {
  width,
  height,
  field,
  hazards,
  player,
  facing,
  seconds,
  compact,
  canvasScale,
  cleanHud,
  worldWidth,
  worldHeight,
 } = opts;
 if (compact && cleanHud) return;
 if (!(width > 0) || !(height > 0) || !Number.isFinite(seconds)) return;

 const mw = compact
  ? Math.round(62 * canvasScale)
  : Math.max(82, Math.min(134, width * 0.165));
 const mh = (mw * worldHeight) / Math.max(1, worldWidth);
 const pad = compact ? Math.round(7 * canvasScale) : width < 600 ? 10 : 16;
 const framePad = compact ? Math.round(4 * canvasScale) : 6;
 const headerH = compact ? Math.round(12 * canvasScale) : 17;
 const mx = width - mw - pad - framePad;
 const my = compact
  ? Math.round(48 * canvasScale)
  : height < 440
    ? 56
    : 88;
 const frameX = mx - framePad;
 const frameY = my - headerH;
 const frameW = mw + framePad * 2;
 const frameH = mh + headerH + framePad;

 ctx.save();

 // 1. Outer translucent glass chassis.
 traceRoundedRect(ctx, frameX, frameY, frameW, frameH, compact ? 7 : 10);
 ctx.fillStyle = compact ? 'rgba(6,13,24,0.62)' : 'rgba(6,14,28,0.80)';
 ctx.fill();
 ctx.strokeStyle = 'rgba(103,232,249,0.34)';
 ctx.lineWidth = 1;
 ctx.stroke();

 // Top header bar text & status pulse LED.
 const headerFont = compact ? Math.max(7, Math.round(7.5 * canvasScale)) : 9.5;
 ctx.font = `800 ${headerFont}px system-ui,sans-serif`;
 ctx.fillStyle = '#8ce9f9';
 ctx.textAlign = 'left';
 ctx.fillText('SCAN', mx + 1, my - (compact ? Math.round(3.5 * canvasScale) : 5));
 ctx.fillStyle =
  field?.progress.phase === 'exit'
   ? '#6ee7b7'
   : field?.progress.phase === 'objective'
     ? '#67e8f9'
     : '#fb7185';
 ctx.beginPath();
 ctx.arc(
  mx + mw - 3,
  my - (compact ? Math.round(6 * canvasScale) : 8),
  compact ? 2.1 : 2.6,
  0,
  Math.PI * 2,
 );
 ctx.fill();

 // 2. Clipped inner map viewport.
 ctx.save();
 traceRoundedRect(ctx, mx, my, mw, mh, compact ? 4 : 6);
 ctx.clip();

 ctx.fillStyle = 'rgba(8,20,34,0.88)';
 ctx.fillRect(mx, my, mw, mh);

 // Faint tactical sector grid lines.
 ctx.strokeStyle = 'rgba(103,232,249,0.11)';
 ctx.lineWidth = 0.8;
 for (let gx = 1; gx < 3; gx++) {
  const x = mx + (mw * gx) / 3;
  ctx.beginPath();
  ctx.moveTo(x, my);
  ctx.lineTo(x, my + mh);
  ctx.stroke();
 }
 ctx.beginPath();
 ctx.moveTo(mx, my + mh * 0.5);
 ctx.lineTo(mx + mw, my + mh * 0.5);
 ctx.stroke();

 // Sweeping holographic scan wedge centered on player position.
 const px = mx + clamp(player.x / worldWidth, 0, 1) * mw;
 const py = my + clamp(player.y / worldHeight, 0, 1) * mh;
 const sweepAngle = (seconds * 1.45) % (Math.PI * 2);
 const sweepGrad = ctx.createRadialGradient?.(px, py, 1, px, py, Math.max(mw, mh) * 0.65);
 if (sweepGrad && typeof sweepGrad.addColorStop === 'function') {
  sweepGrad.addColorStop(0, 'rgba(103,232,249,0.16)');
  sweepGrad.addColorStop(1, 'rgba(103,232,249,0)');
  ctx.fillStyle = sweepGrad;
 } else {
  ctx.fillStyle = 'rgba(103,232,249,0.08)';
 }
 ctx.beginPath();
 ctx.moveTo(px, py);
 ctx.arc(px, py, Math.max(mw, mh) * 0.72, sweepAngle - 0.52, sweepAngle);
 ctx.closePath();
 ctx.fill();

 // Field obstacles, navigation route, and mission targets.
 if (field) {
  ctx.fillStyle = 'rgba(118,166,196,0.28)';
  for (const o of field.plan.obstacles) {
   ctx.fillRect(
    mx + (o.x / OMEGA_FIELD_WIDTH) * mw,
    my + (o.y / OMEGA_FIELD_HEIGHT) * mh,
    Math.max(2, (o.width / OMEGA_FIELD_WIDTH) * mw),
    Math.max(2, (o.height / OMEGA_FIELD_HEIGHT) * mh),
   );
  }

  const dest =
   field.progress.phase === 'exit'
    ? field.plan.exit
    : field.progress.phase === 'objective'
      ? omegaFieldCurrentStep(field.plan, field.progress)?.target
      : undefined;
  if (dest) {
   const route = omegaFieldNextRoute(
    player,
    dest,
    field.plan.obstacles,
    OMEGA_FIELD_WIDTH,
    OMEGA_FIELD_HEIGHT,
   );
   if (route && route.waypoints.length > 0) {
    ctx.strokeStyle =
     field.progress.phase === 'exit' ? 'rgba(110,231,183,0.72)' : 'rgba(103,232,249,0.72)';
    ctx.lineWidth = 1.3;
    ctx.setLineDash([3, 2.5]);
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (const wp of route.waypoints) {
     ctx.lineTo(
      mx + clamp(wp.x / worldWidth, 0, 1) * mw,
      my + clamp(wp.y / worldHeight, 0, 1) * mh,
     );
    }
    ctx.stroke();
    ctx.setLineDash([]);
   }
  }

  for (const [index, step] of field.plan.event.steps.entries()) {
   const done = index < field.progress.completedSteps;
   const active =
    field.progress.phase === 'objective' && index === field.progress.completedSteps;
   const sx = mx + clamp(step.target.x / worldWidth, 0, 1) * mw;
   const sy = my + clamp(step.target.y / worldHeight, 0, 1) * mh;
   const r = active ? 3.1 : 2.1;
   ctx.fillStyle = done ? '#6ee7b7' : active ? '#7ce9ff' : '#4d7996';
   ctx.beginPath();
   ctx.moveTo(sx, sy - r);
   ctx.lineTo(sx + r, sy);
   ctx.lineTo(sx, sy + r);
   ctx.lineTo(sx - r, sy);
   ctx.closePath();
   ctx.fill();
  }

  const ex = mx + clamp(field.plan.exit.x / worldWidth, 0, 1) * mw;
  const ey = my + clamp(field.plan.exit.y / worldHeight, 0, 1) * mh;
  ctx.fillStyle = field.progress.exitUnlocked ? '#86efac' : '#f59e0b';
  ctx.fillRect(ex - 2.6, ey - 2.6, 5.2, 5.2);
 }

 // Hostile blips.
 for (const h of hazards.slice(0, 32)) {
  if (h.hp <= 0) continue;
  const dotX = mx + clamp(h.x / worldWidth, 0, 1) * mw;
  const dotY = my + clamp(h.y / worldHeight, 0, 1) * mh;
  if (h.isStageBoss) {
   ctx.fillStyle = '#fde047';
   ctx.beginPath();
   ctx.arc(dotX, dotY, compact ? 3.3 : 4.2, 0, Math.PI * 2);
   ctx.fill();
  } else {
   ctx.fillStyle = h.type === 'RUNAWAY_CART' ? '#fbbf24' : '#fb7185';
   ctx.beginPath();
   ctx.arc(dotX, dotY, compact ? 1.9 : 2.3, 0, Math.PI * 2);
   ctx.fill();
  }
 }

 // AIRA directional facing cone + core blip.
 const aimAngle = Math.atan2(facing.y || 0, facing.x || 1);
 if (Number.isFinite(aimAngle)) {
  ctx.fillStyle = 'rgba(145,255,240,0.22)';
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, compact ? 11 : 15, aimAngle - 0.45, aimAngle + 0.45);
  ctx.closePath();
  ctx.fill();
 }
 ctx.fillStyle = '#a7ffeb';
 ctx.beginPath();
 ctx.arc(px, py, compact ? 2.6 : 3.2, 0, Math.PI * 2);
 ctx.fill();

 ctx.restore();

 // Crisp inner viewport border.
 traceRoundedRect(ctx, mx, my, mw, mh, compact ? 4 : 6);
 ctx.strokeStyle = 'rgba(126,205,227,0.42)';
 ctx.lineWidth = 1;
 ctx.stroke();

 ctx.restore();
}

export interface OmegaEdgeIndicatorOptions {
 readonly width: number;
 readonly height: number;
 readonly camera: Pick<
  OmegaCameraState,
  'scale' | 'skewX' | 'groundYScale' | 'projectedOffsetX' | 'projectedOffsetY'
 >;
 readonly field: Readonly<{ plan: OmegaFieldPlan; progress: OmegaFieldProgress }> | null;
 readonly hazards: readonly Hazard[];
 readonly player: OmegaFieldPoint;
 readonly fieldElevation: number;
 readonly seconds: number;
 readonly cleanHud: boolean;
 readonly compact: boolean;
}

interface EdgeBeaconCandidate {
 readonly point: OmegaFieldPoint;
 readonly colorHex: string;
 readonly colorRgb: string;
 readonly label: string | null;
 readonly size: number;
}

/**
 * Renders sleek screen-perimeter directional beacons for off-screen active consoles,
 * unlocked extraction exits, bosses, and off-screen threats during close-camera play.
 */
export function drawOmegaEdgeNavigationIndicators(
 ctx: CanvasRenderingContext2D,
 opts: OmegaEdgeIndicatorOptions,
): void {
 const {
  width,
  height,
  camera,
  field,
  hazards,
  player,
  fieldElevation,
  seconds,
  cleanHud,
  compact,
 } = opts;
 if (!(width > 80) || !(height > 80) || !Number.isFinite(seconds)) return;

 const candidates: EdgeBeaconCandidate[] = [];

 if (field) {
  const dest =
   field.progress.phase === 'exit'
    ? field.plan.exit
    : field.progress.phase === 'objective'
      ? omegaFieldCurrentStep(field.plan, field.progress)?.target
      : undefined;
  if (dest) {
   const route = omegaFieldNextRoute(
    player,
    dest,
    field.plan.obstacles,
    OMEGA_FIELD_WIDTH,
    OMEGA_FIELD_HEIGHT,
   );
   const wayTarget = route ? route.next : dest;
   const distMeters = Math.max(1, Math.round((route ? route.length : Math.hypot(dest.x - player.x, dest.y - player.y)) / 18));
   const isExit = field.progress.phase === 'exit';
   candidates.push({
    point: wayTarget,
    colorHex: isExit ? '#6ee7b7' : '#67e8f9',
    colorRgb: isExit ? '110,231,183' : '103,232,249',
    label: `${isExit ? '출구' : '목표'} ${distMeters}m`,
    size: 10,
   });
  }
 }

 const live = hazards.filter((h) => h.hp > 0);
 const boss = live.find((h) => h.isStageBoss);
 if (boss) {
  candidates.push({
   point: boss,
   colorHex: '#fbbf24',
   colorRgb: '251,191,36',
   label: 'BOSS',
   size: 11,
  });
 }

 if (!cleanHud) {
  const others = live
   .filter((h) => !h.isStageBoss)
   .sort(
    (a, b) =>
     Math.hypot(a.x - player.x, a.y - player.y) -
     Math.hypot(b.x - player.x, b.y - player.y),
   )
   .slice(0, 3);
  for (const enemy of others) {
   candidates.push({
    point: enemy,
    colorHex: '#fb7185',
    colorRgb: '251,113,133',
    label: null,
    size: 7.5,
   });
  }
 }

 if (candidates.length === 0) return;

 const marginX = compact ? 18 : 26;
 const marginTop = compact ? 54 : 68;
 const marginBottom = compact ? 58 : 82;
 const left = marginX;
 const right = Math.max(left + 10, width - marginX);
 const top = marginTop;
 const bottom = Math.max(top + 10, height - marginBottom);
 const cx = (left + right) * 0.5;
 const cy = (top + bottom) * 0.5;
 const pulse = 0.72 + 0.28 * Math.sin(seconds * 5.2);

 ctx.save();
 ctx.setTransform(1, 0, 0, 1, 0, 0);

 for (const c of candidates) {
  const screen = omegaProjectWorldToScreen(c.point, camera, fieldElevation);
  if (!Number.isFinite(screen.x) || !Number.isFinite(screen.y)) continue;
  // Already cleanly visible inside viewport interior -> no edge beacon needed.
  if (
   screen.x >= 18 &&
   screen.x <= width - 18 &&
   screen.y >= marginTop - 10 &&
   screen.y <= height - 24
  ) {
   continue;
  }

  const dx = screen.x - cx;
  const dy = screen.y - cy;
  const angle = Math.atan2(dy, dx);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const halfW = (right - left) * 0.5;
  const halfH = (bottom - top) * 0.5;
  const tx = Math.abs(cos) > 1e-5 ? halfW / Math.abs(cos) : Infinity;
  const ty = Math.abs(sin) > 1e-5 ? halfH / Math.abs(sin) : Infinity;
  const rayT = Math.min(tx, ty);
  const bx = cx + cos * rayT;
  const by = cy + sin * rayT;

  ctx.save();
  ctx.translate(bx, by);
  ctx.save();
  ctx.rotate(angle);
  ctx.globalAlpha = c.label ? clamp(0.88 + 0.12 * pulse, 0, 1) : 0.72 * pulse;

  const s = c.size;
  ctx.fillStyle = `rgba(${c.colorRgb},0.28)`;
  ctx.strokeStyle = c.colorHex;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.75, -s * 0.68);
  ctx.lineTo(-s * 0.38, 0);
  ctx.lineTo(-s * 0.75, s * 0.68);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (c.label) {
   ctx.font = `800 ${compact ? 9 : 10}px system-ui,sans-serif`;
   const pillW = Math.max(40, c.label.length * 6.5 + 14);
   const pillH = compact ? 15 : 17;
   const ox = clamp(-cos * (pillW * 0.5 + 14), -pillW * 0.5 - 24, pillW * 0.5 + 24);
   const oy = clamp(-sin * 18, -18, 18);
   const px = clamp(ox - pillW * 0.5, 10 - bx, width - 10 - pillW - bx);
   const py = clamp(oy - pillH * 0.5, top - 14 - by, bottom - pillH - by);

   traceRoundedRect(ctx, px, py, pillW, pillH, 6);
   ctx.fillStyle = 'rgba(6,14,28,0.84)';
   ctx.fill();
   ctx.strokeStyle = c.colorHex;
   ctx.lineWidth = 1;
   ctx.stroke();

   ctx.fillStyle = c.colorHex;
   ctx.textAlign = 'center';
   ctx.fillText(c.label, px + pillW * 0.5, py + pillH * 0.71);
  }
  ctx.restore();
 }

 ctx.restore();
}
