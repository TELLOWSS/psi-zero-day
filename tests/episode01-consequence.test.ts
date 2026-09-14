import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const base = { ramp: 'check_self' as const, entrance: 'request_delay' as const, evening: 'rest' as const };

describe('Episode 01 delayed reporting consequence', () => {
  it('reinforces future reporting after the player listens', () => {
    const { state } = playEpisode({ ...base, plan: 'follow_junho', signal: 'listen_more' });
    expect(state.flags.reporting_return_state).toBe('reinforced');
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(40);
    expect(state.event_runtime.finished_instances.find(i => i.event_id === 'e01_08a_reporting_return')?.selected_choice_ids)
      .toEqual(['reporting_return_reinforced']);
  });

  it('suppresses later reporting after the player cuts the worker off', () => {
    const { state } = playEpisode({ ...base, plan: 'follow_junho', signal: 'dismiss' });
    expect(state.flags.reporting_return_state).toBe('suppressed');
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(22);
  });

  it('records a missed reporting loop when the worker was never followed', () => {
    const { state } = playEpisode({ ...base, plan: 'delegate_kang' });
    expect(state.flags.reporting_return_state).toBe('missed');
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(20);
  });
});
