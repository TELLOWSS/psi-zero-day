import type { DefenseEnemyId } from './defense';

export type ProjectArchetype =
  | 'APT_NEW_BUILD'
  | 'APT_REMODEL'
  | 'DATA_CENTER';

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
  | 'FOUNDATION_BASEMENT'
  | 'RC_FRAME'
  | 'ENVELOPE_MEP_FINISH'
  | 'TOP_SLAB'
  | 'UNDER_SLAB_EXCAVATION'
  | 'CONCURRENT_ABOVE_BELOW'
  | 'SURVEY_ISOLATION'
  | 'SELECTIVE_DEMOLITION'
  | 'STRUCTURAL_REINFORCEMENT'
  | 'EXTENSION_CONNECTION'
  | 'MEP_REROUTE_FINISH'
  | 'CIVIL_STRUCTURE'
  | 'MEP_ROUGH_IN'
  | 'ELECTRICAL_UPS_BATTERY'
  | 'COOLING_PLANT'
  | 'WHITE_SPACE'
  | 'COMMISSIONING_ENERGIZATION';

export type VerticalLayer =
  | 'SURFACE'
  | 'B1'
  | 'B2'
  | 'TYPICAL_FLOOR'
  | 'ROOF_PLANT'
  | 'SYSTEM_VIEW';

export type EnergyState =
  | 'NOT_INSTALLED'
  | 'INSTALLED'
  | 'TESTING'
  | 'ENERGIZED'
  | 'LOCKED_OUT'
  | 'LIVE_CRITICAL';

export interface SiteProfileDefinition {
  readonly id: string;
  readonly projectArchetype: ProjectArchetype;
  readonly constructionMethod: ConstructionMethod;
  readonly processPhase: ProcessPhase;
  readonly labelTextId: string;
  readonly methodTextId: string;
  readonly phaseTextId: string;
  /**
   * Game-design prior only. This is not a statutory risk-assessment score
   * or accident-frequency statistic.
   */
  readonly baseRiskModifiers: Readonly<Record<DefenseEnemyId, number>>;
  readonly defaults: {
    readonly verticalLayer: VerticalLayer;
    readonly uncertainty: number;
    readonly concurrency: number;
    readonly logisticsCongestion: number;
    readonly timePressure: number;
    readonly asBuiltConfidence: number;
    readonly energyState: EnergyState;
  };
}

export interface RiskPriorityContext {
  readonly projectArchetype: ProjectArchetype;
  readonly constructionMethod: ConstructionMethod;
  readonly processPhase: ProcessPhase;
  readonly verticalLayer: VerticalLayer;
  readonly uncertainty: number;
  readonly concurrency: number;
  readonly logisticsCongestion: number;
  readonly timePressure: number;
  readonly asBuiltConfidence: number;
  readonly energyState: EnergyState;
  readonly currentSignals: Readonly<Partial<Record<DefenseEnemyId, number>>>;
  readonly unresolvedHistory: Readonly<Partial<Record<DefenseEnemyId, number>>>;
}

export interface RiskPriorityEntry {
  readonly riskId: DefenseEnemyId;
  readonly score: number;
  readonly rank: number;
  readonly drivers: readonly string[];
}

export interface RiskPriorityResult {
  readonly profileId: string;
  readonly context: RiskPriorityContext;
  readonly entries: readonly RiskPriorityEntry[];
  readonly top3: readonly RiskPriorityEntry[];
}

export const PROJECT_METHODS: Readonly<Record<ProjectArchetype, readonly ConstructionMethod[]>> = {
  APT_NEW_BUILD: ['BOTTOM_UP', 'TOP_DOWN'],
  APT_REMODEL: ['HORIZONTAL_EXTENSION', 'VERTICAL_EXTENSION', 'STRUCTURAL_RECONFIGURATION'],
  DATA_CENTER: ['CONVENTIONAL', 'PHASED', 'MODULAR_PHASED'],
};

export function constructionMethodMatchesProject(
  projectArchetype: ProjectArchetype,
  constructionMethod: ConstructionMethod,
): boolean {
  return PROJECT_METHODS[projectArchetype].includes(constructionMethod);
}
