import { describe, expect, it } from 'vitest';
import { playEpisode } from './helpers/episode01-playthrough';
import type { EpisodeDecisions } from './helpers/episode01-playthrough';

const low = ['CONTROLLED_DELAY', 'CONTROLLED_DELAY', 'RELATION_CONFLICT'];
const origins: { plan: EpisodeDecisions['plan']; signal?: EpisodeDecisions['signal']; rows: string[][] }[] = [
  { plan: 'delegate_kang', rows: [low, low, low] },
  { plan: 'negotiate_yoon', rows: [low, low, low] },
  { plan: 'coordinate_schedule', rows: [low, low, ['NEAR_MISS', 'NEAR_MISS', 'RELATION_CONFLICT']] },
  { plan: 'follow_junho', signal: 'dismiss', rows: [low, low, low] },
  { plan: 'follow_junho', signal: 'listen_more', rows: [
    ['BEST_CONTROL', 'BEST_CONTROL', 'RELATION_CONFLICT'],
    ['BEST_CONTROL', 'BEST_CONTROL', 'RELATION_CONFLICT'],
    low,
  ] },
];

const cases = origins.flatMap(origin => (['check_self', 'ask_minseok', 'keep_schedule'] as const).flatMap((ramp, i) =>
  (['assign_crew', 'request_delay', 'force_clear'] as const).map((entrance, j) => ({
    name: `${origin.plan}/${origin.signal ?? 'no_signal'}/${ramp}/${entrance}`,
    decisions: { plan: origin.plan, signal: origin.signal, ramp, entrance, evening: 'rest' as const },
    result: origin.rows[i]![j]!,
  }))));

function expectSelectedRoute(state: ReturnType<typeof playEpisode>['state'], decisions: EpisodeDecisions) {
  expect(state.flags.episode01_completed).toBe(true);
  if (decisions.plan === 'delegate_kang') {
    expect(state.flags.inspection_result).toBe('accepted_after_sequence');
    expect(state.flags.report_result).toBeUndefined();
  } else if (decisions.plan === 'negotiate_yoon') {
    expect(state.flags.report_result).toBe('timeline_confirmed');
    expect(state.flags.tbm_gap_result).toBeUndefined();
  } else if (decisions.plan === 'coordinate_schedule') {
    expect(state.flags.tbm_gap_result).toBe('changed_work_rebriefed');
    expect(state.flags.restart_result).toBe('controlled_restart');
    expect(state.flags.inspection_result).toBeUndefined();
  } else {
    expect(state.flags.inspection_result).toBeUndefined();
    expect(state.flags.report_result).toBeUndefined();
    expect(state.flags.tbm_gap_result).toBeUndefined();
  }
}

describe('Episode 01 reachable safety matrix', () => {
  it.each(cases)('$name', ({ decisions, result }) => {
    const { state } = playEpisode(decisions);
    expect(state.flags.pump_result).toBe(result);
    expectSelectedRoute(state, decisions);
  });
});
