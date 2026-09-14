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

describe('Episode 01 reachable safety matrix', () => {
  it.each(cases)('$name', ({ decisions, result }) => {
    const { state } = playEpisode(decisions);
    expect(state.flags.pump_result).toBe(result);
    expect(state.flags).toMatchObject({
      inspection_closed: true,
      report_result: 'timeline_confirmed',
      tbm_gap_result: 'changed_work_rebriefed',
      restart_result: 'controlled_restart',
      stopwork_culture_result: 'reporting_route_preserved',
      instruction_chain_result: 'conditional_phrase_restored',
      episode01_completed: true,
    });
  });
});
