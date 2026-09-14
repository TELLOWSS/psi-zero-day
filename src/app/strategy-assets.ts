import visuals from '../../content/episode01/visuals.json';
import type { Id } from '../domain';

export interface StrategyCharacterVisual {
  readonly character_id: Id;
  readonly portrait_uri?: string;
  readonly map_uri?: string;
  readonly accent: string;
}

export interface StrategyVisualAssets {
  readonly background_uri?: string;
  readonly characters: Readonly<Record<Id, StrategyCharacterVisual>>;
}

type AssetResolver = (assetId: string) => string | undefined;

type CharacterVisualPlan = {
  readonly portrait_asset_id: string;
  readonly map_asset_id: string;
  readonly accent: string;
};

/**
 * Presentation-only resolver. Asset IDs are authored in visuals.json and are resolved through
 * the validated content asset manifest. Missing art cleanly falls back to CSS silhouettes/map.
 */
export function projectStrategyVisualAssets(characterIds: readonly Id[], resolve: AssetResolver): StrategyVisualAssets {
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

  const backgroundUri = episode01BackgroundUri(resolve);
  return Object.freeze({
    ...(backgroundUri ? { background_uri: backgroundUri } : {}),
    characters: Object.freeze(characters),
  });
}

export function characterPortraitUri(characterId: Id, resolve: AssetResolver): string | undefined {
  const plan = (visuals.characters as Readonly<Record<string, CharacterVisualPlan>>)[characterId];
  return plan ? resolve(plan.portrait_asset_id) : undefined;
}

export function episode01BackgroundUri(resolve: AssetResolver): string | undefined {
  return resolve(visuals.backgrounds.foundation.map_asset_id);
}
