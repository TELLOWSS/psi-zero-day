/**
 * OMEGA PROTOCOL — 6-Layer 3D Perspective Depth Canvas Renderer.
 * Delivers genuine multi-plane camera parallax, wet puddle reflections,
 * depth-sorted 3D silhouettes, foreground barrier + animated AIRA,
 * atmospheric storm rain, and sector breach camera transitions.
 */

import {
  OMEGA_COVER_LANE_X,
  OMEGA_WEAPONS,
  projectOmegaPoint,
  type OmegaEnemyKind,
  type OmegaQualityPreset,
} from '../domain/omega-protocol';
import type {
  OmegaBarrierState,
  OmegaEnemyState,
  OmegaPropState,
  OmegaProtocolEngine,
} from '../engine/omega-protocol-engine';

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
  depth: number; // 0 = far, 0.5 = mid, 1 = near
}

interface SplashRipple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
}

interface LensDrop {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
}

interface ShellCasing {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  life: number;
  color: string;
}

interface DepthSlicedPlates {
  readonly wingCanvas: HTMLCanvasElement;
  readonly floorCanvas: HTMLCanvasElement;
}

export class OmegaRenderer {
  private readonly imageCache = new Map<string, HTMLImageElement>();
  private readonly plateCache = new Map<string, DepthSlicedPlates>();
  private readonly rainDrops: RainDrop[] = [];
  private readonly ripples: SplashRipple[] = [];
  private readonly lensDrops: LensDrop[] = [];
  private readonly casings: ShellCasing[] = [];
  private clock = 0;
  private airaPeekBlend = 0;
  private prevMuzzleFlash = 0;

  constructor() {
    for (let i = 0; i < 165; i++) {
      const depth = i < 70 ? 0.25 + (i % 4) * 0.05 : i < 130 ? 0.52 + (i % 4) * 0.06 : 0.85 + (i % 4) * 0.14;
      this.rainDrops.push({
        x: (i * 0.0731) % 1,
        y: (i * 0.1397) % 1,
        len: 10 + depth * 24,
        speed: 0.78 + depth * 1.25,
        depth,
      });
    }
    for (let i = 0; i < 20; i++) {
      this.ripples.push({
        x: ((i * 0.173) % 0.86) + 0.07,
        y: 0.7 + ((i * 0.117) % 0.25),
        r: (i * 3) % 14,
        maxR: 10 + (i % 5) * 3,
        alpha: 0.35,
      });
    }
    for (let i = 0; i < 9; i++) {
      const leftSide = i % 2 === 0;
      this.lensDrops.push({
        x: leftSide ? 0.03 + (i * 0.037) % 0.14 : 0.83 + (i * 0.031) % 0.14,
        y: (i * 0.19) % 0.88,
        r: 4.5 + (i % 4) * 2.5,
        vy: 0.012 + (i % 3) * 0.008,
        alpha: 0.26 + (i % 3) * 0.08,
      });
    }
  }

  preloadBackdrops(uris: readonly string[]): void {
    if (typeof Image === 'undefined') return;
    for (const uri of uris) {
      if (this.imageCache.has(uri)) continue;
      const img = new Image();
      img.decoding = 'async';
      img.src = uri;
      this.imageCache.set(uri, img);
    }
  }

  private getBackdropImage(uri: string): HTMLImageElement | null {
    const cached = this.imageCache.get(uri);
    if (!cached) {
      this.preloadBackdrops([uri]);
      return null;
    }
    return cached.complete && cached.naturalWidth > 0 ? cached : null;
  }

  render(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    width: number,
    height: number,
    dt: number,
    options: { readonly quality: OmegaQualityPreset; readonly reducedMotion: boolean },
  ): void {
    if (width <= 0 || height <= 0) return;
    this.clock += Math.min(dt, 0.05);
    const s = engine.state;
    const sec = engine.sector;
    const quality = options.quality;
    const motionScale = options.reducedMotion ? 0.15 : 1;
    const targetPeek = s.posture === 'peek' ? 1 : s.posture === 'dash' ? 0.55 : 0;
    const blendStep = options.reducedMotion ? 1 : 1 - Math.exp(-20 * Math.min(dt, 0.05));
    this.airaPeekBlend += (targetPeek - this.airaPeekBlend) * blendStep;

    // Camera shake offset
    const shakeAmt = options.reducedMotion ? 0 : s.shake;
    const shakeX = shakeAmt > 0 ? Math.sin(this.clock * 73) * shakeAmt * width : 0;
    const shakeY = shakeAmt > 0 ? Math.cos(this.clock * 91) * shakeAmt * height : 0;

    // Transition 3D breach zoom
    const transitionProgress =
      s.phase === 'transition' && s.transitionDuration > 0
        ? 1 - s.transitionTimer / s.transitionDuration
        : 0;
    const breachZoom =
      s.phase === 'transition'
        ? 1 + Math.pow(Math.min(1, transitionProgress * 1.15), 2) * 0.65
        : 1;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (breachZoom !== 1) {
      const cx = width * 0.5;
      const cy = height * sec.horizonY;
      ctx.translate(cx, cy);
      ctx.scale(breachZoom, breachZoom);
      ctx.translate(-cx, -cy);
    }
    ctx.translate(shakeX, shakeY);

    // =========================================================================
    // LAYER 0 (0.10x -> 0.52x 3-Plane Depth-Sliced Sector Art + Lightning)
    // =========================================================================
    this.drawLayer0Backdrop(ctx, engine, width, height, quality, motionScale);

    // =========================================================================
    // LAYER 1 (0.28x Parallax): Volumetric Searchlights, Beacons & Depth Haze
    // =========================================================================
    if (quality !== 'low') {
      this.drawLayer1Atmosphere(ctx, engine, width, height, motionScale);
    }

    // =========================================================================
    // LAYER 2 (0.55x -> 1.0x): Perspective Deck Plane, Wet Reflections & Beams
    // =========================================================================
    this.drawLayer2GroundPlane(ctx, engine, width, height, quality);

    // =========================================================================
    // MIDGROUND ARCH FRAME (0.62x Parallax): Overhead Truss, Cables & Depth Pillars
    // =========================================================================
    if (quality !== 'low') {
      this.drawMidgroundArchFrame(ctx, engine, width, height, motionScale);
    }

    // =========================================================================
    // LAYER 3 (Z-Sorted 3D World): Props, Enemies, Bosses, Rockets
    // =========================================================================
    this.drawLayer3WorldEntities(ctx, engine, width, height);

    // =========================================================================
    // LAYER 4 (1.18x Parallax): Concrete Cover Barriers & Animated AIRA
    // =========================================================================
    this.drawLayer4ForegroundCover(ctx, engine, width, height);

    // =========================================================================
    // LAYER 5 (1.45x Parallax): Foreground Girders, Rain, FX, Crosshair, Shutter
    // =========================================================================
    this.drawLayer5ForegroundAndFX(ctx, engine, width, height, dt, quality, motionScale, transitionProgress);

    ctx.restore();
  }

  private getDepthSlicedPlates(uri: string, img: HTMLImageElement, horizonY: number): DepthSlicedPlates | null {
    const existing = this.plateCache.get(uri);
    if (existing) return existing;
    if (typeof document === 'undefined') return null;

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w <= 0 || h <= 0) return null;

    // 1. Mid-flank structural corridor wings (feathered left/right edges at 0.34x parallax)
    const wingCanvas = document.createElement('canvas');
    wingCanvas.width = w;
    wingCanvas.height = h;
    const wctx = wingCanvas.getContext('2d');
    if (!wctx) return null;
    wctx.drawImage(img, 0, 0);
    wctx.globalCompositeOperation = 'destination-out';
    const wingMask = wctx.createLinearGradient(0, 0, w, 0);
    wingMask.addColorStop(0, 'rgba(0,0,0,0)');
    wingMask.addColorStop(0.22, 'rgba(0,0,0,0.4)');
    wingMask.addColorStop(0.34, 'rgba(0,0,0,1)');
    wingMask.addColorStop(0.66, 'rgba(0,0,0,1)');
    wingMask.addColorStop(0.78, 'rgba(0,0,0,0.4)');
    wingMask.addColorStop(1, 'rgba(0,0,0,0)');
    wctx.fillStyle = wingMask;
    wctx.fillRect(0, 0, w, h);
    // Feather bottom edge so flanking corridor walls blend smoothly above gliding floor
    const wingBottomFade = wctx.createLinearGradient(0, h * 0.66, 0, h * 0.88);
    wingBottomFade.addColorStop(0, 'rgba(0,0,0,0)');
    wingBottomFade.addColorStop(1, 'rgba(0,0,0,1)');
    wctx.fillStyle = wingBottomFade;
    wctx.fillRect(0, h * 0.66, w, h * 0.34);

    // 2. Gliding lower wet deck strip below horizon (feathered top seam at 0.52x parallax)
    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = w;
    floorCanvas.height = h;
    const fctx = floorCanvas.getContext('2d');
    if (!fctx) return null;
    fctx.drawImage(img, 0, 0);
    fctx.globalCompositeOperation = 'destination-out';
    const floorMask = fctx.createLinearGradient(0, 0, 0, h);
    floorMask.addColorStop(0, 'rgba(0,0,0,1)');
    floorMask.addColorStop(Math.max(0.05, horizonY - 0.03), 'rgba(0,0,0,1)');
    floorMask.addColorStop(Math.min(0.95, horizonY + 0.1), 'rgba(0,0,0,0)');
    floorMask.addColorStop(1, 'rgba(0,0,0,0)');
    fctx.fillStyle = floorMask;
    fctx.fillRect(0, 0, w, h);

    const plates = { wingCanvas, floorCanvas };
    this.plateCache.set(uri, plates);
    return plates;
  }

  private drawLayer0Backdrop(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    width: number,
    height: number,
    quality: OmegaQualityPreset,
    motionScale: number,
  ): void {
    const s = engine.state;
    const sec = engine.sector;
    const img = this.getBackdropImage(sec.backdropUri);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, sec.palette.skyTop);
    skyGrad.addColorStop(0.58, sec.palette.fog);
    skyGrad.addColorStop(1, '#090713');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-30, -30, width + 60, height + 60);

    const overscan = 1.12;
    const farShiftX = -s.camX * width * 0.1 * motionScale;
    const farShiftY = -s.camY * height * 0.08 * motionScale;

    if (img) {
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const viewAspect = width / height;
      let drawW = width * overscan;
      let drawH = height * overscan;
      if (viewAspect > imgAspect) {
        drawH = drawW / imgAspect;
      } else {
        drawW = drawH * imgAspect;
      }
      const dx = (width - drawW) * 0.5 + farShiftX;
      const dy = (height - drawH) * 0.48 + farShiftY;
      ctx.drawImage(img, dx, dy, drawW, drawH);

      // Depth-sliced flanking structural wings (0.34x) + wet deck plane (0.52x)
      if (quality !== 'low') {
        const plates = this.getDepthSlicedPlates(sec.backdropUri, img, sec.horizonY);
        if (plates) {
          const floorShiftX = -s.camX * width * 0.52 * motionScale;
          const floorShiftY = -s.camY * height * 0.36 * motionScale;
          ctx.drawImage(
            plates.floorCanvas,
            (width - drawW * 1.04) * 0.5 + floorShiftX,
            (height - drawH * 1.04) * 0.48 + floorShiftY,
            drawW * 1.04,
            drawH * 1.04,
          );

          const wingShiftX = -s.camX * width * 0.34 * motionScale;
          const wingShiftY = -s.camY * height * 0.22 * motionScale;
          ctx.drawImage(
            plates.wingCanvas,
            (width - drawW * 1.05) * 0.5 + wingShiftX,
            (height - drawH * 1.05) * 0.48 + wingShiftY,
            drawW * 1.05,
            drawH * 1.05,
          );
        }
      }
    } else {
      // Crisp procedural silhouette skyline fallback while webp decodes
      this.drawFallbackSkyline(ctx, sec.palette.accent, sec.palette.accentAlt, width, height, farShiftX);
    }

    // Subtle atmospheric lightning storm flash across sky
    if (s.lightningFlash > 0.01) {
      ctx.save();
      ctx.globalAlpha = s.lightningFlash * 0.22;
      ctx.fillStyle = '#d8bfff';
      ctx.fillRect(0, 0, width, height * sec.horizonY);
      ctx.restore();
    }

    // Depth vignette framing
    const vig = ctx.createRadialGradient(
      width * 0.5,
      height * 0.48,
      width * 0.25,
      width * 0.5,
      height * 0.5,
      width * 0.78,
    );
    vig.addColorStop(0, 'rgba(8, 6, 18, 0)');
    vig.addColorStop(1, 'rgba(4, 3, 12, 0.56)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  private drawFallbackSkyline(
    ctx: CanvasRenderingContext2D,
    accent: string,
    accentAlt: string,
    w: number,
    h: number,
    shiftX: number,
  ): void {
    ctx.save();
    ctx.translate(shiftX, 0);
    ctx.fillStyle = '#151029';
    const towers = [0.08, 0.19, 0.31, 0.68, 0.81, 0.92];
    towers.forEach((tx, idx) => {
      const bw = w * (0.06 + (idx % 2) * 0.03);
      const bh = h * (0.28 + (idx % 3) * 0.09);
      ctx.fillRect(tx * w - bw * 0.5, h * 0.54 - bh, bw, bh);
      ctx.fillStyle = idx % 2 === 0 ? accent : accentAlt;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(tx * w - 3, h * 0.54 - bh - 5, 6, 4);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#151029';
    });
    ctx.restore();
  }

  private drawLayer1Atmosphere(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    width: number,
    height: number,
    motionScale: number,
  ): void {
    const s = engine.state;
    const sec = engine.sector;
    const shiftX = -s.camX * width * 0.28 * motionScale;
    const shiftY = -s.camY * height * 0.18 * motionScale;

    ctx.save();
    ctx.translate(shiftX, shiftY);

    // Volumetric diagonal searchlight cones sweeping the storm clouds
    const beams = [
      { ox: 0.16, oy: 0.5, baseAngle: -1.12, swing: 0.22, speed: 0.55, color: sec.palette.accentAlt },
      { ox: 0.84, oy: 0.48, baseAngle: -2.02, swing: 0.24, speed: 0.48, color: sec.palette.accent },
    ];
    ctx.globalCompositeOperation = 'screen';
    for (const b of beams) {
      const ang = b.baseAngle + Math.sin(this.clock * b.speed) * b.swing * motionScale;
      const sx = width * b.ox;
      const sy = height * b.oy;
      const len = height * 0.9;
      const spread = 0.16;
      const x1 = sx + Math.cos(ang - spread) * len;
      const y1 = sy + Math.sin(ang - spread) * len;
      const x2 = sx + Math.cos(ang + spread) * len;
      const y2 = sy + Math.sin(ang + spread) * len;
      const g = ctx.createLinearGradient(sx, sy, (x1 + x2) * 0.5, (y1 + y2) * 0.5);
      g.addColorStop(0, `${b.color}2b`);
      g.addColorStop(1, `${b.color}00`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();
    }

    // Blinking aviation beacons on distant crane tips
    const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(this.clock * 3.1));
    ctx.globalAlpha = pulse;
    for (const bx of [0.27, 0.48, 0.74]) {
      const x = width * bx;
      const y = height * 0.24;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 16);
      rg.addColorStop(0, '#ff4d79');
      rg.addColorStop(1, 'rgba(255, 77, 121, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Multi-band drifting volumetric fog plumes separating background from combat plane
    const horizonPx = height * sec.horizonY;
    const fogGrad = ctx.createLinearGradient(0, horizonPx - height * 0.16, 0, horizonPx + height * 0.14);
    fogGrad.addColorStop(0, 'rgba(30, 18, 60, 0)');
    fogGrad.addColorStop(0.5, 'rgba(42, 22, 74, 0.36)');
    fogGrad.addColorStop(1, 'rgba(20, 12, 42, 0)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, horizonPx - height * 0.16, width, height * 0.3);

    // Animated drifting storm mist plumes
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) {
      const drift = (((this.clock * (0.04 + i * 0.015) * motionScale) + i * 0.37) % 1.4) - 0.2;
      const mx = drift * width - s.camX * width * (0.24 + i * 0.1);
      const my = horizonPx + (i - 1) * height * 0.045;
      const plume = ctx.createRadialGradient(mx, my, 12, mx, my, width * 0.26);
      plume.addColorStop(0, `${sec.palette.accent}18`);
      plume.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = plume;
      ctx.beginPath();
      ctx.ellipse(mx, my, width * 0.26, height * 0.085, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawLayer2GroundPlane(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    width: number,
    height: number,
    quality: OmegaQualityPreset,
  ): void {
    const s = engine.state;
    const sec = engine.sector;
    const horizonPx = height * (sec.horizonY - s.camY * 0.22);
    const vanishX = width * (0.5 - s.camX * 0.32);

    // Subtle 3D perspective deck lines converging into horizon vanishing point
    ctx.save();
    ctx.strokeStyle = `${sec.palette.accent}24`;
    ctx.lineWidth = 1;
    const laneLines = [-0.52, -0.26, 0, 0.26, 0.52];
    for (const wx of laneLines) {
      const near = projectOmegaPoint(wx, 0, 0, sec.horizonY, s.camX, s.camY);
      const far = projectOmegaPoint(wx, 0, 0.98, sec.horizonY, s.camX, s.camY);
      ctx.beginPath();
      ctx.moveTo(far.x * width, far.groundY * height);
      ctx.lineTo(near.x * width, near.groundY * height);
      ctx.stroke();
    }
    for (const zDepth of [0.22, 0.42, 0.65, 0.88]) {
      const left = projectOmegaPoint(-0.52, 0, zDepth, sec.horizonY, s.camX, s.camY);
      const right = projectOmegaPoint(0.52, 0, zDepth, sec.horizonY, s.camX, s.camY);
      ctx.beginPath();
      ctx.moveTo(left.x * width, left.groundY * height);
      ctx.lineTo(right.x * width, right.groundY * height);
      ctx.stroke();
    }

    // Real-time inverted wet puddle reflections & dynamic light bloom relighting
    if (quality !== 'low') {
      ctx.globalCompositeOperation = 'screen';
      for (const e of s.enemies) {
        const ep = projectOmegaPoint(e.worldX, e.elevation, e.z, sec.horizonY, s.camX, s.camY);
        const rx = ep.x * width;
        const ry = ep.groundY * height + 8 * ep.scale;
        const rw = (e.isBoss ? 86 : 28) * ep.scale;
        const rh = (e.isBoss ? 26 : 10) * ep.scale;
        const refGrad = ctx.createRadialGradient(rx, ry, 1, rx, ry, rw);
        refGrad.addColorStop(0, e.isBoss ? `${sec.palette.accent}60` : `${sec.palette.reflection}44`);
        refGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = refGrad;
        ctx.beginPath();
        ctx.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inverted shimmering silhouette streak beneath enemy feet
        const streakH = (e.isBoss ? 48 : 22) * ep.scale;
        const shimmer = Math.sin(this.clock * 8 + e.id) * 3;
        ctx.fillStyle = e.isBoss ? `${sec.palette.accent}24` : `${sec.palette.reflection}20`;
        ctx.beginPath();
        ctx.ellipse(rx + shimmer, ry + streakH * 0.45, rw * 0.42, streakH * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (s.lastLightBloom.intensity > 0.03) {
        const bx = s.lastLightBloom.x * width;
        const by = Math.max(height * sec.horizonY, s.lastLightBloom.y * height);
        const br = width * 0.24;
        const bg = ctx.createRadialGradient(bx, by, 4, bx, by, br);
        const alphaHex = Math.round(Math.min(1, s.lastLightBloom.intensity) * 72)
          .toString(16)
          .padStart(2, '0');
        bg.addColorStop(0, `${s.lastLightBloom.color}${alphaHex}`);
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.ellipse(bx, by, br, br * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (s.muzzleFlash > 0.05) {
        const mx = width * (0.5 + (OMEGA_COVER_LANE_X[s.lane] - s.camX) * 0.95);
        const my = height * 0.88;
        const mg = ctx.createRadialGradient(mx, my, 2, mx, my, 95);
        mg.addColorStop(0, `rgba(255, 86, 200, ${0.42 * s.muzzleFlash})`);
        mg.addColorStop(1, 'rgba(255, 86, 200, 0)');
        ctx.fillStyle = mg;
        ctx.beginPath();
        ctx.ellipse(mx, my, 95, 28, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Sweeping Boss Lane Beam Telegraphs projected onto the 3D deck
    for (const e of s.enemies) {
      if (e.beamLanes.length === 0) continue;
      const origin = projectOmegaPoint(e.worldX, e.elevation, e.z, sec.horizonY, s.camX, s.camY);
      for (const lane of e.beamLanes) {
        const target = projectOmegaPoint(OMEGA_COVER_LANE_X[lane], 0, 0, sec.horizonY, s.camX, s.camY);
        const ox = origin.x * width;
        const oy = origin.y * height;
        const tx = target.x * width;
        const ty = target.groundY * height;
        const halfW = 54;
        const pulse = 0.25 + e.beamProgress * 0.45;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(255, 58, 130, ${pulse * 0.45})`;
        ctx.beginPath();
        ctx.moveTo(ox - 8, oy);
        ctx.lineTo(ox + 8, oy);
        ctx.lineTo(tx + halfW, ty);
        ctx.lineTo(tx - halfW, ty);
        ctx.closePath();
        ctx.fill();

        // Bright danger stripe along barrier edge
        ctx.strokeStyle = e.beamProgress > 0.72 ? '#ffffff' : '#ff4b9c';
        ctx.lineWidth = 2 + e.beamProgress * 3;
        ctx.beginPath();
        ctx.moveTo(tx - halfW, ty);
        ctx.lineTo(tx + halfW, ty);
        ctx.stroke();
      }
    }

    // Slight horizon glow accent
    const hGlow = ctx.createRadialGradient(vanishX, horizonPx, 2, vanishX, horizonPx, width * 0.38);
    hGlow.addColorStop(0, `${sec.palette.accent}22`);
    hGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = hGlow;
    ctx.fillRect(0, horizonPx - 120, width, 240);

    ctx.restore();
  }

  private drawMidgroundArchFrame(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    w: number,
    h: number,
    motionScale: number,
  ): void {
    const s = engine.state;
    const sec = engine.sector;
    const shiftX = -s.camX * w * 0.62 * 0.22 * motionScale;
    const shiftY = -s.camY * h * 0.62 * 0.18 * motionScale;

    ctx.save();
    ctx.translate(shiftX, shiftY);

    // Overhead industrial steel truss beam framing the mid-depth corridor
    const beamY = h * 0.095;
    const beamH = h * 0.042;
    ctx.fillStyle = 'rgba(14, 11, 28, 0.82)';
    ctx.fillRect(-w * 0.12, beamY, w * 1.24, beamH);
    ctx.strokeStyle = 'rgba(130, 108, 196, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = -w * 0.1; x < w * 1.1; x += 68) {
      ctx.moveTo(x, beamY);
      ctx.lineTo(x + 34, beamY + beamH);
      ctx.lineTo(x + 68, beamY);
    }
    ctx.stroke();

    // Suspended catenary power cables gently swaying in storm wind
    const cableSway = Math.sin(this.clock * 1.9) * 5 * motionScale;
    ctx.strokeStyle = 'rgba(26, 20, 48, 0.78)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(w * 0.04, beamY + beamH);
    ctx.quadraticCurveTo(w * 0.27, beamY + beamH + 46 + cableSway, w * 0.5, beamY + beamH + 6);
    ctx.quadraticCurveTo(w * 0.73, beamY + beamH + 42 - cableSway, w * 0.96, beamY + beamH);
    ctx.stroke();

    // Left & right midground structural depth pillars + glowing telemetry strips
    const pillarW = w * 0.028;
    const pillarTop = beamY;
    const pillarBottom = h * 0.76;
    for (const side of [0.065, 0.935]) {
      const px = w * side - pillarW * 0.5;
      ctx.fillStyle = 'rgba(16, 12, 32, 0.78)';
      ctx.fillRect(px, pillarTop, pillarW, pillarBottom - pillarTop);
      ctx.strokeStyle = `${sec.palette.accentAlt}55`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const stripX = side < 0.5 ? px + pillarW - 4 : px + 4;
      ctx.moveTo(stripX, pillarTop + 26);
      ctx.lineTo(stripX, pillarBottom - 36);
      ctx.stroke();

      // Glowing beacon node on pillar
      ctx.fillStyle = side < 0.5 ? sec.palette.accent : sec.palette.accentAlt;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(stripX - 2, pillarTop + 56, 4, 18);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  private drawLayer3WorldEntities(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    width: number,
    height: number,
  ): void {
    const s = engine.state;
    const sec = engine.sector;

    // Collect render items and sort back-to-front (largest z first)
    type RenderItem =
      | { kind: 'prop'; z: number; prop: OmegaPropState }
      | { kind: 'enemy'; z: number; enemy: OmegaEnemyState }
      | { kind: 'shot'; z: number; shotIndex: number };

    const queue: RenderItem[] = [];
    for (const prop of s.props) {
      if (!prop.destroyed) queue.push({ kind: 'prop', z: prop.z, prop });
    }
    for (const enemy of s.enemies) {
      queue.push({ kind: 'enemy', z: enemy.z, enemy });
    }
    s.enemyShots.forEach((shot, shotIndex) => {
      queue.push({ kind: 'shot', z: shot.z, shotIndex });
    });

    queue.sort((a, b) => b.z - a.z);

    // Draw Phantom Boss leap afterimage ghosts behind entities
    for (const ghost of s.phantomGhosts) {
      const gp = projectOmegaPoint(ghost.worldX, ghost.elevation, ghost.z, sec.horizonY, s.camX, s.camY);
      const gx = gp.x * width;
      const gy = gp.y * height;
      const gUnit = height * 0.115 * gp.scale;
      const alpha = Math.max(0, ghost.life / ghost.maxLife) * 0.55;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#a44aff';
      ctx.beginPath();
      ctx.moveTo(gx - gUnit * 0.55, gy + gUnit * 0.1);
      ctx.lineTo(gx - gUnit * 1.15, gy - gUnit * 0.65);
      ctx.lineTo(gx, gy - gUnit * 0.92);
      ctx.lineTo(gx + gUnit * 1.15, gy - gUnit * 0.65);
      ctx.lineTo(gx + gUnit * 0.55, gy + gUnit * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (const item of queue) {
      if (item.kind === 'prop') {
        this.drawProp(ctx, engine, item.prop, width, height);
      } else if (item.kind === 'enemy') {
        this.drawEnemy(ctx, engine, item.enemy, width, height, sec.palette.accent, sec.palette.accentAlt);
      } else {
        const shot = s.enemyShots[item.shotIndex];
        if (shot) {
          this.drawEnemyShot(ctx, engine, shot, width, height);
        }
      }
    }
  }

  private drawProp(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    prop: OmegaPropState,
    w: number,
    h: number,
  ): void {
    const s = engine.state;
    const p = projectOmegaPoint(prop.worldX, 0.09, prop.z, engine.sector.horizonY, s.camX, s.camY);
    const sx = p.x * w;
    const sy = p.y * h;
    const gy = p.groundY * h;
    const sc = p.scale;

    ctx.save();
    // Contact shadow
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.beginPath();
    ctx.ellipse(sx, gy, 20 * sc, 7 * sc, 0, 0, Math.PI * 2);
    ctx.fill();

    const bw = 26 * sc;
    const bh = 38 * sc;
    const topY = gy - bh;

    if (prop.kind === 'barrel') {
      ctx.fillStyle = prop.hitFlash > 0.2 ? '#fff4d4' : '#b83228';
      ctx.strokeStyle = '#ffae42';
      ctx.lineWidth = 2;
      ctx.fillRect(sx - bw * 0.5, topY, bw, bh);
      ctx.strokeRect(sx - bw * 0.5, topY, bw, bh);
      ctx.fillStyle = '#ffae42';
      ctx.fillRect(sx - bw * 0.5, topY + bh * 0.35, bw, bh * 0.2);
    } else if (prop.kind === 'emp') {
      ctx.fillStyle = prop.hitFlash > 0.2 ? '#ffffff' : '#1b4b6e';
      ctx.strokeStyle = '#59efff';
      ctx.lineWidth = 2;
      ctx.fillRect(sx - bw * 0.48, topY, bw * 0.96, bh);
      ctx.strokeRect(sx - bw * 0.48, topY, bw * 0.96, bh);
      ctx.fillStyle = '#59efff';
      ctx.beginPath();
      ctx.arc(sx, topY + bh * 0.3, 6 * sc, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = prop.hitFlash > 0.2 ? '#ffffff' : '#1e5c47';
      ctx.strokeStyle = '#6bffb8';
      ctx.lineWidth = 2;
      ctx.fillRect(sx - bw * 0.65, gy - bh * 0.72, bw * 1.3, bh * 0.72);
      ctx.strokeRect(sx - bw * 0.65, gy - bh * 0.72, bw * 1.3, bh * 0.72);
      ctx.fillStyle = '#6bffb8';
      ctx.fillRect(sx - 2 * sc, gy - bh * 0.54, 4 * sc, bh * 0.35);
      ctx.fillRect(sx - bw * 0.22, gy - bh * 0.39, bw * 0.44, 4 * sc);
    }

    // Floating tactical diamond indicator
    ctx.strokeStyle = prop.kind === 'barrel' ? '#ff9d3b' : prop.kind === 'emp' ? '#5ef4ff' : '#6bffb8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy - bh * 0.55);
    ctx.lineTo(sx + 6 * sc, sy - bh * 0.45);
    ctx.lineTo(sx, sy - bh * 0.35);
    ctx.lineTo(sx - 6 * sc, sy - bh * 0.45);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  private drawEnemy(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    e: OmegaEnemyState,
    w: number,
    h: number,
    accent: string,
    accentAlt: string,
  ): void {
    const s = engine.state;
    const ep = projectOmegaPoint(e.worldX, e.elevation, e.z, engine.sector.horizonY, s.camX, s.camY);
    const sx = ep.x * w;
    const sy = ep.y * h;
    const gy = ep.groundY * h;
    const sc = ep.scale;

    ctx.save();

    // Ground contact shadow
    ctx.fillStyle = 'rgba(0,0,0,0.52)';
    ctx.beginPath();
    ctx.ellipse(sx, gy, (e.isBoss ? 72 : 24) * sc, (e.isBoss ? 18 : 7) * sc, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw sniper/phantom lock-on crimson laser BEFORE body
    if (e.lockTargetLane !== null) {
      const target = projectOmegaPoint(
        OMEGA_COVER_LANE_X[e.lockTargetLane],
        0.13,
        0,
        engine.sector.horizonY,
        s.camX,
        s.camY,
      );
      const tx = target.x * w;
      const ty = target.y * h;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = e.lockProgress > 0.72 ? '#ff245b' : '#ff4d82aa';
      ctx.lineWidth = 1 + (1 - e.lockProgress) * 4;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 38 * sc);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      // Urgent lock-on diamond around player target
      ctx.strokeStyle = e.lockProgress > 0.72 ? '#ffffff' : '#ff3466';
      ctx.lineWidth = 2;
      const ringSize = (1 - e.lockProgress * 0.65) * 32;
      ctx.beginPath();
      ctx.arc(tx, ty, ringSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const flash = e.hitFlash > 0.15;
    const stunned = e.stunTimer > 0;

    if (e.isBoss) {
      this.drawBossSilhouette(ctx, e, sx, sy, w, h, sc, flash, stunned, accent, accentAlt);
    } else {
      this.drawStandardEnemySilhouette(ctx, e.kind, sx, sy, h, sc, flash, stunned, e.shielded);
    }

    // Weakpoint reticle overlay
    const weakX = sx + e.weakOffsetX * w * sc;
    const weakY = sy + e.weakOffsetY * h * sc;
    const weakR = Math.max(6, e.weakRadius * h * sc * 0.85);
    const pulse = 0.85 + 0.15 * Math.sin(this.clock * 8);
    ctx.strokeStyle = stunned ? '#5ef5ff' : '#ff52d4';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(weakX, weakY, weakR * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Non-boss HP bar & Stunned status
    if (!e.isBoss && e.hp < e.maxHp) {
      const barW = 46 * sc;
      const barY = sy - h * 0.072 * sc;
      ctx.fillStyle = 'rgba(10, 8, 22, 0.8)';
      ctx.fillRect(sx - barW * 0.5, barY, barW, 5);
      ctx.fillStyle = '#ff52c8';
      ctx.fillRect(sx - barW * 0.5, barY, barW * (e.hp / e.maxHp), 5);
    }

    if (stunned) {
      ctx.strokeStyle = '#62f6ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy - h * 0.025 * sc, 26 * sc, (this.clock * 5) % (Math.PI * 2), ((this.clock * 5) % (Math.PI * 2)) + 2.2);
      ctx.stroke();
    }

    // Aerial depth fog blend for far enemies (largest z)
    const fogAlpha = Math.max(0, Math.min(0.32, (e.z - 0.35) * 0.42));
    if (fogAlpha > 0.02) {
      ctx.fillStyle = `rgba(38, 22, 68, ${fogAlpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy - h * 0.025 * sc, (e.isBoss ? 80 : 32) * sc, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawStandardEnemySilhouette(
    ctx: CanvasRenderingContext2D,
    kind: OmegaEnemyKind,
    sx: number,
    sy: number,
    h: number,
    sc: number,
    flash: boolean,
    stunned: boolean,
    shielded: boolean,
  ): void {
    const unit = h * 0.056 * sc;
    ctx.fillStyle = flash ? '#fff6ff' : stunned ? '#264666' : '#1b1630';
    ctx.strokeStyle = flash ? '#ffffff' : '#9b7be6';
    ctx.lineWidth = 1.6;

    if (kind === 'drone') {
      // Tri-rotor cyber drone centered on sy
      ctx.beginPath();
      ctx.moveTo(sx - unit * 0.85, sy);
      ctx.lineTo(sx, sy - unit * 0.46);
      ctx.lineTo(sx + unit * 0.85, sy);
      ctx.lineTo(sx, sy + unit * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff4ec6';
      ctx.beginPath();
      ctx.arc(sx, sy, unit * 0.22, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    if (kind === 'turret') {
      ctx.beginPath();
      ctx.moveTo(sx - unit * 0.75, sy);
      ctx.lineTo(sx - unit * 0.42, sy - unit * 0.72);
      ctx.lineTo(sx + unit * 0.42, sy - unit * 0.72);
      ctx.lineTo(sx + unit * 0.75, sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff8042';
      ctx.fillRect(sx - unit * 0.26, sy - h * 0.032 * sc, unit * 0.52, h * 0.014 * sc);
      return;
    }

    // Humanoid cyber-combatant (trooper, breacher, sniper) aligned directly to weakpoint visor
    const bodyW = kind === 'breacher' ? unit * 0.96 : unit * 0.72;
    const bodyH = kind === 'breacher' ? h * 0.064 * sc : h * 0.056 * sc;
    ctx.beginPath();
    ctx.moveTo(sx - bodyW * 0.55, sy);
    ctx.lineTo(sx - bodyW * 0.44, sy - bodyH * 0.7);
    ctx.lineTo(sx - bodyW * 0.24, sy - bodyH);
    ctx.lineTo(sx + bodyW * 0.24, sy - bodyH);
    ctx.lineTo(sx + bodyW * 0.44, sy - bodyH * 0.7);
    ctx.lineTo(sx + bodyW * 0.55, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing head visor aligned with weakOffsetY (-0.048 / -0.055)
    const visorY = kind === 'breacher' ? sy - h * 0.055 * sc : sy - h * 0.048 * sc;
    ctx.fillStyle = kind === 'sniper' ? '#ff3a66' : '#ff63d2';
    ctx.fillRect(sx - unit * 0.2, visorY - unit * 0.08, unit * 0.4, unit * 0.16);

    // Riot shield on Breacher covering lower body while leaving upper visor peekable
    if (kind === 'breacher' && shielded && !stunned) {
      ctx.fillStyle = 'rgba(42, 138, 210, 0.36)';
      ctx.strokeStyle = '#6cf2ff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(sx - unit * 0.72, sy - h * 0.043 * sc, unit * 1.44, h * 0.045 * sc, 6);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawBossSilhouette(
    ctx: CanvasRenderingContext2D,
    e: OmegaEnemyState,
    sx: number,
    sy: number,
    w: number,
    h: number,
    sc: number,
    flash: boolean,
    stunned: boolean,
    accent: string,
    accentAlt: string,
  ): void {
    const unit = h * 0.115 * sc;
    ctx.fillStyle = flash ? '#fff6ff' : stunned ? '#253e63' : '#1b1130';
    ctx.strokeStyle = flash ? '#ffffff' : accent;
    ctx.lineWidth = 2.4;

    if (e.kind === 'boss_gatekeeper') {
      // Armored Gatekeeper Mech with layered shoulder hydraulics & chest vents
      ctx.beginPath();
      ctx.moveTo(sx - unit * 0.92, sy + unit * 0.16);
      ctx.lineTo(sx - unit * 1.08, sy - unit * 0.78);
      ctx.lineTo(sx, sy - unit * 1.02);
      ctx.lineTo(sx + unit * 1.08, sy - unit * 0.78);
      ctx.lineTo(sx + unit * 0.92, sy + unit * 0.16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Hydraulic shoulder braces + chest armor bevel
      ctx.strokeStyle = '#ffd25a88';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - unit * 0.55, sy - unit * 0.72, unit * 1.1, unit * 0.55);

      // Central chest reactor core at weakOffsetY (-0.025)
      const allPodsBroken = e.parts.every(p => p.broken);
      ctx.fillStyle = allPodsBroken ? '#ff38b8' : '#703a78';
      ctx.beginPath();
      ctx.arc(sx, sy - h * 0.025 * sc, unit * 0.25, 0, Math.PI * 2);
      ctx.fill();
      if (allPodsBroken) {
        ctx.strokeStyle = '#ffe5f8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy - h * 0.025 * sc, unit * 0.34, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (e.kind === 'boss_widow') {
      // Gantry suspension cables + downward cyan spotlight cone
      ctx.save();
      ctx.strokeStyle = 'rgba(130, 175, 220, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx - unit * 0.85, sy - unit * 0.5);
      ctx.lineTo(sx - unit * 0.85, 0);
      ctx.moveTo(sx + unit * 0.85, sy - unit * 0.5);
      ctx.lineTo(sx + unit * 0.85, 0);
      ctx.stroke();

      const spot = ctx.createLinearGradient(sx, sy, sx, sy + h * 0.35);
      spot.addColorStop(0, 'rgba(75, 245, 255, 0.24)');
      spot.addColorStop(1, 'rgba(75, 245, 255, 0)');
      ctx.fillStyle = spot;
      ctx.beginPath();
      ctx.moveTo(sx - unit * 0.25, sy);
      ctx.lineTo(sx + unit * 0.25, sy);
      ctx.lineTo(sx + unit * 1.25, sy + h * 0.35);
      ctx.lineTo(sx - unit * 1.25, sy + h * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Crane-mounted gunship
      ctx.beginPath();
      ctx.moveTo(sx - unit * 1.45, sy - unit * 0.12);
      ctx.lineTo(sx - unit * 0.55, sy - unit * 0.58);
      ctx.lineTo(sx + unit * 0.55, sy - unit * 0.58);
      ctx.lineTo(sx + unit * 1.45, sy - unit * 0.12);
      ctx.lineTo(sx + unit * 0.65, sy + unit * 0.34);
      ctx.lineTo(sx - unit * 0.65, sy + unit * 0.34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Twin spinning rotor discs
      const rotorW = unit * (0.45 + Math.abs(Math.sin(this.clock * 28)) * 0.25);
      ctx.strokeStyle = '#75f6ff88';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(sx - unit * 1.15, sy - unit * 0.42, rotorW, unit * 0.1, 0, 0, Math.PI * 2);
      ctx.ellipse(sx + unit * 1.15, sy - unit * 0.42, rotorW, unit * 0.1, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = accentAlt;
      ctx.beginPath();
      ctx.arc(sx, sy + h * 0.015 * sc, unit * 0.24, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 'boss_phantom') {
      // Sleek agile assassin mech with glowing katana blade fins
      ctx.beginPath();
      ctx.moveTo(sx - unit * 0.55, sy + unit * 0.1);
      ctx.lineTo(sx - unit * 1.15, sy - unit * 0.65);
      ctx.lineTo(sx, sy - unit * 0.92);
      ctx.lineTo(sx + unit * 1.15, sy - unit * 0.65);
      ctx.lineTo(sx + unit * 0.55, sy + unit * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing magenta blade edge trim
      ctx.strokeStyle = '#ff63d2';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sx - unit * 1.15, sy - unit * 0.65);
      ctx.lineTo(sx - unit * 1.38, sy - unit * 0.95);
      ctx.moveTo(sx + unit * 1.15, sy - unit * 0.65);
      ctx.lineTo(sx + unit * 1.38, sy - unit * 0.95);
      ctx.stroke();

      ctx.fillStyle = '#ff3678';
      ctx.fillRect(sx - unit * 0.24, sy - h * 0.055 * sc - unit * 0.07, unit * 0.48, unit * 0.14);
    } else {
      // OMEGA AEON — colossal containment core + counter-rotating rings + forked lightning tethers
      const coreY = sy - h * 0.01 * sc;
      const r = unit * 0.95;
      ctx.beginPath();
      ctx.arc(sx, coreY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Counter-rotating segmented halo rings
      ctx.strokeStyle = e.phase === 2 ? '#ffd257' : '#ff46d2';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, coreY, r * 0.68, this.clock * 2.1, this.clock * 2.1 + Math.PI * 1.35);
      ctx.stroke();

      ctx.strokeStyle = '#5ef3ff99';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, coreY, r * 1.15, -this.clock * 1.6, -this.clock * 1.6 + Math.PI * 1.1);
      ctx.stroke();

      // Translucent shield dome while pylons stand
      const intactPylons = e.parts.some(p => !p.broken);
      if (intactPylons) {
        ctx.strokeStyle = 'rgba(138, 224, 255, 0.38)';
        ctx.fillStyle = 'rgba(148, 86, 255, 0.12)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(sx, coreY, r * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      const coreGlow = ctx.createRadialGradient(sx, coreY, 2, sx, coreY, r * (e.phase === 2 ? 0.72 : 0.56));
      coreGlow.addColorStop(0, '#ffffff');
      coreGlow.addColorStop(0.45, e.phase === 2 ? '#ffd257' : '#ff44cc');
      coreGlow.addColorStop(1, 'rgba(255, 68, 204, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(sx, coreY, r * (e.phase === 2 ? 0.72 : 0.56), 0, Math.PI * 2);
      ctx.fill();

      // Forked jagged lightning tethers to intact shield pylons
      ctx.strokeStyle = '#ff98eb';
      ctx.lineWidth = 2;
      for (const part of e.parts) {
        if (part.broken) continue;
        const px = sx + part.offsetX * w * sc;
        const py = sy + part.offsetY * h * sc;
        const mx = (sx + px) * 0.5 + Math.sin(this.clock * 24 + px) * 8;
        const my = (coreY + py) * 0.5 + Math.cos(this.clock * 29 + py) * 8;
        ctx.beginPath();
        ctx.moveTo(sx, coreY);
        ctx.lineTo(mx, my);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    }

    // Draw intact boss sub-parts (shoulder pods / orbiting pylons)
    for (const part of e.parts) {
      if (part.broken) continue;
      const px = sx + part.offsetX * w * sc;
      const py = sy + part.offsetY * h * sc;
      const pr = Math.max(11, part.radius * h * sc * 0.72);
      ctx.fillStyle = '#331c4a';
      ctx.strokeStyle = '#ffd25a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mini part HP arc
      ctx.strokeStyle = '#ff4ec6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, pr + 4, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * (part.hp / part.maxHp));
      ctx.stroke();
    }
  }

  private drawEnemyShot(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    shot: OmegaProtocolEngine['state']['enemyShots'][number],
    w: number,
    h: number,
  ): void {
    const s = engine.state;
    const sp = projectOmegaPoint(shot.worldX, shot.elevation, shot.z, engine.sector.horizonY, s.camX, s.camY);
    const x = sp.x * w;
    const y = sp.y * h;
    const size = (shot.kind === 'rocket' ? 14 : 8) * sp.scale;

    ctx.save();
    if (shot.kind === 'rocket') {
      // Fiery warhead + pulsing shoot-to-intercept ring!
      const glow = ctx.createRadialGradient(x, y, 2, x, y, size * 2.2);
      glow.addColorStop(0, '#fff2b8');
      glow.addColorStop(0.5, '#ff6838');
      glow.addColorStop(1, 'rgba(255, 80, 40, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, size * 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#5cf5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, size * 1.45, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = shot.kind === 'plasma' ? '#ff5ad2' : '#ff9a4e';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawLayer4ForegroundCover(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    w: number,
    h: number,
  ): void {
    const s = engine.state;
    const horizonY = engine.sector.horizonY;

    // 3 beveled 3D concrete jersey barriers at 1.18x parallax + edge threat chevrons
    for (const barrier of s.barriers) {
      this.drawBarrier(ctx, engine, barrier, w, h, horizonY);
      const targetedByLock = s.enemies.some(
        e => e.lockTargetLane === barrier.lane || e.beamLanes.includes(barrier.lane),
      );
      const targetedByRocket = s.enemyShots.some(
        shot => shot.kind === 'rocket' && shot.targetLane === barrier.lane,
      );
      if (targetedByLock || targetedByRocket) {
        const bp = projectOmegaPoint(barrier.worldX, 0, 0, horizonY, s.camX * 1.18, s.camY * 1.18);
        const bx = bp.x * w;
        const by = h * 0.8;
        const pulse = 0.55 + 0.45 * Math.sin(this.clock * 14);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = targetedByRocket ? '#ff9c42' : '#ff3466';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx - 12, by - 8);
        ctx.lineTo(bx, by + 4);
        ctx.lineTo(bx + 12, by - 8);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Violet dash afterimages
    for (const img of s.afterimages) {
      const alpha = (img.life / img.maxLife) * 0.48;
      const ap = projectOmegaPoint(img.worldX, 0.14, 0, horizonY, s.camX, s.camY);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#c45cff';
      ctx.beginPath();
      ctx.ellipse(ap.x * w, ap.groundY * h - 42, 22, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Animated AIRA behind active lane barrier
    this.drawAira(ctx, engine, w, h, horizonY);
  }

  private drawBarrier(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    b: OmegaBarrierState,
    w: number,
    h: number,
    horizonY: number,
  ): void {
    const s = engine.state;
    const p = projectOmegaPoint(b.worldX, 0, 0, horizonY, s.camX * 1.18, s.camY * 1.18);
    const cx = p.x * w;
    const baseY = h * 0.96;
    const bw = Math.min(200, w * 0.185);
    const bh = b.breached ? h * 0.045 : h * 0.125;
    const topY = baseY - bh;
    const isActive = s.lane === b.lane;

    ctx.save();

    // Active lane highlight bracket
    if (isActive) {
      ctx.strokeStyle = s.overdriveTimer > 0 ? '#ffd859' : '#6df7ff88';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - bw * 0.56, topY - 6, bw * 1.12, bh + 10);
    }

    // Beveled concrete trapezoid body
    const topInset = bw * 0.09;
    ctx.fillStyle = b.hitFlash > 0.1 ? '#5c4b6e' : b.breached ? '#1d192a' : '#262438';
    ctx.strokeStyle = isActive ? '#9deeff' : '#656987';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.5, baseY);
    ctx.lineTo(cx - bw * 0.5 + topInset, topY);
    ctx.lineTo(cx + bw * 0.5 - topInset, topY);
    ctx.lineTo(cx + bw * 0.5, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!b.breached) {
      // Wet specular top-edge highlight + muzzle flash bounce light on active barrier
      ctx.strokeStyle = isActive && s.muzzleFlash > 0.08
        ? `rgba(255, 118, 224, ${0.45 + 0.55 * s.muzzleFlash})`
        : 'rgba(182, 224, 255, 0.36)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - bw * 0.5 + topInset + 3, topY + 1);
      ctx.lineTo(cx + bw * 0.5 - topInset - 3, topY + 1);
      ctx.stroke();

      // Hazard stripe band (yellow-black industrial concrete)
      const stripeY = topY + bh * 0.25;
      const stripeH = bh * 0.22;
      ctx.fillStyle = '#f2b738';
      ctx.fillRect(cx - bw * 0.36, stripeY, bw * 0.72, stripeH);
      ctx.fillStyle = '#1b1a24';
      for (let sx = -bw * 0.32; sx < bw * 0.3; sx += bw * 0.14) {
        ctx.beginPath();
        ctx.moveTo(cx + sx, stripeY);
        ctx.lineTo(cx + sx + bw * 0.06, stripeY);
        ctx.lineTo(cx + sx + bw * 0.02, stripeY + stripeH);
        ctx.lineTo(cx + sx - bw * 0.04, stripeY + stripeH);
        ctx.closePath();
        ctx.fill();
      }

      // Stencil mark Ω-01 / Ω-02 / Ω-03
      ctx.fillStyle = isActive ? 'rgba(220, 245, 255, 0.72)' : 'rgba(185, 178, 215, 0.42)';
      ctx.font = `800 ${Math.max(9, Math.round(bw * 0.075))}px Pretendard, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Ω-0${b.lane + 1}`, cx, topY + bh * 0.72);

      // Progressive crack lines when damaged
      const ratio = b.hp / b.maxHp;
      if (ratio < 0.7) {
        ctx.strokeStyle = '#0e0c18';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - bw * 0.15, topY);
        ctx.lineTo(cx - bw * 0.08, topY + bh * 0.45);
        ctx.lineTo(cx - bw * 0.2, topY + bh * 0.75);
        if (ratio < 0.38) {
          ctx.moveTo(cx + bw * 0.18, topY);
          ctx.lineTo(cx + bw * 0.1, topY + bh * 0.55);
        }
        ctx.stroke();
      }

      // Subtle integrity bar
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(cx - bw * 0.32, baseY - 12, bw * 0.64, 4);
      ctx.fillStyle = ratio > 0.45 ? '#6df5ff' : '#ff6b6b';
      ctx.fillRect(cx - bw * 0.32, baseY - 12, bw * 0.64 * ratio, 4);
    } else {
      // Orbiting Nano-Repair Drone when breached
      const droneX = cx + Math.cos(this.clock * 3.4) * (bw * 0.32);
      const droneY = topY - 22 + Math.sin(this.clock * 4.8) * 5;
      ctx.strokeStyle = '#5cf5ff88';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(droneX, droneY);
      ctx.lineTo(cx, topY + 6);
      ctx.stroke();
      ctx.fillStyle = '#5cf5ff';
      ctx.beginPath();
      ctx.arc(droneX, droneY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawAira(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    w: number,
    h: number,
    horizonY: number,
  ): void {
    const s = engine.state;
    const laneX = OMEGA_COVER_LANE_X[s.lane];
    const p = projectOmegaPoint(laneX, 0, 0, horizonY, s.camX * 1.18, s.camY * 1.18);
    const ax = p.x * w;
    // Articulated AIRA tactical rig matching hero-splash.webp design
    const crouchOffset = 32 * (1 - this.airaPeekBlend);
    const baseY = h * 0.94 + crouchOffset;
    const aimAngle = Math.atan2(s.aimY * h - (baseY - 78), s.aimX * w - ax);
    const recoilKick = s.muzzleFlash * 6;

    ctx.save();
    // Overdrive or Invuln aura
    if (s.overdriveTimer > 0) {
      const aura = ctx.createRadialGradient(ax, baseY - 52, 8, ax, baseY - 52, 78);
      aura.addColorStop(0, 'rgba(255, 86, 214, 0.5)');
      aura.addColorStop(1, 'rgba(255, 86, 214, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(ax, baseY - 52, 78, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3-segment flowing dark-violet ponytail with magenta streaks
    const windSway = Math.sin(this.clock * 7) * 7 + (s.posture === 'dash' ? -20 : 0);
    ctx.strokeStyle = '#24153d';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ax - 6, baseY - 94);
    ctx.bezierCurveTo(
      ax - 22 + windSway * 0.7,
      baseY - 88,
      ax - 34 + windSway * 1.1,
      baseY - 70,
      ax - 40 + windSway * 1.5,
      baseY - 48,
    );
    ctx.stroke();
    ctx.strokeStyle = '#f24ac8';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(ax - 9, baseY - 92);
    ctx.quadraticCurveTo(ax - 28 + windSway, baseY - 78, ax - 37 + windSway * 1.35, baseY - 52);
    ctx.stroke();

    // Multi-layered shaded tactical jacket + reflective silver/magenta piping
    ctx.fillStyle = '#171326';
    ctx.strokeStyle = s.lastLightBloom.intensity > 0.15 ? s.lastLightBloom.color : '#c496ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax - 21, baseY);
    ctx.lineTo(ax - 17, baseY - 74);
    ctx.lineTo(ax + 17, baseY - 74);
    ctx.lineTo(ax + 21, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Diagonal reflective silver/white safety piping across torso
    ctx.strokeStyle = '#e8e4ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax - 15, baseY - 56);
    ctx.lineTo(ax + 15, baseY - 56);
    ctx.moveTo(ax - 17, baseY - 26);
    ctx.lineTo(ax + 17, baseY - 26);
    ctx.stroke();

    // Magenta tactical collar & yellow-gold harness buckle
    ctx.fillStyle = '#ff48bc';
    ctx.fillRect(ax - 13, baseY - 72, 26, 5);
    ctx.fillStyle = '#f2b738';
    ctx.fillRect(ax - 14, baseY - 37, 28, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ax - 4, baseY - 37, 8, 5);

    // Head, tactical earpiece & reflective amber goggles
    ctx.fillStyle = '#1e1930';
    ctx.beginPath();
    ctx.arc(ax, baseY - 88, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5ef3ff';
    ctx.fillRect(ax - 13, baseY - 89, 3, 5);
    ctx.fillStyle = '#ffbf3f';
    ctx.beginPath();
    ctx.roundRect(ax - 9, baseY - 97, 18, 7.5, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(ax - 6, baseY - 95.5, 6, 2);

    // Articulated aiming arm + distinct weapon model + recoil kickback
    if (s.posture !== 'cover') {
      ctx.save();
      ctx.translate(ax + 8, baseY - 62);
      ctx.rotate(aimAngle);
      ctx.translate(-recoilKick, 0);
      const gunColor = s.weapon === 'rail' ? '#58f3ff' : s.weapon === 'scatter' ? '#ffb74d' : '#ff4ec8';
      const gunLen = s.weapon === 'rail' ? 40 : s.weapon === 'scatter' ? 32 : 26;
      const gunH = s.weapon === 'scatter' ? 11 : 9;
      ctx.fillStyle = '#29243d';
      ctx.strokeStyle = gunColor;
      ctx.lineWidth = 2;
      ctx.fillRect(0, -gunH * 0.5, gunLen, gunH);
      ctx.strokeRect(0, -gunH * 0.5, gunLen, gunH);

      // Glowing weapon core strip
      ctx.fillStyle = gunColor;
      ctx.fillRect(6, -1.5, gunLen - 10, 3);

      if (s.muzzleFlash > 0.1) {
        ctx.fillStyle = '#fff5fb';
        ctx.beginPath();
        ctx.arc(gunLen + 4, 0, 13 * s.muzzleFlash, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private drawLayer5ForegroundAndFX(
    ctx: CanvasRenderingContext2D,
    engine: OmegaProtocolEngine,
    w: number,
    h: number,
    dt: number,
    quality: OmegaQualityPreset,
    motionScale: number,
    transitionProgress: number,
  ): void {
    const s = engine.state;
    const sec = engine.sector;

    // 1. Out-of-focus foreground steel framing struts shifting at 1.45x parallax
    const fgShiftX = -s.camX * w * 0.24 * motionScale;
    ctx.save();
    ctx.fillStyle = 'rgba(8, 6, 16, 0.72)';
    // Left steel beam silhouette
    ctx.beginPath();
    ctx.moveTo(-40 + fgShiftX, 0);
    ctx.lineTo(w * 0.045 + fgShiftX, 0);
    ctx.lineTo(w * 0.02 + fgShiftX, h);
    ctx.lineTo(-40 + fgShiftX, h);
    ctx.closePath();
    ctx.fill();
    // Right steel beam silhouette
    ctx.beginPath();
    ctx.moveTo(w + 40 + fgShiftX, 0);
    ctx.lineTo(w * 0.955 + fgShiftX, 0);
    ctx.lineTo(w * 0.98 + fgShiftX, h);
    ctx.lineTo(w + 40 + fgShiftX, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Three-depth slanted storm rain, puddle ripples, shell casings & camera lens drops
    const rainCount = quality === 'low' ? 42 : quality === 'balanced' ? 105 : this.rainDrops.length;
    const worldSlowScale = s.overdriveTimer > 0 || s.slowMoTimer > 0 ? 0.35 : 1;

    // Eject tumbling brass/plasma shell casing on weapon discharge
    if (quality !== 'low' && s.muzzleFlash > 0.86 && this.prevMuzzleFlash <= 0.86) {
      const origin = projectOmegaPoint(OMEGA_COVER_LANE_X[s.lane], 0.12, 0, sec.horizonY, s.camX * 1.18, s.camY * 1.18);
      this.casings.push({
        x: origin.x + 0.015,
        y: 0.85,
        vx: -0.09 - Math.random() * 0.08,
        vy: -0.22 - Math.random() * 0.1,
        rot: Math.random() * Math.PI,
        vrot: 14,
        life: 0.65,
        color: s.weapon === 'rail' ? '#5ef3ff' : '#ffd25a',
      });
      if (this.casings.length > 24) this.casings.shift();
    }
    this.prevMuzzleFlash = s.muzzleFlash;

    ctx.save();
    for (let i = 0; i < rainCount; i++) {
      const drop = this.rainDrops[i]!;
      drop.x = (drop.x - dt * 0.12 * drop.speed * worldSlowScale * motionScale + 1) % 1;
      drop.y = (drop.y + dt * drop.speed * worldSlowScale * motionScale) % 1;
      const rx = drop.x * w;
      const ry = drop.y * h;
      ctx.strokeStyle =
        drop.depth > 0.78
          ? 'rgba(226, 210, 255, 0.36)'
          : drop.depth > 0.45
            ? 'rgba(186, 165, 240, 0.22)'
            : 'rgba(155, 138, 215, 0.12)';
      ctx.lineWidth = drop.depth > 0.78 ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - drop.len * 0.18, ry + drop.len);
      ctx.stroke();
    }
    if (quality !== 'low') {
      for (const rip of this.ripples) {
        rip.r += dt * 26 * worldSlowScale * motionScale;
        if (rip.r > rip.maxR) {
          rip.r = 1;
          rip.x = ((rip.x + 0.37) % 0.86) + 0.07;
        }
        ctx.strokeStyle = `rgba(215, 185, 255, ${(1 - rip.r / rip.maxR) * 0.28})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(rip.x * w, rip.y * h, rip.r, rip.r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = this.casings.length - 1; i >= 0; i--) {
        const c = this.casings[i]!;
        c.life -= dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vy += 0.9 * dt;
        c.rot += c.vrot * dt;
        if (c.life <= 0) {
          this.casings.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(c.x * w, c.y * h);
        ctx.rotate(c.rot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-3.5, -1.5, 7, 3);
        ctx.restore();
      }
    }
    if (quality === 'high' && motionScale > 0.5) {
      for (const ld of this.lensDrops) {
        ld.y = (ld.y + dt * ld.vy * worldSlowScale) % 1.04;
        const lx = ld.x * w;
        const ly = ld.y * h;
        const lg = ctx.createRadialGradient(lx - ld.r * 0.25, ly - ld.r * 0.25, 1, lx, ly, ld.r);
        lg.addColorStop(0, `rgba(255, 220, 255, ${ld.alpha * 0.85})`);
        lg.addColorStop(0.7, `rgba(140, 220, 255, ${ld.alpha * 0.25})`);
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(lx, ly, ld.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 3. Weapon tracers, shockwaves & impact particles
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const sw of s.shockwaves) {
      const alpha = Math.max(0, sw.life / sw.maxLife);
      ctx.globalAlpha = alpha * 0.85;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 3.5 * alpha + 1;
      ctx.beginPath();
      ctx.arc(sw.x * w, sw.y * h, sw.radius * Math.min(w, h), 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = alpha * 0.4;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sw.x * w, sw.y * h, sw.radius * Math.min(w, h) * 0.72, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const tr of s.tracers) {
      ctx.globalAlpha = Math.max(0, tr.life / tr.maxLife);
      ctx.strokeStyle = tr.color;
      ctx.lineWidth = tr.width;
      ctx.beginPath();
      ctx.moveTo(tr.x1 * w, tr.y1 * h);
      ctx.lineTo(tr.x2 * w, tr.y2 * h);
      ctx.stroke();
    }
    for (const pt of s.particles) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x * w, pt.y * h, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Floating Combat Popups
    ctx.save();
    ctx.textAlign = 'center';
    for (const pop of s.popups) {
      const alpha = Math.min(1, (pop.life / pop.maxLife) * 1.4);
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${Math.round(14 * pop.scale)}px Pretendard, system-ui, sans-serif`;
      ctx.fillStyle = '#090612';
      ctx.fillText(pop.text, pop.x * w + 1.5, pop.y * h + 1.5);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x * w, pop.y * h);
    }
    ctx.restore();

    // 5. Slow-mo / Overdrive / Player Hit Screen Vignettes + Chromatic Border Pulse
    if (s.slowMoTimer > 0 || s.overdriveTimer > 0) {
      ctx.save();
      const g = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.3, w * 0.5, h * 0.5, w * 0.68);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, s.overdriveTimer > 0 ? 'rgba(255, 64, 198, 0.28)' : 'rgba(66, 232, 255, 0.25)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      if (quality === 'high') {
        const pulse = 0.22 + 0.14 * Math.sin(this.clock * 12);
        ctx.strokeStyle = `rgba(94, 243, 255, ${pulse})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, w - 4, h - 4);
        ctx.strokeStyle = `rgba(255, 72, 188, ${pulse})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, w - 10, h - 10);
      }
      ctx.restore();
    }
    if (s.playerHitFlash > 0.02) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 38, 86, ${s.playerHitFlash * 0.32})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
    if (s.flashAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 226, 255, ${s.flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    // 6. Dynamic Tactical Crosshair & Active Reload Arc
    if (s.phase === 'playing' && s.overdriveCutInTimer === 0) {
      this.drawCrosshair(ctx, engine, w, h);
    }

    // 7. Hydraulic Blast-Door Shutter Wipe during Sector Breach Transition
    if (s.phase === 'transition') {
      const shutter =
        transitionProgress < 0.35
          ? 0
          : transitionProgress < 0.65
            ? (transitionProgress - 0.35) / 0.3
            : transitionProgress < 0.78
              ? 1
              : 1 - (transitionProgress - 0.78) / 0.22;
      if (shutter > 0.01) {
        ctx.save();
        ctx.fillStyle = '#0c0918';
        ctx.fillRect(0, 0, w, h * 0.52 * shutter);
        ctx.fillRect(0, h - h * 0.52 * shutter, w, h * 0.52 * shutter);
        ctx.strokeStyle = sec.palette.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.52 * shutter);
        ctx.lineTo(w, h * 0.52 * shutter);
        ctx.moveTo(0, h - h * 0.52 * shutter);
        ctx.lineTo(w, h - h * 0.52 * shutter);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private drawCrosshair(ctx: CanvasRenderingContext2D, engine: OmegaProtocolEngine, w: number, h: number): void {
    const s = engine.state;
    const cx = s.aimX * w;
    const cy = s.aimY * h;

    // Detect if crosshair hovers over a weakpoint or interceptable rocket
    let onWeakpoint = false;
    for (const e of s.enemies) {
      const ep = projectOmegaPoint(e.worldX, e.elevation, e.z, engine.sector.horizonY, s.camX, s.camY);
      const wx = ep.x + e.weakOffsetX * ep.scale;
      const wy = ep.y + e.weakOffsetY * ep.scale;
      if (Math.hypot(s.aimX - wx, s.aimY - wy) <= e.weakRadius * ep.scale * 1.15) {
        onWeakpoint = true;
        break;
      }
    }

    ctx.save();
    const color = onWeakpoint ? '#ff46d2' : s.overchargedShots > 0 || s.overdriveTimer > 0 ? '#ffd859' : '#6cf7ff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const gap = s.weapon === 'scatter' ? 14 : 7;
    const arm = 10;
    ctx.beginPath();
    ctx.moveTo(cx - gap - arm, cy);
    ctx.lineTo(cx - gap, cy);
    ctx.moveTo(cx + gap, cy);
    ctx.lineTo(cx + gap + arm, cy);
    ctx.moveTo(cx, cy - gap - arm);
    ctx.lineTo(cx, cy - gap);
    ctx.moveTo(cx, cy + gap);
    ctx.lineTo(cx, cy + gap + arm);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Active reload timing arc directly around crosshair!
    if (s.reloadActive) {
      const cfg = OMEGA_WEAPONS[s.weapon];
      const [ws, we] = cfg.activeReloadWindow;
      const r = 24;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();

      // Sweet-spot golden zone
      ctx.strokeStyle = '#ffd859';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI * 0.5 + ws * Math.PI * 2, -Math.PI * 0.5 + we * Math.PI * 2);
      ctx.stroke();

      // Active progress sweep
      ctx.strokeStyle = s.reloadJammed ? '#ff4466' : '#5ef5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI * 0.5, -Math.PI * 0.5 + s.reloadProgress * Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
