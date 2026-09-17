import { describe, expect, it } from 'vitest';
import { projectEpisodeReview } from '../src/app/episode-review';
import { episodeContent, playEpisode } from './helpers/episode01-playthrough';

describe('completed episode review', () => {
  it('retains the actual decisions across save/resume without showing another route', () => {
    const { state } = playEpisode({ plan: 'follow_junho', signal: 'listen_more', ramp: 'ask_minseok', entrance: 'request_delay', evening: 'study' }, { resumeEveryCommand: true });
    const before = JSON.stringify(state);
    const review = projectEpisodeReview(state, episodeContent.events);
    expect(review).toHaveLength(state.event_runtime.choice_history.length);
    const choices = review.map(entry => entry.choice_text_id);
    const plan = episodeContent.events.find(event => event.event_id === 'e01_03_plan_breaks')!;
    expect(choices).toContain(plan.choices.find(choice => choice.choice_id === 'follow_junho')!.text_id);
    expect(choices).not.toContain(plan.choices.find(choice => choice.choice_id === 'delegate_kang')!.text_id);
    expect(projectEpisodeReview(JSON.parse(before), episodeContent.events)).toEqual(review);
    expect(JSON.stringify(state)).toBe(before);
    for (const entry of review.filter(item => item.result_text_id)) {
      expect(state.event_runtime.finished_instances.some(instance => {
        const event = episodeContent.events.find(item => item.event_id === instance.event_id);
        return event?.dialogue.some(node => node.text_id === entry.result_text_id && instance.visited_node_ids.includes(node.node_id));
      })).toBe(true);
    }
  });

  it('produces a different record for a different approach and leaves a fresh run empty', () => {
    const a = playEpisode({ plan: 'delegate_kang', ramp: 'check_self', entrance: 'assign_crew', evening: 'rest' });
    const b = playEpisode({ plan: 'coordinate_schedule', ramp: 'keep_schedule', entrance: 'force_clear', evening: 'family' });
    expect(projectEpisodeReview(a.initial, episodeContent.events)).toEqual([]);
    expect(projectEpisodeReview(a.state, episodeContent.events)).not.toEqual(projectEpisodeReview(b.state, episodeContent.events));
  });
});
