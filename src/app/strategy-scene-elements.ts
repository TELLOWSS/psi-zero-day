import elementCatalog from '../../content/episode01/scene-element-catalog.json';
import type { Id } from '../domain/common';
import type { StrategySceneAnchor } from './strategy-scene';

export type StrategySceneElementKind = 'hazard' | 'prop' | 'control';

export interface StrategySceneElementPivot {
  readonly x: number;
  readonly y: number;
}

export interface StrategySceneElement {
  readonly element_id: Id;
  readonly catalog_key: Id;
  readonly kind: StrategySceneElementKind;
  readonly label: string;
  readonly visual_token: string;
  readonly anchor: StrategySceneAnchor;
  readonly production_status: 'css-placeholder' | 'planned' | 'final';
  readonly planned_asset_id?: Id;
  readonly pivot?: StrategySceneElementPivot;
  readonly map_max_px?: number;
}

type ElementArtDefinition = {
  readonly path: string;
  readonly minimum_width: number;
  readonly minimum_height: number;
  readonly pivot: StrategySceneElementPivot;
  readonly map_max_px: number;
  readonly requires_alpha: true;
};

type ElementDefinition = {
  readonly element_id: string;
  readonly kind: StrategySceneElementKind;
  readonly label: string;
  readonly visual_token: string;
  readonly production_status: 'css-placeholder' | 'planned' | 'final';
  readonly planned_asset_id?: string;
  readonly art?: ElementArtDefinition;
  readonly reuse_for: readonly string[];
};

type EventElementPlacement = {
  readonly element_key: string;
  readonly anchor: StrategySceneAnchor;
};

const definitions = elementCatalog.elements as Readonly<Record<string, ElementDefinition>>;
const eventElements = elementCatalog.event_elements as Readonly<Record<string, readonly EventElementPlacement[]>>;

/**
 * Presentation-only physical scene elements. These are reusable visual props/hazards and do not
 * create new engine hazards, outcomes, or choices. Unknown catalog keys are ignored safely.
 */
export function projectEpisode01SceneElements(activeEventId: Id | null): readonly StrategySceneElement[] {
  if (!activeEventId) return Object.freeze([]);
  const placements = eventElements[activeEventId] ?? [];
  const projected: StrategySceneElement[] = [];

  for (const placement of placements) {
    const definition = definitions[placement.element_key];
    if (!definition) continue;
    projected.push(Object.freeze({
      element_id: definition.element_id,
      catalog_key: placement.element_key,
      kind: definition.kind,
      label: definition.label,
      visual_token: definition.visual_token,
      anchor: placement.anchor,
      production_status: definition.production_status,
      ...(definition.planned_asset_id ? { planned_asset_id: definition.planned_asset_id } : {}),
      ...(definition.art ? {
        pivot: Object.freeze({ ...definition.art.pivot }),
        map_max_px: definition.art.map_max_px,
      } : {}),
    }));
  }

  return Object.freeze(projected);
}
