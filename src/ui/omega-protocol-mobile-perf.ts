export type OmegaPerfPreset = 'auto' | 'performance' | 'quality';

export const OMEGA_PERF_STORAGE_KEY = 'psi:omega-zero-signal:perf:v1';

const VALID_PRESETS = new Set<OmegaPerfPreset>(['auto', 'performance', 'quality']);

export function readOmegaPerfPreset(): OmegaPerfPreset {
 try {
  if (typeof window === 'undefined' || !window.localStorage) return 'auto';
  const raw = window.localStorage.getItem(OMEGA_PERF_STORAGE_KEY);
  return raw && VALID_PRESETS.has(raw as OmegaPerfPreset) ? (raw as OmegaPerfPreset) : 'auto';
 } catch {
  return 'auto';
 }
}

export function saveOmegaPerfPreset(preset: OmegaPerfPreset): void {
 try {
  if (typeof window !== 'undefined' && window.localStorage) {
   window.localStorage.setItem(OMEGA_PERF_STORAGE_KEY, preset);
  }
 } catch {
  void 0;
 }
}

export interface OmegaMobileProfile {
 readonly isCompactViewport: boolean;
 readonly isPortrait: boolean;
 readonly isLandscapePhone: boolean;
 readonly canvasScale: number;
 readonly pixelWidth: number;
 readonly pixelHeight: number;
 readonly skipSecondaryAtmosphere: boolean;
 readonly allowShadowBlur: boolean;
 readonly hudCommitIntervalMs: number;
 readonly radarCompact: boolean;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * Resolves viewport-aware canvas resolution, GPU effect budget, and HUD throttling
 * to keep smartphones locked near 60 FPS with zero canvas overdraw stalls.
 */
export function resolveOmegaMobileProfile(
 cssWidth: number,
 cssHeight: number,
 devicePixelRatio: number,
 preset: OmegaPerfPreset,
 adaptiveScale = 1,
 adaptiveLowFx = false,
): OmegaMobileProfile {
 const w = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 1120;
 const h = Number.isFinite(cssHeight) && cssHeight > 0 ? cssHeight : 720;
 const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;

 const isCompactViewport = Math.min(w, h) <= 540 || w <= 900;
 const isPortrait = h > w;
 const isLandscapePhone = w > h && h <= 520;

 let canvasScale: number;
 if (isCompactViewport) {
  const baseCap =
   preset === 'performance' ? 0.82 : preset === 'quality' ? Math.min(1.18, dpr) : Math.min(1.0, dpr);
  const adapted = preset === 'auto' ? baseCap * clamp(adaptiveScale, 0.68, 1.25) : baseCap;
  const maxW = preset === 'performance' ? 760 : preset === 'quality' ? 1024 : 880;
  const maxH = preset === 'performance' ? 720 : preset === 'quality' ? 1024 : 880;
  canvasScale = Math.max(0.5, Math.min(adapted, maxW / w, maxH / h));
 } else {
  const base = preset === 'performance' ? 0.9 : Math.min(1.25, dpr);
  canvasScale = Math.max(0.1, Math.min(base, 1120 / w, 1200 / h));
 }

 const skipSecondaryAtmosphere =
  preset === 'performance' || (isCompactViewport && preset !== 'quality') || adaptiveLowFx;
 const allowShadowBlur = !isCompactViewport && preset !== 'performance' && !adaptiveLowFx;

 return {
  isCompactViewport,
  isPortrait,
  isLandscapePhone,
  canvasScale,
  pixelWidth: Math.max(1, Math.round(w * canvasScale)),
  pixelHeight: Math.max(1, Math.round(h * canvasScale)),
  skipSecondaryAtmosphere,
  allowShadowBlur,
  hudCommitIntervalMs: isCompactViewport ? 145 : 95,
  radarCompact: isCompactViewport,
 };
}

/**
 * Hysteresis-protected frame-time governor for `'auto'` preset on compact viewports:
 * steps render scale down when rolling FPS dips below 44 FPS twice in a row and
 * cleanly restores full resolution once rolling FPS sustains 56+ FPS across 3 windows.
 */
export class OmegaAdaptiveFrameGovernor {
 private scale = 1.0;
 private lowFx = false;
 private samples: number[] = [];
 private windowElapsed = 0;
 private lowStreak = 0;
 private highStreak = 0;

 reset(): void {
  this.scale = 1.0;
  this.lowFx = false;
  this.samples = [];
  this.windowElapsed = 0;
  this.lowStreak = 0;
  this.highStreak = 0;
 }

 currentScale(preset: OmegaPerfPreset): number {
  if (preset === 'performance') return 0.82;
  if (preset === 'quality') return 1.0;
  return this.scale;
 }

 currentLowFx(preset: OmegaPerfPreset): boolean {
  if (preset === 'performance') return true;
  if (preset === 'quality') return false;
  return this.lowFx;
 }

 recordFrame(dtSeconds: number, preset: OmegaPerfPreset, isCompact: boolean): boolean {
  if (preset !== 'auto' || !isCompact || !Number.isFinite(dtSeconds) || dtSeconds <= 0) {
   return false;
  }
  const dt = clamp(dtSeconds, 0.001, 0.25);
  this.samples.push(dt);
  if (this.samples.length > 24) this.samples.shift();
  this.windowElapsed += dt;

  if (this.windowElapsed < 0.9 || this.samples.length < 12) {
   return false;
  }

  let total = 0;
  for (const s of this.samples) total += s;
  const avgDt = total / this.samples.length;
  const fps = avgDt > 0 ? 1 / avgDt : 60;
  this.samples = [];
  this.windowElapsed = 0;

  if (fps < 44) {
   this.lowStreak++;
   this.highStreak = 0;
   if (this.lowStreak >= 2) {
    this.lowStreak = 0;
    const prevScale = this.scale;
    const prevLowFx = this.lowFx;
    if (this.scale > 0.9) this.scale = 0.86;
    else if (this.scale > 0.78) this.scale = 0.74;
    this.lowFx = true;
    return prevScale !== this.scale || prevLowFx !== this.lowFx;
   }
  } else if (fps >= 56) {
   this.highStreak++;
   this.lowStreak = 0;
   if (this.highStreak >= 3) {
    this.highStreak = 0;
    const prevScale = this.scale;
    const prevLowFx = this.lowFx;
    if (this.scale < 0.8) this.scale = 0.86;
    else if (this.scale < 0.96) this.scale = 1.0;
    this.lowFx = this.scale < 1.0;
    return prevScale !== this.scale || prevLowFx !== this.lowFx;
   }
  } else {
   this.lowStreak = 0;
   this.highStreak = 0;
  }

  return false;
 }
}
