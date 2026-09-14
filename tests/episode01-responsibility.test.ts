import { describe, expect, it } from 'vitest';
import { playEpisode } from './helpers/episode01-playthrough';

const base = {
  plan: 'negotiate_yoon' as const,
  ramp: 'check_self' as const,
  entrance: 'force_clear' as const,
  evening: 'rest' as const,
};

describe('Episode 01 responsibility and report route', () => {
  it('returns a one-sided blame report for correction and then opens record pressure', () => {
    const { state } = playEpisode({ ...base, responsibility: 'report_one_sided' });
    expect(state.flags).toMatchObject({
      report_basis: 'one_sided',
      report_result: 'correction_required',
      record_result: 'factual_record_preserved',
    });
  });

  it('demands evidence for a defensive report and then opens record pressure', () => {
    const { state } = playEpisode({ ...base, responsibility: 'report_defensive' });
    expect(state.flags).toMatchObject({
      report_basis: 'defensive',
      report_result: 'evidence_requested',
      record_result: 'factual_record_preserved',
    });
  });

  it('closes the route after timeline verification without forcing record pressure', () => {
    const { state } = playEpisode({ ...base, responsibility: 'report_verify_timeline' });
    expect(state.flags).toMatchObject({ report_basis: 'timeline', report_result: 'timeline_confirmed' });
    expect(state.flags.record_result).toBeUndefined();
    expect(state.event_runtime.finished_instances.find(i => i.event_id === 'e01_08f_report_return')?.selected_choice_ids)
      .toEqual(['report_return_timeline_confirmed']);
  });
});
