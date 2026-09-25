import { dataCenterScenario, initialDataCenterState } from '../content/data-center';
import type {
  CommissioningState, CrossTradeConcurrency, DataCenterAction, DataCenterPhase,
  DataCenterRuntimeState, InterlockState, SystemIsolationState,
} from '../domain/data-center';
import type { EnergyState } from '../domain/site-profile';

export const DATA_CENTER_STATE_STORAGE_KEY = 'psi-zero-day.data-center-state.v1';

const PHASES = new Set<DataCenterPhase>([
  'MEP_ROUGH_IN','ELECTRICAL_UPS','ENERGIZATION','INTEGRATED_COMMISSIONING','COMPLETE',
]);
const ENERGY = new Set<EnergyState>([
  'NOT_INSTALLED','INSTALLED','TESTING','ENERGIZED','LOCKED_OUT','LIVE_CRITICAL',
]);
const ISOLATION = new Set<SystemIsolationState>(['UNDEFINED','PLANNED','VERIFIED']);
const INTERLOCK = new Set<InterlockState>(['UNVERIFIED','VERIFIED']);
const COMMISSIONING = new Set<CommissioningState>([
  'NOT_STARTED','PRECHECK','SINGLE_SYSTEM_TEST','INTEGRATED_TEST','VERIFIED',
]);
const CONCURRENCY = new Set<CrossTradeConcurrency>(['LOW','MEDIUM','HIGH']);
const ACTIONS = new Set<DataCenterAction>([
  'CLOSE_MEP_PUNCHLIST','VERIFY_ELECTRICAL_BOUNDARY','PLAN_SYSTEM_ISOLATION','VERIFY_SYSTEM_ISOLATION',
  'PRE_ENERGIZATION_CHECK','ENTER_ENERGIZED_STATE','VERIFY_INTERLOCKS','RUN_SINGLE_SYSTEM_TEST',
  'RUN_INTEGRATED_TEST','VERIFY_COMMISSIONING',
]);

function valid(value: unknown): value is DataCenterRuntimeState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Partial<DataCenterRuntimeState>;
  return state.scenarioId === dataCenterScenario.id
    && PHASES.has(state.phase as DataCenterPhase)
    && ENERGY.has(state.energyState as EnergyState)
    && ISOLATION.has(state.isolationState as SystemIsolationState)
    && INTERLOCK.has(state.interlockState as InterlockState)
    && COMMISSIONING.has(state.commissioningState as CommissioningState)
    && CONCURRENCY.has(state.crossTradeConcurrency as CrossTradeConcurrency)
    && Array.isArray(state.completedActions)
    && state.completedActions.every(action => ACTIONS.has(action))
    && typeof state.revision === 'number'
    && Number.isInteger(state.revision)
    && state.revision >= 0;
}

export function readDataCenterState(): DataCenterRuntimeState {
  if (typeof window === 'undefined') return initialDataCenterState();
  try {
    const raw = window.localStorage.getItem(DATA_CENTER_STATE_STORAGE_KEY);
    if (!raw) return initialDataCenterState();
    const parsed: unknown = JSON.parse(raw);
    return valid(parsed) ? parsed : initialDataCenterState();
  } catch {
    return initialDataCenterState();
  }
}

export function writeDataCenterState(state: DataCenterRuntimeState): boolean {
  if (typeof window === 'undefined' || !valid(state)) return false;
  try {
    window.localStorage.setItem(DATA_CENTER_STATE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function resetDataCenterState(): DataCenterRuntimeState {
  const state = initialDataCenterState();
  writeDataCenterState(state);
  return state;
}
