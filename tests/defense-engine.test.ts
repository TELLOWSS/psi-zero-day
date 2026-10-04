import { describe, expect, it } from 'vitest';
import { defenseContent } from '../src/content/defense';
import type { DefenseContent, DefenseRunState } from '../src/domain/defense';
import { advanceDefense, applyDefenseCommand, createDefenseRun, defensePathLength, defensePositionAtDistance, defenseResult, tickDefense } from '../src/engine/defense';

function withResource(state: DefenseRunState, resource = 5000): DefenseRunState { return { ...state, resource }; }
function runTicks(state: DefenseRunState, ticks: number, content: DefenseContent = defenseContent): DefenseRunState {
  let next = state; for (let i = 0; i < ticks; i++) next = tickDefense(next, content); return next;
}

describe('ZERO BREACH geometry and commands', () => {
  it('walks the authored polyline without cutting corners', () => {
    expect(defensePathLength([[0, 0], [10, 0], [10, 10]])).toBe(20);
    expect(defensePositionAtDistance([[0, 0], [10, 0], [10, 10]], 15)).toEqual({ x: 10, y: 5 });
  });
  it('enforces resources, occupied pads, upgrade branches and sale loss', () => {
    let state = { ...createDefenseRun(defenseContent, 'COORDINATOR'), resource: 50 };
    expect(() => applyDefenseCommand(state, defenseContent, { type: 'Build', padId: 'P1', towerId: 'PULSE' })).toThrow('Insufficient');
    state = { ...state, resource: 200 };
    state = applyDefenseCommand(state, defenseContent, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    expect(state.resource).toBe(120);
    expect(() => applyDefenseCommand(state, defenseContent, { type: 'Build', padId: 'P1', towerId: 'SENSOR' })).toThrow('occupied');
    expect(() => applyDefenseCommand(state, defenseContent, { type: 'Upgrade', towerInstanceId: 'tower-1', levelId: 'L3A' })).toThrow('upgrade path');
    state = applyDefenseCommand(state, defenseContent, { type: 'Upgrade', towerInstanceId: 'tower-1', levelId: 'L2' });
    expect(state.resource).toBe(60);
    state = applyDefenseCommand(state, defenseContent, { type: 'Sell', towerInstanceId: 'tower-1' });
    expect(state.resource).toBe(158); // floor((80+60)*0.7)=98; never profitable
  });
  it('unpauses immediately without waiting for a future tick and ignores result commands', () => {
    let state = createDefenseRun(defenseContent, 'COORDINATOR');
    state = applyDefenseCommand(state, defenseContent, { type: 'SetPaused', paused: true });
    const tick = state.tick;
    state = applyDefenseCommand(state, defenseContent, { type: 'SetPaused', paused: false });
    expect(state.paused).toBe(false); expect(state.tick).toBe(tick);
    const won: DefenseRunState = { ...state, status: 'WON' };
    expect(applyDefenseCommand(won, defenseContent, { type: 'Build', padId: 'P1', towerId: 'PULSE' })).toBe(won);
  });
});

describe('ZERO BREACH targeting, damage and effects', () => {
  it('includes exact range boundary and resolves FIRST/STRONG ties deterministically', () => {
    const content = structuredClone(defenseContent) as any;
    content.map.path = [[0, 0], [1000, 0]]; content.map.pads = [{ id: 'P1', x: 0, y: 155 }];
    content.enemies.find((e: any) => e.id === 'NORMAL').speed = 0;
    content.waves[0] = { id: 1, groups: [{ enemy: 'NORMAL', count: 2, startTick: 0, intervalTicks: 1 }] };
    let state = withResource(createDefenseRun(content, 'COORDINATOR'));
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    state = applyDefenseCommand(state, content, { type: 'StartWave' });
    state = tickDefense(state, content);
    expect(state.enemies[0]?.hp).toBe(28); // exactly 155 away at spawn position before 3.25 movement remains in range
    state = applyDefenseCommand(state, content, { type: 'SetTargetMode', towerInstanceId: 'tower-1', targetMode: 'STRONG' });
    expect(state.towers[0]?.targetMode).toBe('STRONG');
  });
  it('awards one kill reward when multiple towers could hit the same enemy in one tick', () => {
    const content = structuredClone(defenseContent) as any;
    content.map.path = [[0, 0], [1000, 0]]; content.map.pads = [{ id: 'P1', x: 0, y: 20 }, { id: 'P2', x: 0, y: 40 }];
    content.enemies.find((e: any) => e.id === 'NORMAL').hp = 10; content.enemies.find((e: any) => e.id === 'NORMAL').speed = 0;
    content.waves[0] = { id: 1, groups: [{ enemy: 'NORMAL', count: 1, startTick: 0, intervalTicks: 1 }] };
    let state = withResource(createDefenseRun(content, 'COORDINATOR'), 500); const before = state.resource;
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P2', towerId: 'PULSE' });
    const afterBuild = state.resource; state = applyDefenseCommand(state, content, { type: 'StartWave' }); state = tickDefense(state, content);
    expect(state.resource - afterBuild).toBe(5); expect(before - afterBuild).toBe(160);
  });
  it('does not attack hidden enemies until revealed and reveal expires end-exclusive', () => {
    const content = structuredClone(defenseContent) as any;
    content.map.path = [[0, 0], [1000, 0]]; content.map.pads = [{ id: 'P1', x: 0, y: 20 }, { id: 'P2', x: 0, y: 40 }];
    content.waves[0] = { id: 1, groups: [{ enemy: 'VEILED', count: 1, startTick: 0, intervalTicks: 1 }] };
    let state = withResource(createDefenseRun(content, 'COORDINATOR'));
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    state = applyDefenseCommand(state, content, { type: 'StartWave' }); state = tickDefense(state, content);
    expect(state.enemies[0]?.hp).toBe(48);
    state = applyDefenseCommand(state, content, { type: 'SetPaused', paused: true });
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P2', towerId: 'SENSOR' });
    state = applyDefenseCommand(state, content, { type: 'SetPaused', paused: false }); state = tickDefense(state, content);
    expect(state.enemies[0]?.hp).toBeLessThan(48);
  });
  it('uses the strongest slow, restores the weaker source after expiry, and halves slow on bosses', () => {
    const content = structuredClone(defenseContent) as any;
    content.map.path = [[0, 0], [5000, 0]]; content.map.pads = [{ id: 'P1', x: 0, y: 10 }, { id: 'P2', x: 0, y: 20 }];
    const control = content.towers.find((t: any) => t.id === 'CONTROL');
    control.levels.find((l: any) => l.id === 'L1').slowTicks = 8;
    control.levels.find((l: any) => l.id === 'L3A').slowTicks = 2;
    content.waves[0] = { id: 1, groups: [{ enemy: 'BOSS', count: 1, startTick: 0, intervalTicks: 1 }] };
    let state = withResource(createDefenseRun(content, 'COORDINATOR'));
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'CONTROL' });
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P2', towerId: 'CONTROL' });
    state = applyDefenseCommand(state, content, { type: 'Upgrade', towerInstanceId: 'tower-2', levelId: 'L2' });
    state = applyDefenseCommand(state, content, { type: 'Upgrade', towerInstanceId: 'tower-2', levelId: 'L3A' });
    state = applyDefenseCommand(state, content, { type: 'StartWave' }); state = tickDefense(state, content);
    expect(state.enemies[0]!.slowEffects).toHaveLength(2);
    const d0 = state.enemies[0]!.distance; state = tickDefense(state, content); const strongStep = state.enemies[0]!.distance - d0;
    expect(strongStep).toBeCloseTo(1.16, 2); // 32*0.05*(1-0.55/2)
    state = tickDefense(state, content); const beforeWeak = state.enemies[0]!.distance; state = tickDefense(state, content);
    const weakStep = state.enemies[0]!.distance - beforeWeak;
    expect(weakStep).toBeCloseTo(1.36, 2); // weaker 0.30 source remains => boss uses 0.15
  });
  it('triggers boss armor once after attacks and lets PURE damage ignore it', () => {
    const content = structuredClone(defenseContent) as any;
    content.map.path = [[0, 0], [5000, 0]]; content.map.pads = [{ id: 'P1', x: 0, y: 10 }];
    content.enemies.find((e: any) => e.id === 'BOSS').hp = 20;
    content.waves[0] = { id: 1, groups: [{ enemy: 'BOSS', count: 1, startTick: 0, intervalTicks: 1 }] };
    let state = withResource(createDefenseRun(content, 'COORDINATOR'));
    state = applyDefenseCommand(state, content, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    state = applyDefenseCommand(state, content, { type: 'StartWave' }); state = tickDefense(state, content);
    expect(state.enemies[0]?.bossPhaseTriggered).toBe(true);
    const boss = state.enemies[0]!; expect(boss.bossArmorUntilTick - boss.bossArmorFromTick).toBe(120);
    const until = boss.bossArmorUntilTick; state = runTicks(state, 5, content);
    expect(state.enemies[0]?.bossArmorUntilTick).toBe(until);
  });
});

describe('ZERO BREACH timing and outcomes', () => {
  it('spawns tick zero in authored group order and gives no reward for leaks', () => {
    const content = structuredClone(defenseContent) as any;
    content.map.path = [[0, 0], [1, 0]]; content.waves[0] = { id: 1, groups: [
      { enemy: 'NORMAL', count: 1, startTick: 0, intervalTicks: 1 }, { enemy: 'SWIFT', count: 1, startTick: 0, intervalTicks: 1 },
    ] };
    let state = createDefenseRun(content, 'COORDINATOR'); const resource = state.resource;
    state = applyDefenseCommand(state, content, { type: 'StartWave' }); state = tickDefense(state, content);
    expect(state.resource).toBe(resource); expect(state.shield).toBe(18); // both leaked, no kill reward
  });
  it('keeps cooldowns across waves and pauses all simulation time', () => {
    let state = withResource(createDefenseRun(defenseContent, 'COORDINATOR'));
    state = applyDefenseCommand(state, defenseContent, { type: 'StartWave' });
    state = applyDefenseCommand(state, defenseContent, { type: 'SetPaused', paused: true });
    expect(tickDefense(state, defenseContent)).toBe(state);
    state = applyDefenseCommand(state, defenseContent, { type: 'SetPaused', paused: false });
    state = applyDefenseCommand(state, defenseContent, { type: 'UseSupport' });
    expect(state.supportCooldownRemaining).toBe(900);
  });
  it('keeps tower and support cooldowns running through intermission instead of resetting them', () => {
    let state = withResource(createDefenseRun(defenseContent, 'COORDINATOR'));
    state = applyDefenseCommand(state, defenseContent, { type: 'Build', padId: 'P1', towerId: 'PULSE' });
    state = { ...state, status: 'INTERMISSION', intermissionRemaining: 3, supportCooldownRemaining: 5,
      towers: [{ ...state.towers[0]!, attackCooldown: 4, revealCooldown: 0 }] };
    state = tickDefense(state, defenseContent);
    expect(state.supportCooldownRemaining).toBe(4); expect(state.towers[0]?.attackCooldown).toBe(3);
  });
  it('makes LOST win over a same-tick final clear and clamps shield at zero', () => {
    const content = structuredClone(defenseContent) as any;
    content.waves = [{ id: 1, groups: [{ enemy: 'BOSS', count: 1, startTick: 0, intervalTicks: 1 }] }];
    content.map.path = [[0, 0], [1, 0]];
    let state = { ...createDefenseRun(content, 'COORDINATOR'), waveId: 1, shield: 20 };
    state = applyDefenseCommand(state, content, { type: 'StartWave' }); state = tickDefense(state, content);
    expect(state.status).toBe('LOST'); expect(state.shield).toBe(0);
  });
  it('produces identical simulation state for 1x vs 2x when advancing the same number of fixed ticks', () => {
    let a = createDefenseRun(defenseContent, 'OBSERVER'); let b = createDefenseRun(defenseContent, 'OBSERVER');
    a = applyDefenseCommand(a, defenseContent, { type: 'StartWave' }); b = applyDefenseCommand(b, defenseContent, { type: 'StartWave' });
    a = advanceDefense(a, defenseContent, 20);
    b = applyDefenseCommand(b, defenseContent, { type: 'SetSpeed', speed: 2 }); b = advanceDefense(b, defenseContent, 10);
    expect({ ...b, speed: 1 }).toEqual(a);
  });
  it('serializes to plain JSON and reports score/stars without DOM state', () => {
    const state = { ...createDefenseRun(defenseContent, 'OBSERVER'), status: 'WON' as const, completedWaves: 10, shield: 15 };
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    expect(defenseResult(state)).toEqual({ won: true, stars: 2, score: 11500, completedWaves: 10, shield: 15 });
  });
});
