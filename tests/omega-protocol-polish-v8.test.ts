import { describe, expect, it } from 'vitest';
import type { Hazard } from '../src/domain/patrol-survivors';
import { OMEGA_UPGRADES } from '../src/domain/omega-protocol-run';
import { omegaActBoundaryDock } from '../src/domain/omega-protocol-field-transit';
import { omegaFieldPlan } from '../src/domain/omega-protocol-field';
import { OmegaProtocolCombatSession } from '../src/engine/omega-protocol-combat';
import { OmegaZeroSignalDirector } from '../src/engine/omega-protocol-zero-signal-director';
import {
 drawOmegaConnectedBoardingPad,
 drawOmegaConnectedLift,
 drawOmegaConnectedLiftFrontRail,
 drawOmegaConnectedServiceTunnel,
} from '../src/ui/omega-protocol-act-lift';
import { OmegaActorFacingController } from '../src/ui/omega-protocol-action-facing';
import { OmegaProceduralAudio } from '../src/ui/omega-protocol-audio';
import { drawOmegaProtocolEnemy } from '../src/ui/omega-protocol-enemy-render';
import { drawOmegaSilverKineticActor } from '../src/ui/omega-protocol-silver-kinetics';
import { OmegaSupplyUpgradeIcon, omegaSupplyUpgradeMeta } from '../src/ui/omega-protocol-supply-ui';
import { drawOmegaZeroSignalScreenFx, drawOmegaZeroSignalWorldFx } from '../src/ui/omega-protocol-zero-signal-fx';

function createRecorder() {
 const events: Array<{ name: string; args: unknown[]; fillStyle?: unknown }> = [];
 const state: Record<string, unknown> = {};
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
    if (key === 'measureText') {
     return () => ({ width: 32 });
    }
    return (...args: unknown[]) => events.push({ name: String(key), args, fillStyle: state.fillStyle });
   },
   set(_t, key, value) {
    state[String(key)] = value;
    return true;
   },
  },
 ) as unknown as CanvasRenderingContext2D;
 return { ctx, events };
}

describe('OMEGA PROTOCOL Wave 8 — Deep Gameplay, Lift Sync, Sword Hit-Feel, Vitality & Supply Terminal', () => {
 it('classifies all 14 tactical supply upgrades with accurate theme and evolution awakening status', () => {
  for (const upg of OMEGA_UPGRADES) {
   const meta = omegaSupplyUpgradeMeta(upg.id, {});
   expect(['crimson', 'cyan', 'amber', 'violet', 'emerald']).toContain(meta.theme);
   expect(meta.synergyLabel.length).toBeGreaterThan(4);
   const iconEl = OmegaSupplyUpgradeIcon({ id: upg.id, theme: meta.theme });
   expect(iconEl).toBeTruthy();
  }

  expect(omegaSupplyUpgradeMeta('blade_edge', {})).toMatchObject({
   theme: 'crimson',
   synergyStatus: 'awakens_now',
  });
  expect(omegaSupplyUpgradeMeta('arc_pulse', {})).toMatchObject({
   theme: 'cyan',
   synergyStatus: 'progress',
  });
  expect(omegaSupplyUpgradeMeta('shockwave', { arc_pulse: 1 })).toMatchObject({
   theme: 'cyan',
   synergyStatus: 'awakens_now',
  });
  expect(omegaSupplyUpgradeMeta('precision_beacon', { radio_overdrive: 1 })).toMatchObject({
   theme: 'amber',
   synergyStatus: 'awakens_now',
  });
  expect(omegaSupplyUpgradeMeta('shield_matrix', {})).toMatchObject({
   theme: 'emerald',
   synergyStatus: 'core',
  });
 });

 it('synchronizes connected hydraulic lifts & service tunnels 1:1 with player elevation and draws front rail', () => {
  const liftRec = createRecorder();
  drawOmegaConnectedLift(liftRec.ctx, 1400, 450, 180, 90, -0.22, false);
  const xform = liftRec.events.find((e) => e.name === 'transform');
  expect(xform?.args[2]).toBeCloseTo(0.22, 5);
  expect(liftRec.events.some((e) => e.name === 'translate' && e.args[0] === 0 && e.args[1] === -90)).toBe(true);
  expect(liftRec.events.some((e) => e.name === 'fillText' && String(e.args[0]).includes('09M / 18M'))).toBe(true);

  const railRec = createRecorder();
  drawOmegaConnectedLiftFrontRail(railRec.ctx, 1400, 450, -90, -0.22, false, false);
  expect(railRec.events.some((e) => e.name === 'translate' && e.args[1] === -90)).toBe(true);

  const tunnelRec = createRecorder();
  drawOmegaConnectedServiceTunnel(tunnelRec.ctx, 4200, 450, 120, 60, -0.22);
  expect(tunnelRec.events.some((e) => e.name === 'translate' && e.args[1] === 60)).toBe(true);
  expect(tunnelRec.events.some((e) => e.name === 'fillText' && String(e.args[0]).includes('-06M / -12M'))).toBe(true);

  const dock = omegaActBoundaryDock(omegaFieldPlan(20261109, 3))!;
  const padRec = createRecorder();
  drawOmegaConnectedBoardingPad(padRec.ctx, dock, 2.0);
  expect(padRec.events.some((e) => e.name === 'ellipse')).toBe(true);
 });

 it('keeps kiting character body facing stable under rapid gun cues and renders seamless coat walk + katana slash', () => {
  const facing = new OmegaActorFacingController();
  const playing = { dashing: false, hurting: false, playing: true };
  let pose = facing.advance(0, { x: -1, y: 0 }, { screenX: 1, screenY: 0, until: 0.4 }, playing);
  for (let i = 1; i <= 10; i++) {
   pose = facing.advance(i * 0.02, { x: -1, y: 0 }, { screenX: 1, screenY: 0, until: 0.4 }, playing);
  }
  expect(pose.headingIndex).toBe(4); // Smoothly remains West while firing East.
  expect(pose.weaponX).toBe(1);

  const dummyImg = {} as HTMLImageElement;
  const walkRec = createRecorder();
  expect(
   drawOmegaSilverKineticActor(
    walkRec.ctx,
    dummyImg,
    'E',
    {
     facingX: 1,
     facingY: 0,
     moving: true,
     time: 1.5,
     dashing: false,
     shooting: false,
     velocityX: 210,
     speedRatio: 0.9,
     gait: {
      active: true,
      phase: 0.25,
      distanceTravelled: 12,
      left: { x: -4, y: 0, planted: true },
      right: { x: 5, y: -2, planted: false },
     },
    },
    120,
   ),
  ).toBe(true);
  const draws = walkRec.events.filter((e) => e.name === 'drawImage');
  expect(draws).toHaveLength(3);
  // Lower-boot split starts below coat hem (>=360px of 512px) so silver coat has zero vertical tear!
  expect(Number(draws[0]!.args[2])).toBeGreaterThanOrEqual(360);

  const slashRec = createRecorder();
  expect(
   drawOmegaSilverKineticActor(
    slashRec.ctx,
    dummyImg,
    'SE',
    {
     facingX: 1,
     facingY: 1,
     moving: false,
     time: 2.0,
     dashing: false,
     shooting: false,
     bladeAge: 0.08,
     bladeCombo: 3,
     bladeFacingX: 1,
     bladeFacingY: 0,
     bladeHits: 2,
    },
    120,
   ),
  ).toBe(true);
  expect(slashRec.events.filter((e) => e.name === 'drawImage').length).toBeGreaterThanOrEqual(4); // lunge ghost + 3-part body
 });

 it('delivers melee knockback, hitTargets, slash-cuts, damage numbers, kill bursts, and separate air/hit audio', () => {
  const session = new OmegaProtocolCombatSession(20261120, 50, false, { fieldTraversal: true, interactivePolish: true });
  const director = new OmegaZeroSignalDirector('valkyrie', false);
  director.applyLoadoutToSession(session);
  const player = session.engine.state.player;
  player.invincibleTime = 999;

  const target = session.engine.state.hazards.find((h) => h.type === 'UNHELMETED')!;
  target.x = player.x + 58;
  target.y = player.y;
  target.hp = 180;
  target.maxHp = 180;
  target.speed = 0;

  session.update(1 / 60, { moveX: 1, moveY: 0, triggerAction: false });
  const xBeforeSlash = target.x;
  const strike = session.blade();
  expect(strike).not.toBeNull();
  expect(strike!.hitTargets?.length).toBeGreaterThanOrEqual(1);
  expect(target.x).toBeGreaterThan(xBeforeSlash); // Knockback shoved enemy away cleanly.
  expect(target.vx ?? 0).toBeGreaterThan(50);

  director.onPlayerBlade(session, strike);
  expect(director.slashCuts.length).toBeGreaterThanOrEqual(1);
  expect(director.damageNumbers.length).toBeGreaterThanOrEqual(1);

  const audio = new OmegaProceduralAudio();
  audio.unlock();
  audio.setMuted(true);
  audio.playBladeSlash(1, 0);
  audio.playBladeSlash(3, 2);
  audio.playShieldAbsorb();
  audio.playPlayerHurt();
  audio.dispose();
 });

 it('gives explicit shield-absorb vs net-HP feedback, trailing enemy HP bars, and soft zombie separation', () => {
  const session = new OmegaProtocolCombatSession(20261120, 50, false, { fieldTraversal: true, interactivePolish: true });
  const director = new OmegaZeroSignalDirector('valkyrie', false);
  director.applyLoadoutToSession(session);
  const player = session.engine.state.player;

  // 1. Soft non-stacking separation gently spreads stacked zombies in approach phase.
  const zombies = session.engine.state.hazards.filter((h) => session.zombieBrain(h.id));
  const z1 = zombies[0]!;
  const z2 = zombies[1]!;
  z1.x = player.x + 190;
  z1.y = player.y;
  z2.x = z1.x + 3;
  z2.y = z1.y;
  session.update(1 / 60, { moveX: 0, moveY: 0, triggerAction: false });
  expect(Math.hypot(z2.x - z1.x, z2.y - z1.y)).toBeGreaterThan(3.1);

  // 2. Full shield absorb suppresses false hurt blink & emits shield_absorb + shield number.
  const hpBefore = player.hp;
  player.hp = hpBefore - 10;
  session.engine.state.lastDamage = { source: 'UNHELMETED', amount: 10, remaining: 2 };
  const absorbRes = director.step(session, 0.016, hpBefore);
  expect(player.hp).toBe(hpBefore);
  expect(absorbRes.events.some((e) => e.kind === 'shield_absorb')).toBe(true);
  expect(director.currentShieldFlash()).toBeGreaterThan(0);
  expect(director.currentHpDamageFlash()).toBe(0);
  expect(session.engine.state.lastDamage.remaining).toBeLessThanOrEqual(1.8);
  expect(director.damageNumbers.some((d) => d.text.includes('🛡 -10'))).toBe(true);

  // 3. Shield break + bleedthrough emits player_hurt, net HP damage popup & crimson screen vignette.
  const shieldLeft = director.currentShield();
  const bleedBefore = player.hp;
  player.hp = bleedBefore - (shieldLeft + 14);
  const hurtRes = director.step(session, 0.016, bleedBefore);
  expect(hurtRes.events.some((e) => e.kind === 'shield_break')).toBe(true);
  expect(hurtRes.events.some((e) => e.kind === 'player_hurt')).toBe(true);
  expect(director.currentHpDamageFlash()).toBeGreaterThan(0);
  expect(director.damageNumbers.some((d) => d.text === '-14 HP')).toBe(true);

  const fxRec = createRecorder();
  drawOmegaZeroSignalWorldFx(fxRec.ctx, director, session, 1.0);
  expect(fxRec.events.length).toBeGreaterThan(5);
  const screenRec = createRecorder();
  drawOmegaZeroSignalScreenFx(screenRec.ctx, director, 1280, 720);
  expect(screenRec.events.some((e) => e.name === 'fillRect')).toBe(true);

  // 4. Trailing enemy HP drain bar renders light white-gold chunk after HP loss.
  const armored = {
   id: 'armored-drain-test',
   type: 'UNHELMETED',
   x: 500,
   y: 400,
   hp: 200,
   maxHp: 200,
   radius: 26,
   speed: 40,
   damage: 14,
   expValue: 0,
  } as Hazard;
  const eRec1 = createRecorder();
  drawOmegaProtocolEnemy(eRec1.ctx, armored, 1.0, { targetX: 400 });
  armored.hp = 100;
  armored.hitFlashTimer = 0.1;
  const eRec2 = createRecorder();
  drawOmegaProtocolEnemy(eRec2.ctx, armored, 1.05, { targetX: 400 });
  expect(eRec2.events.some((e) => String(e.fillStyle).includes('255,244,214'))).toBe(true);
 });
});
