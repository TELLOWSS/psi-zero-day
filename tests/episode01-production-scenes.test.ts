import { describe, expect, it } from 'vitest';
import { episode01ProductionScene } from '../src/app/episode01-production-scene';
import { episode01StoryDirection } from '../src/app/episode01-story-director';

describe('Episode 01 Phase C production scenes', () => {
  it('normalizes director presets into the six production scene families', () => {
    expect(episode01ProductionScene('STRATEGY_MAP')).toBe('STRATEGY');
    expect(episode01ProductionScene('FIELD_DIALOGUE')).toBe('FIELD');
    expect(episode01ProductionScene('NEXT_DAY_TEASER')).toBe('FIELD');
    expect(episode01ProductionScene('TBM')).toBe('TBM');
    expect(episode01ProductionScene('STOP_WORK')).toBe('STOP_WORK');
    expect(episode01ProductionScene('OFFICE_DIALOGUE')).toBe('OFFICE');
    expect(episode01ProductionScene('DAY_RESULT')).toBe('DAY_RESULT');
  });

  it('binds key Episode 01 beats to visibly different production scenes', () => {
    const scene = (eventId: string) => episode01ProductionScene(episode01StoryDirection(eventId)?.preset);
    expect(scene('e01_03_plan_breaks')).toBe('STRATEGY');
    expect(scene('e01_04_junho_signal')).toBe('FIELD');
    expect(scene('e01_02_meet_kang')).toBe('TBM');
    expect(scene('e01_08c_site_pushback')).toBe('STOP_WORK');
    expect(scene('e01_08e_responsibility_clash')).toBe('OFFICE');
    expect(scene('e01_09_evening')).toBe('DAY_RESULT');
  });

  it('keeps unknown content outside the production scene system', () => {
    expect(episode01ProductionScene(undefined)).toBeUndefined();
    expect(episode01ProductionScene(null)).toBeUndefined();
  });
});
