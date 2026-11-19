import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { omegaFieldInitialProgress, omegaFieldPlan } from '../src/domain/omega-protocol-field';
import type { Hazard } from '../src/domain/patrol-survivors';
import { drawOmegaProtocolEnemy } from '../src/ui/omega-protocol-enemy-render';
import {
 drawOmegaAuthoredExtractionGate,
 drawOmegaAuthoredHazardOrBoss,
 drawOmegaAuthoredImpactBurst,
 drawOmegaAuthoredMissionConsole,
 omegaAuthoredEntityPaths,
} from '../src/ui/omega-protocol-entity-art';

const PUBLIC_ROOT = path.resolve(process.cwd(), 'public');

function createRecorder() {
 const events: Array<{ name: string; args: unknown[] }> = [];
 const grad = { addColorStop: () => {} };
 const ctx = new Proxy(
  {},
  {
   get(_t, key) {
    if (key === 'createLinearGradient' || key === 'createRadialGradient') {
     return () => {
      events.push({ name: String(key), args: [] });
      return grad;
     };
    }
    return (...args: unknown[]) => events.push({ name: String(key), args });
   },
   set(_t, key, value) {
    events.push({ name: `set:${String(key)}`, args: [value] });
    return true;
   },
  },
 ) as unknown as CanvasRenderingContext2D;
 return { ctx, events };
}

describe('Wave-2 authored 3/4 isometric entity & impact VFX artwork', () => {
 it('ships all 9 valid WebPs with transparent corners, open extraction doorway, solid Warden boss, and black impact mattes', async () => {
  const paths = omegaAuthoredEntityPaths();
  expect(paths).toHaveLength(9);

  const entitySpecs: Readonly<Record<string, readonly [number, number]>> = {
   '/assets/omega/entities/mission-console.webp': [320, 384],
   '/assets/omega/entities/extraction-gate.webp': [512, 448],
   '/assets/omega/entities/hazard-cart.webp': [384, 320],
   '/assets/omega/entities/hazard-gas.webp': [320, 320],
   '/assets/omega/entities/hazard-debris.webp': [320, 288],
   '/assets/omega/entities/boss-crane.webp': [512, 512],
   '/assets/omega/entities/boss-warden.webp': [512, 512],
  };

  for (const [relPath, [expW, expH]] of Object.entries(entitySpecs)) {
   const abs = path.join(PUBLIC_ROOT, relPath.replace(/^\//, ''));
   const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
   expect(info.width).toBe(expW);
   expect(info.height).toBe(expH);
   expect(info.channels).toBe(4);
   const corners = [
    data[3],
    data[(info.width - 1) * 4 + 3],
    data[((info.height - 1) * info.width) * 4 + 3],
    data[(info.width * info.height - 1) * 4 + 3],
   ];
   expect(corners).toEqual([0, 0, 0, 0]);

   if (relPath.endsWith('extraction-gate.webp')) {
    const portalCenterAlpha = data[(260 * info.width + 256) * 4 + 3];
    expect(portalCenterAlpha).toBe(0);
   }
   if (relPath.endsWith('boss-warden.webp')) {
    const centerAlpha = data[(Math.floor(info.height * 0.58) * info.width + 256) * 4 + 3];
    expect(centerAlpha).toBeGreaterThan(200);
   }
  }

  for (const relPath of ['/assets/omega/vfx/impact-hit.webp', '/assets/omega/vfx/impact-crit.webp']) {
   const abs = path.join(PUBLIC_ROOT, relPath.replace(/^\//, ''));
   const { data, info } = await sharp(abs).raw().toBuffer({ resolveWithObject: true });
   expect(info.width).toBe(256);
   expect(info.height).toBe(256);
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

 it('renders upright 3/4 mission consoles and portal-framed extraction gates cleanly', () => {
  const plan = omegaFieldPlan(20261108, 1);
  const progress = { ...omegaFieldInitialProgress(), phase: 'objective' as const };
  const undecoded = { complete: false, naturalWidth: 0, naturalHeight: 0 } as unknown as HTMLImageElement;
  const decoded = { complete: true, naturalWidth: 320, naturalHeight: 384 } as unknown as HTMLImageElement;

  const uRec = createRecorder();
  expect(drawOmegaAuthoredMissionConsole(uRec.ctx, plan, progress, 0, 1.2, undecoded)).toBe(false);
  expect(uRec.events).toHaveLength(0);

  const cRec = createRecorder();
  expect(drawOmegaAuthoredMissionConsole(cRec.ctx, plan, progress, 0, 1.2, decoded)).toBe(true);
  expect(cRec.events.some((e) => e.name === 'transform')).toBe(true);
  expect(cRec.events.some((e) => e.name === 'drawImage')).toBe(true);

  const lockedRec = createRecorder();
  expect(drawOmegaAuthoredExtractionGate(lockedRec.ctx, plan.exit, false, 2.0, decoded)).toBe(true);
  expect(lockedRec.events.some((e) => e.name === 'set:globalCompositeOperation' && e.args[0] === 'lighter')).toBe(true);
  expect(lockedRec.events.filter((e) => e.name === 'moveTo')).toHaveLength(3);

  const openRec = createRecorder();
  expect(drawOmegaAuthoredExtractionGate(openRec.ctx, plan.exit, true, 2.0, decoded)).toBe(true);
  expect(openRec.events.some((e) => e.name === 'createLinearGradient')).toBe(true);
  expect(openRec.events.filter((e) => e.name === 'arc').length).toBeGreaterThanOrEqual(4);
 });

 it('renders authored hazards, Wave-9 & Wave-15 bosses, elevated HDR impacts, and radial enemy hit flashes', () => {
  const decoded = { complete: true, naturalWidth: 512, naturalHeight: 512 } as unknown as HTMLImageElement;

  const cart = { type: 'RUNAWAY_CART', hp: 50, x: 300, y: 400, radius: 26, variant: 'reinforced_cart' } as Hazard;
  const cRec = createRecorder();
  expect(drawOmegaAuthoredHazardOrBoss(cRec.ctx, cart, 3.1, false, decoded)).toBe(true);
  expect(cRec.events.some((e) => e.name === 'drawImage')).toBe(true);

  const boss = { type: 'CRANE_BOSS', isStageBoss: true, hp: 400, maxHp: 500, x: 500, y: 420, radius: 42, bossPhase: 2, hitFlashTimer: 0 } as Hazard;
  const bRec = createRecorder();
  expect(drawOmegaAuthoredHazardOrBoss(bRec.ctx, boss, 4.5, true, decoded)).toBe(true);
  expect(bRec.events.some((e) => e.name === 'set:globalCompositeOperation' && e.args[0] === 'lighter')).toBe(true);

  const unhelmeted = { type: 'UNHELMETED', hp: 40, x: 200, y: 300, radius: 22 } as Hazard;
  expect(drawOmegaAuthoredHazardOrBoss(bRec.ctx, unhelmeted, 1, false, decoded)).toBe(false);

  const impRec = createRecorder();
  expect(
   drawOmegaAuthoredImpactBurst(
    impRec.ctx,
    { x: 400, y: 400, radius: 20, start: 1, until: 1.26, critical: true, blocked: false, damage: 42, seed: 7 },
    0.25,
    decoded,
   ),
  ).toBe(true);
  expect(impRec.events.some((e) => e.name === 'drawImage')).toBe(true);
  expect(impRec.events.some((e) => e.name === 'strokeText' && e.args[0] === '42')).toBe(true);

  // Enemy hit-flash emits radial arc glow instead of square fillRect box.
  const hitFlashEnemy = { type: 'FALLING_DEBRIS', hp: 30, x: 300, y: 300, radius: 22, hitFlashTimer: 0.08 } as Hazard;
  const hfRec = createRecorder();
  drawOmegaProtocolEnemy(hfRec.ctx, hitFlashEnemy, 2.0, {});
  const arcs = hfRec.events.filter((e) => e.name === 'arc');
  expect(arcs.length).toBeGreaterThanOrEqual(1);
  // Ensure no large square hit-flash rectangle covers the torso/boss.
  const hugeFlashRects = hfRec.events.filter(
   (e) => e.name === 'fillRect' && Number(e.args[2]) >= 50 && Number(e.args[3]) >= 45,
  );
  expect(hugeFlashRects).toHaveLength(0);
 });
});
