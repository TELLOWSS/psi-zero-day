import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Hazard } from '../src/domain/patrol-survivors';
import {
 OMEGA_LOADOUTS,
 OMEGA_STRIKERS,
 omegaActiveEvolutions,
 omegaComputeFinalScore,
 omegaDailySeed,
 omegaEvaluateBlackboxUnlocks,
 omegaStyleRankForPoints,
} from '../src/domain/omega-protocol-zero-signal';
import { OmegaProtocolCombatSession } from '../src/engine/omega-protocol-combat';
import { OmegaZeroSignalDirector } from '../src/engine/omega-protocol-zero-signal-director';
import { OMEGA_AUDIO_MANIFEST, OmegaProceduralAudio } from '../src/ui/omega-protocol-audio';
import {
 drawOmegaZeroSignalScreenFx,
 drawOmegaZeroSignalWorldFx,
} from '../src/ui/omega-protocol-zero-signal-fx';

function createRecorder() {
 const events: string[] = [];
 const grad = { addColorStop: () => {} };
 const ctx = new Proxy(
  {},
  {
   get(_t, key) {
    if (key === 'createLinearGradient' || key === 'createRadialGradient') {
     return () => {
      events.push(String(key));
      return grad;
     };
    }
    return () => {
     events.push(String(key));
    };
   },
   set() {
    return true;
   },
  },
 ) as unknown as CanvasRenderingContext2D;
 return { ctx, events };
}

describe('OMEGA PROTOCOL: ZERO SIGNAL commercial roguelite systems', () => {
 it('provides 3 distinct loadouts, deterministic daily seed, style rank tiers, evolutions, and blackbox archive rules', () => {
  expect(OMEGA_LOADOUTS).toHaveLength(3);
  expect(OMEGA_STRIKERS).toHaveLength(4);

  const d1 = omegaDailySeed(new Date('2026-11-20T01:00:00Z'));
  const d2 = omegaDailySeed(new Date('2026-11-20T22:59:00Z'));
  expect(d1).toEqual(d2);
  expect(d1.seed).toBe(20261120);

  expect(omegaStyleRankForPoints(0).current.tier).toBe('D');
  expect(omegaStyleRankForPoints(750).current.tier).toBe('S');
  expect(omegaStyleRankForPoints(1550).current.tier).toBe('OMEGA');

  const evos = omegaActiveEvolutions({
   arc_pulse: 1,
   shockwave: 1,
   blade_edge: 1,
   radio_overdrive: 2,
  });
  expect(evos).toContain('volt_phantom');
  expect(evos).toContain('crimson_moon');
  expect(evos).toContain('signal_swarm');

  const final = omegaComputeFinalScore({
   clearedWaves: 15,
   maxCombo: 60,
   detonations: 25,
   phantomDodges: 8,
   kills: 110,
   peakPoints: 1800,
   victory: true,
  });
  expect(final.grade).toBe('OMEGA');
  expect(final.score).toBeGreaterThanOrEqual(12500);

  const unlocked = omegaEvaluateBlackboxUnlocks(
   {
    clearedWaves: 9,
    detonations: 2,
    strikersCalledById: { m01_snipe: 1 },
    victory: false,
    peakTier: 'S',
   },
   [],
  );
  expect(unlocked).toEqual(['bb_01_q17', 'bb_02_m01']);
 });

 it('triggers real Signal Mark Detonation on gun hit + blade swing, restoring shield & raising style rank', () => {
  const session = new OmegaProtocolCombatSession(20261120, 50, false, { fieldTraversal: true });
  const director = new OmegaZeroSignalDirector('valkyrie', false);
  director.applyLoadoutToSession(session);

  const target = session.engine.state.hazards[0]!;
  target.x = session.engine.state.player.x + 64;
  target.y = session.engine.state.player.y;
  target.hp = 180;
  target.maxHp = 180;

  director.onProjectileFeedback(session, [
   { projectileId: 'p1', kind: 'radio', phase: 'impact', x: target.x, y: target.y, angle: 0, radius: 10, targetId: target.id },
   { projectileId: 'p2', kind: 'radio', phase: 'impact', x: target.x, y: target.y, angle: 0, radius: 10, targetId: target.id },
  ]);
  expect(director.markCount(target.id)).toBe(2);

  // Trigger facing toward target (+x) then swing blade.
  session.update(1 / 60, { moveX: 1, moveY: 0, triggerAction: false });
  const hpBeforeBlade = target.hp;
  const strike = session.blade();
  expect(strike).not.toBeNull();
  director.onPlayerBlade(session, strike);

  expect(target.hp).toBeLessThan(hpBeforeBlade);
  expect(director.markCount(target.id)).toBe(0);
  expect(director.currentHitstopRemaining()).toBeGreaterThan(0);
  expect(director.currentImpactFlash()).toBeGreaterThan(0);
  expect(director.tickHitstop(0.08)).toBe(false);
  expect(director.currentHitstopRemaining()).toBe(0);

  const hud = director.hudSnapshot(session);
  expect(hud.detonations).toBeGreaterThanOrEqual(1);
  expect(hud.stylePoints).toBeGreaterThan(0);
 });

 it('activates Zero-Second Phantom Dodge bullet-time slow-mo, absorbs damage via shield, deploys strikers, and auto-interacts on empty zones', () => {
  const session = new OmegaProtocolCombatSession(20261120, 50, false, { fieldTraversal: true });
  const director = new OmegaZeroSignalDirector('phantom', false);
  director.applyLoadoutToSession(session);

  // Place a runaway cart near hero so dash triggers genuine Phantom Dodge.
  const hazard = session.engine.state.hazards[0]!;
  (hazard as { type: Hazard['type'] }).type = 'RUNAWAY_CART';
  hazard.x = session.engine.state.player.x + 90;
  hazard.y = session.engine.state.player.y;
  hazard.hp = 200;

  expect(session.dash()).toBe(true);
  const dodgeRes = director.onPlayerDash(session);
  expect(dodgeRes.phantomDodge).toBe(true);
  expect(director.currentOverclockRemaining()).toBeGreaterThan(3);

  const stepSlow = director.step(session, 0.04);
  expect(stepSlow.effectiveDt).toBeLessThan(0.02);

  // Verify Energy Shield absorbs incoming Watch HP loss before HP falls.
  const hpStart = session.engine.state.player.hp;
  session.engine.state.player.hp = hpStart - 10;
  director.step(session, 0.016, hpStart);
  expect(session.engine.state.player.hp).toBe(hpStart);
  expect(director.currentShield()).toBe(10);

  // Deploy unlocked starter Striker (Breaker EMP for phantom loadout).
  const hpHazardBefore = hazard.hp;
  expect(director.triggerStriker(session, 'breaker_emp')).toBe(true);
  expect(hazard.hp).toBeLessThan(hpHazardBefore);
  expect(director.triggerStriker(session, 'breaker_emp')).toBe(false); // Cooldown enforced.

  // Clear hazards and walk to active objective console -> auto-flow interacts seamlessly.
  session.engine.state.hazards = [];
  director.step(session, 0.016);
  session.update(1 / 60, { moveX: 0, moveY: 0, triggerAction: false });
  const stepTarget = session.field!.plan.event.steps[0]!.target;
  session.engine.state.player.x = stepTarget.x;
  session.engine.state.player.y = stepTarget.y;
  const autoStep = director.step(session, 0.016);
  expect(autoStep.events.some((e) => e.kind === 'auto_interact')).toBe(true);
  expect(session.field!.progress.completedSteps).toBe(1);
 });

 it('renders world/screen FX and runs procedural audio cleanly without DOM failures', () => {
  const session = new OmegaProtocolCombatSession(20261120, 50, false, { fieldTraversal: true });
  const director = new OmegaZeroSignalDirector('siege', true);
  director.applyLoadoutToSession(session);
  director.triggerStriker(session, 'guard_sentry');

  const worldRec = createRecorder();
  drawOmegaZeroSignalWorldFx(worldRec.ctx, director, session, 1.5);
  expect(worldRec.events.length).toBeGreaterThan(5);

  const screenRec = createRecorder();
  drawOmegaZeroSignalScreenFx(screenRec.ctx, director, 1120, 720);

  const audio = new OmegaProceduralAudio();
  audio.unlock();
  audio.setMuted(true);
  expect(audio.isMuted()).toBe(true);
  audio.setBulletTime(true);
  audio.playSortieStart();
  audio.playGunshot(true);
  audio.playHitImpact('boss');
  audio.playBladeSlash(3);
  audio.playDetonation(3);
  audio.playPhantomDodge();
  audio.playStriker('m01_snipe');
  audio.playRankUp('OMEGA');
  audio.playBossEntry();
  audio.playWaveClear();
  audio.playFootstep();
  audio.playVictory();
  audio.playDefeat();
  audio.setBgmState(true, 'surge');
  audio.setBulletTime(false);
  audio.dispose();
 });

 it('ships every Track-B studio BGM, SFX, and Korean radio voiceover asset under public/', () => {
  const publicRoot = path.resolve(process.cwd(), 'public');
  const entries = Object.entries(OMEGA_AUDIO_MANIFEST);
  expect(entries.length).toBeGreaterThanOrEqual(35);
  for (const [key, relUrl] of entries) {
   const abs = path.join(publicRoot, relUrl.replace(/^\//, ''));
   expect(fs.existsSync(abs), `Missing studio audio asset for ${key}: ${abs}`).toBe(true);
   expect(fs.statSync(abs).size, `Empty audio file for ${key}: ${abs}`).toBeGreaterThan(1024);
  }
 });

 it('completes Wave 1 transition cleanly across all loadouts including Siege (+25 maxHp) and clears 15 waves to victory', () => {
  for (const loadout of ['valkyrie', 'phantom', 'siege'] as const) {
   const session = new OmegaProtocolCombatSession(20261108, 50, false, {
    fieldTraversal: true,
    gateTransition: true,
    continuousOpening: true,
   });
   const director = new OmegaZeroSignalDirector(loadout, loadout === 'siege');
   director.applyLoadoutToSession(session);

   if (loadout === 'siege') {
    expect(session.engine.state.player.maxHp).toBe(125);
    expect(session.run.maxHp).toBe(125);
   }

   for (let wave = 1; wave <= 15; wave++) {
    for (const h of session.engine.state.hazards) {
     h.hp = 0;
    }
    session.update(1 / 60, { moveX: 0, moveY: 0, triggerAction: false });
    director.step(session, 1 / 60, session.engine.state.player.hp);

    expect(session.field?.progress.phase).toBe('objective');
    for (const step of session.field!.plan.event.steps) {
     session.engine.state.player.x = step.target.x;
     session.engine.state.player.y = step.target.y;
     director.step(session, 1 / 60, session.engine.state.player.hp);
    }

    expect(session.field?.progress.phase).toBe('exit');
    session.engine.state.player.x = session.field!.plan.exit.x;
    session.engine.state.player.y = session.field!.plan.exit.y;
    director.step(session, 1 / 60, session.engine.state.player.hp);

    for (let i = 0; i < 120 && (session.gateTransit || session.run.wave === wave) && session.run.phase === 'battle'; i++) {
     session.update(0.05, { moveX: 0, moveY: 0, triggerAction: false });
     director.step(session, 0.05, session.engine.state.player.hp);
    }

    if (session.run.phase === 'reward') {
     const shieldOffer = session.run.offers.includes('shield_matrix')
      ? 'shield_matrix'
      : session.run.offers[0]!;
     session.selectUpgrade(shieldOffer);
     for (let i = 0; i < 60 && session.gateTransit; i++) {
      session.update(0.05, { moveX: 0, moveY: 0, triggerAction: false });
      director.step(session, 0.05, session.engine.state.player.hp);
     }
    }
   }

   expect(session.run.phase).toBe('victory');
   expect(session.run.wave).toBe(16);
  }
 });
});
