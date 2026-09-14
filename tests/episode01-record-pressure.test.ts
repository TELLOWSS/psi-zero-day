import { describe, expect, it } from 'vitest';
import { playEpisode } from './helpers/episode01-playthrough';

const common = {
  plan: 'negotiate_yoon' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
  responsibility: 'report_one_sided' as const,
  evening: 'rest' as const,
};

describe('Episode 01 post-incident record pressure', () => {
  it.each([
    ['record_minimize_scope', 'evidence_forces_correction'],
    ['record_retrofit_paper', 'retroactive_record_conflict'],
    ['record_preserve_timeline', 'factual_record_preserved'],
  ] as const)('%s resolves as %s', (record, result) => {
    const { state } = playEpisode({ ...common, record });
    expect(state.flags).toMatchObject({
      report_result: 'correction_required',
      record_result: result,
    });
    expect(state.event_runtime.completion_history.map(item => item.event_id)).toEqual(expect.arrayContaining([
      'e01_08e_responsibility_clash', 'e01_08f_report_return', 'e01_08o_record_pressure', 'e01_08p_record_return',
    ]));
  });
});
