import type { Condition, EventDefinition } from '../domain';

const completed = (event_id: string): Condition => ({ kind: 'event_completed', event_id, minimum_count: 1 });

/**
 * Phase B Story Director routing.
 *
 * Episode 01 now follows one authored dramatic spine instead of hiding major realism arcs
 * behind the first planning choice. Player decisions still change flags, relationships,
 * PSI observations and deterministic return beats, but every playthrough reaches the same
 * core story:
 *
 * first signal -> coordination pressure -> stop-work -> reinspection -> reporting
 * -> changed-work TBM -> restart -> social aftermath -> instruction trace -> record -> sunset.
 *
 * Event IDs and choice IDs stay intact for save/data compatibility.
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

export function structureEpisode01PlayableFlow(events: readonly EventDefinition[]): readonly EventDefinition[] {
  return events.map(event => {
    const directed = DIRECTED_CONDITIONS[event.event_id];
    return directed ? { ...event, conditions: directed } : event;
  });
}
