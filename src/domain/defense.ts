export type DefenseRunPhase = 'READY' | 'RUNNING' | 'INTERMISSION' | 'WON' | 'LOST';
export type DefenseTargetMode = 'FIRST' | 'STRONG';
export type DefenseDamageType = 'PHYSICAL' | 'PURE';

export interface DefensePoint { readonly x: number; readonly y: number; }
export interface DefensePad extends DefensePoint { readonly id: string; }

export interface DefenseTowerLevel {
  readonly id: string;
  readonly from: string | null;
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
  readonly id: string;
  readonly nameTextId: string;
  readonly roleTextId: string;
  readonly levels: readonly DefenseTowerLevel[];
}
export interface DefenseEnemyDefinition {
  readonly id: string;
  readonly nameTextId: string;
  readonly hp: number;
  readonly speed: number;
  readonly armor: number;
  readonly reward: number;
  readonly leak: number;
  readonly hidden: boolean;
  readonly boss: boolean;
  readonly phase?: {
    readonly triggerHpRatio: number;
    readonly armor: number;
    readonly durationTicks: number;
    readonly maxTriggers: number;
  };
}
export interface DefenseSupportDefinition {
  readonly id: string;
  readonly characterBinding: string | null;
  readonly skillTextId: string;
  readonly cooldownTicks: number;
  readonly initialCooldownTicks: number;
  readonly freezeMovementTicks: number;
  readonly revealAllTicks: number;
  readonly rangeBonus: number;
  readonly rangeBonusTicks: number;
}
export interface DefenseSpawnGroup {
  readonly enemy: string;
  readonly count: number;
  readonly startTick: number;
  readonly intervalTicks: number;
}
export interface DefenseWaveDefinition {
  readonly id: number;
  readonly groups: readonly DefenseSpawnGroup[];
}
export interface DefenseContent {
  readonly schemaVersion: 1;
  readonly rulesVersion: string;
  readonly contentVersion: string;
  readonly balanceStatus: string;
  readonly tickMs: number;
  readonly speeds: readonly number[];
  readonly initialShield: number;
  readonly initialResource: number;
  readonly intermissionTicks: number;
  readonly waveClearReward: number;
  readonly sellRate: number;
  readonly defaultTargetMode: DefenseTargetMode;
  readonly targetModes: readonly DefenseTargetMode[];
  readonly map: {
    readonly id: string;
    readonly nameTextId: string;
    readonly width: number;
    readonly height: number;
    readonly path: readonly (readonly [number, number])[];
    readonly pads: readonly DefensePad[];
  };
  readonly towers: readonly DefenseTowerDefinition[];
  readonly enemies: readonly DefenseEnemyDefinition[];
  readonly supports: readonly DefenseSupportDefinition[];
  readonly waves: readonly DefenseWaveDefinition[];
  readonly scenario: {
    readonly id: string;
    readonly mapId: string;
    readonly rewardVersion: number;
    readonly availableTowers: readonly string[];
    readonly availableSupports: readonly string[];
    readonly firstClearCosmetic: string;
    readonly threeStarCosmetic: string;
    readonly mainStoryStatRewards: readonly string[];
  };
}

export interface DefenseSlowEffect {
  readonly sourceId: string;
  readonly fraction: number;
  readonly endTick: number;
}
export interface DefenseEnemyState {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly spawnSequence: number;
  readonly hp: number;
  readonly progress: number;
  readonly slowEffects: readonly DefenseSlowEffect[];
  readonly revealedUntilTick: number;
  readonly leaked: boolean;
  readonly bossPhaseTriggers: number;
  readonly bossArmorStartTick: number | null;
  readonly bossArmorEndTick: number | null;
}
export interface DefenseTowerState {
  readonly instanceId: string;
  readonly installationSequence: number;
  readonly padId: string;
  readonly towerId: string;
  readonly levelId: string;
  readonly invested: number;
  readonly targetMode: DefenseTargetMode;
  readonly cooldownRemainingTicks: number;
  readonly revealCooldownRemainingTicks: number;
}
export interface DefenseRunState {
  readonly rulesVersion: string;
  readonly contentVersion: string;
  readonly phase: DefenseRunPhase;
  readonly paused: boolean;
  readonly speed: 1 | 2;
  readonly globalTick: number;
  readonly waveIndex: number;
  readonly waveTick: number;
  readonly intermissionRemainingTicks: number;
  readonly resource: number;
  readonly shield: number;
  readonly completedWaves: number;
  readonly score: number;
  readonly enemies: readonly DefenseEnemyState[];
  readonly towers: readonly DefenseTowerState[];
  readonly spawnSequence: number;
  readonly towerSequence: number;
  readonly selectedSupportId: string | null;
  readonly supportCooldownRemainingTicks: number;
  readonly freezeMovementUntilTick: number;
  readonly revealAllUntilTick: number;
  readonly rangeBonusUntilTick: number;
}

export type DefenseCommand =
  | { readonly type: 'Build'; readonly padId: string; readonly towerId: string }
  | { readonly type: 'Upgrade'; readonly towerInstanceId: string; readonly levelId: string }
  | { readonly type: 'Sell'; readonly towerInstanceId: string }
  | { readonly type: 'SetTargetMode'; readonly towerInstanceId: string; readonly mode: DefenseTargetMode }
  | { readonly type: 'StartWave' }
  | { readonly type: 'UseSupport' }
  | { readonly type: 'SetSpeed'; readonly speed: 1 | 2 }
  | { readonly type: 'SetPaused'; readonly paused: boolean }
  | { readonly type: 'SelectSupport'; readonly supportId: string };

export type DefenseCommandResult =
  | { readonly ok: true; readonly state: DefenseRunState }
  | { readonly ok: false; readonly state: DefenseRunState; readonly reason: string };
