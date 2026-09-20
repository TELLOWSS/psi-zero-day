import { describe, expect, it } from 'vitest';
import { createEpisode01Registry } from '../src/content/episode01';
import {
  EPISODE01_MEANINGFUL_DECISION_COUNT,
  episode01AutoAdvanceDelay,
  episode01StoryDirector,
} from '../src/app/episode01-story-director';

describe('Episode 01 Phase B story director', () => {
  it('locks the new dramatic spine and six production scene presets', () => {
    expect(EPISODE01_MEANINGFUL_DECISION_COUNT).toBe(12);
    expect(episode01StoryDirector('e01_01_arrival')).toMatchObject({ time: '06:27', preset: 'FIELD' });
    expect(episode01StoryDirector('e01_02_meet_kang')).toMatchObject({ time: '06:40', preset: 'TBM' });
    expect(episode01StoryDirector('e01_03_plan_breaks')).toMatchObject({ time: '07:10', preset: 'STRATEGY' });
    expect(episode01StoryDirector('e01_08c_site_pushback')).toMatchObject({ time: '10:24', preset: 'STOP_WORK', label: 'ZERO MOMENT' });
    expect(episode01StoryDirector('e01_08e_responsibility_clash')?.preset).toBe('OFFICE');
    expect(episode01StoryDirector('e01_09_evening')?.preset).toBe('DAY_RESULT');
  });

  it('auto-advances authored exposition but never invents a delay for decisions', () => {
    expect(episode01AutoAdvanceDelay('e01_03_plan_breaks', 'situation', 40)).toBeGreaterThanOrEqual(4200);
    expect(episode01AutoAdvanceDelay('e01_08e_responsibility_clash', 'gc', 60)).toBeGreaterThanOrEqual(4200);
    expect(episode01AutoAdvanceDelay('e01_03_plan_breaks', 'plan', 30)).toBeUndefined();
    expect(episode01AutoAdvanceDelay('e01_08b_inspection_find', 'action', 30)).toBeUndefined();
  });

  it('routes every realism arc through one coherent Episode 01 day', () => {
    const content = createEpisode01Registry().getValidatedContent();
    const events = new Map(content.events.map(event => [event.event_id, event]));

    const expectedPrevious: Readonly<Record<string, string>> = {
      e01_04_junho_signal: 'e01_03_plan_breaks',
      e01_05_command: 'e01_04_junho_signal',
      e01_08b_inspection_find: 'e01_08a_reporting_return',
      e01_08e_responsibility_clash: 'e01_08d_reinspection',
      e01_08g_tbm_field_gap: 'e01_08f_report_return',
      e01_08i_restart_pressure: 'e01_08h_tbm_return',
      e01_08k_stopwork_aftershock: 'e01_08j_restart_return',
      e01_08m_instruction_cascade: 'e01_08l_stopwork_return',
      e01_08o_record_pressure: 'e01_08n_instruction_return',
      e01_09_evening: 'e01_08p_record_return',
    };

    for (const [eventId, previousId] of Object.entries(expectedPrevious)) {
      expect(events.get(eventId)?.conditions).toEqual([
        { kind: 'event_completed', event_id: previousId, minimum_count: 1 },
      ]);
    }
  });
});
