import type { GameState } from '../domain';
import { episode01ExpectedRunTotal } from './episode01-run-progress';

/**
 * Campaign-facing total for the current vertical slice.
 * Episode 01 keeps its standalone run target; once its checkpoint closes, the two-event
 * Episode 02 opening is added without rewriting Episode 01's own progress contract.
 */
export function campaignExpectedRunTotal(state: GameState): number {
  if (state.flags.day02_opening_completed === true) return state.event_runtime.completion_history.length;
  if (state.flags.episode01_completed !== true) return episode01ExpectedRunTotal(state);

  const firstLiftDone = state.event_runtime.finished_instances.some(item => item.event_id === 'e02_01_lift_route_pressure');
  const remaining = firstLiftDone ? 1 : 2;
  return state.event_runtime.completion_history.length + remaining;
}
