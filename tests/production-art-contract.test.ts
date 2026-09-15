import { describe, expect, it } from 'vitest';
import visuals from '../content/episode01/visuals.json';

const cast = [
  'player', 'kang_taesik', 'yoon_sungho', 'lee_jaehoon',
  'lim_junho', 'choi_minseok', 'seo_jeongmin', 'oh_seungjae',
] as const;

const batchA = ['player', 'kang_taesik', 'lim_junho'] as const;

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

  it('locks Batch A to the title/first-play seven final WebP assets', () => {
    const paths = [
      visuals.backgrounds.foundation.path,
      ...batchA.flatMap(characterId => {
        const character = visuals.characters[characterId];
        return [character.portrait_path, character.map_path];
      }),
    ];

    expect(paths).toEqual([
      'assets/episode01/backgrounds/foundation-map.webp',
      'assets/episode01/characters/player-portrait.webp',
      'assets/episode01/characters/player-map.webp',
      'assets/episode01/characters/kang-taesik-portrait.webp',
      'assets/episode01/characters/kang-taesik-map.webp',
      'assets/episode01/characters/lim-junho-portrait.webp',
      'assets/episode01/characters/lim-junho-map.webp',
    ]);
    expect(new Set(paths).size).toBe(7);
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
