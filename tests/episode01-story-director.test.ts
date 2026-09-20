import { describe, expect, it } from 'vitest';
import immersiveScenes from '../content/episode01/immersive-scenes.json';
import director from '../content/episode01/story-director-v1.json';
import {
  EPISODE01_SCENE_PRESETS,
  episode01StoryDirection,
  episode01StoryPreset,
} from '../src/app/episode01-story-director';

describe('Episode 01 story director', () => {
  it('covers every authored immersive event exactly once', () => {
    const sceneIds = Object.keys(immersiveScenes.events).sort();
    const directedIds = Object.keys(director.runtime_event_directions).sort();
    expect(directedIds).toEqual(sceneIds);
  });

  it('uses only registered scene presets and resolves their presentation contract', () => {
    for (const eventId of Object.keys(director.runtime_event_directions)) {
      const direction = episode01StoryDirection(eventId);
      expect(direction).toBeDefined();
      expect(EPISODE01_SCENE_PRESETS).toContain(direction!.preset);
      expect(direction!.hud_density.length).toBeGreaterThan(0);
      expect(direction!.interaction_mode.length).toBeGreaterThan(0);
      expect(direction!.camera_rule.length).toBeGreaterThan(0);
    }
  });

  it('locks the day close and teaser to dedicated presets', () => {
    expect(episode01StoryPreset('e01_09_evening')).toBe('DAY_RESULT');
    expect(episode01StoryPreset('e01_10_next_day_tease')).toBe('NEXT_DAY_TEASER');
  });

  it('keeps unknown content outside the Episode 01 director', () => {
    expect(episode01StoryDirection('unknown')).toBeUndefined();
    expect(episode01StoryDirection(null)).toBeUndefined();
  });
});
