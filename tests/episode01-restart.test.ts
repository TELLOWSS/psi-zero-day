import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'delegate_kang' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  tbm: 'tbm_change_control' as const,
  evening: 'rest' as const,
};

describe('Episode 01 stop-work restart chain', () => {
  it('turns an unchecked verbal restart into a second stop before later reporter protection', () => {
    const { state } = playEpisode({ ...common, restart: 'restart_follow_verbal' });
    expect(state.flags).toMatchObject({
      restart_action: 'follow_verbal',
      restart_result: 'premature_restart_second_stop',
    });
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(25);
    expect(getRelation(state.relations, 'lee_jaehoon', 'player')!.respect).toBe(38);
  });

  it('finds the condition lost while a restart instruction was relayed', () => {
    const { state } = playEpisode({ ...common, restart: 'restart_trace_instruction' });
    expect(state.flags).toMatchObject({
      restart_action: 'trace_instruction',
      restart_result: 'conditional_instruction_distorted',
    });
    expect(state.player.stats.analysis).toBe(41);
    expect(getRelation(state.relations, 'kang_taesik', 'player')!.reporting).toBe(35);
  });

  it('keeps work stopped until physical controls and restart conditions are verified', () => {
    const { state } = playEpisode({ ...common, restart: 'restart_verify_controls' });
    expect(state.flags).toMatchObject({
      restart_action: 'verify_controls',
      restart_result: 'controlled_restart',
    });
    expect(state.player.stats.judgment).toBe(30);
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(27);
  });
});
