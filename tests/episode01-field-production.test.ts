import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { episode01FieldProduction } from '../src/app/episode01-field-production';
import { episode01CharacterBlocking } from '../src/app/episode01-character-blocking';
import { episode01CharacterPerformance } from '../src/app/episode01-character-performance';

describe('Episode 01 Phase C-2 FIELD production scene', () => {
  it('separates the reference Junho signal into read, judgment and consequence states', () => {
    expect(episode01FieldProduction('e01_04_junho_signal', 'signal')).toMatchObject({
      phase: 'signal-read',
      camera_profile: 'worker-intimate',
      depth_profile: 'signal-layered',
      lighting_profile: 'signal-natural',
      ui_profile: 'dialogue',
      cast_profile: 'junho-lead',
      hero_character_id: 'lim_junho',
    });

    expect(episode01FieldProduction('e01_04_junho_signal', 'listen')).toMatchObject({
      phase: 'signal-judgment',
      camera_profile: 'decision-context',
      depth_profile: 'decision-layered',
      lighting_profile: 'decision-focus',
      ui_profile: 'judgment',
      cast_profile: 'junho-player-balance',
      hero_character_id: 'lim_junho',
    });

    expect(episode01FieldProduction('e01_04_junho_signal', 'listen_more_result')).toMatchObject({
      phase: 'signal-consequence',
      camera_profile: 'signal-release',
      depth_profile: 'release-layered',
      lighting_profile: 'signal-release',
      ui_profile: 'result',
      cast_profile: 'signal-release',
    });
  });

  it('maps the wider FIELD family into distinct production grammars', () => {
    expect(episode01FieldProduction('e01_01_arrival', 'arrival')).toMatchObject({
      phase: 'arrival-observe',
      camera_profile: 'site-wide',
      ui_profile: 'observe',
    });
    expect(episode01FieldProduction('e01_07_first_pour', 'pour')).toMatchObject({
      phase: 'active-work',
      camera_profile: 'work-dynamic',
      ui_profile: 'work',
    });
    expect(episode01FieldProduction('e01_08k_stopwork_aftershock', 'situation')).toMatchObject({
      phase: 'human-aftershock',
      camera_profile: 'relationship-medium',
      ui_profile: 'human',
    });
    expect(episode01FieldProduction('e01_10_next_day_tease', 'tease')).toMatchObject({
      phase: 'next-day-tease',
      camera_profile: 'weather-wide',
      ui_profile: 'tease',
    });
    expect(episode01FieldProduction('e01_08c_site_pushback', 'resolve')).toBeUndefined();
  });

  it('authors Junho signal blocking and performance instead of falling back to cast order', () => {
    expect(episode01CharacterBlocking('e01_04_junho_signal', 'lim_junho', 'lim_junho', undefined, 'signal')).toEqual({
      side: 'left',
      depth: 'foreground',
    });
    expect(episode01CharacterBlocking('e01_04_junho_signal', 'player', 'lim_junho', undefined, 'signal')).toEqual({
      side: 'far-left',
      depth: 'midground',
    });
    expect(episode01CharacterBlocking('e01_04_junho_signal', 'player', 'lim_junho', undefined, 'listen')).toEqual({
      side: 'left',
      depth: 'foreground',
    });
    expect(episode01CharacterPerformance('e01_04_junho_signal', 'signal', 'lim_junho', 'lim_junho')).toMatchObject({
      expression: 'concern',
      pose: 'hesitate',
      motion: 'reengage',
    });
    expect(episode01CharacterPerformance('e01_04_junho_signal', 'listen', 'player', 'lim_junho')).toMatchObject({
      expression: 'resolve',
      pose: 'listen',
    });
  });

  it('locks FIELD production profiles and world-first judgment UI in CSS', () => {
    const css = fs.readFileSync('src/ui/production-scenes.css', 'utf8');
    expect(css).toContain('Phase C-2 — FIELD production quality lock');
    expect(css).toContain('[data-field-camera="worker-intimate"]');
    expect(css).toContain('[data-field-depth="decision-layered"]');
    expect(css).toContain('[data-field-lighting="decision-focus"]');
    expect(css).toContain('[data-field-cast="junho-player-balance"]');
    expect(css).toContain('[data-field-ui="judgment"]');
    expect(css).toContain('.choice-visual');
  });
});
