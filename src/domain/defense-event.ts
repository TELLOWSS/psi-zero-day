import type { DefenseEnemyId, DefenseSpawnGroup } from './defense';

export type DefenseStoryFactId = 'ep01.ramp-signal-known';

export type DefenseUnlockCondition =
  | { readonly kind: 'scenario-cleared'; readonly scenarioId: string }
  | { readonly kind: 'story-fact'; readonly factId: DefenseStoryFactId };

export type DefenseEventModifier =
  | { readonly kind: 'replace-wave'; readonly waveId: number; readonly groups: readonly DefenseSpawnGroup[] }
  | { readonly kind: 'enemy-hp'; readonly enemyIds: readonly DefenseEnemyId[]; readonly multiplier: number }
  | { readonly kind: 'enemy-speed'; readonly enemyIds: readonly DefenseEnemyId[]; readonly multiplier: number }
  | { readonly kind: 'initial-resource'; readonly value: number }
  | { readonly kind: 'wave-support-reset'; readonly waveIds: readonly number[] };

export interface DefenseEventDefinition {
  readonly id: string;
  readonly contentVersion: string;
  readonly titleTextId: string;
  readonly briefingTextId: string;
  readonly mapId: string;
  readonly baseScenarioId: string;
  readonly unlock: { readonly all: readonly DefenseUnlockCondition[] };
  readonly modifiers: readonly DefenseEventModifier[];
  readonly rewardVersion: number;
  readonly firstClearCosmeticId: string;
  readonly debriefTextIds: {
    readonly win: string;
    readonly lose: string;
    readonly perfect: string;
  };
}

export interface DefenseUnlockContext {
  readonly clearedScenarioIds: ReadonlySet<string>;
  readonly storyFacts: ReadonlySet<DefenseStoryFactId>;
}

export interface DefenseEventAvailability {
  readonly event: DefenseEventDefinition;
  readonly unlocked: boolean;
  readonly missing: readonly DefenseUnlockCondition[];
}
