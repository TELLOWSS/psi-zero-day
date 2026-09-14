import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const base = { ramp: 'check_self' as const, entrance: 'request_delay' as const, evening: 'rest' as const };

describe('Episode 01 delayed reporting consequence', () => {
  it('returns reinforced, suppressed and missed reporting states without requiring later arcs', () => {
    const listened = playEpisode({ ...base, plan: 'follow_junho', signal: 'listen_more' }).state;
    const dismissed = playEpisode({ ...base, plan: 'follow_junho', signal: 'dismiss' }).state;
    const missed = playEpisode({ ...base, plan: 'delegate_kang' }).state;

    expect(listened.flags.reporting_return_state).toBe('reinforced');
    expect(dismissed.flags.reporting_return_state).toBe('suppressed');
    expect(missed.flags.reporting_return_state).toBe('missed');

    const listenedReporting = getRelation(listened.relations, 'lim_junho', 'player')!.reporting;
    const dismissedReporting = getRelation(dismissed.relations, 'lim_junho', 'player')!.reporting;
    const missedReporting = getRelation(missed.relations, 'lim_junho', 'player')!.reporting;
    expect(listenedReporting).toBeGreaterThan(dismissedReporting);
    expect(dismissedReporting).toBeGreaterThan(missedReporting);

    expect(listened.event_runtime.finished_instances.find(i => i.event_id === 'e01_08a_reporting_return')?.selected_choice_ids)
      .toEqual(['reporting_return_reinforced']);
  });
});
