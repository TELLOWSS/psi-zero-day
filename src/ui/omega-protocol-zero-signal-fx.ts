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

 // 2. AIRA Energy Shield Halo under foot.
 if (director.currentShield() > 0 && state.phase === 'playing') {
  const px = state.player.x;
  const py = state.player.y;
  const pulse = 0.65 + 0.35 * Math.sin(seconds * 5.2);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(103,232,249,${(0.38 * pulse).toFixed(3)})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(px, py + 4, 38, 13, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
 }

 // 3. Signal Mark Reticles hovering cleanly above every marked enemy.
 for (const h of state.hazards) {
  if (h.hp <= 0) continue;
  const stacks = director.markCount(h.id);
  if (stacks <= 0) continue;
  const headUprightY = h.isStageBoss ? -128 : h.type === 'UNHELMETED' ? -108 : -78;
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
 if (slow <= 0 && over <= 0 && flash <= 0) return;

 ctx.save();
 ctx.setTransform(1, 0, 0, 1, 0, 0);
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
 }
 if (over > 0) {
  ctx.strokeStyle = `rgba(103,232,249,${(0.28 * Math.min(1, over)).toFixed(3)})`;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, width - 4, height - 4);
 }
 ctx.restore();
}
