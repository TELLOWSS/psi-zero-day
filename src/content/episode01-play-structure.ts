import type { Condition, EventDefinition } from '../domain';

const completed = (event_id: string): Condition => ({ kind: 'event_completed', event_id, minimum_count: 1 });
const picked = (choice_id: string): Condition => ({ kind: 'choice_selected', event_id: 'e01_03_plan_breaks', choice_id, minimum_count: 1 });
const flag = (flag_id: string, equals: string): Condition => ({ kind: 'flag', flag_id, equals });
const all = (...conditions: Condition[]): Condition => ({ kind: 'all', conditions });
const any = (...conditions: Condition[]): Condition => ({ kind: 'any', conditions });

export type Episode01PlayStructureMode = 'legacy' | 'directed';

const LEGACY_ROUTED_CONDITIONS: Readonly<Record<string, readonly Condition[]>> = {
  e01_08a_reporting_return: [completed('e01_08_reactions')],

  e01_08b_inspection_find: [completed('e01_08a_reporting_return'), picked('delegate_kang')],
  e01_08c_site_pushback: [completed('e01_08b_inspection_find')],
  e01_08d_reinspection: [completed('e01_08c_site_pushback')],

  e01_08e_responsibility_clash: [completed('e01_08a_reporting_return'), picked('negotiate_yoon')],
  e01_08f_report_return: [completed('e01_08e_responsibility_clash')],
  e01_08o_record_pressure: [
    completed('e01_08f_report_return'),
    any(flag('report_result', 'correction_required'), flag('report_result', 'evidence_requested')),
  ],
  e01_08p_record_return: [completed('e01_08o_record_pressure')],

  e01_08g_tbm_field_gap: [completed('e01_08a_reporting_return'), picked('coordinate_schedule')],
  e01_08h_tbm_return: [completed('e01_08g_tbm_field_gap')],
  e01_08i_restart_pressure: [completed('e01_08h_tbm_return'), flag('tbm_gap_action', 'change_control')],
  e01_08j_restart_return: [completed('e01_08i_restart_pressure')],
  e01_08k_stopwork_aftershock: [completed('e01_08j_restart_return'), flag('restart_result', 'premature_restart_second_stop')],
  e01_08l_stopwork_return: [completed('e01_08k_stopwork_aftershock')],
  e01_08m_instruction_cascade: [completed('e01_08j_restart_return'), flag('restart_result', 'conditional_instruction_distorted')],
  e01_08n_instruction_return: [completed('e01_08m_instruction_cascade')],
};

const LEGACY_EVENING_READY: Condition = any(
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

const DIRECTED_CONDITIONS: Readonly<Record<string, readonly Condition[]>> = {
  e01_04_junho_signal: [completed('e01_03_plan_breaks')],
  e01_05_command: [completed('e01_04_junho_signal')],

  e01_08a_reporting_return: [completed('e01_08_reactions')],
  e01_08b_inspection_find: [completed('e01_08a_reporting_return')],
  e01_08c_site_pushback: [completed('e01_08b_inspection_find')],
  e01_08d_reinspection: [completed('e01_08c_site_pushback')],

  e01_08e_responsibility_clash: [completed('e01_08d_reinspection')],
  e01_08f_report_return: [completed('e01_08e_responsibility_clash')],

  e01_08g_tbm_field_gap: [completed('e01_08f_report_return')],
  e01_08h_tbm_return: [completed('e01_08g_tbm_field_gap')],

  e01_08i_restart_pressure: [completed('e01_08h_tbm_return')],
  e01_08j_restart_return: [completed('e01_08i_restart_pressure')],

  e01_08k_stopwork_aftershock: [completed('e01_08j_restart_return')],
  e01_08l_stopwork_return: [completed('e01_08k_stopwork_aftershock')],

  e01_08m_instruction_cascade: [completed('e01_08l_stopwork_return')],
  e01_08n_instruction_return: [completed('e01_08m_instruction_cascade')],

  e01_08o_record_pressure: [completed('e01_08n_instruction_return')],
  e01_08p_record_return: [completed('e01_08o_record_pressure')],

  e01_09_evening: [completed('e01_08p_record_return')],
};

/**
 * Legacy mode keeps the replay/branch contract used by the headless content tests.
 * Directed mode is the player-facing Phase B campaign spine used by EpisodeSession.
 * Engine/event/choice IDs are shared so no duplicate game engine is introduced.
 */
export function structureEpisode01PlayableFlow(
  events: readonly EventDefinition[],
  mode: Episode01PlayStructureMode = 'legacy',
): readonly EventDefinition[] {
  if (mode === 'directed') {
    return events.map(event => {
      const directed = DIRECTED_CONDITIONS[event.event_id];
      return directed ? { ...event, conditions: directed } : event;
    });
  }

  return events.map(event => {
    const routed = LEGACY_ROUTED_CONDITIONS[event.event_id];
    if (routed) return { ...event, conditions: routed };
    if (event.event_id === 'e01_09_evening') return { ...event, conditions: [LEGACY_EVENING_READY] };
    return event;
  });
}
