import { describe, expect, it } from 'vitest';
import { validateDefenseContent, zeroBreachContent } from '../src/content/defense';
import type { DefenseEnemyState, DefenseRunState } from '../src/domain/defense';
import {
  applyDefenseCommand, createDefenseRun, defensePositionAt, defenseStars, tickDefense,
} from '../src/engine/defense';

const content = zeroBreachContent;
const must = (result: ReturnType<typeof applyDefenseCommand>): DefenseRunState => {
  expect(result.ok).toBe(true);
  return result.state;
};
const running = (state: DefenseRunState, patch: Partial<DefenseRunState> = {}): DefenseRunState => ({
  ...state, phase: 'RUNNING', waveIndex: 0, waveTick: 1, ...patch,
});
const enemy = (patch: Partial<DefenseEnemyState> = {}): DefenseEnemyState => ({
  instanceId: 'E999', definitionId: 'NORMAL', spawnSequence: 999, hp: 40, progress: 180,
  slowEffects: [], revealedUntilTick: 0, leaked: false, bossPhaseTriggers: 0,
  bossArmorStartTick: null, bossArmorEndTick: null, ...patch,
});

describe('ZERO BREACH content contract', () => {
  it('validates the supplied v1 IDs, references, pads and ten waves', () => {
    expect(validateDefenseContent(content)).toBe(content);
    expect(content.balanceStatus).toBe('UNTESTED_STARTING_POINT');
    expect(content.tickMs).toBe(50);
    expect(content.map.pads).toHaveLength(8);
    expect(content.towers).toHaveLength(4);
    expect(content.enemies).toHaveLength(6);
    expect(content.waves.map(wave => wave.id)).toEqual([1,2,3,4,5,6,7,8,9,10]);
    expect(content.supports.find(item => item.id === 'COORDINATOR')?.characterBinding).toBe('kang_taesik');
    expect(content.supports.find(item => item.id === 'OBSERVER')?.characterBinding).toBe('lim_junho');
  });

  it('rejects broken references instead of partially accepting content', () => {
    const broken = structuredClone(content) as unknown as Record<string, unknown>;
    const scenario = broken.scenario as Record<string, unknown>;
    scenario.availableTowers = ['NOT_A_TOWER'];
    expect(() => validateDefenseContent(broken)).toThrow(/missing tower reference/);
  });
});

describe('ZERO BREACH deterministic engine', () => {
  it('moves along the polyline corner instead of cutting diagonally', () => {
    expect(defensePositionAt(content, 180)).toEqual({ x: 180, y: 300 });
    expect(defensePositionAt(content, 200)).toEqual({ x: 180, y: 280 });
    expect(defensePositionAt(content, 330)).toEqual({ x: 180, y: 150 });
  });

  it('rejects occupied pads and cannot profit by selling', () => {
    let state = createDefenseRun(content);
    state = must(applyDefenseCommand(content, state, { type: 'Build', padId: 'P1', towerId: 'PULSE' }));
    const afterBuild = state.resource;
    expect(applyDefenseCommand(content, state, { type: 'Build', padId: 'P1', towerId: 'SENSOR' })).toMatchObject({ ok: false, reason: 'PAD_OCCUPIED' });
    const invested = state.towers[0]!.invested;
    state = must(applyDefenseCommand(content, state, { type: 'Sell', towerInstanceId: state.towers[0]!.instanceId }));
    expect(state.resource).toBe(afterBuild + Math.floor(invested * 0.7));
    expect(state.resource).toBeLessThan(content.initialResource);
  });

  it('rejects invalid upgrade branches and clamps cooldown on a valid upgrade', () => {
    let state = createDefenseRun(content);
    state = must(applyDefenseCommand(content, state, { type: 'Build', padId: 'P1', towerId: 'PULSE' }));
    expect(applyDefenseCommand(content, state, { type: 'Upgrade', towerInstanceId: 'T1', levelId: 'L3A' })).toMatchObject({ ok: false, reason: 'INVALID_UPGRADE_PATH' });
    state = { ...state, towers: [{ ...state.towers[0]!, cooldownRemainingTicks: 30 }] };
    state = must(applyDefenseCommand(content, state, { type: 'Upgrade', towerInstanceId: 'T1', levelId: 'L2' }));
    expect(state.towers[0]!.cooldownRemainingTicks).toBe(16);
  });

  it('awards one kill once when multiple towers could attack in the same tick', () => {
    let state = createDefenseRun(content);
    state = must(applyDefenseCommand(content, state, { type: 'Build', padId: 'P1', towerId: 'PULSE' }));
    state = must(applyDefenseCommand(content, state, { type: 'Build', padId: 'P2', towerId: 'PULSE' }));
    const before = state.resource;
    state = running(state, { enemies: [enemy({ hp: 12 })] });
    const after = tickDefense(content, state);
    expect(after.enemies[0]!.hp).toBe(0);
    expect(after.resource).toBe(before + 5);
  });

  it('processes exit leakage before tower attacks and gives no kill reward', () => {
    let state = createDefenseRun(content);
    state = must(applyDefenseCommand(content, state, { type: 'Build', padId: 'P8', towerId: 'PULSE' }));
    const before = state.resource;
    const end = content.map.path.reduce((sum, point, i, path) => i === 0 ? 0 : sum + Math.hypot(point[0] - path[i-1]![0], point[1] - path[i-1]![1]), 0);
    state = running(state, { enemies: [enemy({ hp: 12, progress: end - 0.1 })] });
    const after = tickDefense(content, state);
    expect(after.enemies[0]!.leaked).toBe(true);
    expect(after.shield).toBe(19);
    expect(after.resource).toBe(before);
  });

  it('falls back to the weaker slow after the stronger effect expires and halves boss slow once', () => {
    let state = running(createDefenseRun(content), {
      globalTick: 1,
      enemies: [enemy({
        slowEffects: [
          { sourceId: 'strong', fraction: 0.5, endTick: 2 },
          { sourceId: 'weak', fraction: 0.2, endTick: 10 },
        ],
      })],
    });
    const p0 = state.enemies[0]!.progress;
    state = tickDefense(content, state);
    const strongMove = state.enemies[0]!.progress - p0;
    const p1 = state.enemies[0]!.progress;
    state = tickDefense(content, state);
    const weakMove = state.enemies[0]!.progress - p1;
    expect(strongMove).toBeCloseTo(40 * 0.05 * 0.5, 6);
    expect(weakMove).toBeCloseTo(40 * 0.05 * 0.8, 6);

    const bossState = running(createDefenseRun(content), {
      globalTick: 1,
      enemies: [enemy({ definitionId: 'BOSS', hp: 950, slowEffects: [{ sourceId: 'control', fraction: 0.4, endTick: 10 }] })],
    });
    const bossAfter = tickDefense(content, bossState);
    expect(bossAfter.enemies[0]!.progress - bossState.enemies[0]!.progress).toBeCloseTo(32 * 0.05 * 0.8, 6);
  });

  it('prevents attacking hidden enemies until reveal is active', () => {
    let state = createDefenseRun(content);
    state = must(applyDefenseCommand(content, state, { type: 'Build', padId: 'P1', towerId: 'PULSE' }));
    state = running(state, { enemies: [enemy({ definitionId: 'VEILED', hp: 48 })] });
    const hidden = tickDefense(content, state);
    expect(hidden.enemies[0]!.hp).toBe(48);
    const visibleState = { ...state, enemies: [enemy({ definitionId: 'VEILED', hp: 48, revealedUntilTick: 100 })] };
    const visible = tickDefense(content, visibleState);
    expect(visible.enemies[0]!.hp).toBeLessThan(48);
  });

  it('applies boss armor phase once starting on the next tick for exactly 120 ticks', () => {
    let state = createDefenseRun(content);
    state = must(applyDefenseCommand(content, state, { type: 'Build', padId: 'P1', towerId: 'PULSE' }));
    state = running(state, { globalTick: 10, enemies: [enemy({ definitionId: 'BOSS', hp: 575 })] });
    const triggered = tickDefense(content, state);
    const boss = triggered.enemies[0]!;
    expect(boss.bossPhaseTriggers).toBe(1);
    expect(boss.bossArmorStartTick).toBe(11);
    expect(boss.bossArmorEndTick).toBe(131);
    const afterExpiry = tickDefense(content, { ...triggered, globalTick: 131, towers: triggered.towers.map(tower => ({ ...tower, cooldownRemainingTicks: 0 })) });
    expect(afterExpiry.enemies[0]!.bossPhaseTriggers).toBe(1);
  });

  it('makes simultaneous shield loss beat final-wave victory', () => {
    const end = content.map.path.reduce((sum, point, i, path) => i === 0 ? 0 : sum + Math.hypot(point[0] - path[i-1]![0], point[1] - path[i-1]![1]), 0);
    const state = running(createDefenseRun(content), {
      waveIndex: 9, waveTick: 1000, shield: 20,
      enemies: [enemy({ definitionId: 'BOSS', hp: 950, progress: end - 0.1 })],
    });
    const after = tickDefense(content, state);
    expect(after.phase).toBe('LOST');
    expect(after.shield).toBe(0);
    expect(defenseStars(after)).toBe(0);
  });

  it('does not advance while paused and ignores gameplay commands after a result', () => {
    let state = createDefenseRun(content);
    state = must(applyDefenseCommand(content, state, { type: 'SetPaused', paused: true }));
    expect(tickDefense(content, state)).toBe(state);
    const won: DefenseRunState = { ...state, phase: 'WON', shield: 20 };
    expect(applyDefenseCommand(content, won, { type: 'Build', padId: 'P1', towerId: 'PULSE' })).toMatchObject({ ok: false, reason: 'RUN_FINISHED' });
    expect(defenseStars(won)).toBe(3);
  });

  it('serializes state as data without DOM or renderer references', () => {
    let state = createDefenseRun(content, 'OBSERVER');
    state = must(applyDefenseCommand(content, state, { type: 'Build', padId: 'P1', towerId: 'SENSOR' }));
    const encoded = JSON.stringify(state);
    expect(encoded).toContain('"selectedSupportId":"OBSERVER"');
    expect(encoded).not.toContain('window');
    expect(encoded).not.toContain('document');
    expect(encoded).not.toContain('Phaser');
  });
});
