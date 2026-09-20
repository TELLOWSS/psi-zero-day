import { describe, expect, it } from 'vitest';
import { createEpisode01Registry } from '../src/content/episode01';
import { playEpisode } from './helpers/episode01-playthrough';

describe('Episode 01 integrated flow', () => {
  it('keeps the complete 26-event library available for the directed day', () => {
    expect(createEpisode01Registry().getValidatedContent().events).toHaveLength(26);
  });

  it('completes the full immersive day while preserving the player route inside flags and relationships', () => {
    const { state } = playEpisode({
      plan: 'delegate_kang',
      ramp: 'check_self',
      entrance: 'request_delay',
      evening: 'rest',
    });

    expect(state.flags).toMatchObject({
      inspection_closed: true,
      inspection_result: 'accepted_after_sequence',
      tbm_gap_result: 'changed_work_rebriefed',
      restart_result: 'controlled_restart',
      stopwork_culture_result: 'reporting_route_preserved',
      instruction_chain_result: 'conditional_phrase_restored',
      record_result: 'timeline_preserved',
      episode01_completed: true,
    });
    expect(state.event_runtime.completion_history).toHaveLength(26);
  });
});
