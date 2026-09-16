import { describe, expect, it } from 'vitest';
import backgroundCatalog from '../content/episode01/background-catalog.json';
import sceneComposition from '../content/episode01/scene-composition.json';
import { backgroundAssetUri } from '../src/app/strategy-assets';

type BackgroundPlan = {
  readonly environment: string;
  readonly asset_id: string;
  readonly production_status: 'final' | 'planned';
  readonly fallback_asset_id: string | null;
  readonly reuse_for: readonly string[];
  readonly episode01_events: readonly string[];
};

const backgrounds = backgroundCatalog.backgrounds as Readonly<Record<string, BackgroundPlan>>;

describe('Reusable site background catalog', () => {
  it('locks the minimum five reusable construction environments', () => {
    expect(Object.keys(backgrounds)).toEqual([
      'foundation', 'typical_floor', 'scaffold', 'basement', 'lifting',
    ]);
    expect(backgrounds.foundation?.production_status).toBe('final');
    expect(backgrounds.foundation?.fallback_asset_id).toBeNull();

    for (const key of ['typical_floor', 'scaffold', 'basement', 'lifting'] as const) {
      expect(backgrounds[key]?.production_status).toBe('planned');
      expect(backgrounds[key]?.fallback_asset_id).toBe('ep01.background.foundation.map');
      expect(backgrounds[key]?.reuse_for.length).toBeGreaterThanOrEqual(5);
    }

    const assetIds = Object.values(backgrounds).map(item => item.asset_id);
    expect(new Set(assetIds).size).toBe(assetIds.length);
  });

  it('keeps every authored Episode 01 scene recipe inside the catalog contract', () => {
    const recipes = [sceneComposition.default_scene, ...Object.values(sceneComposition.events)];
    for (const recipe of recipes) {
      const catalogEntry = Object.values(backgrounds).find(item => item.environment === recipe.environment);
      expect(catalogEntry).toBeDefined();
      expect(catalogEntry?.asset_id).toBe(recipe.background_asset_id);
    }
  });

  it('falls back to Foundation until a planned background is registered', () => {
    const available: Readonly<Record<string, string>> = {
      'ep01.background.foundation.map': 'assets/episode01/backgrounds/foundation-map.webp',
    };
    const resolve = (assetId: string) => available[assetId];

    expect(backgroundAssetUri('ep01.background.scaffold.map', resolve))
      .toBe('assets/episode01/backgrounds/foundation-map.webp');
    expect(backgroundAssetUri('ep01.background.lifting.map', resolve))
      .toBe('assets/episode01/backgrounds/foundation-map.webp');
  });
});
