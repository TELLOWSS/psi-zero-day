import { describe, expect, it } from 'vitest';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'delegate_kang' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  evening: 'rest' as const,
};

describe('Episode 01 inspection route', () => {
  it.each([
    ['inspection_full_stop', 'accepted'],
    ['inspection_quick_photo', 'rework_after_reinspection'],
    ['inspection_sequence_agreement', 'accepted_after_sequence'],
  ] as const)('%s resolves as %s', (inspection, result) => {
    const { state } = playEpisode({ ...common, inspection });
    expect(state.flags.inspection_result).toBe(result);
    expect(state.flags.inspection_closed).toBe(true);
    expect(state.event_runtime.completion_history.map(item => item.event_id)).toEqual(expect.arrayContaining([
      'e01_08b_inspection_find', 'e01_08c_site_pushback', 'e01_08d_reinspection',
    ]));
    expect(state.flags.report_result).toBeUndefined();
    expect(state.flags.tbm_gap_result).toBeUndefined();
  });
});
