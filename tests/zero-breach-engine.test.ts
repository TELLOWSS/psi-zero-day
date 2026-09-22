import { describe, expect, it } from 'vitest';
import { validateDefenseContent, zeroBreachContent } from '../src/content/defense';
import type { DefenseEnemyState, DefenseRunState } from '../src/domain/defense';
import {
  advanceDefense, applyDefenseCommand, createDefenseRun, defensePathLength,
  defensePositionAtDistance, defenseResult, tickDefense,
} from '../src/engine/defense';

const content = zeroBreachContent;
const fresh = () => createDefenseRun(content, 'COORDINATOR');
const running = (state: DefenseRunState, patch: Partial<DefenseRunState> = {}): DefenseRunState => ({
  ...state,
  status: 'RUNNING',
  waveTick: 1,
  ...patch,
});
const enemy = (patch: Partial<DefenseEnemyState> = {}): DefenseEnemyState => ({
  id: 'enemy-999',
  enemyId: 'NORMAL',
  hp: 40,
  distance: 180,
  spawnSequence: 999,
  revealUntilTick: 0,
  slowEffects: [],
  bossPhaseTriggered: false,
  bossArmorFromTick: 0,
  bossArmorUntilTick: 0,
  ...patch,
});

describe('ZERO BREACH content contract', () => {
  it('validates the supplied v1 IDs, references, pads and ten waves', () => {
    expect(validateDefenseContent(content)).toBe(content);
    expect(content.balanceStatus).toBe('UNTESTED_STARTING_POINT');
    expect(content.tickMs).toBe(50);
    expect(content.map.pads).toHaveLength(8);
    expect(content.towers.map(tower => tower.id)).toEqual(['PULSE', 'BURST', 'CONTROL', 'SENSOR']);
    expect(content.enemies.map(item => item.id)).toEqual(['NORMAL', 'SWIFT', 'ARMORED', 'SWARM', 'VEILED', 'BOSS']);
    expect(content.waves.map(wave => wave.id)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    // Character IDs are intentionally resolved by the integration adapter, not embedded in rule data.
    expect(content.supports.find(item => item.id === 'COORDINATOR')?.characterBinding).toBeNull();
    expect(content.supports.find(item => item.id === 'OBSERVER')?.characterBinding).toBeNull();
  });

  it('rejects broken stable references instead of partially accepting content', () => {
    const broken = structuredClone(content) as unknown as Record<string, unknown>;
    const scenario = broken.scenario as Record<string, unknown>;
    scenario.availableTowers = ['NOT_A_TOWER'];
    expect(() => validateDefenseContent(broken)).toThrow();
  });
});

describe('ZERO BREACH deterministic combat rules', () => {
  it('follows the polyline corner without cutting diagonally', () => {
    expect(defensePositionAtDistance(content.map.path, 180)).toEqual({ x: 180, y: 300 });
    expect(defensePositionAtDistance(content.map.path, 200)).toEqual({ x: 180, y: 280 });
    expect(defensePositionAtDistance(content.map.path, 330)).toEqual({ x: 180, y: 150 });
  });

  it('includes the exact range boundary and resolves FIRST/STRONG ties by spawn order', () => {
    let state = fresh();
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });

    const xAtBoundary = 120 + Math.sqrt(155 * 155 - 70 * 70);
    const boundaryDistance = 330 + (xAtBoundary - 180);
    state = running(state, {
      freezeMovementUntilTick: 10,
      enemies: [enemy({ id: 'boundary', distance: boundaryDistance, spawnSequence: 1 })],
    });
    let after = tickDefense(state, content);
    expect(after.enemies[0]!.hp).toBe(28);

    for (const targetMode of ['FIRST', 'STRONG'] as const) {
      let tied = fresh();
      tied = applyDefenseCommand(tied, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
      tied = applyDefenseCommand(tied, content, { type: 'SetTargetMode', towerInstanceId: 'tower-1', targetMode });
      tied = running(tied, {
        freezeMovementUntilTick: 10,
        enemies: [
          enemy({ id: 'older', spawnSequence: 1 }),
          enemy({ id: 'newer', spawnSequence: 2 }),
        ],
      });
      after = tickDefense(tied, content);
      expect(after.enemies.find(item => item.id === 'older')?.hp).toBe(28);
      expect(after.enemies.find(item => item.id === 'newer')?.hp).toBe(40);
    }
  });

  it('processes exit leakage before attacks and gives no kill reward', () => {
    let state = fresh();
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P8', towerId: 'PULSE' });
    const before = state.resource;
    const end = defensePathLength(content.map.path);
    state = running(state, {
      enemies: [enemy({ id: 'leaker', hp: 12, distance: end - 65 * 0.05 })],
    });
    const after = tickDefense(state, content);
    expect(after.enemies).toHaveLength(0);
    expect(after.shield).toBe(19);
    expect(after.resource).toBe(before);
  });

  it('awards one kill reward once when multiple towers can fire in the same tick', () => {
    let state = fresh();
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P2', towerId: 'PULSE' });
    const before = state.resource;
    state = running(state, { freezeMovementUntilTick: 10, enemies: [enemy({ id: 'fragile', hp: 12, spawnSequence: 1 })] });
    const after = tickDefense(state, content);
    expect(after.enemies).toHaveLength(0);
    expect(after.resource).toBe(before + 5);
  });

  it('falls back to weaker slow after expiry and halves boss slow exactly once', () => {
    let state = running(fresh(), {
      tick: 1,
      enemies: [enemy({
        slowEffects: [
          { sourceId: 'strong', fraction: 0.5, startTick: 0, endTick: 2 },
          { sourceId: 'weak', fraction: 0.2, startTick: 0, endTick: 10 },
        ],
      })],
    });
    const p0 = state.enemies[0]!.distance;
    state = tickDefense(state, content);
    const strongMove = state.enemies[0]!.distance - p0;
    const p1 = state.enemies[0]!.distance;
    state = tickDefense(state, content);
    const weakMove = state.enemies[0]!.distance - p1;
    expect(strongMove).toBeCloseTo(65 * 0.05 * 0.5, 6);
    expect(weakMove).toBeCloseTo(65 * 0.05 * 0.8, 6);

    const bossState = running(fresh(), {
      tick: 1,
      enemies: [enemy({
        id: 'boss',
        enemyId: 'BOSS',
        hp: 950,
        slowEffects: [{ sourceId: 'control', fraction: 0.4, startTick: 0, endTick: 10 }],
      })],
    });
    const bossAfter = tickDefense(bossState, content);
    expect(bossAfter.enemies[0]!.distance - bossState.enemies[0]!.distance)
      .toBeCloseTo(32 * 0.05 * 0.8, 6);
  });

  it('blocks attacks on hidden enemies, reveals them with SENSOR, and expires reveal on the exact tick', () => {
    let hidden = fresh();
    hidden = applyDefenseCommand(hidden, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    hidden = running(hidden, { freezeMovementUntilTick: 10, enemies: [enemy({ id: 'veiled', enemyId: 'VEILED', hp: 48 })] });
    const notSeen = tickDefense(hidden, content);
    expect(notSeen.enemies[0]!.hp).toBe(48);

    let sensed = fresh();
    sensed = applyDefenseCommand(sensed, content, { type: 'Build', padId: 'P1', towerId: 'SENSOR' });
    sensed = running(sensed, { freezeMovementUntilTick: 10, enemies: [enemy({ id: 'veiled', enemyId: 'VEILED', hp: 48 })] });
    const seen = tickDefense(sensed, content);
    expect(seen.enemies[0]!.revealUntilTick).toBe(50);
    expect(seen.enemies[0]!.hp).toBeLessThan(48);

    let expiry = fresh();
    expiry = applyDefenseCommand(expiry, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    expiry = running(expiry, {
      tick: 0,
      freezeMovementUntilTick: 10,
      enemies: [enemy({ id: 'veiled', enemyId: 'VEILED', hp: 48, revealUntilTick: 1 })],
    });
    const visibleTick = tickDefense(expiry, content);
    expect(visibleTick.enemies[0]!.hp).toBeLessThan(48);
    const resetCooldown: DefenseRunState = {
      ...visibleTick,
      towers: visibleTick.towers.map(tower => ({ ...tower, attackCooldown: 0 })),
    };
    const expiredTick = tickDefense(resetCooldown, content);
    expect(expiredTick.enemies[0]!.hp).toBe(visibleTick.enemies[0]!.hp);
  });

  it('activates boss armor once on the next tick and expires it after exactly 120 ticks', () => {
    let state = fresh();
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    state = running(state, {
      tick: 10,
      freezeMovementUntilTick: 200,
      enemies: [enemy({ id: 'boss', enemyId: 'BOSS', hp: 575 })],
    });
    const triggered = tickDefense(state, content);
    const boss = triggered.enemies[0]!;
    expect(boss.bossPhaseTriggered).toBe(true);
    expect(boss.bossArmorFromTick).toBe(11);
    expect(boss.bossArmorUntilTick).toBe(131);

    const activeArmorState: DefenseRunState = {
      ...triggered,
      tick: 11,
      enemies: [{ ...boss, hp: 500 }],
      towers: triggered.towers.map(tower => ({ ...tower, attackCooldown: 0 })),
    };
    const activeArmor = tickDefense(activeArmorState, content);
    expect(activeArmor.enemies[0]!.hp).toBe(494);

    const expiredArmorState: DefenseRunState = {
      ...triggered,
      tick: 131,
      enemies: [{ ...boss, hp: 500 }],
      towers: triggered.towers.map(tower => ({ ...tower, attackCooldown: 0 })),
    };
    const expiredArmor = tickDefense(expiredArmorState, content);
    expect(expiredArmor.enemies[0]!.hp).toBe(491);
    expect(expiredArmor.enemies[0]!.bossPhaseTriggered).toBe(true);
  });

  it('rejects bad commands, prevents sell profit, and resumes without a paused-tick deadlock', () => {
    let state = fresh();
    expect(() => applyDefenseCommand(state, content, { type: 'Build', padId: 'missing', towerId: 'PULSE' })).toThrow('Unknown pad');

    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    expect(() => applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'SENSOR' })).toThrow('Pad occupied');
    expect(() => applyDefenseCommand(state, content, { type: 'Upgrade', towerInstanceId: 'tower-1', levelId: 'L3A' })).toThrow('Invalid upgrade path');

    const beforeSell = state.resource;
    const invested = state.towers[0]!.invested;
    state = applyDefenseCommand(state, content, { type: 'Sell', towerInstanceId: 'tower-1' });
    expect(state.resource).toBe(beforeSell + Math.floor(invested * content.sellRate));
    expect(state.resource).toBeLessThan(content.initialResource);

    let poor = fresh();
    poor = applyDefenseCommand(poor, content, { type: 'Build', padId: 'P1', towerId: 'BURST' });
    expect(() => applyDefenseCommand(poor, content, { type: 'Build', padId: 'P2', towerId: 'BURST' })).toThrow('Insufficient resource');

    let paused = running(fresh(), { paused: true });
    const same = tickDefense(paused, content);
    expect(same).toBe(paused);
    paused = applyDefenseCommand(paused, content, { type: 'SetPaused', paused: false });
    const resumed = tickDefense(paused, content);
    expect(resumed.tick).toBe(paused.tick + 1);
  });

  it('supports manual intermission start, 2x fixed steps, final victory, and simultaneous defeat priority', () => {
    let intermission: DefenseRunState = {
      ...fresh(),
      status: 'INTERMISSION',
      waveId: 2,
      intermissionRemaining: content.intermissionTicks,
      spawnedByGroup: content.waves[1]!.groups.map(() => 0),
    };
    intermission = applyDefenseCommand(intermission, content, { type: 'StartWave' });
    expect(intermission.status).toBe('RUNNING');

    let doubleSpeed = running(fresh());
    doubleSpeed = applyDefenseCommand(doubleSpeed, content, { type: 'SetSpeed', speed: 2 });
    expect(advanceDefense(doubleSpeed, content, 1).tick).toBe(doubleSpeed.tick + 2);

    const wave10Counts = content.waves[9]!.groups.map(group => group.count);
    const victory = tickDefense(running(fresh(), {
      waveId: 10,
      waveTick: 1000,
      spawnedByGroup: wave10Counts,
      enemies: [],
      shield: 20,
      completedWaves: 9,
    }), content);
    expect(victory.status).toBe('WON');
    expect(defenseResult(victory)).toMatchObject({ won: true, stars: 3, completedWaves: 10 });

    const end = defensePathLength(content.map.path);
    const defeat = tickDefense(running(fresh(), {
      waveId: 10,
      waveTick: 1000,
      spawnedByGroup: wave10Counts,
      enemies: [enemy({ id: 'boss', enemyId: 'BOSS', hp: 950, distance: end - 32 * 0.05 })],
      shield: 20,
      completedWaves: 9,
    }), content);
    expect(defeat.status).toBe('LOST');
    expect(defeat.shield).toBe(0);
    expect(defenseResult(defeat).stars).toBe(0);
  });

  it('ignores result-screen gameplay input and remains serializable without renderer references', () => {
    const won: DefenseRunState = { ...fresh(), status: 'WON', completedWaves: 10 };
    expect(applyDefenseCommand(won, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' })).toBe(won);

    let state = fresh();
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'SENSOR' });
    const encoded = JSON.stringify(state);
    expect(encoded).toContain('"supportId":"COORDINATOR"');
    expect(encoded).not.toContain('window');
    expect(encoded).not.toContain('document');
    expect(encoded).not.toContain('Phaser');
  });
});
