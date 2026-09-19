import scenePlan from '../../content/episode01/scene-composition.json';
import { productionMapStyle, type ProductionMapAnchorId } from './production-map';

type SceneRecipe = {
  readonly primary_anchor: ProductionMapAnchorId;
};

const defaultRecipe = scenePlan.default_scene as SceneRecipe;
const eventRecipes = scenePlan.events as Readonly<Record<string, SceneRecipe>>;

export interface Episode01ImmersiveLocator {
  readonly anchor: ProductionMapAnchorId;
  readonly marker_style: Readonly<{ left: string; top: string }>;
}

export function episode01ImmersiveLocator(
  eventId: string | null | undefined,
): Episode01ImmersiveLocator | undefined {
  if (!eventId || eventId === 'e01_09_evening') return undefined;
  const recipe = eventRecipes[eventId] ?? defaultRecipe;
  return Object.freeze({
    anchor: recipe.primary_anchor,
    marker_style: productionMapStyle(recipe.primary_anchor, 'minimap'),
  });
}
