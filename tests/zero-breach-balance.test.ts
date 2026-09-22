import { describe, expect, it } from 'vitest';
import { zeroBreachContent as content } from '../src/content/defense';
import type {
  DefenseLevelId, DefenseRunState, DefenseSupportId, DefenseTowerId,
} from '../src/domain/defense';
import {
  applyDefenseCommand, createDefenseRun, defensePathLength, defenseResult, tickDefense,
} from '../src/engine/defense';

type BuildAction = { type: 'build'; padId: string; towerId: DefenseTowerId };
type UpgradeAction = { type: 'upgrade'; padId: string; levelId: DefenseLevelId };
type TargetAction = { type: 'target'; padId: string; targetMode: 'FIRST' | 'STRONG' };
type PlanAction = BuildAction | UpgradeAction | TargetAction;

interface StrategyPlan {
  readonly id: string;
  readonly support: DefenseSupportId;
  readonly prepByWave: Readonly<Record<number, readonly PlanAction[]>>;
  readonly supportWaves: readonly number[];
}

interface PurchaseRecord {
  readonly wave: number;
  readonly tick: number;
  readonly action: string;
  readonly resourceAfter: number;
}

interface BalanceReport {
  readonly id: string;
  readonly support: DefenseSupportId | 'NONE';
  readonly won: boolean;
  readonly stars: number;
  readonly shield: number;
  readonly completedWaves: number;
  readonly failureWave: number | null;
  readonly ticks: number;
  readonly wallSeconds1x: number;
  readonly initialPlacement: readonly string[];
  readonly purchases: readonly PurchaseRecord[];
  readonly supportUse: readonly { wave: number; tick: number }[];
  readonly leakDamageByEnemy: Readonly<Record<string, number>>;
  readonly finalBranches: readonly string[];
}

const pathLength = defensePathLength(content.map.path);

function towerIdAtPad(state: DefenseRunState, padId: string): string | null {
  return state.towers.find(tower => tower.padId === padId)?.id ?? null;
}

function applyPlanAction(state: DefenseRunState, action: PlanAction): DefenseRunState {
  if (action.type === 'build') {
    if (towerIdAtPad(state, action.padId)) return state;
    const level = content.towers.find(tower => tower.id === action.towerId)!.levels.find(level => level.id === 'L1')!;
    if (state.resource < level.cost) return state;
    return applyDefenseCommand(state, content, { type: 'Build', padId: action.padId, towerId: action.towerId });
  }
  const towerInstanceId = towerIdAtPad(state, action.padId);
  if (!towerInstanceId) return state;
  if (action.type === 'target') {
    return applyDefenseCommand(state, content, { type: 'SetTargetMode', towerInstanceId, targetMode: action.targetMode });
  }
  const tower = state.towers.find(item => item.id === towerInstanceId)!;
  if (tower.levelId === action.levelId) return state;
  const level = content.towers.find(item => item.id === tower.towerId)!.levels.find(level => level.id === action.levelId);
  if (!level || level.from !== tower.levelId || state.resource < level.cost) return state;
  return applyDefenseCommand(state, content, { type: 'Upgrade', towerInstanceId, levelId: action.levelId });
}

function removedEnemies(before: DefenseRunState, after: DefenseRunState) {
  const remaining = new Set(after.enemies.map(enemy => enemy.id));
  return before.enemies.filter(enemy => !remaining.has(enemy.id));
}

function inferLeakTypes(
  before: DefenseRunState,
  after: DefenseRunState,
  target: Record<string, number>,
): void {
  const lostShield = before.shield - after.shield;
  if (lostShield <= 0) return;

  let unassigned = lostShield;
  const candidates = removedEnemies(before, after)
    .map(enemy => {
      const definition = content.enemies.find(item => item.id === enemy.enemyId)!;
      return { enemy, definition };
    })
    .filter(({ enemy, definition }) => enemy.distance + definition.speed * (content.tickMs / 1000) >= pathLength - 0.000001)
    .sort((a, b) => b.definition.leak - a.definition.leak);

  for (const { enemy, definition } of candidates) {
    if (unassigned < definition.leak) continue;
    target[enemy.enemyId] = (target[enemy.enemyId] ?? 0) + definition.leak;
    unassigned -= definition.leak;
  }
  if (unassigned > 0) target.UNKNOWN = (target.UNKNOWN ?? 0) + unassigned;
}

function runStrategy(plan: StrategyPlan): BalanceReport {
  let state = createDefenseRun(content, plan.support, `balance-${plan.id}`);
  const purchases: PurchaseRecord[] = [];
  const supportUse: { wave: number; tick: number }[] = [];
  const leakDamageByEnemy: Record<string, number> = {};
  const preparedWaves = new Set<number>();
  const usedSupportWaves = new Set<number>();
  const initialPlacement: string[] = [];

  const executePrep = () => {
    if (preparedWaves.has(state.waveId)) return;
    if (state.status !== 'READY' && state.status !== 'INTERMISSION') return;
    preparedWaves.add(state.waveId);
    for (const action of plan.prepByWave[state.waveId] ?? []) {
      const before = state;
      state = applyPlanAction(state, action);
      if (state === before) continue;
      const description = action.type === 'build'
        ? `BUILD ${action.towerId}@${action.padId}`
        : action.type === 'upgrade'
          ? `UPGRADE ${action.padId}->${action.levelId}`
          : `TARGET ${action.padId}->${action.targetMode}`;
      purchases.push({ wave: state.waveId, tick: state.tick, action: description, resourceAfter: state.resource });
      if (state.waveId === 1 && action.type === 'build') initialPlacement.push(description);
    }
  };

  executePrep();
  state = applyDefenseCommand(state, content, { type: 'StartWave' });

  let guard = 0;
  while (state.status !== 'WON' && state.status !== 'LOST') {
    guard += 1;
    if (guard > 100_000) throw new Error(`strategy ${plan.id} exceeded tick guard`);

    if (state.status === 'INTERMISSION') executePrep();

    if (
      state.status === 'RUNNING'
      && plan.supportWaves.includes(state.waveId)
      && !usedSupportWaves.has(state.waveId)
      && state.supportCooldownRemaining === 0
    ) {
      state = applyDefenseCommand(state, content, { type: 'UseSupport' });
      usedSupportWaves.add(state.waveId);
      supportUse.push({ wave: state.waveId, tick: state.tick });
    }

    const before = state;
    state = tickDefense(state, content);
    inferLeakTypes(before, state, leakDamageByEnemy);
  }

  const result = defenseResult(state);
  return {
    id: plan.id,
    support: plan.support,
    won: result.won,
    stars: result.stars,
    shield: result.shield,
    completedWaves: result.completedWaves,
    failureWave: result.won ? null : state.waveId,
    ticks: state.tick,
    wallSeconds1x: Number((state.tick * content.tickMs / 1000).toFixed(1)),
    initialPlacement,
    purchases,
    supportUse,
    leakDamageByEnemy,
    finalBranches: state.towers
      .filter(tower => tower.levelId === 'L3A' || tower.levelId === 'L3B')
      .map(tower => `${tower.towerId}@${tower.padId}:${tower.levelId}`),
  };
}

function runNoResponse(): BalanceReport {
  let state = createDefenseRun(content, 'COORDINATOR', 'balance-no-response');
  state = applyDefenseCommand(state, content, { type: 'StartWave' });
  const leakDamageByEnemy: Record<string, number> = {};
  let guard = 0;
  while (state.status !== 'WON' && state.status !== 'LOST') {
    guard += 1;
    if (guard > 100_000) throw new Error('no-response exceeded tick guard');
    const before = state;
    state = tickDefense(state, content);
    inferLeakTypes(before, state, leakDamageByEnemy);
  }
  const result = defenseResult(state);
  return {
    id: 'NO_RESPONSE',
    support: 'NONE',
    won: result.won,
    stars: result.stars,
    shield: result.shield,
    completedWaves: result.completedWaves,
    failureWave: result.won ? null : state.waveId,
    ticks: state.tick,
    wallSeconds1x: Number((state.tick * content.tickMs / 1000).toFixed(1)),
    initialPlacement: [],
    purchases: [],
    supportUse: [],
    leakDamageByEnemy,
    finalBranches: [],
  };
}

const STRATEGIES: readonly StrategyPlan[] = [
  {
    id: 'BALANCED_CORNERS',
    support: 'COORDINATOR',
    supportWaves: [5, 8, 10],
    prepByWave: {
      1: [
        { type: 'build', padId: 'P2', towerId: 'PULSE' },
        { type: 'build', padId: 'P4', towerId: 'BURST' },
        { type: 'target', padId: 'P4', targetMode: 'FIRST' },
      ],
      2: [{ type: 'upgrade', padId: 'P2', levelId: 'L2' }],
      3: [{ type: 'build', padId: 'P6', towerId: 'CONTROL' }],
      4: [{ type: 'build', padId: 'P8', towerId: 'SENSOR' }],
      5: [
        { type: 'upgrade', padId: 'P4', levelId: 'L2' },
        { type: 'upgrade', padId: 'P6', levelId: 'L2' },
      ],
      6: [
        { type: 'upgrade', padId: 'P8', levelId: 'L2' },
        { type: 'upgrade', padId: 'P2', levelId: 'L3B' },
      ],
      7: [
        { type: 'upgrade', padId: 'P8', levelId: 'L3A' },
        { type: 'upgrade', padId: 'P4', levelId: 'L3A' },
      ],
      8: [{ type: 'upgrade', padId: 'P6', levelId: 'L3B' }],
      9: [
        { type: 'build', padId: 'P5', towerId: 'PULSE' },
        { type: 'upgrade', padId: 'P5', levelId: 'L2' },
      ],
      10: [
        { type: 'upgrade', padId: 'P5', levelId: 'L3B' },
        { type: 'target', padId: 'P2', targetMode: 'STRONG' },
        { type: 'target', padId: 'P5', targetMode: 'STRONG' },
      ],
    },
  },
  {
    id: 'CONTROL_SPLASH',
    support: 'OBSERVER',
    supportWaves: [6, 8, 10],
    prepByWave: {
      1: [
        { type: 'build', padId: 'P2', towerId: 'CONTROL' },
        { type: 'build', padId: 'P4', towerId: 'BURST' },
      ],
      2: [{ type: 'upgrade', padId: 'P2', levelId: 'L2' }],
      3: [{ type: 'build', padId: 'P6', towerId: 'PULSE' }],
      4: [{ type: 'upgrade', padId: 'P4', levelId: 'L2' }],
      5: [
        { type: 'build', padId: 'P8', towerId: 'SENSOR' },
        { type: 'upgrade', padId: 'P6', levelId: 'L2' },
      ],
      6: [{ type: 'upgrade', padId: 'P8', levelId: 'L2' }],
      7: [
        { type: 'upgrade', padId: 'P2', levelId: 'L3A' },
        { type: 'upgrade', padId: 'P4', levelId: 'L3A' },
      ],
      8: [{ type: 'upgrade', padId: 'P8', levelId: 'L3B' }],
      9: [
        { type: 'upgrade', padId: 'P6', levelId: 'L3B' },
        { type: 'target', padId: 'P6', targetMode: 'STRONG' },
      ],
      10: [
        { type: 'build', padId: 'P5', towerId: 'CONTROL' },
        { type: 'upgrade', padId: 'P5', levelId: 'L2' },
        { type: 'upgrade', padId: 'P5', levelId: 'L3B' },
      ],
    },
  },
  {
    id: 'PRECISION_PURE',
    support: 'COORDINATOR',
    supportWaves: [4, 7, 10],
    prepByWave: {
      1: [
        { type: 'build', padId: 'P1', towerId: 'PULSE' },
        { type: 'build', padId: 'P6', towerId: 'PULSE' },
      ],
      2: [{ type: 'upgrade', padId: 'P1', levelId: 'L2' }],
      3: [{ type: 'upgrade', padId: 'P6', levelId: 'L2' }],
      4: [{ type: 'build', padId: 'P4', towerId: 'BURST' }],
      5: [{ type: 'build', padId: 'P8', towerId: 'SENSOR' }],
      6: [
        { type: 'upgrade', padId: 'P8', levelId: 'L2' },
        { type: 'upgrade', padId: 'P1', levelId: 'L3B' },
      ],
      7: [{ type: 'upgrade', padId: 'P4', levelId: 'L2' }],
      8: [
        { type: 'upgrade', padId: 'P8', levelId: 'L3A' },
        { type: 'upgrade', padId: 'P6', levelId: 'L3B' },
      ],
      9: [
        { type: 'upgrade', padId: 'P4', levelId: 'L3B' },
        { type: 'target', padId: 'P1', targetMode: 'STRONG' },
        { type: 'target', padId: 'P6', targetMode: 'STRONG' },
      ],
      10: [
        { type: 'build', padId: 'P5', towerId: 'CONTROL' },
        { type: 'upgrade', padId: 'P5', levelId: 'L2' },
      ],
    },
  },
];

describe('ZERO BREACH step 4 baseline balance', () => {
  it('measures three explicit strategies with the unchanged numeric baseline', () => {
    expect(content.balanceStatus).toBe('STEP4_AUTOMATION_VALIDATED_NO_NUMERIC_TUNING');

    const reports = STRATEGIES.map(runStrategy);
    const staticOpening = runStrategy({
      id: 'STATIC_OPENING',
      support: 'COORDINATOR',
      supportWaves: [],
      prepByWave: {
        1: [
          { type: 'build', padId: 'P1', towerId: 'PULSE' },
          { type: 'build', padId: 'P6', towerId: 'PULSE' },
        ],
      },
    });
    const noResponse = runNoResponse();
    console.log('ZERO_BREACH_BALANCE_BASELINE=' + JSON.stringify({ reports, staticOpening, noResponse }));

    const winners = reports.filter(report => report.won);
    expect(winners.length, JSON.stringify(reports, null, 2)).toBeGreaterThanOrEqual(2);
    expect(staticOpening.won, JSON.stringify(staticOpening, null, 2)).toBe(false);
    expect(noResponse.won).toBe(false);
    expect(noResponse.failureWave).not.toBeNull();

    const winningBranches = new Set(winners.flatMap(report => report.finalBranches.map(branch => branch.split(':').at(-1))));
    expect(winningBranches.has('L3A')).toBe(true);
    expect(winningBranches.has('L3B')).toBe(true);
  });
});
