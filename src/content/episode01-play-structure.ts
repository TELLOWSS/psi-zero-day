import type { Condition, EventDefinition } from '../domain';

const completed = (event_id: string): Condition => ({ kind: 'event_completed', event_id, minimum_count: 1 });

/**
 * Phase B Story Director routing.
 *
 * Episode 01 now has one authored dramatic spine instead of mutually exclusive realism arcs.
 * Choice consequences still differ through flags, relationships and deterministic return events,
 * but every run reaches the same core story beats:
 *
 * signal -> pressure -> stop work -> reinspection -> reporting -> TBM change -> restart
 * -> stop-work culture -> instruction chain -> record -> evening result.
 */
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
 * Event IDs, choice IDs and effect bundles remain intact for save/data compatibility.
 * Only eligibility routing is directed here so the player experiences a coherent single-day arc.
 */
export function structureEpisode01PlayableFlow(events: readonly EventDefinition[]): readonly EventDefinition[] {
  return events.map(event => {
    const directed = DIRECTED_CONDITIONS[event.event_id];
    return directed ? { ...event, conditions: directed } : event;
  });
}
