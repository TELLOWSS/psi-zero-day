import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'delegate_kang' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  tbm: 'tbm_change_control' as const,
  restart: 'restart_verify_controls' as const,
  stopwork: 'stopwork_protect_process' as const,
  evening: 'rest' as const,
};

describe('Episode 01 instruction cascade', () => {
  it('leaves the delivery gap unresolved when only the top-level instruction is accepted', () => {
    const { state } = playEpisode({ ...common, instruction: 'instruction_accept_top' });
    expect(state.flags).toMatchObject({
      instruction_chain_action: 'accept_top',
      instruction_chain_result: 'condition_loss_unresolved',
    });
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(26);
  });

  it('chills clarification when the last worker carries the blame', () => {
    const { state } = playEpisode({ ...common, instruction: 'instruction_blame_worker' });
    expect(state.flags).toMatchObject({
      instruction_chain_action: 'blame_worker',
      instruction_chain_result: 'worker_blame_hides_chain',
    });
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(21);
  });

  it('reconstructs where the safety condition disappeared in the delivery chain', () => {
    const { state } = playEpisode({ ...common, instruction: 'instruction_reconstruct_chain' });
    expect(state.flags).toMatchObject({
      instruction_chain_action: 'reconstruct_chain',
      instruction_chain_result: 'conditional_phrase_restored',
    });
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(27);
    expect(state.player.stats.analysis).toBe(41);
  });
});
