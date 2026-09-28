import { describe, expect, it } from 'vitest';
import type { DefenseEnemyState, DefenseRunState } from '../src/domain/defense';
import {
  applyDefCoreOneStepRuntime,
  evaluateDefCoreOneStepVerification,
} from '../src/ui/DefCoreOneStep';

function swift(
  id: string,
  distance: number,
  slowEffects: DefenseEnemyState['slowEffects'] = [],
): DefenseEnemyState {
  return {
    id,
    enemyId: 'SWIFT',
    hp: 100,
    distance,
    spawnSequence: Number(id.replace(/\D/g, '')) || 1,
    revealUntilTick: 0,
    slowEffects,
    bossPhaseTriggered: false,
    bossArmorFromTick: 0,
    bossArmorUntilTick: 0,
  };
}

function run(
  tick: number,
  enemies: readonly DefenseEnemyState[],
  overrides: Partial<DefenseRunState> = {},
): DefenseRunState {
  return {
    runId: 'def-core-test',
    mode: 'EVENT',
    variant: 'EVENT_MODIFIED',
    scenarioId: 'event-ramp-reconstruction-v1',
    eventId: null,
    eventContentVersion: null,
    status: 'RUNNING',
    paused: false,
    speed: 1,
    tick,
    waveId: 8,
    waveTick: tick,
    intermissionRemaining: 0,
    shield: 100,
    resource: 0,
    towers: [],
    enemies,
    spawnedByGroup: [],
    nextTowerSequence: 1,
    nextEnemySequence: 10,
    supportId: 'COORDINATOR',
    supportCooldownRemaining: 0,
    freezeMovementUntilTick: 0,
    revealAllUntilTick: 0,
    rangeBonusUntilTick: 0,
    completedWaves: 7,
    leakedByEnemy: {},
    ...overrides,
  };
}

describe('DEF-GAMEPLAY-IDENTITY-01 CONTROL cycle', () => {
  it('A holds the active vehicle at the control line before release', () => {
    const previous = run(100, [swift('enemy-1', 50)]);
    const advanced = run(101, [swift('enemy-1', 52)]);
    const next = applyDefCoreOneStepRuntime(previous, advanced, 'A', 100);
    const vehicle = next.enemies[0]!;

    expect(vehicle.distance).toBeCloseTo(50, 6);
    expect(vehicle.slowEffects.some(effect =>
      effect.sourceId === 'def-core-01:A' && effect.fraction === 1,
    )).toBe(true);
  });

  it('B holds a trailing vehicle when minimum headway would be violated', () => {
    const previous = run(100, [
      swift('enemy-1', 100),
      swift('enemy-2', 20),
    ]);
    const advanced = run(101, [
      swift('enemy-1', 102),
      swift('enemy-2', 22),
    ]);
    const next = applyDefCoreOneStepRuntime(previous, advanced, 'B', 100);
    const lead = next.enemies.find(enemy => enemy.id === 'enemy-1')!;
    const trailing = next.enemies.find(enemy => enemy.id === 'enemy-2')!;

    expect(lead.distance).toBeGreaterThan(100);
    expect(trailing.distance).toBe(20);
    expect(trailing.slowEffects.some(effect =>
      effect.sourceId === 'def-core-01:B' && effect.fraction === 1,
    )).toBe(true);
  });

  it('C visibly returns the active vehicle toward staging and slows following arrivals', () => {
    const previous = run(100, [swift('enemy-1', 100)]);
    const advanced = run(101, [
      swift('enemy-1', 102),
      swift('enemy-2', 2),
    ]);
    const next = applyDefCoreOneStepRuntime(previous, advanced, 'C', 100);
    const active = next.enemies.find(enemy => enemy.id === 'enemy-1')!;
    const following = next.enemies.find(enemy => enemy.id === 'enemy-2')!;

    expect(active.distance).toBeLessThan(10);
    expect(following.distance).toBeLessThan(2);
    expect(following.slowEffects.some(effect =>
      effect.sourceId === 'def-core-01:C' && effect.fraction === 0.3,
    )).toBe(true);
  });

  it('VERIFY closes from field-control evidence and does not depend on HP', () => {
    const controlled = swift('enemy-1', 40, [{
      sourceId: 'def-core-01:A',
      fraction: 1,
      startTick: 101,
      endTick: 160,
    }]);
    const safe = evaluateDefCoreOneStepVerification(
      run(110, [{ ...controlled, hp: 100 }]),
      'A',
      100,
    );
    const unsafeDespiteZeroHp = evaluateDefCoreOneStepVerification(
      run(110, [{ ...controlled, hp: 0, slowEffects: [] }]),
      'A',
      100,
    );

    expect(safe.safe).toBe(true);
    expect(safe.vehicleControlled).toBe(true);
    expect(unsafeDespiteZeroHp.safe).toBe(false);
  });

  it('B verification accepts either safe headway or an actively held trailing vehicle', () => {
    const source = (fraction: number) => [{
      sourceId: 'def-core-01:B',
      fraction,
      startTick: 101,
      endTick: 260,
    }];
    const state = run(112, [
      swift('enemy-1', 160, source(0.55)),
      swift('enemy-2', 80, source(1)),
    ]);
    const result = evaluateDefCoreOneStepVerification(state, 'B', 100);

    expect(result.vehicleControlled).toBe(true);
    expect(result.choiceConditionMet).toBe(true);
    expect(result.safe).toBe(true);
  });
});
