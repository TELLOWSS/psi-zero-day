import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import phaseC from '../content/episode01/phase-c-production-scenes.json';
import { episode01ProductionScene } from '../src/app/episode01-production-scene';
import { episode01StoryDirection } from '../src/app/episode01-story-director';

describe('Episode 01 Phase C integrated production quality', () => {
  it('locks all six production scene families under one end-to-end contract', () => {
    expect(phaseC.status).toBe('INTEGRATED_QUALITY_LOCK');
    expect(phaseC.integration_lock.status).toBe('LOCKED');
    expect(phaseC.integration_lock.production_reference_order).toEqual([
      'STOP_WORK',
      'FIELD',
      'TBM',
      'STRATEGY',
      'OFFICE',
      'DAY_RESULT',
    ]);
    expect(Object.keys(phaseC.scene_families).sort()).toEqual([
      'DAY_RESULT',
      'FIELD',
      'OFFICE',
      'STOP_WORK',
      'STRATEGY',
      'TBM',
    ]);
  });

  it.each([
    ['e01_08c_site_pushback', 'STOP_WORK'],
    ['e01_04_junho_signal', 'FIELD'],
    ['e01_08g_tbm_field_gap', 'TBM'],
    ['e01_05_command', 'STRATEGY'],
    ['e01_08e_responsibility_clash', 'OFFICE'],
    ['e01_09_evening', 'DAY_RESULT'],
  ] as const)('keeps %s in its authored production family', (eventId, expectedScene) => {
    const direction = episode01StoryDirection(eventId);
    expect(direction).toBeDefined();
    expect(episode01ProductionScene(direction?.preset)).toBe(expectedScene);
  });

  it('bridges DAY RESULT into DAY 02 without creating a seventh scene family', () => {
    const evening = episode01StoryDirection('e01_09_evening');
    const tomorrow = episode01StoryDirection('e01_10_next_day_tease');
    expect(episode01ProductionScene(evening?.preset)).toBe('DAY_RESULT');
    expect(tomorrow).toMatchObject({
      preset: 'NEXT_DAY_TEASER',
      interaction_mode: 'continue',
      hud_density: 'minimal',
    });
    expect(episode01ProductionScene(tomorrow?.preset)).toBe('FIELD');
    expect(phaseC.integration_lock.contracts.day02_bridge).toHaveLength(3);
  });

  it('ships the final Phase C continuity layer after the six scene-specific locks', () => {
    const css = fs.readFileSync(path.resolve('src/ui/production-scenes.css'), 'utf8');
    const marker = '/* Phase C integration quality lock — Episode 01 end-to-end. */';
    expect(css).toContain(marker);
    expect(css).toContain('[data-event="e01_10_next_day_tease"]');
    expect(css).toContain('@media (orientation:portrait) and (max-width:900px)');
    expect(css).toContain('@media (orientation:landscape) and (max-height:650px)');
    expect(css.lastIndexOf(marker)).toBeGreaterThan(css.indexOf('Phase C-6'));
  });
});
