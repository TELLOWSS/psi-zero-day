import { CORE_STAGES, CONSTRUCTION_STAGES } from '../domain';
import type { CoreStage, GameState, StageId } from '../domain';
import { add, finite, own } from './data';

export type ProgressBounds = Readonly<Partial<Record<CoreStage, { readonly min: number; readonly max: number }>>>;

export function canonicalStage(stage: StageId): CoreStage {
  const index = CONSTRUCTION_STAGES.indexOf(stage as (typeof CONSTRUCTION_STAGES)[number]);
  if (index >= 0) return CORE_STAGES[index]!;
  if (CORE_STAGES.includes(stage as CoreStage)) return stage as CoreStage;
  throw new Error(`Unknown construction stage: ${stage}`);
}
export function progressKey(state: GameState['construction'], stage: StageId): StageId | undefined {
  const keys = (Object.keys(state.progress_by_stage) as StageId[]).filter(k => canonicalStage(k) === canonicalStage(stage));
  if (keys.length > 1) throw new Error('Duplicate canonical/legacy progress keys');
  return keys[0];
}
export function getProgress(state: GameState['construction'], stage: StageId): number | undefined {
  const key = progressKey(state, stage);
  return key === undefined ? undefined : own(state.progress_by_stage, key);
}
export function checkedProgress(value: number, stage: StageId, bounds: ProgressBounds): number {
  const limit = own(bounds, canonicalStage(stage));
  if (!limit || finite(limit.min) > finite(limit.max)) throw new Error('Explicit progress bounds required');
  finite(value);
  if (value < limit.min || value > limit.max) throw new Error('Construction progress outside supplied bounds');
  return value;
}
export function changeProgress(state: GameState['construction'], stage: StageId, delta: number, bounds: ProgressBounds): GameState['construction'] {
  const key = progressKey(state, stage);
  if (!key) throw new Error('Missing initial construction progress');
  const value = checkedProgress(add(state.progress_by_stage[key], delta), stage, bounds);
  return { ...state, progress_by_stage: { ...state.progress_by_stage, [key]: value } };
}
