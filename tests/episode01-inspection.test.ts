import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'delegate_kang' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  responsibility: 'report_verify_timeline' as const,
  evening: 'rest' as const,
};

describe('Episode 01 inspection chain', () => {
  it('keeps full correction accepted but costs cooperation before later recovery steps', () => {
    const { state } = playEpisode({ ...common, inspection: 'inspection_full_stop' });
    expect(state.flags.inspection_result).toBe('accepted');
    expect(getRelation(state.relations, 'seo_jeongmin', 'player')).toMatchObject({ trust: 33, respect: 34 });
    expect(getRelation(state.relations, 'lee_jaehoon', 'player')!.respect).toBe(35);
  });

  it('makes a photo-first shortcut return as reinspection work', () => {
    const { state } = playEpisode({ ...common, inspection: 'inspection_quick_photo' });
    expect(state.flags.inspection_result).toBe('rework_after_reinspection');
    expect(getRelation(state.relations, 'seo_jeongmin', 'player')).toMatchObject({ trust: 26, respect: 24 });
    expect(getRelation(state.relations, 'lee_jaehoon', 'player')!.respect).toBe(38);
  });

  it('accepts negotiated sequencing and preserves both sides', () => {
    const { state } = playEpisode({ ...common, inspection: 'inspection_sequence_agreement' });
    expect(state.flags.inspection_result).toBe('accepted_after_sequence');
    expect(getRelation(state.relations, 'seo_jeongmin', 'player')).toMatchObject({ trust: 32, respect: 32 });
    expect(getRelation(state.relations, 'lee_jaehoon', 'player')!.respect).toBe(40);
    expect(state.player.stats.negotiation).toBe(32);
  });
});
