import backgroundCatalog from '../../content/episode01/background-catalog.json';
import visuals from '../../content/episode01/visuals.json';
import type { Id } from '../domain';
import type { StrategySceneElement } from './strategy-scene-elements';

export interface StrategyCharacterVisual {
  readonly character_id: Id;
  readonly portrait_uri?: string;
  readonly map_uri?: string;
  readonly accent: string;
}

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

type AssetResolver = (assetId: string) => string | undefined;

type CharacterVisualPlan = {
  readonly portrait_asset_id: string;
  readonly map_asset_id: string;
  readonly accent: string;
};

type BackgroundPlan = {
  readonly environment: string;
  readonly asset_id: string;
  readonly production_status: 'final' | 'planned';
  readonly fallback_asset_id: string | null;
};

const backgroundPlans = backgroundCatalog.backgrounds as Readonly<Record<string, BackgroundPlan>>;

/**
 * Presentation-only resolver. Asset IDs are authored in visuals.json / scene-composition.json
 * and are resolved through the validated content asset manifest. Planned site backgrounds may
 * explicitly fall back to an already registered background until their final art lands.
 * Scene elements intentionally use final WebP -> CSS placeholder with no RC SVG layer.
 */
export function projectStrategyVisualAssets(
  characterIds: readonly Id[],
  resolve: AssetResolver,
  backgroundAssetId: Id = visuals.backgrounds.foundation.map_asset_id,
  sceneElements: readonly StrategySceneElement[] = [],
): StrategyVisualAssets {
  const characters: Record<Id, StrategyCharacterVisual> = {};
  const plans = visuals.characters as Readonly<Record<string, CharacterVisualPlan>>;

  for (const characterId of characterIds) {
    const plan = plans[characterId];
    if (!plan) continue;
    const portraitUri = resolve(plan.portrait_asset_id);
    const mapUri = resolve(plan.map_asset_id);
    characters[characterId] = Object.freeze({
      character_id: characterId,
      ...(portraitUri ? { portrait_uri: portraitUri } : {}),
      ...(mapUri ? { map_uri: mapUri } : {}),
      accent: plan.accent,
    });
  }

  const sceneElementVisuals: Record<Id, StrategySceneElementVisual> = {};
  for (const element of sceneElements) {
    if (!element.planned_asset_id) continue;
    const uri = resolve(element.planned_asset_id);
    if (!uri) continue;
    sceneElementVisuals[element.element_id] = Object.freeze({
      element_id: element.element_id,
      uri,
      pivot_x: element.pivot?.x ?? 0.5,
      pivot_y: element.pivot?.y ?? 1,
      map_max_px: element.map_max_px ?? 128,
    });
  }

  const backgroundUri = backgroundAssetUri(backgroundAssetId, resolve);
  return Object.freeze({
    ...(backgroundUri ? { background_uri: backgroundUri } : {}),
    characters: Object.freeze(characters),
    ...(Object.keys(sceneElementVisuals).length
      ? { scene_elements: Object.freeze(sceneElementVisuals) }
      : {}),
  });
}

export function characterPortraitUri(characterId: Id, resolve: AssetResolver): string | undefined {
  const plan = (visuals.characters as Readonly<Record<string, CharacterVisualPlan>>)[characterId];
  return plan ? resolve(plan.portrait_asset_id) : undefined;
}

export function backgroundAssetUri(assetId: Id, resolve: AssetResolver): string | undefined {
  const direct = resolve(assetId);
  if (direct) return direct;

  const plan = Object.values(backgroundPlans).find(candidate => candidate.asset_id === assetId);
  return plan?.fallback_asset_id ? resolve(plan.fallback_asset_id) : undefined;
}

export function episode01BackgroundUri(resolve: AssetResolver): string | undefined {
  return backgroundAssetUri(visuals.backgrounds.foundation.map_asset_id, resolve);
}
