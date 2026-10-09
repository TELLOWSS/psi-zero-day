import type { PatrolStageId } from './patrol-survivors';

export type BossCombatPhase = 'arrival' | 'pattern' | 'weak_point' | 'burst' | 'recovery' | 'secured';
export interface BossGameplayProgress {
  readonly bossId: string;
  readonly patternId: string;
  readonly weakPointId: string;
  combatPhase: BossCombatPhase;
  phaseIndex: number;
  signatureResolvedThisCycle: boolean;
  patternContact: boolean;
  burstRemaining: number;
  remaining: number;
  cycleCount: number;
  staleRoute?: import('../engine/survivors-boss-stale-route').StaleRouteState;
  gangform?: {
    step: 'pendulum_warning' | 'pendulum' | 'debris_warning' | 'debris' | 'drop_zone';
    remaining: number;
    anchorX: number;
    anchorY: number;
    zones: Array<{x:number;y:number;radius:number;hp:number;maxHp:number}>;
  };
}

export type BossCombatArchetype = 'ACTION' | 'PATTERN' | 'PUZZLE' | 'SURVIVAL' | 'MULTI' | 'FINAL';
export type BossPrimarySkill = 'DODGE' | 'POSITION' | 'READ' | 'TIMING' | 'ROUTE' | 'MASTERY';
export type BossEncounterTier = 'REGULAR' | 'MAJOR' | 'CHAPTER' | 'FINAL';

export interface BossGameplayIntro {
  readonly firstPlaySeconds: number;
  readonly replaySkippableAfterSeconds: number;
  readonly freezeGameplay: true;
}

export interface BossGameplayDefinition {
  readonly stageId: PatrolStageId;
  readonly bossId: string;
  readonly stageNumber: number;
  readonly bossName: string;
  readonly combatArchetype: BossCombatArchetype;
  readonly primarySkill: BossPrimarySkill;
  readonly patternId: string;
  readonly encounterTier: BossEncounterTier;
  readonly intro: BossGameplayIntro;
  readonly phaseCount: number;
  readonly combatLoop: string;
  readonly weakPointId: string;
  readonly burstWindowSeconds: number;
  readonly playerFacingMechanic: string;
  readonly premiumHook: string;
  readonly failureRead: string;
  readonly safetySource: string;
  readonly playerCopyRule: string;
  readonly postClearLearningPoint: string;
}

export interface BossGameplayContent {
  readonly id: string;
  readonly version: string;
  readonly status: string;
  readonly precedence: string;
  readonly perceivedRatio: {
    readonly gameplay: number;
    readonly safetyExplanation: number;
  };
  readonly coreLoop: string;
  readonly globalRules: readonly string[];
  readonly archetypeMix: Readonly<Record<BossCombatArchetype, number>>;
  readonly stages: readonly BossGameplayDefinition[];
}
