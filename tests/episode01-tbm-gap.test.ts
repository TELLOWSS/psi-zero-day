import { describe, expect, it } from 'vitest';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'coordinate_schedule' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  evening: 'rest' as const,
};

describe('Episode 01 TBM and field-work route', () => {
  it('ends the route at TBM return when the response relies on signed paperwork', () => {
    const { state } = playEpisode({ ...common, tbm: 'tbm_form_first' });
    expect(state.flags.tbm_gap_result).toBe('paper_field_gap_remains');
    expect(state.flags.restart_result).toBeUndefined();
  });

  it('ends the route at TBM return when changed work is reduced to worker blame', () => {
    const { state } = playEpisode({ ...common, tbm: 'tbm_worker_blame' });
    expect(state.flags.tbm_gap_result).toBe('reporting_chilled');
    expect(state.flags.restart_result).toBeUndefined();
  });

  it('opens restart control only after the player chooses changed-work control', () => {
    const { state } = playEpisode({ ...common, tbm: 'tbm_change_control', restart: 'restart_verify_controls' });
    expect(state.flags).toMatchObject({
      tbm_gap_result: 'changed_work_rebriefed',
      restart_result: 'controlled_restart',
    });
    expect(state.event_runtime.completion_history.map(item => item.event_id)).toEqual(expect.arrayContaining([
      'e01_08g_tbm_field_gap', 'e01_08h_tbm_return', 'e01_08i_restart_pressure', 'e01_08j_restart_return',
    ]));
  });
});
