import { describe, expect, it } from 'vitest';
import { episode01ExpectedRunTotal } from '../src/app/episode01-run-progress';
import { playEpisode } from './helpers/episode01-playthrough';

const base = { ramp: 'check_self' as const, entrance: 'request_delay' as const, evening: 'rest' as const };
const completedIds = (state: ReturnType<typeof playEpisode>['state']) => state.event_runtime.completion_history.map(item => item.event_id);

function expectOnly(ids: readonly string[], included: readonly string[], excluded: readonly string[]) {
  for (const id of included) expect(ids).toContain(id);
  for (const id of excluded) expect(ids).not.toContain(id);
}

describe('Episode 01 conditional play structure', () => {
  it('keeps the worker-reporting route compact', () => {
    const { state } = playEpisode({ ...base, plan: 'follow_junho', signal: 'listen_more' });
    const ids = completedIds(state);
    expect(ids).toHaveLength(11);
    expectOnly(ids, ['e01_04_junho_signal', 'e01_08a_reporting_return'],
      ['e01_08b_inspection_find', 'e01_08e_responsibility_clash', 'e01_08g_tbm_field_gap']);
    expect(episode01ExpectedRunTotal(state)).toBe(11);
  });

  it('routes delegated cleanup into the three-scene inspection arc only', () => {
    const { state } = playEpisode({ ...base, plan: 'delegate_kang' });
    const ids = completedIds(state);
    expect(ids).toHaveLength(13);
    expectOnly(ids, ['e01_08b_inspection_find', 'e01_08c_site_pushback', 'e01_08d_reinspection'],
      ['e01_08e_responsibility_clash', 'e01_08g_tbm_field_gap', 'e01_08o_record_pressure']);
    expect(episode01ExpectedRunTotal(state)).toBe(13);
  });

  it('routes negotiated rebar work into responsibility/reporting and skips record pressure when facts are verified', () => {
    const { state } = playEpisode({ ...base, plan: 'negotiate_yoon', responsibility: 'report_verify_timeline' });
    const ids = completedIds(state);
    expect(ids).toHaveLength(12);
    expectOnly(ids, ['e01_08e_responsibility_clash', 'e01_08f_report_return'],
      ['e01_08b_inspection_find', 'e01_08g_tbm_field_gap', 'e01_08o_record_pressure']);
    expect(episode01ExpectedRunTotal(state)).toBe(12);
  });

  it('adds record pressure only after a weak or contested report', () => {
    const { state } = playEpisode({ ...base, plan: 'negotiate_yoon', responsibility: 'report_one_sided', record: 'record_preserve_timeline' });
    const ids = completedIds(state);
    expect(ids).toHaveLength(14);
    expectOnly(ids, ['e01_08e_responsibility_clash', 'e01_08f_report_return', 'e01_08o_record_pressure', 'e01_08p_record_return'],
      ['e01_08g_tbm_field_gap']);
    expect(episode01ExpectedRunTotal(state)).toBe(14);
  });

  it('keeps the normal change-control route to TBM and restart only', () => {
    const { state } = playEpisode({ ...base, plan: 'coordinate_schedule', tbm: 'tbm_change_control', restart: 'restart_verify_controls' });
    const ids = completedIds(state);
    expect(ids).toHaveLength(14);
    expectOnly(ids, ['e01_08g_tbm_field_gap', 'e01_08h_tbm_return', 'e01_08i_restart_pressure', 'e01_08j_restart_return'],
      ['e01_08k_stopwork_aftershock', 'e01_08m_instruction_cascade', 'e01_08o_record_pressure']);
    expect(episode01ExpectedRunTotal(state)).toBe(14);
  });

  it('adds stop-work social consequences only after a premature restart', () => {
    const { state } = playEpisode({ ...base, plan: 'coordinate_schedule', tbm: 'tbm_change_control',
      restart: 'restart_follow_verbal', stopwork: 'stopwork_protect_process' });
    const ids = completedIds(state);
    expect(ids).toHaveLength(16);
    expectOnly(ids, ['e01_08k_stopwork_aftershock', 'e01_08l_stopwork_return'], ['e01_08m_instruction_cascade']);
  });

  it('adds instruction-cascade reconstruction only when restart conditions were distorted', () => {
    const { state } = playEpisode({ ...base, plan: 'coordinate_schedule', tbm: 'tbm_change_control',
      restart: 'restart_trace_instruction', instruction: 'instruction_reconstruct_chain' });
    const ids = completedIds(state);
    expect(ids).toHaveLength(16);
    expectOnly(ids, ['e01_08m_instruction_cascade', 'e01_08n_instruction_return'], ['e01_08k_stopwork_aftershock']);
  });
});
