import { describe, expect, it } from 'vitest';
import { projectEpisode01Frictions } from '../src/app/strategy-frictions';

describe('Episode 01 field frictions', () => {
  it('projects schedule and coordination pressure from the existing planning conflict', () => {
    const frictions = projectEpisode01Frictions('e01_03_plan_breaks');
    expect(frictions.map(item => item.kind)).toEqual(['schedule_pressure', 'coordination_conflict']);
  });

  it('projects reporting and hierarchy pressure when Junho hesitates to report', () => {
    expect(projectEpisode01Frictions('e01_04_junho_signal').map(item => item.kind))
      .toEqual(['reporting_hesitation', 'hierarchy_pressure']);
  });

  it('surfaces the delayed relationship aftershock after the work is over', () => {
    expect(projectEpisode01Frictions('e01_08a_reporting_return').map(item => item.friction_id))
      .toEqual(['friction.reporting.aftershock']);
  });

  it('shows inspection and responsibility pressure across correction and reinspection', () => {
    expect(projectEpisode01Frictions('e01_08b_inspection_find').map(item => item.kind))
      .toEqual(['inspection_pressure', 'schedule_pressure', 'responsibility_shift']);
    expect(projectEpisode01Frictions('e01_08d_reinspection').map(item => item.kind))
      .toEqual(['inspection_pressure', 'responsibility_shift']);
  });

  it('shows responsibility crossfire and changed-instruction evidence pressure', () => {
    expect(projectEpisode01Frictions('e01_08e_responsibility_clash').map(item => item.friction_id)).toEqual([
      'friction.responsibility.crossfire', 'friction.timeline.changed_instruction', 'friction.paper_gap.report',
    ]);
  });

  it('shows the TBM-to-field gap and its delayed consequence', () => {
    expect(projectEpisode01Frictions('e01_08g_tbm_field_gap').map(item => item.friction_id)).toEqual([
      'friction.tbm.field_gap', 'friction.tbm.change_not_shared',
    ]);
    expect(projectEpisode01Frictions('e01_08h_tbm_return').map(item => item.friction_id))
      .toEqual(['friction.tbm.return']);
  });

  it('shows restart pressure, lost conditions and the restart aftershock', () => {
    expect(projectEpisode01Frictions('e01_08i_restart_pressure').map(item => item.friction_id)).toEqual([
      'friction.restart.schedule', 'friction.restart.condition_lost', 'friction.restart.who_ordered',
    ]);
    expect(projectEpisode01Frictions('e01_08j_restart_return').map(item => item.friction_id))
      .toEqual(['friction.restart.return']);
  });

  it('shows social blame and reporting chill after a stop-work intervention', () => {
    expect(projectEpisode01Frictions('e01_08k_stopwork_aftershock').map(item => item.friction_id)).toEqual([
      'friction.stopwork.schedule_blame', 'friction.stopwork.social_pressure', 'friction.stopwork.reporting_chill',
    ]);
    expect(projectEpisode01Frictions('e01_08l_stopwork_return').map(item => item.friction_id))
      .toEqual(['friction.stopwork.return']);
  });

  it('does not invent field pressure for unrelated scenes', () => {
    expect(projectEpisode01Frictions('e01_01_arrival')).toEqual([]);
    expect(projectEpisode01Frictions(null)).toEqual([]);
  });
});
