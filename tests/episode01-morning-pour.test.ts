import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { episode01MorningPourPlate, EP01_MORNING_POUR_PLATES } from '../src/app/episode01-morning-pour';
import { episode01ImmersiveScene } from '../src/app/episode01-immersive-scene';

describe('Episode01 daylight raster art routing without changing the story', () => {
  it('replaces both temporary SVG layouts with two distinct, real raster-art plates', () => {
    const arrival = episode01MorningPourPlate('e01_06_pump_arrival');
    const pouring = episode01MorningPourPlate('e01_07_first_pour');
    expect(arrival?.uri).not.toBe(pouring?.uri);
    expect(arrival?.camera).toBe('site-approach-wide');
    expect(pouring?.camera).toBe('slab-level-workface');
    expect(Object.keys(EP01_MORNING_POUR_PLATES)).toHaveLength(2);

    for (const plate of [arrival, pouring]) {
      expect(plate?.approval).toBe('ART_REVIEW_REQUIRED');
      expect(plate?.uri).toMatch(/\.webp$/);
      expect(plate?.uri).not.toMatch(/preview|\.svg$/);
    }
    // The 09:24 master is built in prebuild from its committed original PNG.
    expect(existsSync('art-source/story-cinema-v1/ramp-entry.png')).toBe(true);
    const buildScript = readFileSync('scripts/build-story-cinema-art.mjs', 'utf8');
    expect(buildScript).toContain('ramp-entry');
    expect(existsSync('public/' + pouring!.uri)).toBe(true);
  });

  it('keeps engine scene IDs, shared background catalog and save identity unchanged', () => {
    expect(episode01ImmersiveScene('e01_06_pump_arrival', undefined, undefined)?.background_asset_id)
      .toBe('ep01.scene_bg.concrete_pour');
    expect(episode01ImmersiveScene('e01_07_first_pour', undefined, undefined)?.background_asset_id)
      .toBe('ep01.scene_bg.concrete_pour');
    expect(episode01MorningPourPlate('e01_08_reactions')).toBeUndefined();
  });
});
