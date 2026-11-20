import { OMEGA_QUARTER_VIEW, type OmegaFieldPlan, type OmegaFieldPoint, type OmegaFieldProgress } from '../domain/omega-protocol-field';
import type { OmegaZombieBrain, OmegaZombieKind } from '../domain/omega-protocol-zombie-ai';
import type { Hazard } from '../domain/patrol-survivors';
import type { OmegaImpactFx } from './omega-protocol-impact-vfx';

export const OMEGA_ENTITY_ART_ROOT = '/assets/omega/entities';
export const OMEGA_IMPACT_ART_ROOT = '/assets/omega/vfx';

export type OmegaEntityArtKey =
 | 'mission-console'
 | 'extraction-gate'
 | 'hazard-cart'
 | 'hazard-gas'
 | 'hazard-debris'
 | 'boss-crane'
 | 'boss-warden'
 | 'impact-hit'
 | 'impact-crit'
 | 'zombie-drifter-0'
 | 'zombie-drifter-1'
 | 'zombie-drifter-2'
 | 'zombie-drifter-3'
 | 'zombie-sprinter-0'
 | 'zombie-sprinter-1'
 | 'zombie-sprinter-2'
 | 'zombie-sprinter-3'
 | 'zombie-armored-0'
 | 'zombie-armored-1'
 | 'zombie-armored-2'
 | 'zombie-armored-3'
 | 'zombie-stalker-0'
 | 'zombie-stalker-1'
 | 'zombie-stalker-2'
 | 'zombie-stalker-3'
 | 'striker-sentry'
 | 'swarm-drone'
 | 'act-lift'
 | 'act-airlock'
 | 'signal-core'
 | 'signal-reticle';

const ENTITY_PATH_BY_KEY: Readonly<Record<OmegaEntityArtKey, string>> = {
 'mission-console': `${OMEGA_ENTITY_ART_ROOT}/mission-console.webp`,
 'extraction-gate': `${OMEGA_ENTITY_ART_ROOT}/extraction-gate.webp`,
 'hazard-cart': `${OMEGA_ENTITY_ART_ROOT}/hazard-cart.webp`,
 'hazard-gas': `${OMEGA_ENTITY_ART_ROOT}/hazard-gas.webp`,
 'hazard-debris': `${OMEGA_ENTITY_ART_ROOT}/hazard-debris.webp`,
 'boss-crane': `${OMEGA_ENTITY_ART_ROOT}/boss-crane.webp`,
 'boss-warden': `${OMEGA_ENTITY_ART_ROOT}/boss-warden.webp`,
 'impact-hit': `${OMEGA_IMPACT_ART_ROOT}/impact-hit.webp`,
 'impact-crit': `${OMEGA_IMPACT_ART_ROOT}/impact-crit.webp`,
 'zombie-drifter-0': `${OMEGA_ENTITY_ART_ROOT}/zombie-drifter-0.webp`,
 'zombie-drifter-1': `${OMEGA_ENTITY_ART_ROOT}/zombie-drifter-1.webp`,
 'zombie-drifter-2': `${OMEGA_ENTITY_ART_ROOT}/zombie-drifter-2.webp`,
 'zombie-drifter-3': `${OMEGA_ENTITY_ART_ROOT}/zombie-drifter-3.webp`,
 'zombie-sprinter-0': `${OMEGA_ENTITY_ART_ROOT}/zombie-sprinter-0.webp`,
 'zombie-sprinter-1': `${OMEGA_ENTITY_ART_ROOT}/zombie-sprinter-1.webp`,
 'zombie-sprinter-2': `${OMEGA_ENTITY_ART_ROOT}/zombie-sprinter-2.webp`,
 'zombie-sprinter-3': `${OMEGA_ENTITY_ART_ROOT}/zombie-sprinter-3.webp`,
 'zombie-armored-0': `${OMEGA_ENTITY_ART_ROOT}/zombie-armored-0.webp`,
 'zombie-armored-1': `${OMEGA_ENTITY_ART_ROOT}/zombie-armored-1.webp`,
 'zombie-armored-2': `${OMEGA_ENTITY_ART_ROOT}/zombie-armored-2.webp`,
 'zombie-armored-3': `${OMEGA_ENTITY_ART_ROOT}/zombie-armored-3.webp`,
 'zombie-stalker-0': `${OMEGA_ENTITY_ART_ROOT}/zombie-stalker-0.webp`,
 'zombie-stalker-1': `${OMEGA_ENTITY_ART_ROOT}/zombie-stalker-1.webp`,
 'zombie-stalker-2': `${OMEGA_ENTITY_ART_ROOT}/zombie-stalker-2.webp`,
 'zombie-stalker-3': `${OMEGA_ENTITY_ART_ROOT}/zombie-stalker-3.webp`,
 'striker-sentry': `${OMEGA_ENTITY_ART_ROOT}/striker-sentry.webp`,
 'swarm-drone': `${OMEGA_ENTITY_ART_ROOT}/swarm-drone.webp`,
 'act-lift': `${OMEGA_ENTITY_ART_ROOT}/act-lift.webp`,
 'act-airlock': `${OMEGA_ENTITY_ART_ROOT}/act-airlock.webp`,
 'signal-core': `${OMEGA_IMPACT_ART_ROOT}/signal-core.webp`,
 'signal-reticle': `${OMEGA_IMPACT_ART_ROOT}/signal-reticle.webp`,
};

const cachedImages: Partial<Record<OmegaEntityArtKey, HTMLImageElement>> = {};
let prepared = false;

function clamp(v: number, lo: number, hi: number): number {
 return v < lo ? lo : v > hi ? hi : v;
}

function isDecodedSource(source: unknown): source is CanvasImageSource {
 if (!source || typeof source !== 'object') return false;
 const rec = source as Record<string, unknown>;
 if ('complete' in rec && rec.complete === false) return false;
 if ('naturalWidth' in rec) {
  return typeof rec.naturalWidth === 'number' && rec.naturalWidth > 0;
 }
 if ('width' in rec) {
  return typeof rec.width === 'number' && rec.width > 0;
 }
 return false;
}

function resolveEntityImage(key: OmegaEntityArtKey, imageOverride?: CanvasImageSource | null): CanvasImageSource | null {
 if (imageOverride !== undefined) {
  return isDecodedSource(imageOverride) ? imageOverride : null;
 }
 const cached = cachedImages[key];
 return cached && isDecodedSource(cached) ? cached : null;
}

/**
 * Returns every authored WebP entity & impact VFX asset path under `/assets/omega/{entities|vfx}`.
 */
export function omegaAuthoredEntityPaths(): readonly string[] {
 return (Object.keys(ENTITY_PATH_BY_KEY) as OmegaEntityArtKey[]).map((key) => ENTITY_PATH_BY_KEY[key]);
}

/**
 * Idempotently preloads all 7 3/4 isometric entities and 2 HDR impact VFX textures.
 */
export function omegaPrepareEntityArt(): void {
 if (prepared || typeof Image === 'undefined') return;
 prepared = true;
 (Object.keys(ENTITY_PATH_BY_KEY) as OmegaEntityArtKey[]).forEach((key) => {
  const img = new Image();
  img.decoding = 'async';
  img.src = ENTITY_PATH_BY_KEY[key];
  cachedImages[key] = img;
 });
}

/**
 * Renders the 3/4 isometric mission field terminal console with live state holography and
 * ground activation beacon. Fails closed (`false`) when the WebP asset is not yet decoded.
 */
export function drawOmegaAuthoredMissionConsole(
 ctx: CanvasRenderingContext2D,
 plan: OmegaFieldPlan,
 progress: OmegaFieldProgress,
 index: number,
 seconds: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 const step = plan.event.steps[index];
 if (!step || !Number.isFinite(seconds)) return false;
 const img = resolveEntityImage('mission-console', imageOverride);
 if (!img) return false;

 const state =
  index < progress.completedSteps
   ? 'completed'
   : progress.phase === 'objective' && index === progress.completedSteps
     ? 'active'
     : 'locked';
 const pulse = 0.65 + 0.35 * Math.sin(seconds * 4 + index);
 const colorRgb = state === 'completed' ? '112,240,189' : state === 'active' ? '124,233,255' : '230,171,103';
 const colorHex = state === 'completed' ? '#70f0bd' : state === 'active' ? '#7ce9ff' : '#e6ab67';
 const invY = 1 / OMEGA_QUARTER_VIEW.groundYScale;

 ctx.save();
 ctx.translate(step.target.x, step.target.y);

 // 1. Ground contact shadow + pulsing active terminal ring on ground plane.
 ctx.fillStyle = 'rgba(1,6,15,.50)';
 ctx.beginPath();
 ctx.ellipse(2, 4, 42, 14, 0, 0, Math.PI * 2);
 ctx.fill();

 if (state === 'active') {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(${colorRgb},${(0.42 + 0.28 * pulse).toFixed(3)})`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 4, 44 + pulse * 7, 15 + pulse * 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
 }

 // 2. Stand console artwork cleanly upright via inverse 3/4 transform.
 ctx.transform(1, 0, -OMEGA_QUARTER_VIEW.skewX * invY, invY, 0, 0);
 const drawW = 88;
 const drawH = 105.6;
 ctx.drawImage(img, -drawW * 0.5, -drawH + 12, drawW, drawH);

 // 3. Additive holographic status icon projecting above console display bay.
 ctx.globalCompositeOperation = 'lighter';
 const holoX = 2;
 const holoY = -62 - Math.sin(seconds * 3.2 + index) * 2;
 const glow = ctx.createRadialGradient?.(holoX, holoY, 2, holoX, holoY, 34);
 if (glow && typeof glow.addColorStop === 'function') {
  glow.addColorStop(0, `rgba(${colorRgb},${(state === 'active' ? 0.58 * pulse : 0.34).toFixed(3)})`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(holoX, holoY, 34, 0, Math.PI * 2);
  ctx.fill();
 }

 ctx.strokeStyle = colorHex;
 ctx.fillStyle = colorHex;
 ctx.lineWidth = 2.2;
 ctx.globalAlpha = state === 'locked' ? 0.55 : 0.92;
 if (plan.event.kind === 'power_lockout') {
  // High-voltage breaker zigzag icon.
  ctx.beginPath();
  ctx.moveTo(holoX - 4, holoY - 9);
  ctx.lineTo(holoX - 8, holoY + 1);
  ctx.lineTo(holoX + 1, holoY + 1);
  ctx.lineTo(holoX - 2, holoY + 10);
  ctx.stroke();
 } else if (plan.event.kind === 'worker_evacuation') {
  // Evacuation chevron arrow.
  ctx.beginPath();
  ctx.moveTo(holoX - 8, holoY);
  ctx.lineTo(holoX + 8, holoY);
  ctx.lineTo(holoX + 2, holoY - 6);
  ctx.moveTo(holoX + 8, holoY);
  ctx.lineTo(holoX + 2, holoY + 6);
  ctx.stroke();
 } else {
  // Structural interlock diamond.
  ctx.beginPath();
  ctx.moveTo(holoX, holoY - 8);
  ctx.lineTo(holoX + 9, holoY);
  ctx.lineTo(holoX, holoY + 8);
  ctx.lineTo(holoX - 9, holoY);
  ctx.closePath();
  ctx.stroke();
 }

 ctx.restore();
 return true;
}

/**
 * Renders the heavy 3/4 isometric blast bulkhead extraction portal with live interior energy curtain
 * (unlocked) or containment lasers (locked) framed cleanly through its transparent doorway.
 */
export function drawOmegaAuthoredExtractionGate(
 ctx: CanvasRenderingContext2D,
 point: OmegaFieldPoint,
 unlocked: boolean,
 seconds: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 if (!Number.isFinite(seconds)) return false;
 const img = resolveEntityImage('extraction-gate', imageOverride);
 if (!img) return false;

 const invY = 1 / OMEGA_QUARTER_VIEW.groundYScale;
 const blink = 0.62 + 0.38 * Math.sin(seconds * 4.2);
 const colorRgb = unlocked ? '112,240,189' : '255,156,96';

 ctx.save();
 ctx.translate(point.x, point.y);

 // 1. Portal floor cast shadow & threshold pad light.
 ctx.fillStyle = 'rgba(0,6,16,.58)';
 ctx.beginPath();
 ctx.ellipse(2, 7, 74, 21, 0, 0, Math.PI * 2);
 ctx.fill();

 if (unlocked) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(${colorRgb},${(0.45 + 0.3 * blink).toFixed(3)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 7, 68 + blink * 5, 18 + blink * 2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
 }

 // 2. Stand gate upright cleanly in world space.
 ctx.transform(1, 0, -OMEGA_QUARTER_VIEW.skewX * invY, invY, 0, 0);
 const drawW = 168;
 const drawH = 147;

 // 3. Dynamic doorway interior rendered BEHIND the open bulkhead archway.
 ctx.save();
 ctx.globalCompositeOperation = 'lighter';
 if (unlocked) {
  const portalGrad = ctx.createLinearGradient?.(0, -102, 0, -6);
  if (portalGrad && typeof portalGrad.addColorStop === 'function') {
   portalGrad.addColorStop(0, `rgba(121,249,213,${(0.24 + 0.14 * blink).toFixed(3)})`);
   portalGrad.addColorStop(0.6, `rgba(74,222,255,${(0.42 + 0.18 * blink).toFixed(3)})`);
   portalGrad.addColorStop(1, 'rgba(112,240,189,0.08)');
   ctx.fillStyle = portalGrad;
   ctx.fillRect(-34, -102, 68, 96);
  }
  // Rising extraction energy motes inside doorway.
  for (let i = 0; i < 4; i++) {
   const life = (seconds * 1.15 + i * 0.25) % 1;
   const mx = -22 + i * 15;
   const my = -10 - life * 84;
   ctx.fillStyle = `rgba(216,255,244,${((1 - life) * 0.72).toFixed(3)})`;
   ctx.beginPath();
   ctx.arc(mx, my, 2.2, 0, Math.PI * 2);
   ctx.fill();
  }
 } else {
  // Security laser barrier bars while sector objectives are incomplete.
  ctx.strokeStyle = `rgba(255,118,128,${(0.55 + 0.28 * blink).toFixed(3)})`;
  ctx.lineWidth = 2.6;
  for (let row = 0; row < 3; row++) {
   const ly = -76 + row * 24;
   ctx.beginPath();
   ctx.moveTo(-31, ly);
   ctx.lineTo(31, ly);
   ctx.stroke();
  }
 }
 ctx.restore();

 // 4. Draw heavy painted bulkhead archway framing the doorway.
 ctx.drawImage(img, -drawW * 0.5, -drawH + 14, drawW, drawH);

 // 5. Upper beacon halo accents matching gate status.
 ctx.globalCompositeOperation = 'lighter';
 const topGlow = ctx.createRadialGradient?.(0, -112, 2, 0, -112, 42);
 if (topGlow && typeof topGlow.addColorStop === 'function') {
  topGlow.addColorStop(0, `rgba(${colorRgb},${(0.44 * blink).toFixed(3)})`);
  topGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGlow;
  ctx.beginPath();
  ctx.arc(0, -112, 42, 0, Math.PI * 2);
  ctx.fill();
 }

 ctx.restore();
 return true;
}

/**
 * Renders 3/4 isometric hazard & boss artwork (`RUNAWAY_CART`, `GAS_LEAK`, `FALLING_DEBRIS`,
 * Wave-9 `CRANE_BOSS`, Wave-15 `POWER WARDEN`) directly inside the hero's upright space.
 */
export function drawOmegaAuthoredHazardOrBoss(
 ctx: CanvasRenderingContext2D,
 hazard: Hazard,
 time: number,
 finalBoss: boolean,
 imageOverride?: CanvasImageSource | null,
): boolean {
 let key: OmegaEntityArtKey | null = null;
 let drawW = 96;
 let drawH = 96;
 let footPad = 12;

 if (hazard.type === 'RUNAWAY_CART') {
  key = 'hazard-cart';
  drawW = 114;
  drawH = 95;
  footPad = 12;
 } else if (hazard.type === 'GAS_LEAK') {
  key = 'hazard-gas';
  drawW = 84;
  drawH = 84;
  footPad = 12;
 } else if (hazard.type === 'FALLING_DEBRIS') {
  key = 'hazard-debris';
  drawW = 88;
  drawH = 79;
  footPad = 10;
 } else if (hazard.type === 'CRANE_BOSS') {
  key = finalBoss ? 'boss-warden' : 'boss-crane';
  drawW = finalBoss ? 188 : 176;
  drawH = finalBoss ? 188 : 176;
  footPad = 16;
 }

 if (!key) return false;
 const img = resolveEntityImage(key, imageOverride);
 if (!img) return false;

 ctx.save();

 let dy = 0;
 if (key === 'hazard-cart') {
  dy = Math.sin(time * 28 + hazard.x * 0.05) * 1.1;
 } else if (key === 'boss-warden') {
  dy = Math.sin(time * 2.4) * 4.5;
 } else if (key === 'boss-crane') {
  dy = Math.sin(time * 3.1) * 1.6;
 }

 ctx.drawImage(img, -drawW * 0.5, -drawH + footPad + dy, drawW, drawH);

 // Live atmospheric / phase-2 combat VFX overlays fitted to the authored artwork.
 if (key === 'hazard-gas') {
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
   const life = (time * 0.72 + i * 0.25) % 1;
   const gx = Math.sin(time * 2.4 + i * 1.7) * (8 + life * 10);
   const gy = -56 - life * 34;
   const r = 10 + life * 16;
   const mist = ctx.createRadialGradient?.(gx, gy, 1, gx, gy, r);
   if (mist && typeof mist.addColorStop === 'function') {
    mist.addColorStop(0, `rgba(92,244,212,${((1 - life) * 0.34).toFixed(3)})`);
    mist.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mist;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
   }
  }
 } else if (key === 'hazard-cart' && hazard.variant === 'reinforced_cart') {
  ctx.globalCompositeOperation = 'lighter';
  const rim = ctx.createRadialGradient?.(0, -34, 8, 0, -34, 56);
  if (rim && typeof rim.addColorStop === 'function') {
   rim.addColorStop(0, 'rgba(255,156,112,0.22)');
   rim.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = rim;
   ctx.beginPath();
   ctx.arc(0, -34, 56, 0, Math.PI * 2);
   ctx.fill();
  }
 } else if (key === 'boss-crane' || key === 'boss-warden') {
  const phase2 = hazard.bossPhase === 2;
  const pulse = 0.58 + 0.42 * Math.sin(time * 4.5);
  const auraRgb = key === 'boss-warden' ? (phase2 ? '255,112,216' : '116,238,255') : phase2 ? '255,138,224' : '255,178,96';
  ctx.globalCompositeOperation = 'lighter';
  const coreY = -72 + dy;
  const aura = ctx.createRadialGradient?.(0, coreY, 6, 0, coreY, 64);
  if (aura && typeof aura.addColorStop === 'function') {
   aura.addColorStop(0, `rgba(${auraRgb},${(phase2 ? 0.56 * pulse : 0.34 * pulse).toFixed(3)})`);
   aura.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = aura;
   ctx.beginPath();
   ctx.arc(0, coreY, 64, 0, Math.PI * 2);
   ctx.fill();
  }
  if (phase2) {
   ctx.strokeStyle = `rgba(${auraRgb},${(0.45 + 0.3 * pulse).toFixed(3)})`;
   ctx.lineWidth = 2.6;
   ctx.beginPath();
   ctx.arc(0, coreY, 54, time * 1.4, time * 1.4 + Math.PI * 1.35);
   ctx.stroke();
  }
 }

 ctx.restore();
 return true;
}

/**
 * Renders additive HDR radial impact bursts at chest height (`-36` upright offset) with sharp
 * floating combat damage telemetry, failing closed (`false`) when texture is undecoded.
 */
export function drawOmegaAuthoredImpactBurst(
 ctx: CanvasRenderingContext2D,
 effect: OmegaImpactFx,
 age: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 const img = resolveEntityImage(effect.critical ? 'impact-crit' : 'impact-hit', imageOverride);
 if (!img || !Number.isFinite(age)) return false;

 const clampedAge = clamp(age, 0, 1);
 const opacity = Math.pow(1 - clampedAge, 1.45);
 if (opacity <= 0.01) return true;

 const chestUprightY = -36;
 const invY = 1 / OMEGA_QUARTER_VIEW.groundYScale;
 const worldX = effect.x - (OMEGA_QUARTER_VIEW.skewX * invY) * chestUprightY;
 const worldY = effect.y + chestUprightY * invY;
 const size = effect.radius * (effect.critical ? 3.4 : 2.6) * (0.65 + 0.72 * clampedAge);

 ctx.save();
 ctx.translate(worldX, worldY);

 ctx.save();
 ctx.rotate(((effect.seed % 16) * Math.PI) / 8 + clampedAge * (effect.critical ? 0.45 : 0.25));
 ctx.globalCompositeOperation = 'lighter';
 ctx.globalAlpha = opacity;
 ctx.drawImage(img, -size * 0.5, -size * 0.5, size, size);
 ctx.restore();

 if (effect.damage > 0) {
  const numY = -18 - clampedAge * 30;
  const text = String(Math.round(effect.damage));
  ctx.font = effect.critical ? '900 18px system-ui' : '800 14px system-ui';
  ctx.textAlign = 'center';
  ctx.globalAlpha = clamp(opacity * 1.15, 0, 1);
  ctx.strokeStyle = 'rgba(4,8,16,0.88)';
  ctx.lineWidth = 3.2;
  ctx.strokeText(text, 0, numY);
  ctx.fillStyle = effect.critical ? '#ffea9c' : effect.blocked ? '#ffad76' : '#a8f8ff';
  ctx.fillText(text, 0, numY);
 }

 ctx.restore();
 return true;
}

const ZOMBIE_SIZE_BY_KIND: Readonly<Record<OmegaZombieKind, number>> = {
 drifter: 108,
 sprinter: 104,
 armored: 124,
 stalker: 120,
};

function idHash(id: string): number {
 let v = 0;
 for (let i = 0; i < id.length; i++) v = (v * 31 + id.charCodeAt(i)) | 0;
 return Math.abs(v);
}

/**
 * Renders an animated AAA hand-painted 3/4 isometric infected zombie sprite (4 poses per kind),
 * grounded at world foot `(0, 0)` with velocity/target facing and zero flat vector geometry.
 * Fails closed (`false`) if the frame WebP has not finished decoding.
 */
export function drawOmegaAuthoredZombie(
 ctx: CanvasRenderingContext2D,
 hazard: Hazard,
 time: number,
 brain?: OmegaZombieBrain,
 targetX?: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 if (!Number.isFinite(time) || hazard.hp <= 0) return false;
 const kind: OmegaZombieKind = brain?.kind ?? 'drifter';
 const seed = idHash(hazard.id ?? 'zombie');

 let frame: 0 | 1 | 2 | 3 = 0;
 if (brain?.phase === 'warning' || brain?.phase === 'charge') {
  frame = 3;
 } else if ((hazard.isStunned ?? 0) <= 0) {
  const cadence = kind === 'sprinter' ? 9.5 : kind === 'armored' ? 5.2 : 6.4;
  const cycle = Math.floor(time * cadence + (seed % 7)) % 4;
  frame = ([0, 1, 2, 1][cycle] ?? 0) as 0 | 1 | 2 | 3;
 }

 const key = `zombie-${kind}-${frame}` as OmegaEntityArtKey;
 const img = resolveEntityImage(key, imageOverride);
 if (!img) return false;

 const drawSize = ZOMBIE_SIZE_BY_KIND[kind];
 const facesLeft =
  brain && (brain.phase === 'warning' || brain.phase === 'charge') && Math.abs(brain.lockedX) > 0.01
   ? brain.lockedX < 0
   : (targetX ?? hazard.x) < hazard.x;
 const walkBob = (hazard.isStunned ?? 0) > 0 ? 0 : Math.abs(Math.sin(time * 6.2 + seed)) * -2.6;
 const lean = kind === 'sprinter' ? 0.08 : brain?.phase === 'charge' ? 0.11 : 0;

 ctx.save();
 if (brain?.phase === 'warning') {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const warnAura = ctx.createRadialGradient?.(0, -18, 4, 0, -18, 42);
  if (warnAura && typeof warnAura.addColorStop === 'function') {
   warnAura.addColorStop(0, kind === 'armored' ? 'rgba(255,160,91,0.42)' : 'rgba(255,110,207,0.42)');
   warnAura.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = warnAura;
   ctx.beginPath();
   ctx.arc(0, -18, 42, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.restore();
 }

 ctx.translate(0, walkBob);
 if (facesLeft) ctx.scale(-1, 1);
 if (lean > 0) ctx.rotate(lean);
 ctx.drawImage(img, -drawSize * 0.5, -drawSize * 0.945, drawSize, drawSize);
 ctx.restore();
 return true;
}

/**
 * Renders the painted Signal Guard crossover Sentry Turret sprite with subtle targeting optic
 * beam and slim lifetime arc. Fails closed (`false`) before image decode.
 */
export function drawOmegaAuthoredSentryTurret(
 ctx: CanvasRenderingContext2D,
 x: number,
 y: number,
 aimAngle: number,
 lifeRatio: number,
 seconds: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(seconds)) return false;
 const img = resolveEntityImage('striker-sentry', imageOverride);
 if (!img) return false;

 const invY = 1 / OMEGA_QUARTER_VIEW.groundYScale;
 const skew = OMEGA_QUARTER_VIEW.skewX;
 const facesLeft = Math.cos(aimAngle) < 0;

 ctx.save();
 ctx.translate(x, y);
 ctx.fillStyle = 'rgba(0,8,16,0.52)';
 ctx.beginPath();
 ctx.ellipse(0, 4, 34, 11, 0, 0, Math.PI * 2);
 ctx.fill();

 ctx.transform(1, 0, -skew * invY, invY, 0, 0);

 // Soft emerald targeting optic flare & laser sight line.
 ctx.save();
 ctx.globalCompositeOperation = 'lighter';
 ctx.strokeStyle = 'rgba(110,231,183,0.42)';
 ctx.lineWidth = 1.6;
 ctx.beginPath();
 ctx.moveTo(facesLeft ? -16 : 16, -34);
 ctx.lineTo(Math.cos(aimAngle) * 76, -34 + Math.sin(aimAngle) * 52);
 ctx.stroke();
 ctx.restore();

 // Drawn upright turret artwork.
 ctx.save();
 if (facesLeft) ctx.scale(-1, 1);
 ctx.drawImage(img, -40, -76, 80, 80);
 ctx.restore();

 // Slim holographic duration arc at base.
 ctx.strokeStyle = 'rgba(52,211,153,0.72)';
 ctx.lineWidth = 2;
 ctx.beginPath();
 ctx.ellipse(0, 2, 29, 10, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(lifeRatio, 0, 1));
 ctx.stroke();

 ctx.restore();
 return true;
}

/**
 * Renders the painted autonomous Signal Swarm Hunter Micro-Drone hovering with gentle bank
 * and additive engine bloom.
 */
export function drawOmegaAuthoredSwarmDrone(
 ctx: CanvasRenderingContext2D,
 x: number,
 y: number,
 vx: number,
 vy: number,
 seconds: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(seconds)) return false;
 const img = resolveEntityImage('swarm-drone', imageOverride);
 if (!img) return false;

 const bob = Math.sin(seconds * 8 + x * 0.04) * 3;
 const tilt = clamp((vx || 0) * 0.0006, -0.22, 0.22);

 ctx.save();
 ctx.translate(x, y - 16 + bob);
 ctx.rotate(tilt);

 ctx.save();
 ctx.globalCompositeOperation = 'lighter';
 const g = ctx.createRadialGradient?.(0, 0, 2, 0, 0, 24);
 if (g && typeof g.addColorStop === 'function') {
  g.addColorStop(0, 'rgba(255,216,128,0.34)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
 }
 ctx.restore();

 ctx.drawImage(img, -23, -23, 46, 46);
 void vy;
 ctx.restore();
 return true;
}

/**
 * Renders the holographic glowing Signal Core loot orb via additive blending.
 */
export function drawOmegaAuthoredSignalCore(
 ctx: CanvasRenderingContext2D,
 x: number,
 y: number,
 seconds: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(seconds)) return false;
 const img = resolveEntityImage('signal-core', imageOverride);
 if (!img) return false;

 const bob = Math.sin(seconds * 6.5 + x * 0.05) * 3.5;
 ctx.save();
 ctx.translate(x, y - 16 + bob);
 ctx.rotate(Math.sin(seconds * 2.2) * 0.14);
 ctx.globalCompositeOperation = 'lighter';
 ctx.drawImage(img, -20, -20, 40, 40);
 ctx.restore();
 return true;
}

/**
 * Renders the holographic Signal Mark Target Lock-On reticle emblem above marked targets.
 */
export function drawOmegaAuthoredSignalReticle(
 ctx: CanvasRenderingContext2D,
 x: number,
 y: number,
 stacks: number,
 seconds: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 if (!Number.isFinite(x) || !Number.isFinite(y) || stacks <= 0 || !Number.isFinite(seconds)) return false;
 const img = resolveEntityImage('signal-reticle', imageOverride);
 if (!img) return false;

 const size = stacks >= 3 ? 40 : stacks === 2 ? 32 : 25;
 ctx.save();
 ctx.translate(x, y);
 ctx.save();
 ctx.rotate(stacks >= 3 ? seconds * 2.4 : seconds * 0.7);
 ctx.globalCompositeOperation = 'lighter';
 ctx.globalAlpha = stacks >= 3 ? 0.98 : stacks === 2 ? 0.78 : 0.6;
 ctx.drawImage(img, -size * 0.5, -size * 0.5, size, size);
 ctx.restore();

 // Crisp stack pip diamonds at bottom rim of reticle.
 for (let i = 0; i < stacks; i++) {
  const ox = (i - (stacks - 1) * 0.5) * 9;
  ctx.fillStyle = stacks >= 3 ? '#fde047' : stacks === 2 ? '#e879f9' : '#67e8f9';
  ctx.beginPath();
  ctx.moveTo(ox, 12);
  ctx.lineTo(ox + 3.5, 16);
  ctx.lineTo(ox, 20);
  ctx.lineTo(ox - 3.5, 16);
  ctx.closePath();
  ctx.fill();
 }
 ctx.restore();
 return true;
}

/**
 * Renders the 3/4 isometric ACT boundary industrial cargo lift (`act-lift.webp`) or heavy sealed
 * pressure airlock (`act-airlock.webp`) cleanly at real world coordinates.
 */
export function drawOmegaAuthoredActDock(
 ctx: CanvasRenderingContext2D,
 kind: 'lift' | 'airlock',
 x: number,
 y: number,
 title: string,
 sublabel: string,
 accentHex: string,
 seconds: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(seconds)) return false;
 const key: OmegaEntityArtKey = kind === 'lift' ? 'act-lift' : 'act-airlock';
 const img = resolveEntityImage(key, imageOverride);
 if (!img) return false;

 const pulse = 0.6 + 0.4 * Math.sin(seconds * 3.1);
 const drawW = kind === 'lift' ? 164 : 186;
 const drawH = kind === 'lift' ? 216 : 166;
 const footY = kind === 'lift' ? 20 : 14;

 ctx.save();
 ctx.translate(x, y);

 // Floor contact shadow + accessible beacon ring.
 ctx.fillStyle = 'rgba(1,6,17,0.62)';
 ctx.beginPath();
 ctx.ellipse(4, 12, 88, 25, 0, 0, Math.PI * 2);
 ctx.fill();

 ctx.save();
 ctx.globalCompositeOperation = 'lighter';
 ctx.strokeStyle = accentHex;
 ctx.globalAlpha = 0.25 + 0.32 * pulse;
 ctx.lineWidth = 3.2;
 ctx.beginPath();
 ctx.ellipse(0, 9, 82 + 5 * pulse, 22 + 2.5 * pulse, 0, 0, Math.PI * 2);
 ctx.stroke();
 ctx.restore();

 // Draw painted 3D industrial lift / airlock structure.
 ctx.drawImage(img, -drawW * 0.5, -drawH + footY, drawW, drawH);

 // Sleek compact floating holo-plate tag at lintel.
 const plateY = kind === 'lift' ? -188 : -154;
 ctx.fillStyle = 'rgba(9,19,32,0.84)';
 ctx.fillRect(-62, plateY - 12, 124, 24);
 ctx.strokeStyle = accentHex;
 ctx.lineWidth = 1.6;
 ctx.strokeRect(-62, plateY - 12, 124, 24);
 ctx.font = '800 11px system-ui';
 ctx.textAlign = 'center';
 ctx.fillStyle = accentHex;
 ctx.fillText(title, 0, plateY + 3, 116);
 if (sublabel) {
  ctx.font = '700 10px system-ui';
  ctx.fillStyle = '#e2f4f8';
  ctx.fillText(sublabel, 0, plateY + 23, 116);
 }

 ctx.restore();
 return true;
}
