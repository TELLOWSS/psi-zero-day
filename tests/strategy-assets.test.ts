import { describe, expect, it } from 'vitest';
import { createEpisode01Registry } from '../src/content/episode01';
import { characterPortraitUri, projectStrategyVisualAssets } from '../src/app/strategy-assets';

const available: Readonly<Record<string, string>> = {
  'ep01.background.foundation.map': 'assets/episode01/backgrounds/foundation-map.webp',
  'ep01.character.lim_junho.map': 'assets/episode01/characters/lim-junho-map.webp',
  'ep01.character.lim_junho.portrait': 'assets/episode01/characters/lim-junho-portrait.webp',
};
const resolve = (id: string) => available[id];

const cast = [
  'player', 'kang_taesik', 'yoon_sungho', 'lee_jaehoon',
  'lim_junho', 'choi_minseok', 'seo_jeongmin', 'oh_seungjae',
] as const;

describe('Episode 01 strategy visual assets', () => {
  it('keeps final WebP asset ids compatible with the resolver contract', () => {
    const visuals = projectStrategyVisualAssets(['lim_junho', 'kang_taesik'], resolve);
    expect(visuals.background_uri).toBe('assets/episode01/backgrounds/foundation-map.webp');
    expect(visuals.characters.lim_junho).toMatchObject({
      character_id: 'lim_junho',
      map_uri: 'assets/episode01/characters/lim-junho-map.webp',
      portrait_uri: 'assets/episode01/characters/lim-junho-portrait.webp',
    });
    expect(visuals.characters.kang_taesik?.map_uri).toBeUndefined();
    expect(visuals.characters.kang_taesik?.accent).toBe('#c86f2b');
  });

  it('uses TASK-014A RC art for the foundation plus Player/Kang/Junho while retaining generated SVG fallback for the rest', () => {
    const registry = createEpisode01Registry();
    const content = registry.getValidatedContent();
    expect(content.asset_manifest.assets).toHaveLength(17);

    expect(registry.getAsset('ep01.background.foundation.map')?.variants[0]?.uri)
      .toBe('assets/episode01/backgrounds/foundation-map-rc.svg');
    expect(registry.getAsset('ep01.character.player.map')?.variants[0]?.uri)
      .toBe('assets/episode01/characters/player-map-rc.svg');
    expect(registry.getAsset('ep01.character.player.portrait')?.variants[0]?.uri)
      .toBe('assets/episode01/characters/player-portrait-rc.svg');
    expect(registry.getAsset('ep01.character.kang_taesik.map')?.variants[0]?.uri)
      .toBe('assets/episode01/characters/kang-taesik-map-rc.svg');
    expect(registry.getAsset('ep01.character.lim_junho.portrait')?.variants[0]?.uri)
      .toBe('assets/episode01/characters/lim-junho-portrait-rc.svg');

    const art = projectStrategyVisualAssets(cast, id => registry.getAsset(id)?.variants[0]?.uri);
    expect(art.background_uri).toBe('assets/episode01/backgrounds/foundation-map-rc.svg');
    expect(art.characters.player?.map_uri).toMatch(/player-map-rc\.svg$/);
    expect(art.characters.kang_taesik?.portrait_uri).toMatch(/kang-taesik-portrait-rc\.svg$/);
    expect(art.characters.lim_junho?.map_uri).toMatch(/lim-junho-map-rc\.svg$/);

    for (const characterId of ['yoon_sungho', 'lee_jaehoon', 'choi_minseok', 'seo_jeongmin', 'oh_seungjae'] as const) {
      expect(art.characters[characterId]?.portrait_uri).toMatch(/-portrait\.svg$/);
      expect(art.characters[characterId]?.map_uri).toMatch(/-map\.svg$/);
    }
  });

  it('still falls back cleanly when no production files are registered', () => {
    const visuals = projectStrategyVisualAssets(['kang_taesik'], () => undefined);
    expect(visuals.background_uri).toBeUndefined();
    expect(visuals.characters.kang_taesik?.map_uri).toBeUndefined();
    expect(visuals.characters.kang_taesik?.portrait_uri).toBeUndefined();
  });

  it('uses the same planned portrait binding for dialogue cards', () => {
    expect(characterPortraitUri('lim_junho', resolve)).toBe('assets/episode01/characters/lim-junho-portrait.webp');
    expect(characterPortraitUri('seo_jeongmin', resolve)).toBeUndefined();
  });
});
