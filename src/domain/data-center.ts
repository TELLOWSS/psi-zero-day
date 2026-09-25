import type { EnergyState } from './site-profile';
import type { SiteProcessMapDefinition } from './site-process-map';

export type DataCenterPhase =
  | 'MEP_ROUGH_IN'
  | 'ELECTRICAL_UPS'
  | 'ENERGIZATION'
  | 'INTEGRATED_COMMISSIONING'
  | 'COMPLETE';

export type SystemIsolationState = 'UNDEFINED' | 'PLANNED' | 'VERIFIED';
export type InterlockState = 'UNVERIFIED' | 'VERIFIED';
export type CommissioningState = 'NOT_STARTED' | 'PRECHECK' | 'SINGLE_SYSTEM_TEST' | 'INTEGRATED_TEST' | 'VERIFIED';
export type CrossTradeConcurrency = 'LOW' | 'MEDIUM' | 'HIGH';

export type DataCenterAction =
  | 'CLOSE_MEP_PUNCHLIST'
  | 'VERIFY_ELECTRICAL_BOUNDARY'
  | 'PLAN_SYSTEM_ISOLATION'
  | 'VERIFY_SYSTEM_ISOLATION'
  | 'PRE_ENERGIZATION_CHECK'
  | 'ENTER_ENERGIZED_STATE'
  | 'VERIFY_INTERLOCKS'
  | 'RUN_SINGLE_SYSTEM_TEST'
  | 'RUN_INTEGRATED_TEST'
  | 'VERIFY_COMMISSIONING';

export interface DataCenterRuntimeState {
  readonly scenarioId: string;
  readonly phase: DataCenterPhase;
  readonly energyState: EnergyState;
  readonly isolationState: SystemIsolationState;
  readonly interlockState: InterlockState;
  readonly commissioningState: CommissioningState;
  readonly crossTradeConcurrency: CrossTradeConcurrency;
  readonly completedActions: readonly DataCenterAction[];
  readonly revision: number;
}

export interface DataCenterActionResult {
  readonly state: DataCenterRuntimeState;
  readonly applied: boolean;
  readonly blockedReason: string | null;
}

export interface DataCenterScenarioDefinition {
  readonly id: string;
  readonly profileId: string;
  readonly label: string;
  readonly map: SiteProcessMapDefinition;
}
