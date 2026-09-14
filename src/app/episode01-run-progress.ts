import type { GameState } from '../domain';

function selected(state: GameState, choiceId: string): boolean {
  return state.event_runtime.choice_history.some(item => item.choice_id === choiceId);
}

/**
 * Run-facing progress target, not a content-library count.
 * The registry keeps every authored event for replay, while one playthrough only counts the branch it can actually reach.
 */
export function episode01ExpectedRunTotal(state: GameState): number {
  if (state.flags.episode01_completed === true) return state.event_runtime.completion_history.length;

  // Core: 01,02,03,05,06,07,08,08a,09,10.
  let total = 10;

  if (selected(state, 'follow_junho')) total += 1; // e01_04
  else if (selected(state, 'delegate_kang')) total += 3; // inspection/find -> pushback -> reinspection
  else if (selected(state, 'negotiate_yoon')) {
    total += 2; // responsibility clash -> report return
    if (state.flags.report_result === 'correction_required' || state.flags.report_result === 'evidence_requested') total += 2;
  } else if (selected(state, 'coordinate_schedule')) {
    total += 2; // TBM field gap -> return
    if (state.flags.tbm_gap_action === 'change_control') {
      total += 2; // restart pressure -> return
      if (state.flags.restart_result === 'premature_restart_second_stop' ||
          state.flags.restart_result === 'conditional_instruction_distorted') total += 2;
    }
  }

  const completed = state.event_runtime.completion_history.length;
  return Math.max(total, completed + (state.event_runtime.active_instance ? 1 : 0));
}
