import { describe, expect, it } from 'vitest';
import { getRelation } from '../src/engine';
import { playEpisode } from './helpers/episode01-playthrough';

const base = { ramp: 'check_self' as const, entrance: 'request_delay' as const, evening: 'rest' as const };

describe('Episode 01 delayed reporting consequence', () => {
  it('reinforces future reporting after the player listens and later change control can reinforce it again', () => {
    const { state } = playEpisode({ ...base, plan: 'follow_junho', signal: 'listen_more' });
    expect(state.flags.reporting_return_state).toBe('reinforced');
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(42);
    expect(state.event_runtime.finished_instances.find(i => i.event_id === 'e01_08a_reporting_return')?.selected_choice_ids)
      .toEqual(['reporting_return_reinforced']);
  });

  it('suppresses reporting after dismissal but allows partial recovery through later change control', () => {
    const { state } = playEpisode({ ...base, plan: 'follow_junho', signal: 'dismiss' });
    expect(state.flags.reporting_return_state).toBe('suppressed');
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(24);
  });

  it('records a missed reporting loop and later builds a small reporting route through change control', () => {
    const { state } = playEpisode({ ...base, plan: 'delegate_kang' });
    expect(state.flags.reporting_return_state).toBe('missed');
    expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(22);
  });
});
