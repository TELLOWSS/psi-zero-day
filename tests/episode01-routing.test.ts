import { describe, expect, it } from 'vitest';
import { episode01ExpectedRunTotal } from '../src/app/episode01-run-progress';
import { playEpisode } from './helpers/episode01-playthrough';

const base = {
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  evening: 'rest' as const,
};

const CORE_DIRECTED_ARCS = [
  'e01_04_junho_signal',
  'e01_08b_inspection_find',
  'e01_08c_site_pushback',
  'e01_08d_reinspection',
  'e01_08e_responsibility_clash',
  'e01_08f_report_return',
  'e01_08g_tbm_field_gap',
  'e01_08h_tbm_return',
  'e01_08i_restart_pressure',
  'e01_08j_restart_return',
  'e01_08k_stopwork_aftershock',
  'e01_08l_stopwork_return',
  'e01_08m_instruction_cascade',
  'e01_08n_instruction_return',
  'e01_08o_record_pressure',
  'e01_08p_record_return',
] as const;

function completedIds(state: ReturnType<typeof playEpisode>['state']) {
  return state.event_runtime.completion_history.map(item => item.event_id);
}

describe('Episode 01 directed play structure', () => {
  it('keeps every core realism arc in one coherent 26-event day', () => {
    const { state } = playEpisode({ ...base, plan: 'follow_junho', signal: 'listen_more' });
    const ids = completedIds(state);
    expect(ids).toHaveLength(26);
    for (const id of CORE_DIRECTED_ARCS) expect(ids).toContain(id);
    expect(episode01ExpectedRunTotal(state)).toBe(26);
  });

  it('does not hide the stop-work and reporting story behind the first planning choice', () => {
    for (const plan of ['delegate_kang', 'negotiate_yoon', 'coordinate_schedule', 'follow_junho'] as const) {
      const { state } = playEpisode({ ...base, plan });
      const ids = completedIds(state);
      expect(ids).toHaveLength(26);
      expect(ids).toContain('e01_08b_inspection_find');
      expect(ids).toContain('e01_08e_responsibility_clash');
      expect(ids).toContain('e01_08g_tbm_field_gap');
      expect(ids).toContain('e01_08k_stopwork_aftershock');
      expect(ids).toContain('e01_08o_record_pressure');
    }
  });

  it('preserves consequences inside the common spine instead of deleting branches', () => {
    const { state } = playEpisode({
      ...base,
      plan: 'coordinate_schedule',
      tbm: 'tbm_change_control',
      restart: 'restart_follow_verbal',
      stopwork: 'stopwork_protect_process',
      instruction: 'instruction_reconstruct_chain',
      record: 'record_preserve_timeline',
    });

    expect(state.flags).toMatchObject({
      tbm_gap_action: 'change_control',
      restart_result: 'premature_restart_second_stop',
      stopwork_culture_result: 'reporting_route_preserved',
      instruction_chain_result: 'conditional_phrase_restored',
      record_result: 'timeline_preserved',
      episode01_completed: true,
    });
  });

  it('keeps alternative decisions meaningful while preserving the same dramatic spine', () => {
    const { state } = playEpisode({
      ...base,
      plan: 'delegate_kang',
      inspection: 'inspection_full_stop',
      responsibility: 'report_one_sided',
      tbm: 'tbm_form_first',
      restart: 'restart_trace_instruction',
      stopwork: 'stopwork_public_boundary',
      instruction: 'instruction_accept_top',
      record: 'record_minimize_scope',
    });

    expect(state.event_runtime.completion_history).toHaveLength(26);
    expect(state.flags).toMatchObject({
      inspection_action: 'full_stop',
      report_basis: 'one_sided',
      tbm_gap_action: 'form_first',
      restart_action: 'trace_instruction',
      stopwork_culture_action: 'public_boundary',
      instruction_chain_action: 'accept_top',
      record_action: 'minimize_scope',
      episode01_completed: true,
    });
  });
});
