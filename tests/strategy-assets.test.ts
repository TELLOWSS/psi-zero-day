import { describe, expect, it } from 'vitest';
import { characterPortraitUri, projectStrategyVisualAssets } from '../src/app/strategy-assets';

const available: Readonly<Record<string, string>> = {
  'ep01.background.foundation.map': 'assets/episode01/backgrounds/foundation-map.webp',
  'ep01.character.lim_junho.map': 'assets/episode01/characters/lim-junho-map.webp',
  'ep01.character.lim_junho.portrait': 'assets/episode01/characters/lim-junho-portrait.webp',
};
const resolve = (id: string) => available[id];

describe('Episode 01 strategy visual assets', () => {
  it('resolves available map/background art through asset ids', () => {
    const visuals = projectStrategyVisualAssets(['lim_junho', 'kang_taesik'], resolve);
    expect(visuals.background_uri).toBe('assets/episode01/backgrounds/foundation-map.webp');
    expect(visuals.characters.lim_junho).toMatchObject({
      character_id: 'lim_junho',
      map_uri: 'assets/episode01/characters/lim-junho-map.webp',
      portrait_uri: 'assets/episode01/characters/lim-junho-portrait.webp',
    });
    expect(visuals.characters.kang_taesik?.map_uri).toBeUndefined();
    expect(visuals.characters.kang_taesik?.accent).toBe('#b99b76');
  });

  it('falls back cleanly when no production files are registered', () => {
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
