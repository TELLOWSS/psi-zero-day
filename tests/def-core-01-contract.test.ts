import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import core from '../content/defense/def-core-01.json';
import g2 from '../content/defense/def-hd01-pq-benchmark.json';
import { zeroBreachContent } from '../src/content/defense';
import { applyDefCoreOneStepRuntime } from '../src/ui/DefCoreOneStep';

describe('DEF-CORE-01 one-step vertical slice contract', () => {
  it('starts only after the G2 production benchmark is locked', () => {
    expect(g2.status).toBe('G2_PRODUCTION_LOCKED');
    expect(g2.runtimePromotion.approved).toBe(true);
    expect(core.inherits.g2ProductionLock).toBe(true);
    expect(core.inherits.swift).toBe('assets/defense/enemies/swift-pq01.svg');
    expect(core.inherits.controlSources).toContain('assets/episode01/characters/choi-minseok-map.webp');
  });

  it('limits G3 to the representative SWIFT + CONTROL cycle on Wave 8', () => {
    expect(core.gate).toBe('DEF-CORE-01');
    expect(core.scope.scenarioId).toBe('event-ramp-reconstruction-v1');
    expect(core.scope.representativeWave).toBe(8);
    expect(core.scope.riskId).toBe('SWIFT');
    expect(core.scope.responseId).toBe('CONTROL');
    expect(core.action.noAdditionalResponseFamilies).toBe(true);
    expect(core.sliceAssets.wideGate).toBe('assets/episode01/cg/gate-dawn.webp');
    expect(core.sliceAssets.vehicleRear).toBe('assets/episode01/cg/ramp-entry.webp');
    expect(core.sliceAssets.separation).toBe('assets/episode01/scene-elements/vehicle-pedestrian-separation.webp');
    expect(core.protected.noNewTowerFamily).toBe(true);
    expect(core.protected.noNewRiskFamily).toBe(true);
  });

  it('preserves the locked base DefenseGame topology and balance content', () => {
    expect(zeroBreachContent.map.width).toBe(1000);
    expect(zeroBreachContent.map.height).toBe(600);
    expect(zeroBreachContent.map.path).toEqual([
      [0,300],[180,300],[180,150],[450,150],[450,450],[720,450],[720,240],[1000,240],
    ]);
    expect(zeroBreachContent.map.pads.map(({ id, x, y }) => [id, x, y])).toEqual([
      ['P1',120,220],['P2',260,220],['P3',360,70],['P4',370,340],
      ['P5',530,240],['P6',600,370],['P7',640,530],['P8',800,320],
    ]);
    expect(zeroBreachContent.waves).toHaveLength(10);
    expect(zeroBreachContent.initialShield).toBe(20);
    expect(zeroBreachContent.initialResource).toBe(200);
    expect(core.protected.noBaseCoordinateChange).toBe(true);
    expect(core.protected.noBaseWaveBalanceChange).toBe(true);
  });

  it('contains the complete story/action cycle and three safe operating decisions', () => {
    expect(core.scope.cycle).toEqual([
      'NORMAL_WORK','SIGNAL','READ','CONTROL','IMPACT','CINEMATIC','DECISION','RETURN','HOOK','DONE',
    ]);
    expect(core.choices.map(choice => choice.id)).toEqual(['A','B','C']);
    expect(core.choices.map(choice => choice.worldResult)).toEqual([
      'HOLD_LINE','REINFORCED_CONTROL','REROUTED_STAGING',
    ]);
    expect(core.returnToDefense.allChoicesSafe).toBe(true);
    expect(core.returnToDefense.noBaseBalanceMutation).toBe(true);
    expect(core.choices.map(choice => choice.runtime.swiftSlowFraction)).toEqual([1, 0.55, 0.3]);
    expect(core.choices.find(choice => choice.id === 'C')?.runtime.setbackDistance).toBe(95);
    expect(core.cinematic.shots).toHaveLength(6);
    expect(core.cinematic.targetSeconds[0]).toBeGreaterThanOrEqual(12);
    expect(core.cinematic.targetSeconds[1]).toBeLessThanOrEqual(20);
  });

  it('applies choice-specific live SWIFT movement without mutating the base wave content', () => {
    const swift = {
      id: 'enemy-swift', enemyId: 'SWIFT', hp: 30, distance: 80, spawnSequence: 1,
      revealUntilTick: 0, slowEffects: [], bossPhaseTriggered: false, bossArmorFromTick: 0, bossArmorUntilTick: 0,
    };
    const previous = {
      scenarioId: 'event-ramp-reconstruction-v1', waveId: 8, tick: 100, status: 'RUNNING',
      enemies: [swift],
    } as any;
    const advanced = {
      ...previous, tick: 101, enemies: [{ ...swift, distance: 86 }],
    } as any;

    const hold = applyDefCoreOneStepRuntime(previous, advanced, 'A', 100);
    const reinforced = applyDefCoreOneStepRuntime(previous, advanced, 'B', 100);
    const rerouted = applyDefCoreOneStepRuntime(previous, advanced, 'C', 100);

    const holdSwift = hold.enemies[0]!;
    const reinforcedSwift = reinforced.enemies[0]!;
    const reroutedSwift = rerouted.enemies[0]!;
    expect(holdSwift.distance).toBe(80);
    expect(holdSwift.slowEffects.at(-1)?.fraction).toBe(1);
    expect(reinforcedSwift.distance).toBeCloseTo(82.7, 4);
    expect(reinforcedSwift.slowEffects.at(-1)?.fraction).toBe(0.55);
    const reinforcedNextEngineTick = {
      ...reinforced,
      tick: 102,
      enemies: [{ ...reinforcedSwift, distance: reinforcedSwift.distance + 2.25 }],
    } as any;
    const reinforcedNext = applyDefCoreOneStepRuntime(reinforced, reinforcedNextEngineTick, 'B', 100);
    const reinforcedNextSwift = reinforcedNext.enemies[0]!;
    expect(reinforcedNextSwift.distance).toBeCloseTo(84.95, 4);
    expect(reroutedSwift.distance).toBe(0);
    expect(reroutedSwift.slowEffects.at(-1)?.fraction).toBe(0.3);
    expect(zeroBreachContent.waves[7]?.groups).toEqual([
      { enemy: 'VEILED', count: 8, startTick: 0, intervalTicks: 25 },
      { enemy: 'SWIFT', count: 10, startTick: 60, intervalTicks: 20 },
    ]);
  });

  it('integrates the slice into DefenseGame without StrategyMapShell or new engine IDs', () => {
    const ui = fs.readFileSync('src/ui/DefenseGame.tsx', 'utf8');
    const slice = fs.readFileSync('src/ui/DefCoreOneStep.tsx', 'utf8');
    const css = fs.readFileSync('src/ui/defense-game.css', 'utf8');

    expect(ui).toContain('useDefCoreOneStep');
    expect(ui).toContain('applyDefCoreOneStepRuntime');
    expect(ui).toContain('DefCoreOneStepBoardOverlay');
    expect(ui).toContain('DefCoreOneStepOverlay');
    expect(ui).toContain('data-def-core-phase');
    expect(slice).toContain("state.scenarioId === contract.scope.scenarioId");
    expect(slice).toContain("enemy.enemyId === contract.scope.riskId");
    expect(slice).toContain('CONTROL · 유도원 + 보행동선 분리');
    expect(slice).toContain('차를 세우면 뒤에 두 대가 밀립니다.');
    expect(css).toContain('.def-core-cinematic');
    expect(ui).not.toContain('StrategyMapShell');
  });

  it('keeps real-world identifiers out of the slice contract', () => {
    const serialized = JSON.stringify(core);
    for (const forbidden of ['푸르지오','휘강건설','대우건설','용인 푸르지오']) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
