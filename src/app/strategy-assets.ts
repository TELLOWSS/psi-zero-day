import sceneElementCatalog from '../../content/episode01/scene-element-runtime.json';
import type { Id } from '../domain';
import {
  backgroundAssetUri,
  characterMapUri,
  characterPortraitUri,
  episode01BackgroundUri,
  projectCharacterVisualAssets,
  type AssetResolver,
  type StrategyCharacterVisual,
} from './episode-visual-assets';

export {
  backgroundAssetUri,
  characterMapUri,
  characterPortraitUri,
  episode01BackgroundUri,
  projectCharacterVisualAssets,
};
export type { AssetResolver, StrategyCharacterVisual };

export interface StrategySceneElementVisual {
  readonly element_id: Id;
  readonly uri: string;
  readonly pivot_x: number;
  readonly pivot_y: number;
  readonly map_max_px: number;
}

export interface StrategyVisualAssets {
  readonly background_uri?: string;
  readonly characters: Readonly<Record<Id, StrategyCharacterVisual>>;
  readonly scene_elements?: Readonly<Record<Id, StrategySceneElementVisual>>;
}

type SceneElementArtPlan = {
  readonly pivot: { readonly x: number; readonly y: number };
  readonly map_max_px: number;
};

type SceneElementPlan = {
  readonly element_id: Id;
  readonly planned_asset_id?: Id;
  readonly art?: SceneElementArtPlan;
};

const sceneElementPlans = sceneElementCatalog.elements as Readonly<Record<string, SceneElementPlan>>;

/**
 * Gameplay-only visual resolver. Heavy scene-element catalog stays behind the lazy
 * PlayableEpisode boundary; title/home code should import episode-visual-assets instead.
 */
export function projectStrategyVisualAssets(
  characterIds: readonly Id[],
  resolve: AssetResolver,
  backgroundAssetId?: Id,
): StrategyVisualAssets {
  const lite = projectCharacterVisualAssets(characterIds, resolve, backgroundAssetId);
  const sceneElementVisuals: Record<Id, StrategySceneElementVisual> = {};

  for (const definition of Object.values(sceneElementPlans)) {
    if (!definition.planned_asset_id || !definition.art) continue;
    const uri = resolve(definition.planned_asset_id);
    if (!uri) continue;
    sceneElementVisuals[definition.element_id] = Object.freeze({
      element_id: definition.element_id,
      uri,
      pivot_x: definition.art.pivot.x,
      pivot_y: definition.art.pivot.y,
      map_max_px: definition.art.map_max_px,
    });
  }

  return Object.freeze({
    ...lite,
    ...(Object.keys(sceneElementVisuals).length
      ? { scene_elements: Object.freeze(sceneElementVisuals) }
      : {}),
  });
}
