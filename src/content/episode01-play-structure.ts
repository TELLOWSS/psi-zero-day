import type { Condition, EventDefinition } from '../domain';

const completed = (event_id: string): Condition => ({ kind: 'event_completed', event_id, minimum_count: 1 });
const picked = (choice_id: string): Condition => ({ kind: 'choice_selected', event_id: 'e01_03_plan_breaks', choice_id, minimum_count: 1 });
const flag = (flag_id: string, equals: string): Condition => ({ kind: 'flag', flag_id, equals });
const all = (...conditions: Condition[]): Condition => ({ kind: 'all', conditions });
const any = (...conditions: Condition[]): Condition => ({ kind: 'any', conditions });

const ROUTED_CONDITIONS: Readonly<Record<string, readonly Condition[]>> = {
  // Short common consequence: every run sees how the earlier worker interaction returns.
  e01_08a_reporting_return: [completed('e01_08_reactions')],

  // Delegating the cleanup makes the later field inspection the main realism arc.
  e01_08b_inspection_find: [completed('e01_08a_reporting_return'), picked('delegate_kang')],
  e01_08c_site_pushback: [completed('e01_08b_inspection_find')],
  e01_08d_reinspection: [completed('e01_08c_site_pushback')],

  // Negotiating the rebar sequence opens the conflicting-account/reporting arc.
  e01_08e_responsibility_clash: [completed('e01_08a_reporting_return'), picked('negotiate_yoon')],
  e01_08f_report_return: [completed('e01_08e_responsibility_clash')],
  // Record pressure appears only after a weak/contested report, not after every report.
  e01_08o_record_pressure: [
    completed('e01_08f_report_return'),
    any(flag('report_result', 'correction_required'), flag('report_result', 'evidence_requested')),
  ],
  e01_08p_record_return: [completed('e01_08o_record_pressure')],

  // Schedule-first play opens changed-work control. Deeper aftershocks only appear when earned by the restart choice.
  e01_08g_tbm_field_gap: [completed('e01_08a_reporting_return'), picked('coordinate_schedule')],
  e01_08h_tbm_return: [completed('e01_08g_tbm_field_gap')],
  e01_08i_restart_pressure: [completed('e01_08h_tbm_return'), flag('tbm_gap_action', 'change_control')],
  e01_08j_restart_return: [completed('e01_08i_restart_pressure')],
  e01_08k_stopwork_aftershock: [completed('e01_08j_restart_return'), flag('restart_result', 'premature_restart_second_stop')],
  e01_08l_stopwork_return: [completed('e01_08k_stopwork_aftershock')],
  e01_08m_instruction_cascade: [completed('e01_08j_restart_return'), flag('restart_result', 'conditional_instruction_distorted')],
  e01_08n_instruction_return: [completed('e01_08m_instruction_cascade')],
};

const EVENING_READY: Condition = any(
  all(picked('follow_junho'), completed('e01_08a_reporting_return')),
  all(picked('delegate_kang'), completed('e01_08d_reinspection')),
  all(picked('negotiate_yoon'), any(
    all(completed('e01_08f_report_return'), flag('report_result', 'timeline_confirmed')),
    completed('e01_08p_record_return'),
  )),
  all(picked('coordinate_schedule'), any(
    all(completed('e01_08h_tbm_return'), any(flag('tbm_gap_action', 'form_first'), flag('tbm_gap_action', 'worker_blame'))),
    all(completed('e01_08j_restart_return'), flag('restart_result', 'controlled_restart')),
    completed('e01_08l_stopwork_return'),
    completed('e01_08n_instruction_return'),
  )),
);

/**
 * TASK-009A presentation/content routing only.
 * The complete 26-event library remains in the registry, but a single run sees only the branch earned by its choices.
 */
export function structureEpisode01PlayableFlow(events: readonly EventDefinition[]): readonly EventDefinition[] {
  return events.map(event => {
    const routed = ROUTED_CONDITIONS[event.event_id];
    if (routed) return { ...event, conditions: routed };
    if (event.event_id === 'e01_09_evening') return { ...event, conditions: [EVENING_READY] };
    return event;
  });
}
