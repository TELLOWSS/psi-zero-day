import scenePlan from '../../content/episode01/scene-composition.json';
import type { Id } from '../domain/common';
import { projectEpisode01SceneElements } from './strategy-scene-elements';
import type { StrategySceneElement } from './strategy-scene-elements';
import type { StrategySignal } from './strategy-signals';

export type StrategySceneLayer = 'background' | 'characters' | 'elements' | 'signals' | 'pressures' | 'dialogue';
export type StrategySceneAnchor = 'overview' | 'yard' | 'entry' | 'core' | 'ramp' | 'gate' | 'inspection' | 'office';

export interface StrategySceneComposition {
  readonly scene_id: Id;
  readonly event_id: Id | null;
  readonly background_asset_id: Id;
  readonly environment: string;
  readonly primary_anchor: StrategySceneAnchor;
  readonly active_layers: readonly StrategySceneLayer[];
  readonly hazard_signal_ids: readonly Id[];
  readonly elements?: readonly StrategySceneElement[];
}

type SceneRecipe = {
  readonly scene_id: string;
  readonly background_asset_id: string;
  readonly environment: string;
  readonly primary_anchor: StrategySceneAnchor;
  readonly active_layers: readonly StrategySceneLayer[];
};

const defaultRecipe = scenePlan.default_scene as SceneRecipe;
const eventRecipes = scenePlan.events as Readonly<Record<string, SceneRecipe>>;

/**
 * Presentation-only scene recipe. Gameplay rules remain in the engine; this layer simply tells
 * the UI how to compose reusable background, character, physical element, signal, pressure and
 * dialogue layers.
 */
export function projectEpisode01Scene(
  activeEventId: Id | null,
  signals: readonly StrategySignal[],
): StrategySceneComposition {
  const recipe = activeEventId ? (eventRecipes[activeEventId] ?? defaultRecipe) : defaultRecipe;
  const elements = projectEpisode01SceneElements(activeEventId);
  return Object.freeze({
    scene_id: recipe.scene_id,
    event_id: activeEventId,
    background_asset_id: recipe.background_asset_id,
    environment: recipe.environment,
    primary_anchor: recipe.primary_anchor,
    active_layers: Object.freeze([...recipe.active_layers]),
    hazard_signal_ids: Object.freeze(signals.map(signal => signal.signal_id)),
    elements,
  });
}
