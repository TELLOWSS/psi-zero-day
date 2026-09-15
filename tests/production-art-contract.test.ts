import { describe, expect, it } from 'vitest';
import visuals from '../content/episode01/visuals.json';

const cast = [
  'player', 'kang_taesik', 'yoon_sungho', 'lee_jaehoon',
  'lim_junho', 'choi_minseok', 'seo_jeongmin', 'oh_seungjae',
] as const;

describe('Episode 01 production art contract', () => {
  it('locks exactly seventeen final WebP slots: one map plus portrait/map for all eight characters', () => {
    const paths: string[] = [];
    const ids: string[] = [];

    for (const characterId of cast) {
      const character = visuals.characters[characterId];
      expect(character).toBeDefined();
      paths.push(character.portrait_path, character.map_path);
      ids.push(character.portrait_asset_id, character.map_asset_id);
    }

    paths.push(visuals.backgrounds.foundation.path);
    ids.push(visuals.backgrounds.foundation.map_asset_id);

    expect(paths).toHaveLength(17);
    expect(ids).toHaveLength(17);
    expect(new Set(paths).size).toBe(17);
    expect(new Set(ids).size).toBe(17);
    expect(paths.every(path => path.endsWith('.webp'))).toBe(true);
    expect(paths.some(path => /-rc\.svg$|\.svg$/i.test(path))).toBe(false);
  });

  it('keeps production character file names stable and role-neutral for direct asset replacement', () => {
    for (const characterId of cast) {
      const character = visuals.characters[characterId];
      expect(character.portrait_path).toMatch(/^assets\/episode01\/characters\/[a-z-]+-portrait\.webp$/);
      expect(character.map_path).toMatch(/^assets\/episode01\/characters\/[a-z-]+-map\.webp$/);
    }
    expect(visuals.backgrounds.foundation.path)
      .toBe('assets/episode01/backgrounds/foundation-map.webp');
  });
});
