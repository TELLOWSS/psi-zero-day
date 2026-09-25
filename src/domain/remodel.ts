import type { DefenseEnemyId } from './defense';
import type { SiteProcessMapDefinition } from './site-process-map';

export type RemodelPhase =
  | 'SURVEY_ISOLATION'
  | 'TEMP_SUPPORT'
  | 'SELECTIVE_DEMOLITION'
  | 'OLD_NEW_CONNECTION'
  | 'COMPLETE';

export type AsBuiltConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type IsolationState = 'UNKNOWN' | 'PARTIAL' | 'VERIFIED';
export type TempSupportState = 'NOT_INSTALLED' | 'INSTALLED' | 'VERIFIED';
export type StructuralOpeningState = 'CLOSED' | 'PLANNED' | 'OPENED' | 'REINFORCED';
export type ConnectionState = 'NOT_STARTED' | 'PREPARED' | 'VERIFIED';

export type RemodelAction =
  | 'REVIEW_EXISTING_RECORDS'
  | 'FIELD_VERIFY_EXISTING'
  | 'VERIFY_ISOLATION'
  | 'INSTALL_TEMP_SUPPORT'
  | 'VERIFY_TEMP_SUPPORT'
  | 'PLAN_SELECTIVE_OPENING'
  | 'OPEN_SELECTIVE_ZONE'
  | 'REINFORCE_OPENING'
  | 'PREPARE_CONNECTION'
  | 'VERIFY_CONNECTION';

export interface RemodelRuntimeState {
  readonly scenarioId: string;
  readonly phase: RemodelPhase;
  readonly asBuiltConfidence: AsBuiltConfidence;
  readonly isolationState: IsolationState;
  readonly tempSupportState: TempSupportState;
  readonly structuralOpeningState: StructuralOpeningState;
  readonly connectionState: ConnectionState;
  readonly completedActions: readonly RemodelAction[];
  readonly revision: number;
}

export interface RemodelActionResult {
  readonly state: RemodelRuntimeState;
  readonly applied: boolean;
  readonly blockedReason: string | null;
}

export interface RemodelScenarioDefinition {
  readonly id: string;
  readonly profileId: string;
  readonly label: string;
  readonly legalScaleNote: string;
  readonly map: SiteProcessMapDefinition;
  readonly riskHints: Readonly<Partial<Record<DefenseEnemyId, number>>>;
}
