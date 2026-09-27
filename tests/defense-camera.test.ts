import { describe, expect, it } from 'vitest';
import { defenseCameraScale, defenseCameraSignal } from '../src/ui/useDefenseCamera';
import type { DefenseContent, DefenseRunState } from '../src/domain/defense';

const content = {
  map: {
    id: 'map-apt-bottom-up-excavation-01',
    width: 1000,
    height: 600,
    path: [[0, 500], [180, 500], [180, 390], [370, 390], [370, 240], [620, 240], [620, 120], [1000, 120]],
    pads: [{ id: 'P1', x: 300, y: 315 }],
  },
  towers: [{
    id: 'CONTROL',
    levels: [{
      id: 'L1', from: null, cost: 0, damage: 0, damageType: 'PHYSICAL',
      intervalTicks: 10, range: 150, splashRadius: 0, maxTargets: 1,
      slowFraction: 0.5, slowTicks: 20, revealRadius: 0,
      revealIntervalTicks: 0, revealTicks: 0,
    }],
  }],
} as unknown as DefenseContent;

function state(overrides: Partial<DefenseRunState> = {}): DefenseRunState {
  return {
    runId: 'run', mode: 'TRAINING', variant: 'STANDARD',
    scenarioId: 'training-site:apt-new-bottom-up-excavation', eventId: null, eventContentVersion: null,
    status: 'RUNNING', paused: false, speed: 1, tick: 100, waveId: 8, waveTick: 100,
    intermissionRemaining: 0, shield: 100, resource: 100,
    towers: [{ id: 'tower-1', padId: 'P1', towerId: 'CONTROL', levelId: 'L1', targetMode: 'FIRST', invested: 0, attackCooldown: 0, revealCooldown: 0 }],
    enemies: [{
      id: 'swift-1', enemyId: 'SWIFT', hp: 10, distance: 280, spawnSequence: 1,
      revealUntilTick: 0, slowEffects: [], bossPhaseTriggered: false,
      bossArmorFromTick: 0, bossArmorUntilTick: 0,
    }],
    spawnedByGroup: [1, 0], nextTowerSequence: 2, nextEnemySequence: 2,
    supportId: 'COORDINATOR', supportCooldownRemaining: 0,
    freezeMovementUntilTick: 0, revealAllUntilTick: 0, rangeBonusUntilTick: 0,
    completedWaves: 7, leakedByEnemy: {},
    ...overrides,
  };
}

describe('cinematic defense camera', () => {
  it('uses a stronger landscape impact punch and restrained portrait punch', () => {
    expect(defenseCameraScale('STRATEGIC_BASE', false)).toBe(1);
    expect(defenseCameraScale('THREAT_APPROACH', false)).toBe(1.16);
    expect(defenseCameraScale('IMPACT_CLOSE_UP', false)).toBe(1.28);
    expect(defenseCameraScale('IMPACT_CLOSE_UP', true)).toBe(1.18);
  });

  it('fires IMPACT when a new CONTROL slow effect lands', () => {
    const before = state();
    const after = state({
      tick: 101,
      enemies: [{
        ...before.enemies[0]!,
        slowEffects: [{ sourceId: 'tower-1', fraction: 0.5, startTick: 101, endTick: 121 }],
      }],
    });
    const signal = defenseCameraSignal(before, after, content);
    expect(signal.kind).toBe('IMPACT');
    expect(signal.reason).toBe('CONTROL_INTERVENTION');
    expect(signal.enemyId).toBe('swift-1');
  });

  it('fires APPROACH when VEILED becomes newly revealed', () => {
    const veiled = {
      id: 'veiled-1', enemyId: 'VEILED' as const, hp: 10, distance: 90, spawnSequence: 1,
      revealUntilTick: 0, slowEffects: [], bossPhaseTriggered: false,
      bossArmorFromTick: 0, bossArmorUntilTick: 0,
    };
    const before = state({ enemies: [veiled] });
    const after = state({ tick: 101, enemies: [{ ...veiled, revealUntilTick: 130 }] });
    const signal = defenseCameraSignal(before, after, content);
    expect(signal.kind).toBe('APPROACH');
    expect(signal.reason).toBe('VEILED_REVEAL');
  });
});
