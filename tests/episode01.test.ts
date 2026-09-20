import { describe, expect, it } from 'vitest';
import { createEpisode01Registry } from '../src/content/episode01';
import { playEpisode } from './helpers/episode01-playthrough';

describe('Episode 01 integrated flow', () => {
  it('keeps the complete 26-event library available for replay', () => {
    expect(createEpisode01Registry().getValidatedContent().events).toHaveLength(26);
  });

  it('completes a selected realism route instead of forcing every authored event into one run', () => {
    const { state } = playEpisode({
      plan: 'delegate_kang',
      ramp: 'check_self',
      entrance: 'request_delay',
      evening: 'rest',
    });
    expect(state.flags).toMatchObject({
      reporting_return_state: 'missed',
      inspection_closed: true,
      inspection_result: 'accepted_after_sequence',
      episode01_completed: true,
    });
    expect(state.flags.report_result).toBeUndefined();
    expect(state.flags.tbm_gap_result).toBeUndefined();
    expect(state.event_runtime.completion_history).toHaveLength(13);
  });
});
