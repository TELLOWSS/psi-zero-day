import { describe, expect, it } from 'vitest';
import { createEpisode01Registry } from '../src/content/episode01';
import { playEpisode } from './helpers/episode01-playthrough';

describe('Episode 01 integrated flow', () => {
  it('loads the 22-event vertical slice', () => {
    expect(createEpisode01Registry().getValidatedContent().events).toHaveLength(22);
  });

  it('completes the default realism chain', () => {
    const { state } = playEpisode({
      plan: 'delegate_kang',
      ramp: 'check_self',
      entrance: 'request_delay',
      evening: 'rest',
    });
    expect(state.flags).toMatchObject({
      inspection_closed: true,
      report_result: 'timeline_confirmed',
      tbm_gap_result: 'changed_work_rebriefed',
      restart_result: 'controlled_restart',
      stopwork_culture_result: 'reporting_route_preserved',
      episode01_completed: true,
    });
  });
});
