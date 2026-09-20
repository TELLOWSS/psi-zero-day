import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { episode01CharacterBlocking } from '../src/app/episode01-character-blocking';
import { episode01CharacterPerformance } from '../src/app/episode01-character-performance';
import { episode01StopWorkProduction } from '../src/app/episode01-stopwork-production';

describe('Episode 01 Phase C-1 STOP WORK production scene', () => {
  it('separates hazard reading, zero moment and restart gate into three cinematic states', () => {
    expect(episode01StopWorkProduction('e01_08b_inspection_find')).toMatchObject({
      phase: 'hazard-read',
      hero_character_id: 'seo_jeongmin',
      camera_profile: 'hazard-wide',
      depth_profile: 'deep-field',
      lighting_profile: 'hazard-cool',
      ui_profile: 'observe',
      cast_profile: 'inspector-lead',
    });
    expect(episode01StopWorkProduction('e01_08c_site_pushback')).toMatchObject({
      phase: 'zero-moment',
      hero_character_id: 'player',
      camera_profile: 'decision-compressed',
      depth_profile: 'compressed-pressure',
      lighting_profile: 'stop-red',
      ui_profile: 'judgment',
      cast_profile: 'player-hero',
    });
    expect(episode01StopWorkProduction('e01_08d_reinspection')).toMatchObject({
      phase: 'restart-gate',
      hero_character_id: 'seo_jeongmin',
      camera_profile: 'verification-medium',
      depth_profile: 'open-verification',
      lighting_profile: 'restart-neutral',
      ui_profile: 'verify',
      cast_profile: 'verification-lead',
    });
    expect(episode01StopWorkProduction('e01_04_junho_signal')).toBeUndefined();
  });

  it('stages the player as the foreground decision owner at the zero moment', () => {
    expect(episode01CharacterBlocking('e01_08c_site_pushback', 'player')).toEqual({
      side: 'far-left',
      depth: 'foreground',
    });
    expect(episode01CharacterBlocking('e01_08c_site_pushback', 'lee_jaehoon')).toEqual({
      side: 'right',
      depth: 'midground',
    });
    expect(episode01CharacterPerformance('e01_08c_site_pushback', 'resolve', 'player')).toMatchObject({
      expression: 'resolve',
      pose: 'brace',
    });
  });

  it('keeps the production layer factual rather than scoring the player', () => {
    const zero = episode01StopWorkProduction('e01_08c_site_pushback')!;
    expect(zero.title_text_id).toBe('ui.stopwork.title.zero');
    expect(zero.markers.map(marker => marker.key)).toEqual(['edge', 'route']);
    expect(JSON.stringify(zero)).not.toMatch(/score|grade|correct|wrong/i);
  });

  it('locks the cinematic hierarchy and uncluttered decision dock in CSS', () => {
    const css = fs.readFileSync('src/ui/production-scenes.css', 'utf8');
    expect(css).toContain('Phase C-1 — STOP WORK quality lock');
    expect(css).toContain('[data-event="e01_08c_site_pushback"] .episode-immersive-character[data-character="player"]');
    expect(css).toContain('.play-panel:has(.choice-content)');
    expect(css).toContain('.choice-visual');
    expect(css).toContain('.stop-work-production-stopline');
    expect(css).toContain('[data-stopwork-camera="decision-compressed"]');
    expect(css).toContain('[data-stopwork-depth="compressed-pressure"]');
    expect(css).toContain('[data-stopwork-lighting="stop-red"]');
    expect(css).toContain('[data-stopwork-ui="judgment"]');
    expect(css).toContain('[data-stopwork-cast="player-hero"]');
  });
});
