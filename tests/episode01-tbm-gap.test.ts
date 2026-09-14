import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'delegate_kang' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  evening: 'rest' as const,
};

describe('Episode 01 TBM and field-work gap', () => {
  it('leaves the paper-field gap when the response relies on the signed TBM', () => {
    const { state } = playEpisode({ ...common, tbm: 'tbm_form_first' });
    expect(state.flags.tbm_gap_result).toBe('paper_field_gap_remains');
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(18);
  });

  it('chills reporting when the changed work is reduced to worker blame', () => {
    const { state } = playEpisode({ ...common, tbm: 'tbm_worker_blame' });
    expect(state.flags.tbm_gap_result).toBe('reporting_chilled');
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(14);
  });

  it('rebriefs the changed work and preserves a route for later reporting', () => {
    const { state } = playEpisode({ ...common, tbm: 'tbm_change_control' });
    expect(state.flags.tbm_gap_result).toBe('changed_work_rebriefed');
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(22);
    expect(state.player.stats.judgment).toBe(29);
  });
});
