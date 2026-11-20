import type { OmegaFieldObstacle, OmegaFieldPlan } from '../domain/omega-protocol-field';
import type { OmegaBladeStrike } from '../engine/omega-protocol-combat';
import { omega3DSectorTheme, type Omega3DBudget } from './omega-protocol-atmosphere-3d';
import type { OmegaCameraState } from './omega-protocol-camera';

export const OMEGA_PROP_ART_ROOT = '/assets/omega/props';
export const OMEGA_VFX_ART_ROOT = '/assets/omega/vfx';

export type OmegaPropArtKind = OmegaFieldObstacle['kind'];
export type OmegaVfxArtKey =
 | 'blade-slash-1'
 | 'blade-slash-2'
 | 'blade-slash-3'
 | 'muzzle-flash'
 | 'rain-sheet';

export type OmegaVfxAndPropKey = OmegaPropArtKind | OmegaVfxArtKey;

const PROP_ASPECT_RATIOS: Readonly<Record<OmegaPropArtKind, { readonly widthRatio: number; readonly minWidth: number; readonly aspectH: number; readonly footPad: number }>> = {
 container: { widthRatio: 1.18, minWidth: 128, aspectH: 416 / 512, footPad: 0.14 },
 scaffold: { widthRatio: 1.24, minWidth: 148, aspectH: 1.0, footPad: 0.12 },
 machine: { widthRatio: 1.22, minWidth: 128, aspectH: 448 / 512, footPad: 0.14 },
 barrier: { widthRatio: 1.16, minWidth: 118, aspectH: 288 / 512, footPad: 0.14 },
};

const ASSET_PATH_BY_KEY: Readonly<Record<OmegaVfxAndPropKey, string>> = {
 container: `${OMEGA_PROP_ART_ROOT}/container.webp`,
 scaffold: `${OMEGA_PROP_ART_ROOT}/scaffold.webp`,
 machine: `${OMEGA_PROP_ART_ROOT}/machine.webp`,
 barrier: `${OMEGA_PROP_ART_ROOT}/barrier.webp`,
 'blade-slash-1': `${OMEGA_VFX_ART_ROOT}/blade-slash-1.webp`,
 'blade-slash-2': `${OMEGA_VFX_ART_ROOT}/blade-slash-2.webp`,
 'blade-slash-3': `${OMEGA_VFX_ART_ROOT}/blade-slash-3.webp`,
 'muzzle-flash': `${OMEGA_VFX_ART_ROOT}/muzzle-flash.webp`,
 'rain-sheet': `${OMEGA_VFX_ART_ROOT}/rain-sheet.webp`,
};

const cachedImages: Partial<Record<OmegaVfxAndPropKey, HTMLImageElement>> = {};
let prepared = false;

function clamp(value: number, min: number, max: number): number {
 return value < min ? min : value > max ? max : value;
}

function easeOutCubic(t: number): number {
 const k = 1 - clamp(t, 0, 1);
 return 1 - k * k * k;
}

function wrapMod(value: number, span: number): number {
 if (!(span > 0)) return 0;
 return ((value % span) + span) % span;
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

function resolveImage(key: OmegaVfxAndPropKey, imageOverride?: CanvasImageSource | null): CanvasImageSource | null {
 if (imageOverride !== undefined) {
  return isDecodedSource(imageOverride) ? imageOverride : null;
 }
 const cached = cachedImages[key];
 return cached && isDecodedSource(cached) ? cached : null;
}

/**
 * Returns every authored WebP prop and additive VFX asset path under `/assets/omega/{props|vfx}`.
 */
export function omegaAuthoredVfxAndPropPaths(): readonly string[] {
 return [
  ASSET_PATH_BY_KEY.container,
  ASSET_PATH_BY_KEY.scaffold,
  ASSET_PATH_BY_KEY.machine,
  ASSET_PATH_BY_KEY.barrier,
  ASSET_PATH_BY_KEY['blade-slash-1'],
  ASSET_PATH_BY_KEY['blade-slash-2'],
  ASSET_PATH_BY_KEY['blade-slash-3'],
  ASSET_PATH_BY_KEY['muzzle-flash'],
  ASSET_PATH_BY_KEY['rain-sheet'],
 ];
}

/**
 * Idempotently preloads all 4 isolated 3/4 props and 5 additive VFX textures in browser runtimes.
 */
export function omegaPrepareVfxAndPropArt(): void {
 if (prepared || typeof Image === 'undefined') return;
 prepared = true;
 (Object.keys(ASSET_PATH_BY_KEY) as OmegaVfxAndPropKey[]).forEach((key) => {
  const img = new Image();
  img.decoding = 'async';
  img.src = ASSET_PATH_BY_KEY[key];
  cachedImages[key] = img;
 });
}

/**
 * Renders an isolated hand-painted 3/4 isometric prop upright in world space with soft grounded
 * cast shadows and subtle sector-key rim reflection. Returns `false` if the WebP is not decoded yet
 * so legacy structural fallbacks keep working seamlessly.
 */
export function drawOmegaAuthored3DProp(
 ctx: CanvasRenderingContext2D,
 plan: OmegaFieldPlan,
 obstacle: OmegaFieldObstacle,
 camera: Pick<OmegaCameraState, 'skewX' | 'groundYScale'>,
 seconds: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 const img = resolveImage(obstacle.kind, imageOverride);
 if (!img) return false;
 if (
  !Number.isFinite(obstacle.x) ||
  !Number.isFinite(obstacle.y) ||
  !(obstacle.width > 0) ||
  !(obstacle.height > 0) ||
  !(camera.groundYScale > 0.1) ||
  !Number.isFinite(seconds)
 ) {
  return false;
 }

 const theme = omega3DSectorTheme(plan.sector);
 const spec = PROP_ASPECT_RATIOS[obstacle.kind];
 const invY = 1 / camera.groundYScale;

 ctx.save();

 // 1. Grounded soft ambient + directional cast shadow hugging the real Watch footprint.
 const sx = obstacle.x;
 const sy = obstacle.y;
 const sw = obstacle.width;
 const sh = obstacle.height;
 const castX = sw * 0.16;
 const castY = sh * 0.14;

 ctx.fillStyle = 'rgba(2,6,12,.34)';
 ctx.beginPath();
 ctx.moveTo(sx - sw * 0.04, sy + sh * 0.25);
 ctx.lineTo(sx + sw * 0.96, sy + sh * 0.20);
 ctx.lineTo(sx + sw + castX * 1.15, sy + sh + castY * 1.15);
 ctx.lineTo(sx + castX * 0.45, sy + sh + castY);
 ctx.closePath();
 ctx.fill();

 ctx.fillStyle = 'rgba(1,4,10,.48)';
 ctx.beginPath();
 ctx.ellipse(sx + sw * 0.52, sy + sh * 0.88, sw * 0.52, Math.max(8, sh * 0.24), 0, 0, Math.PI * 2);
 ctx.fill();

 // 2. Stand the 3/4 isometric artwork upright via inverse quarter-view matrix at front-center base.
 ctx.translate(sx + sw * 0.5, sy + sh);
 ctx.transform(1, 0, -camera.skewX * invY, invY, 0, 0);

 const drawW = Math.max(sw * spec.widthRatio, spec.minWidth);
 const drawH = drawW * spec.aspectH;
 const left = -drawW * 0.5;
 const top = -drawH + sh * spec.footPad;
 ctx.drawImage(img, left, top, drawW, drawH);

 // 3. Subtle atmospheric rim integration (zero solid shapes or bars over metal surfaces).
 const pulse = 0.08 + 0.03 * Math.sin(seconds * 2.4 + sx * 0.02);
 const rimGrad = ctx.createRadialGradient(-drawW * 0.12, top + drawH * 0.25, 4, 0, top + drawH * 0.42, drawW * 0.58);
 rimGrad.addColorStop(0, `rgba(${theme.keyRgb},${pulse.toFixed(3)})`);
 rimGrad.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.globalCompositeOperation = 'lighter';
 ctx.fillStyle = rimGrad;
 ctx.beginPath();
 ctx.ellipse(0, top + drawH * 0.38, drawW * 0.48, drawH * 0.38, 0, 0, Math.PI * 2);
 ctx.fill();

 ctx.restore();
 return true;
}

/**
 * Renders additive painterly supersonic plasma muzzle burst directly at AIRA's barrel tip.
 * Ignition origin of `muzzle-flash.webp` sits strictly at `(0.22 * drawW, 0.50 * drawH)`.
 */
export function drawOmegaPaintedMuzzleFlash(
 ctx: CanvasRenderingContext2D,
 localX: number,
 localY: number,
 angleRad: number,
 scale: number,
 ageSeconds: number,
 imageOverride?: CanvasImageSource | null,
): boolean {
 if (
  !Number.isFinite(localX) ||
  !Number.isFinite(localY) ||
  !Number.isFinite(angleRad) ||
  !(scale > 0) ||
  !Number.isFinite(ageSeconds) ||
  ageSeconds < 0 ||
  ageSeconds > 0.11
 ) {
  return false;
 }

 const norm = ageSeconds / 0.11;
 const env = norm < 0.08 ? norm / 0.08 : Math.pow(1 - (norm - 0.08) / 0.92, 1.8);
 if (env <= 0.01) return false;

 const img = resolveImage('muzzle-flash', imageOverride);
 const jitter = Math.sin(ageSeconds * 190) * 0.055;

 ctx.save();
 ctx.translate(localX, localY);
 ctx.rotate(angleRad + jitter);
 ctx.globalCompositeOperation = 'lighter';

 if (img) {
  const drawW = 88 * scale * (0.86 + 0.24 * env);
  const drawH = drawW * (256 / 384);
  ctx.globalAlpha = clamp(env * 1.05, 0, 1);
  ctx.drawImage(img, -0.22 * drawW, -0.50 * drawH, drawW, drawH);
 }

 // Crisp white-hot optical ignition core illuminating the barrel tip.
 const coreRadius = 22 * scale * (0.7 + 0.45 * env);
 const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
 grad.addColorStop(0, `rgba(255,255,255,${clamp(0.95 * env, 0, 1).toFixed(3)})`);
 grad.addColorStop(0.32, `rgba(148,232,255,${clamp(0.68 * env, 0, 1).toFixed(3)})`);
 grad.addColorStop(1, 'rgba(30,120,255,0)');
 ctx.globalAlpha = 1;
 ctx.fillStyle = grad;
 ctx.beginPath();
 ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
 ctx.fill();

 ctx.restore();
 return true;
}

/**
 * Renders progressive-sweep 3/4 tilted liquid-plasma blade slash VFX at chest height in world space,
 * paired with wet-floor reflection pool and impact sparks on actual hits.
 */
export function drawOmegaPaintedBladeSlash(
 ctx: CanvasRenderingContext2D,
 strike: OmegaBladeStrike | null,
 gameTime: number,
 camera: Pick<OmegaCameraState, 'skewX' | 'groundYScale'>,
 lift = 0,
 imageOverride?: CanvasImageSource | null,
): boolean {
 if (!strike || !Number.isFinite(gameTime) || !(camera.groundYScale > 0.1)) return false;
 const age = gameTime - strike.time;
 if (age < 0 || age > 0.28) return false;

 const progress = clamp(age / 0.28, 0, 1);
 const combo = strike.combo;
 const slashKey: OmegaVfxArtKey =
  combo === 1 ? 'blade-slash-1' : combo === 2 ? 'blade-slash-2' : 'blade-slash-3';
 const img = resolveImage(slashKey, imageOverride);

 const invY = 1 / camera.groundYScale;
 const chestUprightY = -46;
 const footWorldX = strike.x + lift * camera.skewX;
 const footWorldY = strike.y - lift;
 const chestWorldX = footWorldX - (camera.skewX * invY) * chestUprightY;
 const chestWorldY = footWorldY + chestUprightY * invY;

 const facingAngle = Math.atan2(strike.facingY || 0, strike.facingX || 1);
 const sweepT = easeOutCubic(clamp(progress * 1.65, 0, 1));
 const fadeAlpha = progress < 0.45 ? 1 : Math.pow(1 - (progress - 0.45) / 0.55, 1.4);
 const colorRgb =
  combo === 1 ? '108,226,255' : combo === 2 ? '204,132,255' : '255,168,84';

 ctx.save();

 // 1. Wet-floor specular plasma reflection pool under hero feet.
 ctx.save();
 ctx.translate(footWorldX + Math.cos(facingAngle) * 26, footWorldY + 6);
 ctx.scale(1, 0.38);
 ctx.globalCompositeOperation = 'lighter';
 const floorGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 96);
 floorGrad.addColorStop(0, `rgba(${colorRgb},${(0.36 * fadeAlpha).toFixed(3)})`);
 floorGrad.addColorStop(1, 'rgba(0,0,0,0)');
 ctx.fillStyle = floorGrad;
 ctx.beginPath();
 ctx.arc(0, 0, 96, 0, Math.PI * 2);
 ctx.fill();
 ctx.restore();

 // 2. 3/4 tilted progressive sweeping liquid-plasma slash reaching forward into targets.
 ctx.save();
 ctx.translate(
  chestWorldX+Math.cos(facingAngle)*26,
  chestWorldY+Math.sin(facingAngle)*26*0.72,
 );
 ctx.rotate(facingAngle);
 ctx.scale(1, 0.72);
 if (combo === 1) {
  ctx.rotate(-0.10);
 } else if (combo === 2) {
  ctx.rotate(0.16);
  ctx.scale(1, -1);
 } else {
  ctx.scale(1.18, 1.18);
 }

 const slashSize = combo === 3 ? 216 : 186;
 const startArc = -2.35;
 const endArc = startArc + 4.70 * sweepT;
 ctx.beginPath();
 ctx.moveTo(0, 0);
 ctx.arc(0, 0, slashSize * 0.92, startArc, endArc);
 ctx.closePath();
 ctx.clip();

 ctx.globalCompositeOperation = 'lighter';
 ctx.globalAlpha = clamp(fadeAlpha * 0.96, 0, 1);

 if (img) {
  ctx.drawImage(img, -slashSize * 0.40, -slashSize * 0.50, slashSize, slashSize);
  if (combo === 3) {
   ctx.save();
   ctx.rotate(0.18);
   ctx.globalAlpha = clamp(fadeAlpha * 0.55, 0, 1);
   ctx.drawImage(img, -slashSize * 0.40, -slashSize * 0.50, slashSize * 1.05, slashSize * 1.05);
   ctx.restore();
  }
 } else {
  // Soft additive plasma ribbon fallback when undecoded (zero pie-wedge polygons).
  const arcR = slashSize * 0.39;
  const fallbackGrad = ctx.createRadialGradient(0, 0, arcR * 0.58, 0, 0, arcR);
  fallbackGrad.addColorStop(0, 'rgba(0,0,0,0)');
  fallbackGrad.addColorStop(0.68, `rgba(${colorRgb},${(0.45 * fadeAlpha).toFixed(3)})`);
  fallbackGrad.addColorStop(0.92, `rgba(255,255,255,${(0.92 * fadeAlpha).toFixed(3)})`);
  fallbackGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fallbackGrad;
  ctx.beginPath();
  ctx.arc(0, 0, arcR, 0, Math.PI * 2);
  ctx.fill();
 }
 ctx.restore();

 // 3. Impact hit-flash bursts when blade actually struck infected targets.
 if (strike.hits > 0 && progress < 0.55) {
  const hitFade = 1 - progress / 0.55;
  ctx.globalCompositeOperation = 'lighter';
  const count = Math.min(2, strike.hits);
  for (let i = 0; i < count; i++) {
   const dist = 54 + i * 20;
   const spread = i === 0 ? 0.08 : -0.22;
   const hx = chestWorldX + Math.cos(facingAngle + spread) * dist;
   const hy = chestWorldY + Math.sin(facingAngle + spread) * dist * 0.72;
   const burst = ctx.createRadialGradient(hx, hy, 0, hx, hy, 28);
   burst.addColorStop(0, `rgba(255,255,255,${(0.85 * hitFade).toFixed(3)})`);
   burst.addColorStop(0.42, `rgba(${colorRgb},${(0.55 * hitFade).toFixed(3)})`);
   burst.addColorStop(1, 'rgba(0,0,0,0)');
   ctx.fillStyle = burst;
   ctx.beginPath();
   ctx.arc(hx, hy, 28, 0, Math.PI * 2);
   ctx.fill();
  }
 }

 ctx.restore();
 return true;
}

/**
 * Tiles 2 parallax-scrolling `'screen'`-blended photographic rain sheets across storm/rain sectors
 * (Sectors 1 & 3), collapsing to a single sheet on mobile budgets.
 */
export function drawOmegaPaintedRainOverlay(
 ctx: CanvasRenderingContext2D,
 plan: OmegaFieldPlan,
 camera: Pick<OmegaCameraState, 'scale' | 'projectedOffsetX' | 'projectedOffsetY'>,
 width: number,
 height: number,
 seconds: number,
 budget: Pick<Omega3DBudget, 'tier'>,
 imageOverride?: CanvasImageSource | null,
): boolean {
 if (plan.sector !== 1 && plan.sector !== 3) return false;
 const img = resolveImage('rain-sheet', imageOverride);
 if (
  !img ||
  !(width > 0) ||
  !(height > 0) ||
  !Number.isFinite(seconds) ||
  !Number.isFinite(camera.scale)
 ) {
  return false;
 }

 const camX = Number.isFinite(camera.projectedOffsetX) ? camera.projectedOffsetX * camera.scale : 0;
 const camY = Number.isFinite(camera.projectedOffsetY) ? camera.projectedOffsetY * camera.scale : 0;
 const storm = plan.sector === 3;

 const layers =
  budget.tier === 'mobile'
   ? [{ tile: 500, alpha: storm ? 0.42 : 0.28, vx: -205, vy: 810, parallax: 0.58 }]
   : [
      { tile: 420, alpha: storm ? 0.34 : 0.24, vx: -165, vy: 680, parallax: 0.38 },
      { tile: 560, alpha: storm ? 0.44 : 0.30, vx: -235, vy: 920, parallax: 0.78 },
     ];

 ctx.save();
 ctx.setTransform(1, 0, 0, 1, 0, 0);
 ctx.globalCompositeOperation = 'screen';

 for (const layer of layers) {
  const tile = layer.tile;
  const offX = wrapMod(seconds * layer.vx + camX * layer.parallax, tile);
  const offY = wrapMod(seconds * layer.vy + camY * layer.parallax, tile);
  ctx.globalAlpha = layer.alpha;
  for (let y = offY - tile; y < height; y += tile) {
   for (let x = offX - tile; x < width; x += tile) {
    ctx.drawImage(img, x, y, tile, tile);
   }
  }
 }

 ctx.restore();
 return true;
}
