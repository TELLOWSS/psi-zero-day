import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'coordinate_schedule' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  tbm: 'tbm_change_control' as const,
  restart: 'restart_trace_instruction' as const,
  evening: 'rest' as const,
};

describe('Episode 01 instruction cascade', () => {
  it('keeps top-level acceptance, worker blame and handoff reconstruction behavior distinct', () => {
    const topOnly = playEpisode({ ...common, instruction: 'instruction_accept_top' }).state;
    const workerBlame = playEpisode({ ...common, instruction: 'instruction_blame_worker' }).state;
    const reconstructed = playEpisode({ ...common, instruction: 'instruction_reconstruct_chain' }).state;

    expect(topOnly.flags.instruction_chain_result).toBe('condition_loss_unresolved');
    expect(workerBlame.flags.instruction_chain_result).toBe('worker_blame_hides_chain');
    expect(reconstructed.flags.instruction_chain_result).toBe('conditional_phrase_restored');

    const topReporting = getRelation(topOnly.relations, 'lim_junho', 'player')!.reporting;
    const blamedReporting = getRelation(workerBlame.relations, 'lim_junho', 'player')!.reporting;
    const reconstructedReporting = getRelation(reconstructed.relations, 'lim_junho', 'player')!.reporting;
    expect(topReporting).toBeGreaterThan(blamedReporting);
    expect(reconstructedReporting).toBeGreaterThan(blamedReporting);
    expect(reconstructed.player.stats.analysis ?? 0).toBeGreaterThan(topOnly.player.stats.analysis ?? 0);
  });
});
