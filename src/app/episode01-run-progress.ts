import type { GameState } from '../domain';

const DIRECTED_EPISODE01_EVENT_TOTAL = 26;

/**
 * Phase B has one authored 26-event dramatic spine.
 * Deterministic return beats do not require extra player choices, but they remain real
 * completed events so progress and save/review state stay aligned with the runtime.
 */
export function episode01ExpectedRunTotal(state: GameState): number {
  if (state.flags.episode01_completed === true) return state.event_runtime.completion_history.length;
  const completed = state.event_runtime.completion_history.length;
  return Math.max(DIRECTED_EPISODE01_EVENT_TOTAL, completed + (state.event_runtime.active_instance ? 1 : 0));
}
