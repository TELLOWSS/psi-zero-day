import type { DefenseEnemyId } from './defense';

export type ProjectArchetype = 'APT_NEW_BUILD' | 'APT_REMODEL' | 'DATA_CENTER';
export type ConstructionMethod =
  | 'BOTTOM_UP'
  | 'TOP_DOWN'
  | 'HORIZONTAL_EXTENSION'
  | 'VERTICAL_EXTENSION'
  | 'STRUCTURAL_RECONFIGURATION'
  | 'CONVENTIONAL'
  | 'PHASED'
  | 'MODULAR_PHASED';

export type ProcessPhase =
  | 'EXCAVATION'
  | 'RC_FRAME'
  | 'UNDER_SLAB_EXCAVATION'
  | 'CONCURRENT_ABOVE_BELOW'
  | 'SURVEY_ISOLATION'
  | 'SELECTIVE_DEMOLITION'
  | 'OLD_NEW_CONNECTION'
  | 'MEP_ROUGH_IN'
  | 'ELECTRICAL_UPS'
  | 'COMMISSIONING';

export type AsBuiltConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type EnergyState =
  | 'NOT_INSTALLED'
  | 'INSTALLED'
  | 'TESTING'
  | 'ENERGIZED'
  | 'LOCKED_OUT'
  | 'LIVE_CRITICAL';
export type GroundwaterState = 'NORMAL' | 'RISING' | 'UNCONTROLLED';

export interface SiteProfileDefinition {
  readonly id: string;
  readonly projectArchetype: ProjectArchetype;
  readonly constructionMethod: ConstructionMethod;
  readonly processPhase: ProcessPhase;
  readonly label: string;
  readonly mapFamily: string;
  readonly baseRiskScores: Readonly<Record<DefenseEnemyId, number>>;
}

export interface RiskPriorityContext {
  readonly profileId: string;
  readonly concurrency: number;
  readonly uncertainty: number;
  readonly logisticsCongestion: number;
  readonly timePressure: number;
  readonly asBuiltConfidence: AsBuiltConfidence;
  readonly energyState: EnergyState;
  readonly groundwaterState: GroundwaterState;
  readonly unresolvedSignals?: Readonly<Partial<Record<DefenseEnemyId, number>>>;
}

export interface RiskPriorityResult {
  readonly riskId: DefenseEnemyId;
  readonly score: number;
  readonly rank: number;
  readonly baseScore: number;
  readonly reasons: readonly string[];
}

export interface SiteProfileSelection {
  readonly profileId: string;
  readonly updatedAt: string;
}
