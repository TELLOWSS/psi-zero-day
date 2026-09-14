import { describe, expect, it } from 'vitest';
import { projectEpisode01Frictions } from '../src/app/strategy-frictions';

describe('Episode 01 field frictions', () => {
  it('projects schedule and coordination pressure from the existing planning conflict', () => {
    const frictions = projectEpisode01Frictions('e01_03_plan_breaks');
    expect(frictions.map(item => item.kind)).toEqual(['schedule_pressure', 'coordination_conflict']);
  });

  it('projects reporting and hierarchy pressure when Junho hesitates to report', () => {
    const frictions = projectEpisode01Frictions('e01_04_junho_signal');
    expect(frictions.map(item => item.kind)).toEqual(['reporting_hesitation', 'hierarchy_pressure']);
  });

  it('surfaces the delayed relationship aftershock after the work is over', () => {
    const frictions = projectEpisode01Frictions('e01_08a_reporting_return');
    expect(frictions.map(item => item.friction_id)).toEqual(['friction.reporting.aftershock']);
  });

  it('does not invent field pressure for unrelated scenes', () => {
    expect(projectEpisode01Frictions('e01_01_arrival')).toEqual([]);
    expect(projectEpisode01Frictions(null)).toEqual([]);
  });
});
