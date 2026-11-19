import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { omegaFieldPlan } from '../src/domain/omega-protocol-field';
import {
 drawOmegaAuthored3DProp,
 drawOmegaPaintedBladeSlash,
 drawOmegaPaintedMuzzleFlash,
 drawOmegaPaintedRainOverlay,
 omegaAuthoredVfxAndPropPaths,
} from '../src/ui/omega-protocol-vfx-art';

const PUBLIC_ROOT = path.resolve(process.cwd(), 'public');

function createRecorder() {
 const events: Array<{ name: string; args: unknown[]; props?: Record<string, unknown> }> = [];
 const state: Record<string, unknown> = {};
 const grad = { addColorStop: () => {} };
 const ctx = new Proxy(
  {},
  {
   get(_t, key) {
    if (key === 'createLinearGradient' || key === 'createRadialGradient') {
     return () => {
      events.push({ name: String(key), args: [], props: { ...state } });
      return grad;
     };
    }
    return (...args: unknown[]) => events.push({ name: String(key), args, props: { ...state } });
   },
   set(_t, key, value) {
    state[String(key)] = value;
    events.push({ name: `set:${String(key)}`, args: [value] });
    return true;
   },
  },
 ) as unknown as CanvasRenderingContext2D;
 return { ctx, events };
}

describe('Authored isometric 3D props and painterly VFX textures', () => {
 it('ships all 9 valid WebP assets with clean alpha cutouts (props) and black mattes (VFX)', async () => {
  const paths = omegaAuthoredVfxAndPropPaths();
  expect(paths).toHaveLength(9);

  const expectedProps: Readonly<Record<string, readonly [number, number]>> = {
   '/assets/omega/props/container.webp': [512, 416],
   '/assets/omega/props/scaffold.webp': [512, 512],
   '/assets/omega/props/machine.webp': [512, 448],
   '/assets/omega/props/barrier.webp': [512, 288],
  };

  for (const [relPath, [expW, expH]] of Object.entries(expectedProps)) {
   const abs = path.join(PUBLIC_ROOT, relPath.replace(/^\//, ''));
   const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
   expect(info.width).toBe(expW);
   expect(info.height).toBe(expH);
   expect(info.channels).toBe(4);
   // All 4 corners must be transparent.
   const corners = [
    data[3],
    data[(info.width - 1) * 4 + 3],
    data[((info.height - 1) * info.width) * 4 + 3],
    data[(info.width * info.height - 1) * 4 + 3],
   ];
   expect(corners).toEqual([0, 0, 0, 0]);
   if (relPath.endsWith('scaffold.webp')) {
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
     if (data[i] === 0) transparent++;
    }
    expect(transparent / (info.width * info.height)).toBeGreaterThan(0.5);
   }
  }

  const expectedVfx: Readonly<Record<string, readonly [number, number]>> = {
   '/assets/omega/vfx/blade-slash-1.webp': [512, 512],
   '/assets/omega/vfx/blade-slash-2.webp': [512, 512],
   '/assets/omega/vfx/blade-slash-3.webp': [512, 512],
   '/assets/omega/vfx/muzzle-flash.webp': [384, 256],
   '/assets/omega/vfx/rain-sheet.webp': [512, 512],
  };

  for (const [relPath, [expW, expH]] of Object.entries(expectedVfx)) {
   const abs = path.join(PUBLIC_ROOT, relPath.replace(/^\//, ''));
   const { data, info } = await sharp(abs).raw().toBuffer({ resolveWithObject: true });
   expect(info.width).toBe(expW);
   expect(info.height).toBe(expH);
   const c = info.channels;
   const maxCorner = Math.max(
    data[0]!,
    data[1]!,
    data[2]!,
    data[(info.width - 1) * c]!,
    data[(info.width - 1) * c + 1]!,
    data[(info.width - 1) * c + 2]!,
    data[(info.height - 1) * info.width * c]!,
    data[(info.height - 1) * info.width * c + 1]!,
    data[(info.height - 1) * info.width * c + 2]!,
    data[(info.width * info.height - 1) * c]!,
    data[(info.width * info.height - 1) * c + 1]!,
    data[(info.width * info.height - 1) * c + 2]!,
   );
   expect(maxCorner).toBeLessThanOrEqual(6);
  }
 });

 it('renders upright 3/4 props via inverse camera transform when decoded and fails closed when undecoded', () => {
  const plan = omegaFieldPlan(20261108, 3);
  const obstacle = plan.obstacles[0]!;
  const camera = { skewX: -0.22, groundYScale: 0.78 };

  const undecoded = createRecorder();
  expect(
   drawOmegaAuthored3DProp(
    undecoded.ctx,
    plan,
    obstacle,
    camera,
    2.5,
    { complete: false, naturalWidth: 0, naturalHeight: 0 } as unknown as HTMLImageElement,
   ),
  ).toBe(false);
  expect(undecoded.events).toHaveLength(0);

  const decoded = createRecorder();
  const mockImg = { complete: true, naturalWidth: 512, naturalHeight: 416 } as unknown as HTMLImageElement;
  expect(drawOmegaAuthored3DProp(decoded.ctx, plan, obstacle, camera, 2.5, mockImg)).toBe(true);
  const xform = decoded.events.find((e) => e.name === 'transform');
  expect(xform).toBeDefined();
  expect(xform!.args[2]).toBeCloseTo(0.22 / 0.78, 5);
  expect(xform!.args[3]).toBeCloseTo(1 / 0.78, 5);
  expect(decoded.events.some((e) => e.name === 'drawImage')).toBe(true);
  expect(decoded.events.some((e) => e.name === 'scale' && (e.args[0] as number) < 0)).toBe(false);
 });

 it('renders additive muzzle flashes and progressive sweeping 3-hit chest-height blade slashes', () => {
  const camera = { skewX: -0.22, groundYScale: 0.78 };
  const mockVfx = { complete: true, naturalWidth: 512, naturalHeight: 512 } as unknown as HTMLImageElement;

  const muzzle = createRecorder();
  expect(drawOmegaPaintedMuzzleFlash(muzzle.ctx, 34, -71, 0, 1, 0.02, mockVfx)).toBe(true);
  expect(muzzle.events.some((e) => e.name === 'set:globalCompositeOperation' && e.args[0] === 'lighter')).toBe(true);
  expect(muzzle.events.some((e) => e.name === 'drawImage')).toBe(true);
  expect(drawOmegaPaintedMuzzleFlash(muzzle.ctx, 34, -71, 0, 1, 0.25, mockVfx)).toBe(false);

  for (const combo of [1, 2, 3] as const) {
   const slash = createRecorder();
   const ok = drawOmegaPaintedBladeSlash(
    slash.ctx,
    { time: 10, combo, hits: 2, totalDamage: 36, x: 420, y: 380, facingX: 1, facingY: 0 },
    10.08,
    camera,
    0,
    mockVfx,
   );
   expect(ok).toBe(true);
   expect(slash.events.some((e) => e.name === 'clip')).toBe(true);
   expect(slash.events.some((e) => e.name === 'set:globalCompositeOperation' && e.args[0] === 'lighter')).toBe(true);
   expect(slash.events.filter((e) => e.name === 'drawImage').length).toBeGreaterThanOrEqual(combo === 3 ? 2 : 1);
  }
 });

 it('tiles screen-blended photographic rain sheets only on rain/storm sectors (1 and 3)', () => {
  const camera = { scale: 1, projectedOffsetX: 24, projectedOffsetY: 12 };
  const mockRain = { complete: true, naturalWidth: 512, naturalHeight: 512 } as unknown as HTMLImageElement;

  const s1 = createRecorder();
  expect(
   drawOmegaPaintedRainOverlay(s1.ctx, omegaFieldPlan(20261108, 1), camera, 1280, 720, 4.2, { tier: 'desktop' }, mockRain),
  ).toBe(true);
  expect(s1.events.some((e) => e.name === 'set:globalCompositeOperation' && e.args[0] === 'screen')).toBe(true);
  expect(s1.events.filter((e) => e.name === 'drawImage').length).toBeGreaterThan(4);

  const s2 = createRecorder();
  expect(
   drawOmegaPaintedRainOverlay(s2.ctx, omegaFieldPlan(20261108, 11), camera, 1280, 720, 4.2, { tier: 'desktop' }, mockRain),
  ).toBe(false);
 });
});
