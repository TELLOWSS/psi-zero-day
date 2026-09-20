import type { GameState } from '../domain';

const DIRECTED_EPISODE01_EVENT_TOTAL = 26;

/**
 * Phase B uses the complete authored 26-event day as one dramatic spine.
 * Return/consequence events can be deterministic, but they are still real runtime events
 * and therefore remain part of progress, save and review history.
 */
export function episode01ExpectedRunTotal(state: GameState): number {
  if (state.flags.episode01_completed === true) return state.event_runtime.completion_history.length;
  const completed = state.event_runtime.completion_history.length;
  return Math.max(DIRECTED_EPISODE01_EVENT_TOTAL, completed + (state.event_runtime.active_instance ? 1 : 0));
}
