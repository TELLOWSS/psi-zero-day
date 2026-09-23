export type DefenseDamageType = 'PHYSICAL' | 'PURE';
export type DefenseTargetMode = 'FIRST' | 'STRONG';
export type DefenseStatus = 'READY' | 'RUNNING' | 'INTERMISSION' | 'WON' | 'LOST';
export type DefenseTowerId = 'PULSE' | 'BURST' | 'CONTROL' | 'SENSOR';
export type DefenseEnemyId = 'NORMAL' | 'SWIFT' | 'ARMORED' | 'SWARM' | 'VEILED' | 'BOSS';
export type DefenseSupportId = 'COORDINATOR' | 'OBSERVER';
export type DefenseLevelId = 'L1' | 'L2' | 'L3A' | 'L3B';

export interface DefensePoint { readonly x: number; readonly y: number }
export interface DefensePad extends DefensePoint { readonly id: string }
export interface DefenseMapDefinition {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly path: readonly (readonly [number, number])[];
  readonly pads: readonly DefensePad[];
}
export interface DefenseTowerLevelDefinition {
  readonly id: DefenseLevelId;
  readonly from: DefenseLevelId | null;
  readonly cost: number;
  readonly damage: number;
  readonly damageType: DefenseDamageType;
  readonly intervalTicks: number;
  readonly range: number;
  readonly splashRadius: number;
  readonly maxTargets: number;
  readonly slowFraction: number;
  readonly slowTicks: number;
  readonly revealRadius: number;
  readonly revealIntervalTicks: number;
  readonly revealTicks: number;
}
export interface DefenseTowerDefinition {
  readonly id: DefenseTowerId;
  readonly levels: readonly DefenseTowerLevelDefinition[];
}
export interface DefenseBossPhaseDefinition {
  readonly triggerHpRatio: number;
  readonly armor: number;
  readonly durationTicks: number;
  readonly maxTriggers: 1;
}
export interface DefenseEnemyDefinition {
  readonly id: DefenseEnemyId;
  readonly hp: number;
  readonly speed: number;
  readonly armor: number;
  readonly reward: number;
  readonly leak: number;
  readonly hidden: boolean;
  readonly boss: boolean;
  readonly phase?: DefenseBossPhaseDefinition;
}
export interface DefenseSupportDefinition {
  readonly id: DefenseSupportId;
  readonly characterBinding: string | null;
  readonly cooldownTicks: number;
  readonly initialCooldownTicks: number;
  readonly freezeMovementTicks: number;
  readonly revealAllTicks: number;
  readonly rangeBonus: number;
  readonly rangeBonusTicks: number;
}
export interface DefenseSpawnGroup {
  readonly enemy: DefenseEnemyId;
  readonly count: number;
  readonly startTick: number;
  readonly intervalTicks: number;
}
export interface DefenseWaveDefinition { readonly id: number; readonly groups: readonly DefenseSpawnGroup[] }
export interface DefenseScenarioDefinition {
  readonly id: string;
  readonly mapId: string;
  readonly rewardVersion: number;
  readonly availableTowers: readonly DefenseTowerId[];
  readonly availableSupports: readonly DefenseSupportId[];
  readonly firstClearCosmetic: string;
  readonly threeStarCosmetic: string | null;
  readonly mainStoryStatRewards: readonly string[];
  readonly supportResetWaveIds: readonly number[];
  readonly eventId: string | null;
  readonly eventContentVersion: string | null;
}
export interface DefenseContent {
  readonly schemaVersion: 1;
  readonly rulesVersion: string;
  readonly contentVersion: string;
  readonly balanceStatus: 'UNTESTED_STARTING_POINT' | string;
  readonly tickMs: 50;
  readonly speeds: readonly (1 | 2)[];
  readonly initialShield: number;
  readonly initialResource: number;
  readonly intermissionTicks: number;
  readonly waveClearReward: number;
  readonly sellRate: number;
  readonly defaultTargetMode: DefenseTargetMode;
  readonly targetModes: readonly DefenseTargetMode[];
  readonly map: DefenseMapDefinition;
  readonly towers: readonly DefenseTowerDefinition[];
  readonly enemies: readonly DefenseEnemyDefinition[];
  readonly supports: readonly DefenseSupportDefinition[];
  readonly waves: readonly DefenseWaveDefinition[];
  readonly scenario: DefenseScenarioDefinition;
}

export interface DefenseSlowEffect {
  readonly sourceId: string;
  readonly fraction: number;
  readonly startTick: number;
  readonly endTick: number;
}
export interface DefenseEnemyState {
  readonly id: string;
  readonly enemyId: DefenseEnemyId;
  readonly hp: number;
  readonly distance: number;
  readonly spawnSequence: number;
  readonly revealUntilTick: number;
  readonly slowEffects: readonly DefenseSlowEffect[];
  readonly bossPhaseTriggered: boolean;
  readonly bossArmorFromTick: number;
  readonly bossArmorUntilTick: number;
}
export interface DefenseTowerState {
  readonly id: string;
  readonly padId: string;
  readonly towerId: DefenseTowerId;
  readonly levelId: DefenseLevelId;
  readonly targetMode: DefenseTargetMode;
  readonly invested: number;
  readonly attackCooldown: number;
  readonly revealCooldown: number;
}
export type DefenseRunMode = 'TRAINING' | 'EVENT';
export type DefenseRunVariant = 'STANDARD' | 'EVENT_MODIFIED';

export interface DefenseRunState {
  readonly runId: string;
  readonly mode: DefenseRunMode;
  readonly variant: DefenseRunVariant;
  readonly scenarioId: string;
  readonly eventId: string | null;
  readonly eventContentVersion: string | null;
  readonly status: DefenseStatus;
  readonly paused: boolean;
  readonly speed: 1 | 2;
  readonly tick: number;
  readonly waveId: number;
  readonly waveTick: number;
  readonly intermissionRemaining: number;
  readonly shield: number;
  readonly resource: number;
  readonly towers: readonly DefenseTowerState[];
  readonly enemies: readonly DefenseEnemyState[];
  readonly spawnedByGroup: readonly number[];
  readonly nextTowerSequence: number;
  readonly nextEnemySequence: number;
  readonly supportId: DefenseSupportId;
  readonly supportCooldownRemaining: number;
  readonly freezeMovementUntilTick: number;
  readonly revealAllUntilTick: number;
  readonly rangeBonusUntilTick: number;
  readonly completedWaves: number;
  readonly leakedByEnemy: Readonly<Partial<Record<DefenseEnemyId, number>>>;
}

export type DefenseCommand =
  | { readonly type: 'Build'; readonly padId: string; readonly towerId: DefenseTowerId }
  | { readonly type: 'Upgrade'; readonly towerInstanceId: string; readonly levelId: DefenseLevelId }
  | { readonly type: 'Sell'; readonly towerInstanceId: string }
  | { readonly type: 'SetTargetMode'; readonly towerInstanceId: string; readonly targetMode: DefenseTargetMode }
  | { readonly type: 'StartWave' }
  | { readonly type: 'UseSupport' }
  | { readonly type: 'SetSpeed'; readonly speed: 1 | 2 }
  | { readonly type: 'SetPaused'; readonly paused: boolean };

export interface DefenseResult {
  readonly won: boolean;
  readonly stars: 0 | 1 | 2 | 3;
  readonly score: number;
  readonly completedWaves: number;
  readonly shield: number;
}
