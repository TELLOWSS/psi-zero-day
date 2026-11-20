import { describe, expect, it } from 'vitest';
import { OmegaProtocolCombatSession } from '../src/engine/omega-protocol-combat';
import { OmegaZeroSignalDirector } from '../src/engine/omega-protocol-zero-signal-director';
import type { OmegaZombieBrain } from '../src/domain/omega-protocol-zombie-ai';
import type { Hazard } from '../src/domain/patrol-survivors';
import { omegaFieldPlan } from '../src/domain/omega-protocol-field';
import {
 drawOmegaZeroSignalGroundFx,
 drawOmegaZeroSignalWorldFx,
 drawOmegaZeroSignalScreenFx,
} from '../src/ui/omega-protocol-zero-signal-fx';
import { drawOmegaAuthoredZombie } from '../src/ui/omega-protocol-entity-art';
import { drawOmegaDashEnergy, drawOmegaGroundedSplash } from '../src/ui/omega-protocol-dash-visuals';
import { drawOmegaPaintedBladeSlash, drawOmegaAuthored3DProp } from '../src/ui/omega-protocol-vfx-art';
import { drawOmegaSilverKineticActor } from '../src/ui/omega-protocol-silver-kinetics';
import { OmegaProceduralAudio } from '../src/ui/omega-protocol-audio';

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

describe('Wave 9 AAA graphics, hit-feel, and motion overhaul', () => {
 it('populates physics sparks, floor scorches, rotational camera roll punch, and enemy_kill events cleanly', () => {
  const session = new OmegaProtocolCombatSession(20261108, 50, false, {
   fieldTraversal: true,
   interactivePolish: true,
  });
  const director = new OmegaZeroSignalDirector('valkyrie', false);
  director.applyLoadoutToSession(session);

  const player = session.engine.state.player;
  const target = session.engine.state.hazards.find((h) => h.hp > 0)!;
  target.x = player.x + 58;
  target.y = player.y;

  // Fire Rail Burst toward target to trigger sparks, scorch, beam, and cameraRoll
  expect(director.fireRailBurst(session, { x: target.x, y: target.y })).toBe(true);
  expect(director.sparks.length).toBeGreaterThan(0);
  expect(director.scorches.length).toBeGreaterThan(0);
  expect(Math.abs(director.cameraRoll)).toBeGreaterThan(0);

  // Render ground, world, and screen FX passes without throwing
  const gRec = createRecorder();
  drawOmegaZeroSignalGroundFx(gRec.ctx, director, 1.5);
  expect(gRec.events.some((e) => e.name === 'arc')).toBe(true);

  const wRec = createRecorder();
  drawOmegaZeroSignalWorldFx(wRec.ctx, director, session, 1.5);
  expect(wRec.events.some((e) => e.name === 'moveTo')).toBe(true);

  const sRec = createRecorder();
  drawOmegaZeroSignalScreenFx(sRec.ctx, director, 1280, 720);
  expect(sRec.events.length).toBeGreaterThan(0);

  // Confirm enemy kill produces enemy_kill event and sparks
  target.hp = 1;
  director.onPlayerBlade(session, {
   time: 1.5,
   combo: 3,
   hits: 1,
   totalDamage: 65,
   x: player.x,
   y: player.y,
   facingX: 1,
   facingY: 0,
   hitTargets: [{ id: target.id, x: target.x, y: target.y, damage: 65, killed: true, boss: false, armored: false }],
  });
  target.hp = 0;

  let sawKillEvent = false;
  for (let i = 0; i < 80; i++) {
   const stepRes = director.step(session, 0.05);
   if (stepRes.events.some((e) => e.kind === 'enemy_kill')) sawKillEvent = true;
  }
  expect(sawKillEvent).toBe(true);
  // Camera roll decays smoothly back to 0 and timed sparks/scorches expire after 4.0s
  expect(Math.abs(director.cameraRoll)).toBeLessThan(0.001);
  expect(director.sparks).toHaveLength(0);
  expect(director.scorches).toHaveLength(0);
 });

 it('renders distinct per-species zombie gaits and warning eye-glints while preserving exact drawImage contract', () => {
  const decoded = { complete: true, naturalWidth: 256, naturalHeight: 256 } as unknown as HTMLImageElement;
  const h = { id: 'z-test', type: 'UNHELMETED', hp: 50, maxHp: 50, x: 400, y: 300, radius: 22 } as Hazard;

  const warningBrain: OmegaZombieBrain = {
   kind: 'stalker',
   phase: 'warning',
   timer: 0.25,
   slot: 0,
   orbitSign: 1,
   seedHp: 50,
   speed: 98,
   damage: 19,
   warningDuration: 0.66,
   attackRadius: 59,
   attackTrigger: 125,
   cooldown: 1.2,
   warnings: 1,
   attacks: 0,
   hits: 0,
   damageDone: 0,
   lockedX: 1,
   lockedY: 0,
   chargeResolved: false,
  };

  const wRec = createRecorder();
  expect(drawOmegaAuthoredZombie(wRec.ctx, h, 2.0, warningBrain, 300, decoded)).toBe(true);
  expect(wRec.events.filter((e) => e.name === 'drawImage')).toHaveLength(1);
  // Eye-glint 4-point star renders moveTo + closePath inside warning wind-up
  expect(wRec.events.some((e) => e.name === 'moveTo')).toBe(true);

  const chargeBrain: OmegaZombieBrain = { ...warningBrain, phase: 'charge', timer: 0.3 };
  const cRec = createRecorder();
  expect(drawOmegaAuthoredZombie(cRec.ctx, h, 2.0, chargeBrain, 300, decoded)).toBe(true);
  expect(cRec.events.some((e) => e.name === 'set:globalCompositeOperation' && e.args[0] === 'lighter')).toBe(true);
 });

 it('keeps dash/boot splash, 3D prop grounding, blade finisher, 8-way walk, and audio kill chime contracts intact', () => {
  const gRec = createRecorder();
  drawOmegaGroundedSplash(gRec.ctx, [{ x: 100, y: 200, landed: true }], 1.2);
  expect(gRec.events.filter((e) => e.name === 'ellipse')).toHaveLength(1);
  expect(gRec.events.filter((e) => e.name === 'moveTo')).toHaveLength(3);

  const dRec = createRecorder();
  drawOmegaDashEnergy(dRec.ctx, [{ x: 100, y: 200, facingX: 1, facingY: 0, time: 1.0 }], 1.04);
  expect(dRec.events.filter((e) => e.name === 'ellipse')).toHaveLength(2);
  expect(dRec.events.some((e) => e.name === 'moveTo')).toBe(true);

  const dummyImg = { complete: true, naturalWidth: 512, naturalHeight: 512 } as unknown as HTMLImageElement;
  const camera = { skewX: -0.22, groundYScale: 0.78 };
  const plan = omegaFieldPlan(20261108, 3);
  const propRec = createRecorder();
  expect(drawOmegaAuthored3DProp(propRec.ctx, plan, plan.obstacles[0]!, camera, 2.0, dummyImg)).toBe(true);
  expect(propRec.events.some((e) => e.name === 'createLinearGradient')).toBe(true);

  const slashRec = createRecorder();
  expect(
   drawOmegaPaintedBladeSlash(
    slashRec.ctx,
    { time: 10, combo: 3, hits: 2, totalDamage: 52, x: 420, y: 380, facingX: 1, facingY: 0 },
    10.08,
    camera,
    0,
    dummyImg,
   ),
  ).toBe(true);
  expect(slashRec.events.filter((e) => e.name === 'drawImage').length).toBeGreaterThanOrEqual(2);

  const actorRec = createRecorder();
  expect(
   drawOmegaSilverKineticActor(
    actorRec.ctx,
    dummyImg,
    'SE',
    { facingX: 1, facingY: 1, velocityX: 140, velocityY: 90, moving: true, time: 1.4, dashing: false, shooting: false },
    118,
   ),
  ).toBe(true);
  expect(actorRec.events.filter((e) => e.name === 'drawImage')).toHaveLength(3);

  const audio = new OmegaProceduralAudio();
  expect(() => audio.playKillConfirm(false)).not.toThrow();
  expect(() => audio.playKillConfirm(true)).not.toThrow();
  expect(() => audio.playBladeSlash(3, 2)).not.toThrow();
 });
});
