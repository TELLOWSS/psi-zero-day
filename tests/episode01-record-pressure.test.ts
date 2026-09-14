import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'delegate_kang' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  instruction: 'instruction_reconstruct_chain' as const,
  evening: 'rest' as const,
};

describe('Episode 01 post-incident record pressure', () => {
  it('returns minimized wording for correction when evidence shows the wider sequence', () => {
    const { state } = playEpisode({ ...common, record: 'record_minimize_scope' });
    expect(state.flags).toMatchObject({
      record_action: 'minimize_scope',
      record_result: 'evidence_forces_correction',
    });
    expect(getRelation(state.relations, 'oh_seungjae', 'player')!.trust).toBe(31);
    expect(state.player.stats.analysis).toBe(40);
  });

  it('exposes a conflict when later paperwork is retrofitted to the changed work', () => {
    const { state } = playEpisode({ ...common, record: 'record_retrofit_paper' });
    expect(state.flags).toMatchObject({
      record_action: 'retrofit_paper',
      record_result: 'retroactive_record_conflict',
    });
    expect(getRelation(state.relations, 'oh_seungjae', 'player')!.trust).toBe(30);
    expect(getRelation(state.relations, 'lee_jaehoon', 'player')!.respect).toBe(35);
  });

  it('keeps neutral wording separate from the underlying timeline and evidence', () => {
    const { state } = playEpisode({ ...common, record: 'record_preserve_timeline' });
    expect(state.flags).toMatchObject({
      record_action: 'preserve_timeline',
      record_result: 'factual_record_preserved',
    });
    expect(getRelation(state.relations, 'oh_seungjae', 'player')).toMatchObject({ trust: 33, respect: 32 });
    expect(getRelation(state.relations, 'lee_jaehoon', 'player')!.respect).toBe(37);
    expect(state.player.stats.analysis).toBe(41);
  });
});
