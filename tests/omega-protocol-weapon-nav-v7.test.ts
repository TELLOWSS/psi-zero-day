import { describe, expect, it } from 'vitest';
import type { Hazard } from '../src/domain/patrol-survivors';
import { omegaFieldInitialProgress, omegaFieldPlan } from '../src/domain/omega-protocol-field';
import { omegaCreateZombieBrain } from '../src/domain/omega-protocol-zombie-ai';
import { OmegaProtocolCombatSession } from '../src/engine/omega-protocol-combat';
import { OmegaZeroSignalDirector } from '../src/engine/omega-protocol-zero-signal-director';
import { omegaQuarterViewCamera } from '../src/ui/omega-protocol-camera';
import { drawOmegaCounterplayCues, omegaCounterplayCues } from '../src/ui/omega-protocol-counterplay';
import { drawOmegaProtocolEnemy } from '../src/ui/omega-protocol-enemy-render';
import { drawOmegaBossTelegraph, drawOmegaFieldMission } from '../src/ui/omega-protocol-field-render';
import {
 drawOmegaEdgeNavigationIndicators,
 drawOmegaTacticalRadar,
 omegaProjectWorldToScreen,
} from '../src/ui/omega-protocol-navigation-hud';
import { drawOmegaZeroSignalWorldFx } from '../src/ui/omega-protocol-zero-signal-fx';

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
    if (key === 'measureText') {
     return () => ({ width: 42 });
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

describe('OMEGA PROTOCOL Wave 7 — Weapon Mechanics & Holographic Navigation', () => {
 it('supports smart-assist blade target snap + collision-safe micro-lunge while keeping default directional blade()', () => {
  const session = new OmegaProtocolCombatSession(20261120, 50, false, { fieldTraversal: true });
  const target = session.engine.state.hazards.find((h) => h.type === 'UNHELMETED')!;
  const player = session.engine.state.player;
  player.invincibleTime = 999;

  // Walk right (+x) so default lastFacing points +x, then place marked zombie 135 units BEHIND player (-x).
  session.update(1 / 60, { moveX: 1, moveY: 0, triggerAction: false });
  target.x = player.x - 135;
  target.y = player.y;
  target.hp = 240;
  target.maxHp = 240;
  target.speed = 0;

  // 1. Default directional blade() swings toward +x and misses target behind AIRA.
  const blindMiss = session.blade();
  expect(blindMiss).not.toBeNull();
  expect(blindMiss!.hits).toBe(0);
  expect(target.hp).toBe(240);

  // Cooldown expires after 0.52s.
  for (let i = 0; i < 36; i++) session.update(1 / 60, { moveX: 0, moveY: 0, triggerAction: false });

  // 2. Smart-assist blade snaps toward marked target behind AIRA and micro-lunges into clean hit range.
  const prevX = player.x;
  const smartHit = session.blade({
   smartAssist: true,
   markedIds: new Set([target.id]),
  });
  expect(smartHit).not.toBeNull();
  expect(smartHit!.hits).toBeGreaterThanOrEqual(1);
  expect(target.hp).toBeLessThan(240);
  expect(player.x).toBeLessThan(prevX); // Micro-lunged left toward target.
 });

 it('fires multi-target piercing Rail Burst, blocks through cover, toggles rapid/focus mode & triggers Gun-Blade Weave', () => {
  const session = new OmegaProtocolCombatSession(20261120, 50, false, { fieldTraversal: true });
  const director = new OmegaZeroSignalDirector('valkyrie', false);
  director.applyLoadoutToSession(session);
  const player = session.engine.state.player;
  player.invincibleTime = 999;

  const h1 = session.engine.state.hazards[0]!;
  const h2 = session.engine.state.hazards[1]!;
  (h1 as { type: Hazard['type'] }).type = 'UNHELMETED';
  (h2 as { type: Hazard['type'] }).type = 'RUNAWAY_CART';
  h1.x = player.x + 120;
  h1.y = player.y;
  h1.hp = 260;
  h1.maxHp = 260;
  h2.x = player.x + 210;
  h2.y = player.y + 4;
  h2.hp = 300;
  h2.maxHp = 300;

  // Toggle to Focus mode -> prioritizes armored/cart high-value target.
  expect(director.toggleWeaponMode(session)).toBe('focus');
  expect(director.resolveLockedTarget(session)?.id).toBe(h2.id);

  // Fire Rail Burst aiming east (+x) -> pierces both aligned threats and stacks Signal Marks!
  const fired = director.fireRailBurst(session, { x: player.x + 250, y: player.y });
  expect(fired).toBe(true);
  expect(h1.hp).toBeLessThan(260);
  expect(h2.hp).toBeLessThan(300);
  expect(director.markCount(h2.id)).toBeGreaterThanOrEqual(2);

  // Smart-assist Blade Detonation within 2.6s weave window triggers Gun-Blade Weave bonus!
  session.update(1 / 60, { moveX: 1, moveY: 0, triggerAction: false });
  const strike = session.blade({
   smartAssist: true,
   markedIds: director.markedHazardIds(),
  });
  expect(strike).not.toBeNull();
  director.onPlayerBlade(session, strike);
  const stepped = director.step(session, 1 / 60, player.hp);
  expect(stepped.events.some((e) => e.kind === 'weave_bonus')).toBe(true);

  const hud = director.hudSnapshot(session);
  expect(hud.weaponMode).toBe('focus');
  expect(hud.railBurstsFired).toBe(1);
  expect(hud.detonations).toBeGreaterThanOrEqual(1);

  // Solid obstacle cover blocks Rail Burst from hitting enemies tucked completely behind a wall.
  const cover = session.field!.plan.obstacles[0]!;
  player.x = cover.x - 45;
  player.y = cover.y + cover.height * 0.5;
  h1.x = cover.x + cover.width + 80;
  h1.y = player.y;
  const hpBehindWall = h1.hp;
  // Recharge railCharge cleanly via dash/step before second shot test.
  director.onPlayerDash(session);
  const blockedFired = director.fireRailBurst(session, { x: h1.x, y: h1.y });
  expect(blockedFired).toBe(true);
  expect(h1.hp).toBe(hpBehindWall);
 });

 it('renders holographic radar, edge indicators, counterplay lanes, boss telegraphs & normalized HP bars cleanly', () => {
  const session = new OmegaProtocolCombatSession(20261120, 50, false, { fieldTraversal: true });
  const director = new OmegaZeroSignalDirector('valkyrie', false);
  director.applyLoadoutToSession(session);
  const field = session.field!;
  const plan = omegaFieldPlan(20261120, 9);
  const progress = { ...omegaFieldInitialProgress(), phase: 'objective' as const };
  const player = session.engine.state.player;
  const camera = omegaQuarterViewCamera(player, 390, 844, 1.12);

  const screenPt = omegaProjectWorldToScreen(plan.exit, camera, 0);
  expect(Number.isFinite(screenPt.x)).toBe(true);
  expect(Number.isFinite(screenPt.y)).toBe(true);

  const radarRec = createRecorder();
  drawOmegaTacticalRadar(radarRec.ctx, {
   width: 390,
   height: 844,
   field: { plan, progress },
   hazards: session.engine.state.hazards,
   player,
   facing: { x: 1, y: 0 },
   seconds: 2.5,
   compact: true,
   canvasScale: 1,
   cleanHud: false,
   worldWidth: 1400,
   worldHeight: 900,
  });
  expect(radarRec.events).toContain('fillText');

  const edgeRec = createRecorder();
  drawOmegaEdgeNavigationIndicators(edgeRec.ctx, {
   width: 390,
   height: 844,
   camera,
   field: { plan, progress },
   hazards: session.engine.state.hazards,
   player,
   fieldElevation: 0,
   seconds: 2.5,
   cleanHud: false,
   compact: true,
  });
  expect(edgeRec.events.length).toBeGreaterThan(2);

  const cart = session.engine.state.hazards.find((h) => h.type === 'RUNAWAY_CART')!;
  cart.motion = { phase: 'warning', timer: 0.4, directionX: 1, directionY: 0 };
  const cueRec = createRecorder();
  drawOmegaCounterplayCues(
   cueRec.ctx,
   omegaCounterplayCues(session.engine.state.hazards, (id) => session.zombieBrain(id)),
   1.8,
   field.plan.obstacles,
  );
  expect(cueRec.events).toContain('rotate');

  const bossRec = createRecorder();
  drawOmegaBossTelegraph(
   bossRec.ctx,
   {
    wave: 15,
    attack: 'power_sweep',
    attackNumber: 1,
    phase: 'warning',
    timer: 0.6,
    warningDuration: 1.0,
    center: { x: 700, y: 450 },
    radius: 150,
    lane: 'horizontal',
    laneHalfWidth: 70,
    empowered: false,
    hitResolved: false,
   },
   1.5,
  );
  expect(bossRec.events).toContain('fillRect');

  const enemyRec = createRecorder();
  const zombie = session.engine.state.hazards.find((h) => h.type === 'UNHELMETED')!;
  const brain = omegaCreateZombieBrain(zombie, 'armored', 0);
  brain.phase = 'warning';
  drawOmegaProtocolEnemy(enemyRec.ctx, zombie, 1.5, { zombie: brain, targetX: player.x });
  expect(enemyRec.events).toContain('scale');

  const fxRec = createRecorder();
  drawOmegaZeroSignalWorldFx(fxRec.ctx, director, session, 2.0);
  expect(fxRec.events.length).toBeGreaterThan(4);

  const navRec = createRecorder();
  drawOmegaFieldMission(navRec.ctx, plan, progress, plan.entry, 2.0, false);
  expect(navRec.events).toContain('rotate');
 });
});
