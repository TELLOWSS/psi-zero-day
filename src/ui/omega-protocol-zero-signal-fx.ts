import { OMEGA_QUARTER_VIEW } from '../domain/omega-protocol-field';
import type { OmegaProtocolCombatSession } from '../engine/omega-protocol-combat';
import type { OmegaZeroSignalDirector } from '../engine/omega-protocol-zero-signal-director';
import {
 drawOmegaAuthoredSentryTurret,
 drawOmegaAuthoredSignalCore,
 drawOmegaAuthoredSignalReticle,
 drawOmegaAuthoredSwarmDrone,
} from './omega-protocol-entity-art';

/**
 * World-space and screen-space canvas VFX layers for 『OMEGA PROTOCOL: ZERO SIGNAL』:
 * Signal Mark enemy reticles, Magnetized Signal Core orbs, Guard Sentry turrets,
 * Site Aegis domes, Moonwaves, Swarm Drones, Detonation Shockwaves, Chain Lightning,
 * M01 Sniper Beams, Breaker Orbital EMP pillars, Phantom Dodge bullet-time veil, and callouts.
 */

function clamp(v: number, lo: number, hi: number): number {
 return v < lo ? lo : v > hi ? hi : v;
}

function seededOffset(seed: number, idx: number): number {
 const x = Math.sin(seed * 12.9898 + idx * 78.233) * 43758.5453;
 return (x - Math.floor(x)) * 2 - 1;
}

/**
 * Renders floor-level combat scorch craters, cooling ember fractures, and real-time
 * wet-deck bounce lighting from explosions, plasma moonwaves, and railgun/orbital beams.
 * Drawn directly after ground surfaces and BEFORE depth-sorted props and actors.
 */
export function drawOmegaZeroSignalGroundFx(
 ctx: CanvasRenderingContext2D,
 director: OmegaZeroSignalDirector,
 seconds: number,
): void {
 const hasScorches = director.scorches.length > 0;
 const hasLights =
  director.detonations.length > 0 || director.beams.length > 0 || director.waves.length > 0;
 if (!hasScorches && !hasLights) return;

 const invY = 1 / OMEGA_QUARTER_VIEW.groundYScale;
 const gY = OMEGA_QUARTER_VIEW.groundYScale;

 ctx.save();

 // 1. Persistent carbonized scorch decals & cooling fracture lines on the deck.
 for (const sc of director.scorches) {
  const p = clamp(sc.age / Math.max(0.01, sc.duration), 0, 1);
  const fade = Math.pow(1 - p, 1.35);
  const heatFade = p < 0.45 ? Math.pow(1 - p / 0.45, 1.2) : 0;
  ctx.save();
  ctx.translate(sc.x, sc.y + 4);
  ctx.scale(1, gY);

  const crater = ctx.createRadialGradient?.(0, 0, sc.radius * 0.1, 0, 0, sc.radius);
  if (crater && typeof crater.addColorStop === 'function') {
   crater.addColorStop(0, `rgba(3,7,14,${(0.56 * fade).toFixed(3)})`);
   crater.addColorStop(0.65, `rgba(6,12,22,${(0.34 * fade).toFixed(3)})`);
   crater.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = crater;
  } else {
   ctx.fillStyle = `rgba(3,7,14,${(0.45 * fade).toFixed(3)})`;
  }
  ctx.beginPath();
  ctx.arc(0, 0, sc.radius, 0, Math.PI * 2);
  ctx.fill();

  // Four radiating surface crack fractures inside crater.
  ctx.strokeStyle = `rgba(4,9,18,${(0.55 * fade).toFixed(3)})`;
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 4; i++) {
   const a = seededOffset(sc.x + sc.y, i) * Math.PI + (i * Math.PI) / 2;
   ctx.beginPath();
   ctx.moveTo(Math.cos(a) * sc.radius * 0.14, Math.sin(a) * sc.radius * 0.14);
   ctx.lineTo(Math.cos(a) * sc.radius * 0.78, Math.sin(a) * sc.radius * 0.78);
   ctx.stroke();
  }

  if (heatFade > 0.02) {
   ctx.globalCompositeOperation = 'lighter';
   ctx.strokeStyle = `rgba(${sc.colorRgb},${(0.34 * heatFade).toFixed(3)})`;
   ctx.lineWidth = 2.4;
   ctx.beginPath();
   ctx.arc(0, 0, sc.radius * (0.48 + (1 - heatFade) * 0.14), 0, Math.PI * 2);
   ctx.stroke();
  }
  ctx.restore();
 }

 // 2. Real-time wet-floor bounce lighting under active detonations, beams & waves.
 ctx.globalCompositeOperation = 'lighter';

 for (const d of director.detonations) {
  const p = clamp(d.age / Math.max(0.01, d.duration), 0, 1);
  const fade = Math.pow(1 - p, 1.3);
  const r = d.radius * (0.75 + 0.45 * p);
  const col = d.stacks >= 3 ? '251,191,36' : '103,232,249';
  ctx.save();
  ctx.translate(d.x, d.y + 4);
  ctx.scale(1, gY);
  const glow = ctx.createRadialGradient?.(0, 0, 4, 0, 0, r);
  if (glow && typeof glow.addColorStop === 'function') {
   glow.addColorStop(0, `rgba(255,255,255,${(0.32 * fade).toFixed(3)})`);
   glow.addColorStop(0.45, `rgba(${col},${(0.28 * fade).toFixed(3)})`);
   glow.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = glow;
   ctx.beginPath();
   ctx.arc(0, 0, r, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.restore();
 }

 for (const b of director.beams) {
  const fade = clamp(1 - b.age / Math.max(0.01, b.duration), 0, 1);
  const gx1 = b.x1;
  const gy1 = b.y1 + 24 * invY;
  const gx2 = b.x2;
  const gy2 = b.y2 + (b.isPillar ? 0 : 22 * invY);
  const beamGlow = ctx.createLinearGradient?.(gx1, gy1, gx2, gy2);
  if (beamGlow && typeof beamGlow.addColorStop === 'function') {
   beamGlow.addColorStop(0, `rgba(${b.colorRgb},${(0.18 * fade).toFixed(3)})`);
   beamGlow.addColorStop(0.5, `rgba(${b.colorRgb},${(0.24 * fade).toFixed(3)})`);
   beamGlow.addColorStop(1, `rgba(255,255,255,${(0.34 * fade).toFixed(3)})`);
   ctx.strokeStyle = beamGlow;
  } else {
   ctx.strokeStyle = `rgba(${b.colorRgb},${(0.22 * fade).toFixed(3)})`;
  }
  ctx.lineWidth = (b.isPillar ? 68 : 44) * fade;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(gx1, gy1);
  ctx.lineTo(gx2, gy2);
  ctx.stroke();
 }

 for (const wv of director.waves) {
  const fade = clamp(1 - wv.age / Math.max(0.01, wv.duration), 0, 1);
  const col = wv.crimson ? '244,114,182' : '103,232,249';
  const shimmer = 0.85 + 0.15 * Math.sin(seconds * 18);
  ctx.save();
  ctx.translate(wv.x, wv.y + 4);
  ctx.scale(1, gY);
  const wg = ctx.createRadialGradient?.(0, 0, 2, 0, 0, wv.radius * 0.95);
  if (wg && typeof wg.addColorStop === 'function') {
   wg.addColorStop(0, `rgba(${col},${(0.26 * fade * shimmer).toFixed(3)})`);
   wg.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = wg;
   ctx.beginPath();
   ctx.arc(0, 0, wv.radius * 0.95, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.restore();
 }

 ctx.restore();
}

export function drawOmegaZeroSignalWorldFx(
 ctx: CanvasRenderingContext2D,
 director: OmegaZeroSignalDirector,
 session: OmegaProtocolCombatSession,
 seconds: number,
): void {
 const state = session.engine.state;
 const invY = 1 / OMEGA_QUARTER_VIEW.groundYScale;
 const skew = OMEGA_QUARTER_VIEW.skewX;

 ctx.save();

 // 1. Active Site Team Aegis Domes on ground & surrounding AIRA.
 for (const dm of director.domes) {
  const fade = clamp(dm.remaining / Math.min(1, dm.duration * 0.25), 0.2, 1);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const aura = ctx.createRadialGradient?.(dm.x, dm.y, 12, dm.x, dm.y, dm.radius);
  if (aura && typeof aura.addColorStop === 'function') {
   aura.addColorStop(0, 'rgba(251,191,36,0.03)');
   aura.addColorStop(0.72, `rgba(112,240,189,${(0.16 * fade).toFixed(3)})`);
   aura.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = aura;
   ctx.beginPath();
   ctx.arc(dm.x, dm.y, dm.radius, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.strokeStyle = `rgba(253,224,71,${(0.62 * fade).toFixed(3)})`;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.ellipse(dm.x, dm.y, dm.radius, dm.radius * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
 }

 // 2. AIRA Energy Shield Halo + shield-absorb pulse + micro vitality arc under foot.
 const shFlash = director.currentShieldFlash();
 const hpFlash = director.currentHpDamageFlash();
 if ((director.currentShield() > 0 || shFlash > 0 || hpFlash > 0) && state.phase === 'playing') {
  const px = state.player.x;
  const py = state.player.y;
  const pulse = 0.65 + 0.35 * Math.sin(seconds * 5.2);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (director.currentShield() > 0) {
   ctx.strokeStyle = `rgba(103,232,249,${((0.36 + shFlash * 0.42) * pulse).toFixed(3)})`;
   ctx.lineWidth = 2.2 + shFlash * 1.4;
   ctx.beginPath();
   ctx.ellipse(px, py + 4, 38 + shFlash * 5, 13 + shFlash * 2, 0, 0, Math.PI * 2);
   ctx.stroke();
  }
  if (shFlash > 0.05) {
   const rippleR = 32 + (1 - shFlash) * 28;
   ctx.strokeStyle = `rgba(56,189,248,${(shFlash * 0.78).toFixed(3)})`;
   ctx.lineWidth = 2.8 * shFlash + 1;
   ctx.beginPath();
   ctx.ellipse(px, py + 2, rippleR, rippleR * 0.38, 0, 0, Math.PI * 2);
   ctx.stroke();
  }
  const hpRatio = clamp(state.player.hp / Math.max(1, state.player.maxHp), 0, 1);
  if (hpFlash > 0.02 || hpRatio < 0.45) {
   const hpAlpha = Math.max(hpFlash * 0.85, hpRatio < 0.45 ? 0.52 + 0.25 * Math.sin(seconds * 7) : 0);
   ctx.strokeStyle = `rgba(251,113,133,${hpAlpha.toFixed(3)})`;
   ctx.lineWidth = 3.0;
   ctx.beginPath();
   ctx.ellipse(px, py + 7, 44, 15, 0, Math.PI * 0.12, Math.PI * (0.12 + 0.76 * hpRatio));
   ctx.stroke();
  }
  ctx.restore();
 }

 // 2.2 Empowered Combat Aura on AIRA when Overclocked or Rail Burst Ready.
 const overRem = director.currentOverclockRemaining();
 const railReady = director.currentRailCharge() >= 50;
 if (state.phase === 'playing' && (overRem > 0 || railReady)) {
  const px = state.player.x;
  const py = state.player.y - 34 * invY;
  const isFocus = director.getWeaponMode() === 'focus';
  const auraRgb =
   overRem > 0
    ? '103,232,249'
    : isFocus
      ? '251,191,36'
      : '224,249,255';
  const moteCount = overRem > 0 ? 3 : 2;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let m = 0; m < moteCount; m++) {
   const ang = seconds * (overRem > 0 ? 5.2 : 3.4) + (m * Math.PI * 2) / moteCount;
   const mx = px + Math.cos(ang) * 28;
   const my = py + Math.sin(ang) * 11 - Math.sin(seconds * 4 + m) * 4;
   const mg = ctx.createRadialGradient?.(mx, my, 0.5, mx, my, 9);
   if (mg && typeof mg.addColorStop === 'function') {
    mg.addColorStop(0, 'rgba(255,255,255,0.92)');
    mg.addColorStop(0.45, `rgba(${auraRgb},0.55)`);
    mg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mg;
   } else {
    ctx.fillStyle = `rgba(${auraRgb},0.65)`;
   }
   ctx.beginPath();
   ctx.arc(mx, my, 9, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.restore();
 }

 // 2.5 Active Gun Target-Lock Bracket, Laser Rangefinder Sightline & Detonate-Ready Floor Halos.
 if (state.phase === 'playing') {
  const locked = director.resolveLockedTarget(session);
  const px = state.player.x;
  const py = state.player.y;
  const isFocus = director.getWeaponMode() === 'focus';
  const lockRgb = director.currentOverclockRemaining() > 0
   ? '165,243,252'
   : isFocus
     ? '251,191,36'
     : '103,232,249';

  if (locked) {
   const pulse = 0.72 + 0.28 * Math.sin(seconds * 9);
   const startY = py - 42 * invY;
   const endY = locked.y - (locked.isStageBoss ? 48 : 30) * invY;
   ctx.save();
   ctx.globalCompositeOperation = 'lighter';
   const beamGrad = ctx.createLinearGradient?.(px, startY, locked.x, endY);
   if (beamGrad && typeof beamGrad.addColorStop === 'function') {
    beamGrad.addColorStop(0, `rgba(${lockRgb},0.06)`);
    beamGrad.addColorStop(0.7, `rgba(${lockRgb},${(0.24 * pulse).toFixed(3)})`);
    beamGrad.addColorStop(1, `rgba(255,255,255,${(0.55 * pulse).toFixed(3)})`);
    ctx.strokeStyle = beamGrad;
   } else {
    ctx.strokeStyle = `rgba(${lockRgb},0.28)`;
   }
   ctx.lineWidth = isFocus ? 1.8 : 1.3;
   ctx.setLineDash([7, 7]);
   ctx.lineDashOffset = -(seconds * 70) % 14;
   ctx.beginPath();
   ctx.moveTo(px, startY);
   ctx.lineTo(locked.x, endY);
   ctx.stroke();
   ctx.setLineDash([]);

   // Rotating tactical target-lock bracket at enemy ground plane.
   const r = Math.max(22, (locked.radius || 20) + 8);
   ctx.translate(locked.x, locked.y + 2);
   ctx.scale(1, OMEGA_QUARTER_VIEW.groundYScale);
   ctx.rotate(seconds * (isFocus ? 2.4 : 1.5));
   ctx.strokeStyle = `rgba(${lockRgb},${(0.78 * pulse).toFixed(3)})`;
   ctx.lineWidth = 1.9;
   for (let q = 0; q < 4; q++) {
    const a = (q * Math.PI) / 2 + Math.PI / 4;
    ctx.beginPath();
    ctx.arc(0, 0, r, a - 0.34, a + 0.34);
    ctx.stroke();
   }
   ctx.restore();
  }

  for (const h of state.hazards) {
   if (h.hp <= 0) continue;
   const stacks = director.markCount(h.id);
   if (stacks <= 0) continue;
   if (Math.hypot(h.x - px, h.y - py) > 178) continue;
   const pulse = 0.65 + 0.35 * Math.sin(seconds * 11);
   const r = Math.max(25, (h.radius || 20) + 12);
   ctx.save();
   ctx.globalCompositeOperation = 'lighter';
   ctx.strokeStyle =
    stacks >= 3
     ? `rgba(251,191,36,${(0.78 * pulse).toFixed(3)})`
     : `rgba(103,232,249,${(0.54 * pulse).toFixed(3)})`;
   ctx.lineWidth = stacks >= 3 ? 2.2 : 1.6;
   ctx.beginPath();
   ctx.ellipse(h.x, h.y + 3, r + pulse * 3, (r + pulse * 3) * OMEGA_QUARTER_VIEW.groundYScale, 0, 0, Math.PI * 2);
   ctx.stroke();
   ctx.restore();
  }
 }

 // 3. Signal Mark Reticles hovering cleanly above every marked enemy.
 for (const h of state.hazards) {
  if (h.hp <= 0) continue;
  const stacks = director.markCount(h.id);
  if (stacks <= 0) continue;
  const hScale = Math.max(0.8, Math.min(1.5, h.radius / 24));
  const headUprightY = h.isStageBoss
   ? -222
   : h.type === 'UNHELMETED'
     ? -(Math.round(78 * hScale) + 28)
     : -90;
  const mx = h.x - (skew * invY) * headUprightY;
  const my = h.y + headUprightY * invY;

  if (drawOmegaAuthoredSignalReticle(ctx, mx, my, stacks, seconds)) {
   continue;
  }

  ctx.save();
  ctx.translate(mx, my);
  ctx.globalCompositeOperation = 'lighter';
  if (stacks >= 3) {
   ctx.rotate(seconds * 3.8);
   ctx.strokeStyle = 'rgba(251,191,36,0.96)';
   ctx.lineWidth = 2.4;
   ctx.beginPath();
   ctx.arc(0, 0, 12, 0, Math.PI * 2);
   ctx.stroke();
   for (let d = 0; d < 4; d++) {
    const a = (d * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
    ctx.stroke();
   }
  }
  // Draw stack pip diamonds (-12 / 0 / +12) when not rotating center.
  ctx.rotate(stacks >= 3 ? -seconds * 3.8 : 0);
  for (let i = 0; i < stacks; i++) {
   const ox = (i - (stacks - 1) * 0.5) * 10;
   ctx.fillStyle = stacks >= 3 ? '#fde047' : stacks === 2 ? '#e879f9' : '#67e8f9';
   ctx.beginPath();
   ctx.moveTo(ox, -5);
   ctx.lineTo(ox + 4, 0);
   ctx.lineTo(ox, 5);
   ctx.lineTo(ox - 4, 0);
   ctx.closePath();
   ctx.fill();
  }
  ctx.restore();
 }

 // 4. Magnetized Signal Core Loot Orbs.
 for (const orb of director.orbs) {
  if (drawOmegaAuthoredSignalCore(ctx, orb.x, orb.y, seconds)) {
   continue;
  }
  const bob = Math.sin(seconds * 7 + orb.x) * 3;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient?.(orb.x, orb.y - 14 + bob, 1, orb.x, orb.y - 14 + bob, 16);
  if (g && typeof g.addColorStop === 'function') {
   g.addColorStop(0, 'rgba(255,255,255,0.95)');
   g.addColorStop(0.45, 'rgba(56,189,248,0.68)');
   g.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = g;
   ctx.beginPath();
   ctx.arc(orb.x, orb.y - 14 + bob, 16, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.restore();
 }

 // 5. Signal Guard Deployed Sentry Turrets.
 for (const t of director.turrets) {
  const lifeRatio = clamp(t.remaining / t.duration, 0, 1);
  if (drawOmegaAuthoredSentryTurret(ctx, t.x, t.y, t.aimAngle, lifeRatio, seconds)) {
   continue;
  }
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.fillStyle = 'rgba(0,8,16,0.48)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 22, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.transform(1, 0, -skew * invY, invY, 0, 0);

  // Armored tripod base + glowing emerald barrel.
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(0, -18);
  ctx.lineTo(16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.translate(0, -18);
  ctx.rotate(t.aimAngle);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-6, -6, 22, 10);
  ctx.fillStyle = '#6ee7b7';
  ctx.fillRect(6, -2.5, 16, 4);
  ctx.restore();

  // Remaining timer ring around base.
  ctx.strokeStyle = 'rgba(110,231,183,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -16, 20, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio);
  ctx.stroke();
  ctx.restore();
 }

 // 6. Homing Swarm Micro-Drones.
 for (const dr of director.drones) {
  if (drawOmegaAuthoredSwarmDrone(ctx, dr.x, dr.y, dr.vx, dr.vy, seconds)) {
   continue;
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient?.(dr.x, dr.y, 1, dr.x, dr.y, 14);
  if (g && typeof g.addColorStop === 'function') {
   g.addColorStop(0, 'rgba(255,244,180,0.95)');
   g.addColorStop(0.5, 'rgba(244,114,182,0.55)');
   g.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = g;
   ctx.beginPath();
   ctx.arc(dr.x, dr.y, 14, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.restore();
 }

 // 7. Piercing Crimson / Cyan Moonwaves.
 for (const wv of director.waves) {
  const fade = clamp(1 - wv.age / wv.duration, 0, 1);
  ctx.save();
  ctx.translate(wv.x, wv.y - 32 * invY);
  ctx.rotate(wv.angle);
  ctx.scale(1, 0.72);
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = fade;
  ctx.strokeStyle = wv.crimson ? '#f472b6' : '#67e8f9';
  ctx.lineWidth = 8 * fade + 2;
  ctx.beginPath();
  ctx.arc(-18, 0, wv.radius * 0.85, -1.1, 1.1);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3 * fade + 1;
  ctx.beginPath();
  ctx.arc(-15, 0, wv.radius * 0.88, -1.0, 1.0);
  ctx.stroke();
  ctx.restore();
 }

 // 8. Signal Mark Detonation Shockwaves.
 for (const d of director.detonations) {
  const p = clamp(d.age / d.duration, 0, 1);
  const fade = Math.pow(1 - p, 1.4);
  const r = d.radius * (0.28 + 0.76 * p);
  const col = d.stacks >= 3 ? '251,191,36' : '103,232,249';
  ctx.save();
  ctx.translate(d.x, d.y - 26 * invY);
  ctx.scale(1, 0.72);
  ctx.globalCompositeOperation = 'lighter';
  const fill = ctx.createRadialGradient?.(0, 0, r * 0.15, 0, 0, r);
  if (fill && typeof fill.addColorStop === 'function') {
   fill.addColorStop(0, `rgba(255,255,255,${(0.55 * fade).toFixed(3)})`);
   fill.addColorStop(0.55, `rgba(${col},${(0.42 * fade).toFixed(3)})`);
   fill.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = fill;
   ctx.beginPath();
   ctx.arc(0, 0, r, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.strokeStyle = `rgba(${col},${(0.92 * fade).toFixed(3)})`;
  ctx.lineWidth = 4 * fade + 1;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
 }

 // 9. Chain Lightning Bolts.
 for (const l of director.lightnings) {
  const fade = clamp(1 - l.age / l.duration, 0, 1);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(125,211,252,${fade.toFixed(3)})`;
  ctx.lineWidth = 3.2 * fade + 1;
  ctx.beginPath();
  ctx.moveTo(l.x1, l.y1);
  for (let s = 1; s < 5; s++) {
   const t = s / 5;
   const jx = seededOffset(l.seed, s) * 16;
   const jy = seededOffset(l.seed + 7, s) * 16;
   ctx.lineTo(l.x1 + (l.x2 - l.x1) * t + jx, l.y1 + (l.y2 - l.y1) * t + jy);
  }
  ctx.lineTo(l.x2, l.y2);
  ctx.stroke();
  ctx.restore();
 }

 // 10. M01 Sniper Beams & Breaker Orbital EMP Pillars.
 for (const b of director.beams) {
  const fade = clamp(1 - b.age / b.duration, 0, 1);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(${b.colorRgb},${(0.82 * fade).toFixed(3)})`;
  ctx.lineWidth = (b.isPillar ? 34 : 10) * fade;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(b.x1, b.y1);
  ctx.lineTo(b.x2, b.y2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255,255,255,${fade.toFixed(3)})`;
  ctx.lineWidth = (b.isPillar ? 10 : 3) * fade;
  ctx.beginPath();
  ctx.moveTo(b.x1, b.y1);
  ctx.lineTo(b.x2, b.y2);
  ctx.stroke();
  ctx.restore();
 }

 // 10.5 Ejected Plasma Weapon Casings + Physics Ballistic Impact Sparks.
 for (const c of director.casings) {
  const fade = clamp(1 - c.age / c.duration, 0, 1);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = fade * 0.92;
  ctx.fillStyle = c.colorHex;
  ctx.beginPath();
  ctx.arc(c.x, c.y - c.z * invY, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
 }

 for (const sp of director.sparks) {
  const fade = clamp(1 - sp.age / Math.max(0.01, sp.duration), 0, 1);
  const headX = sp.x;
  const headY = sp.y - sp.z * invY;
  const tailX = headX - sp.vx * 0.028;
  const tailY = headY - (sp.vy - sp.vz * invY) * 0.028;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(${sp.colorRgb},${(0.86 * fade).toFixed(3)})`;
  ctx.lineWidth = sp.size * 2.1 * (0.4 + 0.6 * fade);
  ctx.beginPath();
  ctx.moveTo(tailX, tailY);
  ctx.lineTo(headX, headY);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255,255,255,${(0.95 * fade).toFixed(3)})`;
  ctx.lineWidth = sp.size * 0.85;
  ctx.beginPath();
  ctx.moveTo(tailX * 0.35 + headX * 0.65, tailY * 0.35 + headY * 0.65);
  ctx.lineTo(headX, headY);
  ctx.stroke();
  ctx.restore();
 }

 // 10.6 Per-Target Diagonal Slash-Cut Flash & Dissolve Kill Bursts.
 for (const sc of director.slashCuts) {
  const p = clamp(sc.age / sc.duration, 0, 1);
  const fade = Math.pow(1 - p, 1.45);
  const cx = sc.x;
  const cy = sc.y - 30 * invY;
  const len = (sc.crit ? 42 : 30) * (0.55 + 0.65 * Math.min(1, p * 2.2));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = 'lighter';
  const cuts = sc.crit ? [sc.angle - 0.38, sc.angle + 0.58] : [sc.angle - 0.34];
  for (const ang of cuts) {
   const ux = Math.cos(ang) * len;
   const uy = Math.sin(ang) * len * 0.78;
   ctx.strokeStyle = `rgba(${sc.colorRgb},${(0.86 * fade).toFixed(3)})`;
   ctx.lineWidth = (sc.crit ? 6.5 : 4.5) * fade + 1;
   ctx.lineCap = 'round';
   ctx.beginPath();
   ctx.moveTo(-ux, -uy);
   ctx.lineTo(ux, uy);
   ctx.stroke();

   ctx.strokeStyle = `rgba(255,255,255,${(0.95 * fade).toFixed(3)})`;
   ctx.lineWidth = (sc.crit ? 2.6 : 1.8) * fade + 0.4;
   ctx.beginPath();
   ctx.moveTo(-ux * 0.78, -uy * 0.78);
   ctx.lineTo(ux * 0.78, uy * 0.78);
   ctx.stroke();
  }
  ctx.restore();
 }

 for (const kb of director.killBursts) {
  const p = clamp(kb.age / kb.duration, 0, 1);
  const fade = Math.pow(1 - p, 1.5);
  const cy = kb.y - 24 * invY;
  const r = (kb.boss ? 98 : 48) * (0.3 + 0.88 * p);
  const col = kb.boss ? '244,114,182' : '103,232,249';
  ctx.save();
  ctx.translate(kb.x, cy);
  ctx.globalCompositeOperation = 'lighter';

  // Expanding outer shockwave + crisp white inner dissolve ring.
  ctx.strokeStyle = `rgba(${col},${(0.8 * fade).toFixed(3)})`;
  ctx.lineWidth = (kb.boss ? 5.2 : 3.2) * fade + 0.8;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.56, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (fade > 0.35) {
   const innerFade = (fade - 0.35) / 0.65;
   ctx.strokeStyle = `rgba(255,255,255,${(0.75 * innerFade).toFixed(3)})`;
   ctx.lineWidth = 2.0 * innerFade;
   ctx.beginPath();
   ctx.ellipse(0, 0, r * 0.62, r * 0.34, 0, 0, Math.PI * 2);
   ctx.stroke();

   // Brief central cyber-vaporization flash beam rising from neutralized host.
   ctx.strokeStyle = `rgba(${col},${(0.62 * innerFade).toFixed(3)})`;
   ctx.lineWidth = (kb.boss ? 12 : 6) * innerFade;
   ctx.beginPath();
   ctx.moveTo(0, 14);
   ctx.lineTo(0, -(kb.boss ? 92 : 52) * (0.5 + p));
   ctx.stroke();
  }

  for (let s = 0; s < 8; s++) {
   const sa = (s * Math.PI) / 4 + p * 0.65;
   const dist = r * (0.68 + p * 0.55);
   const inner = dist * 0.62;
   const ex = Math.cos(sa) * dist;
   const ey = Math.sin(sa) * dist * 0.68;
   ctx.strokeStyle = `rgba(255,244,214,${(0.88 * fade).toFixed(3)})`;
   ctx.lineWidth = 2.2 * fade + 0.6;
   ctx.beginPath();
   ctx.moveTo(Math.cos(sa) * inner, Math.sin(sa) * inner * 0.68);
   ctx.lineTo(ex, ey);
   ctx.stroke();
   ctx.fillStyle = `rgba(255,255,255,${(0.95 * fade).toFixed(3)})`;
   ctx.beginPath();
   ctx.arc(ex, ey, 2.2 * fade + 0.6, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.restore();
 }

 // 10.7 Unified Floating Combat Damage Numbers.
 for (const dn of director.damageNumbers) {
  const p = clamp(dn.age / dn.duration, 0, 1);
  const fade = p < 0.14 ? p / 0.14 : Math.pow(1 - (p - 0.14) / 0.86, 1.2);
  const pop = p < 0.16 ? 1.32 - (p / 0.16) * 0.32 : 1.0;
  const y = dn.y - p * 30;
  ctx.save();
  ctx.translate(dn.x, y);
  ctx.scale(dn.scale * pop, dn.scale * pop);
  ctx.globalAlpha = clamp(fade, 0, 1);
  ctx.font = dn.crit ? '900 17px system-ui' : '800 13px system-ui';
  ctx.textAlign = 'center';
  ctx.strokeStyle = 'rgba(4,9,20,0.94)';
  ctx.lineWidth = 4;
  ctx.strokeText(dn.text, 0, 0);
  ctx.fillStyle = dn.colorHex;
  ctx.fillText(dn.text, 0, 0);
  ctx.restore();
 }

 // 11. World Floating Combat Callouts.
 for (const c of director.callouts) {
  const p = clamp(c.age / c.duration, 0, 1);
  const fade = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
  ctx.save();
  ctx.globalAlpha = clamp(fade, 0, 1);
  ctx.font = '900 15px system-ui';
  ctx.textAlign = 'center';
  const y = c.y - p * 34;
  ctx.strokeStyle = 'rgba(4,8,18,0.9)';
  ctx.lineWidth = 4;
  ctx.strokeText(c.text, c.x, y);
  ctx.fillStyle = c.colorHex;
  ctx.fillText(c.text, c.x, y);
  ctx.restore();
 }

 ctx.restore();
}

export function drawOmegaZeroSignalScreenFx(
 ctx: CanvasRenderingContext2D,
 director: OmegaZeroSignalDirector,
 width: number,
 height: number,
): void {
 const slow = director.currentSlowMoRemaining();
 const over = director.currentOverclockRemaining();
 const flash = director.currentImpactFlash();
 const hpFlash = director.currentHpDamageFlash();
 if (slow <= 0 && over <= 0 && flash <= 0 && hpFlash <= 0) return;

 ctx.save();
 ctx.setTransform(1, 0, 0, 1, 0, 0);
 if (hpFlash > 0) {
  const hurtGrad = ctx.createRadialGradient?.(
   width * 0.5,
   height * 0.5,
   Math.min(width, height) * 0.38,
   width * 0.5,
   height * 0.5,
   Math.max(width, height) * 0.78,
  );
  if (hurtGrad && typeof hurtGrad.addColorStop === 'function') {
   hurtGrad.addColorStop(0, 'rgba(0,0,0,0)');
   hurtGrad.addColorStop(0.62, `rgba(225,29,72,${(hpFlash * 0.18).toFixed(3)})`);
   hurtGrad.addColorStop(1, `rgba(225,29,72,${(hpFlash * 0.38).toFixed(3)})`);
   ctx.fillStyle = hurtGrad;
   ctx.fillRect(0, 0, width, height);
  }
 }
 if (flash > 0) {
  const impactGrad = ctx.createRadialGradient?.(
   width * 0.5,
   height * 0.5,
   Math.min(width, height) * 0.22,
   width * 0.5,
   height * 0.5,
   Math.max(width, height) * 0.72,
  );
  if (impactGrad && typeof impactGrad.addColorStop === 'function') {
   ctx.globalCompositeOperation = 'lighter';
   impactGrad.addColorStop(0, `rgba(255,255,255,${(flash * 0.12).toFixed(3)})`);
   impactGrad.addColorStop(0.55, `rgba(103,232,249,${(flash * 0.16).toFixed(3)})`);
   impactGrad.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = impactGrad;
   ctx.fillRect(0, 0, width, height);
   ctx.globalCompositeOperation = 'source-over';
  }
 }
 if (slow > 0) {
  const alpha = clamp(slow / 0.4, 0, 1) * 0.24;
  const grad = ctx.createRadialGradient?.(
   width * 0.5,
   height * 0.5,
   Math.min(width, height) * 0.24,
   width * 0.5,
   height * 0.5,
   Math.max(width, height) * 0.72,
  );
  if (grad && typeof grad.addColorStop === 'function') {
   grad.addColorStop(0, 'rgba(0,0,0,0)');
   grad.addColorStop(1, `rgba(56,189,248,${alpha.toFixed(3)})`);
   ctx.fillStyle = grad;
   ctx.fillRect(0, 0, width, height);
  }
  // Subtle dual-tone holographic edge trim during Phantom Dodge bullet-time.
  const trimA = clamp(slow / 0.4, 0, 1) * 0.22;
  ctx.strokeStyle = `rgba(103,232,249,${trimA.toFixed(3)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(2, height - 2);
  ctx.lineTo(2, 2);
  ctx.lineTo(width - 2, 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(192,132,252,${trimA.toFixed(3)})`;
  ctx.beginPath();
  ctx.moveTo(width - 2, 2);
  ctx.lineTo(width - 2, height - 2);
  ctx.lineTo(2, height - 2);
  ctx.stroke();
 }
 if (flash > 0.22 || slow > 0) {
  // 16 crisp radial edge speedlines anchored strictly inside the outer 15% screen perimeter.
  const lineAlpha = Math.max(flash > 0.22 ? (flash - 0.22) * 0.48 : 0, slow > 0 ? clamp(slow / 0.4, 0, 1) * 0.26 : 0);
  const cx = width * 0.5;
  const cy = height * 0.5;
  const rx = width * 0.5;
  const ry = height * 0.5;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = slow > 0 ? `rgba(186,230,253,${lineAlpha.toFixed(3)})` : `rgba(224,250,255,${lineAlpha.toFixed(3)})`;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
   const a = (i * Math.PI * 2) / 16 + (i % 2 === 0 ? 0.08 : -0.06);
   const innerScale = i % 2 === 0 ? 0.72 : 0.78;
   ctx.beginPath();
   ctx.moveTo(cx + Math.cos(a) * rx * innerScale, cy + Math.sin(a) * ry * innerScale);
   ctx.lineTo(cx + Math.cos(a) * rx * 0.99, cy + Math.sin(a) * ry * 0.99);
   ctx.stroke();
  }
  ctx.restore();
 }
 if (over > 0) {
  ctx.strokeStyle = `rgba(103,232,249,${(0.28 * Math.min(1, over)).toFixed(3)})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);
 }
 ctx.restore();
}
