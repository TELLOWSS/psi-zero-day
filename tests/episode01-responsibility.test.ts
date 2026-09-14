import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const base = {
  plan: 'delegate_kang' as const,
  ramp: 'check_self' as const,
  entrance: 'force_clear' as const,
  inspection: 'inspection_sequence_agreement' as const,
  evening: 'rest' as const,
};

describe('Episode 01 responsibility and report chain', () => {
  it('returns a one-sided blame report for correction when later records conflict', () => {
    const { state } = playEpisode({ ...base, responsibility: 'report_one_sided' });
    expect(state.flags).toMatchObject({ report_basis: 'one_sided', report_result: 'correction_required' });
    expect(getRelation(state.relations, 'oh_seungjae', 'player')).toMatchObject({ trust: 29, respect: 32 });
    expect(getRelation(state.relations, 'lee_jaehoon', 'player')!.respect).toBe(29);
    expect(getRelation(state.relations, 'kang_taesik', 'player')!.trust).toBe(31);
  });

  it('demands evidence when the report only repeats the subcontractor defence', () => {
    const { state } = playEpisode({ ...base, responsibility: 'report_defensive' });
    expect(state.flags).toMatchObject({ report_basis: 'defensive', report_result: 'evidence_requested' });
    expect(getRelation(state.relations, 'oh_seungjae', 'player')).toMatchObject({ trust: 27, respect: 27 });
    expect(getRelation(state.relations, 'lee_jaehoon', 'player')!.respect).toBe(36);
    expect(getRelation(state.relations, 'kang_taesik', 'player')!.trust).toBe(36);
  });

  it('confirms a mixed-cause timeline when the player checks instruction and evidence timestamps', () => {
    const { state } = playEpisode({ ...base, responsibility: 'report_verify_timeline' });
    expect(state.flags).toMatchObject({ report_basis: 'timeline', report_result: 'timeline_confirmed' });
    expect(getRelation(state.relations, 'oh_seungjae', 'player')).toMatchObject({ trust: 32, respect: 31 });
    expect(getRelation(state.relations, 'lee_jaehoon', 'player')!.respect).toBe(36);
    expect(state.player.stats.analysis).toBe(39);
    expect(state.event_runtime.finished_instances.find(i => i.event_id === 'e01_08f_report_return')?.selected_choice_ids)
      .toEqual(['report_return_timeline_confirmed']);
  });
});
