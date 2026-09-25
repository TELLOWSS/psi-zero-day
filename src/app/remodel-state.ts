import { initialRemodelState, remodelScenario } from '../content/remodel';
import type {
  AsBuiltConfidence, ConnectionState, IsolationState, RemodelAction, RemodelPhase,
  RemodelRuntimeState, StructuralOpeningState, TempSupportState,
} from '../domain/remodel';

export const REMODEL_STATE_STORAGE_KEY = 'psi-zero-day.remodel-state.v1';

const PHASES = new Set<RemodelPhase>([
  'SURVEY_ISOLATION','TEMP_SUPPORT','SELECTIVE_DEMOLITION','OLD_NEW_CONNECTION','COMPLETE',
]);
const AS_BUILT = new Set<AsBuiltConfidence>(['LOW','MEDIUM','HIGH']);
const ISOLATION = new Set<IsolationState>(['UNKNOWN','PARTIAL','VERIFIED']);
const SUPPORT = new Set<TempSupportState>(['NOT_INSTALLED','INSTALLED','VERIFIED']);
const OPENING = new Set<StructuralOpeningState>(['CLOSED','PLANNED','OPENED','REINFORCED']);
const CONNECTION = new Set<ConnectionState>(['NOT_STARTED','PREPARED','VERIFIED']);
const ACTIONS = new Set<RemodelAction>([
  'REVIEW_EXISTING_RECORDS','FIELD_VERIFY_EXISTING','VERIFY_ISOLATION','INSTALL_TEMP_SUPPORT',
  'VERIFY_TEMP_SUPPORT','PLAN_SELECTIVE_OPENING','OPEN_SELECTIVE_ZONE','REINFORCE_OPENING',
  'PREPARE_CONNECTION','VERIFY_CONNECTION',
]);

function valid(value: unknown): value is RemodelRuntimeState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Partial<RemodelRuntimeState>;
  return state.scenarioId === remodelScenario.id
    && PHASES.has(state.phase as RemodelPhase)
    && AS_BUILT.has(state.asBuiltConfidence as AsBuiltConfidence)
    && ISOLATION.has(state.isolationState as IsolationState)
    && SUPPORT.has(state.tempSupportState as TempSupportState)
    && OPENING.has(state.structuralOpeningState as StructuralOpeningState)
    && CONNECTION.has(state.connectionState as ConnectionState)
    && Array.isArray(state.completedActions)
    && state.completedActions.every(action => ACTIONS.has(action))
    && typeof state.revision === 'number'
    && Number.isInteger(state.revision)
    && state.revision >= 0;
}

export function readRemodelState(): RemodelRuntimeState {
  if (typeof window === 'undefined') return initialRemodelState();
  try {
    const raw = window.localStorage.getItem(REMODEL_STATE_STORAGE_KEY);
    if (!raw) return initialRemodelState();
    const parsed: unknown = JSON.parse(raw);
    return valid(parsed) ? parsed : initialRemodelState();
  } catch {
    return initialRemodelState();
  }
}

export function writeRemodelState(state: RemodelRuntimeState): boolean {
  if (typeof window === 'undefined' || !valid(state)) return false;
  try {
    window.localStorage.setItem(REMODEL_STATE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function resetRemodelState(): RemodelRuntimeState {
  const state = initialRemodelState();
  writeRemodelState(state);
  return state;
}
