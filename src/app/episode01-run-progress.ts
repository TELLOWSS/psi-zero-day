import type { GameState } from '../domain';

const DIRECTED_CONTENT_VERSION = 'ep01.director.v5';
const DIRECTED_EPISODE01_EVENT_TOTAL = 26;

function selected(state: GameState, choiceId: string): boolean {
  return state.event_runtime.choice_history.some(item => item.choice_id === choiceId);
}

/**
 * Player-facing Phase B uses the full 26-event directed day.
 * Legacy/headless route content keeps the established branch-aware progress contract.
 */
export function episode01ExpectedRunTotal(state: GameState): number {
  if (state.flags.episode01_completed === true) return state.event_runtime.completion_history.length;

  if (state.run.content_version === DIRECTED_CONTENT_VERSION) {
    const completed = state.event_runtime.completion_history.length;
    return Math.max(DIRECTED_EPISODE01_EVENT_TOTAL, completed + (state.event_runtime.active_instance ? 1 : 0));
  }

  // Legacy core: 01,02,03,05,06,07,08,08a,09,10.
  let total = 10;

  if (selected(state, 'follow_junho')) total += 1;
  else if (selected(state, 'delegate_kang')) total += 3;
  else if (selected(state, 'negotiate_yoon')) {
    total += 2;
    if (state.flags.report_result === 'correction_required' || state.flags.report_result === 'evidence_requested') total += 2;
  } else if (selected(state, 'coordinate_schedule')) {
    total += 2;
    if (state.flags.tbm_gap_action === 'change_control') {
      total += 2;
      if (state.flags.restart_result === 'premature_restart_second_stop' ||
          state.flags.restart_result === 'conditional_instruction_distorted') total += 2;
    }
  }

  const completed = state.event_runtime.completion_history.length;
  return Math.max(total, completed + (state.event_runtime.active_instance ? 1 : 0));
}
