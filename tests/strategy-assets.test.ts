import { describe, expect, it } from 'vitest';
import { createEpisode01Registry } from '../src/content/episode01';
import { characterPortraitUri, projectStrategyVisualAssets } from '../src/app/strategy-assets';
import { visualAssetTier } from '../src/ui/VisualSlot';

const available: Readonly<Record<string, string>> = {
  'ep01.background.foundation.map': 'assets/episode01/backgrounds/foundation-map.webp',
  'ep01.background.scaffold.map': 'assets/episode01/backgrounds/scaffold-map.webp',
  'ep01.character.lim_junho.map': 'assets/episode01/characters/lim-junho-map.webp',
  'ep01.character.lim_junho.portrait': 'assets/episode01/characters/lim-junho-portrait.webp',
  'ep01.scene_element.material_stack': 'assets/episode01/scene-elements/material-stack.webp',
  'ep01.scene_element.access_barrier': 'assets/episode01/scene-elements/access-barrier.webp',
  'ep01.scene_element.vehicle_overlap': 'assets/episode01/scene-elements/vehicle-overlap.webp',
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

  it('supports mixed final and RC character tiers while production art lands in batches', () => {
    const mixedAvailable: Readonly<Record<string, string>> = {
      'ep01.character.player.map': 'assets/episode01/characters/player-map.webp',
      'ep01.character.player.portrait': 'assets/episode01/characters/player-portrait.webp',
      'ep01.character.kang_taesik.map': 'assets/episode01/characters/kang-taesik-map.webp',
      'ep01.character.kang_taesik.portrait': 'assets/episode01/characters/kang-taesik-portrait.webp',
      'ep01.character.lim_junho.map': 'assets/episode01/characters/lim-junho-map-rc.svg',
      'ep01.character.lim_junho.portrait': 'assets/episode01/characters/lim-junho-portrait-rc.svg',
    };
    const mixedResolve = (id: string) => mixedAvailable[id];
    const art = projectStrategyVisualAssets(['player', 'kang_taesik', 'lim_junho'], mixedResolve);

    expect(visualAssetTier(art.characters.player?.map_uri)).toBe('final');
    expect(visualAssetTier(art.characters.player?.portrait_uri)).toBe('final');
    expect(visualAssetTier(art.characters.kang_taesik?.map_uri)).toBe('final');
    expect(visualAssetTier(art.characters.kang_taesik?.portrait_uri)).toBe('final');
    expect(visualAssetTier(art.characters.lim_junho?.map_uri)).toBe('rc');
    expect(visualAssetTier(art.characters.lim_junho?.portrait_uri)).toBe('rc');

    expect(art.characters.player?.map_uri).toContain('player-map.webp');
    expect(art.characters.kang_taesik?.portrait_uri).toContain('kang-taesik-portrait.webp');
    expect(art.characters.lim_junho?.map_uri).toContain('lim-junho-map-rc.svg');
  });

  it('lets a scene recipe select a reusable background without changing character bindings', () => {
    const visuals = projectStrategyVisualAssets(
      ['lim_junho'],
      resolve,
      'ep01.background.scaffold.map',
    );
    expect(visuals.background_uri).toBe('assets/episode01/backgrounds/scaffold-map.webp');
    expect(visuals.characters.lim_junho?.map_uri).toBe('assets/episode01/characters/lim-junho-map.webp');
  });

  it('promotes final scene-element WebPs with catalog pivots and map scales', () => {
    const visuals = projectStrategyVisualAssets([], resolve);
    expect(visuals.scene_elements?.['scene.prop.material_stack']).toEqual({
      element_id: 'scene.prop.material_stack',
      uri: 'assets/episode01/scene-elements/material-stack.webp',
      pivot_x: 0.5,
      pivot_y: 0.94,
      map_max_px: 132,
    });
    expect(visuals.scene_elements?.['scene.control.access_barrier']).toBeUndefined();
    expect(visuals.scene_elements?.['scene.hazard.vehicle_overlap']).toBeUndefined();
    expect(visuals.scene_elements?.['scene.hazard.harness_unclipped']).toBeUndefined();
  });

  it('uses integrated production art through the registry without changing asset identities', () => {
    const registry = createEpisode01Registry();
    const content = registry.getValidatedContent();
    expect(content.asset_manifest.assets.length).toBeGreaterThanOrEqual(48);

    expect(registry.getAsset('ep01.background.foundation.map')?.variants[0]?.uri)
      .toBe('assets/episode01/backgrounds/foundation-map.webp');
    expect(registry.getAsset('ep01.scene_element.material_stack')?.variants[0]?.uri)
      .toBe('assets/episode01/scene-elements/material-stack.webp');
    expect(registry.getAsset('ep01.scene_element.access_barrier')?.variants[0]?.uri)
      .toBe('assets/episode01/scene-elements/access-barrier.webp');
    expect(registry.getAsset('ep01.scene_element.vehicle_overlap')?.variants[0]?.uri)
      .toBe('assets/episode01/scene-elements/vehicle-overlap.webp');

    const art = projectStrategyVisualAssets(cast, id => registry.getAsset(id)?.variants[0]?.uri);
    expect(art.background_uri).toBe('assets/episode01/backgrounds/foundation-map.webp');
    expect(art.scene_elements?.['scene.prop.material_stack']).toMatchObject({
      element_id: 'scene.prop.material_stack',
      uri: 'assets/episode01/scene-elements/material-stack.webp',
      pivot_x: 0.5,
      pivot_y: 0.94,
      map_max_px: 132,
    });
    expect(art.scene_elements?.['scene.control.access_barrier']).toBeUndefined();
    expect(art.scene_elements?.['scene.hazard.vehicle_overlap']).toBeUndefined();

    for (const characterId of cast) {
      const file = characterId.replaceAll('_', '-');
      expect(art.characters[characterId]?.portrait_uri).toBe(`assets/episode01/characters/${file}-portrait.webp`);
      expect(art.characters[characterId]?.map_uri).toBe(`assets/episode01/characters/${file}-map.webp`);
    }

  });

  it('still falls back cleanly when no production files are registered', () => {
    const visuals = projectStrategyVisualAssets(['kang_taesik'], () => undefined);
    expect(visuals.background_uri).toBeUndefined();
    expect(visuals.characters.kang_taesik?.map_uri).toBeUndefined();
    expect(visuals.characters.kang_taesik?.portrait_uri).toBeUndefined();
    expect(visuals.scene_elements).toBeUndefined();
  });

  it('uses the same planned portrait binding for dialogue cards', () => {
    expect(characterPortraitUri('lim_junho', resolve)).toBe('assets/episode01/characters/lim-junho-portrait.webp');
    expect(characterPortraitUri('seo_jeongmin', resolve)).toBeUndefined();
  });
});
