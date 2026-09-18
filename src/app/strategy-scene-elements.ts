import elementCatalog from '../../content/episode01/scene-element-runtime.json';
import type { Id } from '../domain/common';
import type { StrategySceneAnchor } from './strategy-scene';

export type StrategySceneElementKind = 'hazard' | 'prop' | 'control';
export type StrategyLiftingLoadFamily = 'general_material' | 'gangform';
export type StrategyRiggingMethod = 'round_sling' | 'wire_rope';
export type StrategyHitchMethod = 'choker' | 'site_defined';
export type StrategyCapacityBasis = 'manufacturer_choker_wll' | 'work_plan_and_rated_capacity';
export type StrategyHarnessType = 'full_body';
export type StrategyLanyardConfiguration = 'twin_y';
export type StrategyFallConnectionIntent = 'continuous_attachment_during_transfer';
export type StrategyBrandingPolicy = 'no_logo_no_trademark';
export type StrategyMaterialDimensionGrouping = 'same_spec_only';
export type StrategyMaterialBindingMethod = 'center_ratchet_or_equivalent';
export type StrategyMaterialBindingPosition = 'center';
export type StrategyAccessBarrierForm = 'freestanding_modular';
export type StrategyAccessBarrierMaterial = 'high_visibility_polymer';
export type StrategyAccessBarrierStabilization = 'weighted_feet';
export type StrategyTrafficRenderMode = 'route_overlay';
export type StrategyVehiclePathStyle = 'wide_drive_path';
export type StrategyPedestrianPathStyle = 'narrow_walk_path';
export type StrategyTrafficConflictMarker = 'highlighted_overlap';
export type StrategyTrafficDirectionalMarkings = 'chevrons_and_lane_edges';

export interface StrategySceneElementPivot {
  readonly x: number;
  readonly y: number;
}

export interface StrategyLiftingProfile {
  readonly load_family: StrategyLiftingLoadFamily;
  readonly rigging_method: StrategyRiggingMethod;
  readonly hitch_method: StrategyHitchMethod;
  readonly capacity_basis: StrategyCapacityBasis;
  readonly wire_rope_diameter_mm: number | null;
  readonly site_practice_note: string;
  readonly safety_evaluation_note: string;
}

export interface StrategyFallProtectionProfile {
  readonly harness_type: StrategyHarnessType;
  readonly lanyard_configuration: StrategyLanyardConfiguration;
  readonly lanyard_count: 2;
  readonly hook_count: 2;
  readonly connection_intent: StrategyFallConnectionIntent;
  readonly design_reference: string;
  readonly branding_policy: StrategyBrandingPolicy;
  readonly site_practice_note: string;
  readonly safety_evaluation_note: string;
}

export interface StrategyStorageProfile {
  readonly dimension_grouping: StrategyMaterialDimensionGrouping;
  readonly mixed_dimensions_allowed: false;
  readonly binding_method: StrategyMaterialBindingMethod;
  readonly binding_position: StrategyMaterialBindingPosition;
  readonly site_practice_note: string;
  readonly safety_evaluation_note: string;
}

export interface StrategyAccessControlProfile {
  readonly barrier_form: StrategyAccessBarrierForm;
  readonly body_material: StrategyAccessBarrierMaterial;
  readonly stabilization: StrategyAccessBarrierStabilization;
  readonly reflective_marking: true;
  readonly integrated_text_allowed: false;
  readonly integrated_sign_allowed: false;
  readonly warning_lamps_allowed: false;
  readonly site_practice_note: string;
  readonly control_evaluation_note: string;
}

export interface StrategyTrafficConflictProfile {
  readonly render_mode: StrategyTrafficRenderMode;
  readonly vehicle_path_style: StrategyVehiclePathStyle;
  readonly pedestrian_path_style: StrategyPedestrianPathStyle;
  readonly conflict_marker: StrategyTrafficConflictMarker;
  readonly directional_markings: StrategyTrafficDirectionalMarkings;
  readonly vehicle_object_allowed: false;
  readonly pedestrian_object_allowed: false;
  readonly integrated_text_allowed: false;
  readonly branding_allowed: false;
  readonly site_practice_note: string;
  readonly safety_evaluation_note: string;
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
  readonly lifting_profile?: StrategyLiftingProfile;
  readonly fall_protection_profile?: StrategyFallProtectionProfile;
  readonly storage_profile?: StrategyStorageProfile;
  readonly access_control_profile?: StrategyAccessControlProfile;
  readonly traffic_conflict_profile?: StrategyTrafficConflictProfile;
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
  readonly lifting_profile?: StrategyLiftingProfile;
  readonly fall_protection_profile?: StrategyFallProtectionProfile;
  readonly storage_profile?: StrategyStorageProfile;
  readonly access_control_profile?: StrategyAccessControlProfile;
  readonly traffic_conflict_profile?: StrategyTrafficConflictProfile;
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
 * Lifting, fall-protection, storage, access-control, and traffic-conflict profiles describe authored
 * site/visual practice; they are not standalone safety verdicts.
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
      ...(definition.lifting_profile ? {
        lifting_profile: Object.freeze({ ...definition.lifting_profile }),
      } : {}),
      ...(definition.fall_protection_profile ? {
        fall_protection_profile: Object.freeze({ ...definition.fall_protection_profile }),
      } : {}),
      ...(definition.storage_profile ? {
        storage_profile: Object.freeze({ ...definition.storage_profile }),
      } : {}),
      ...(definition.access_control_profile ? {
        access_control_profile: Object.freeze({ ...definition.access_control_profile }),
      } : {}),
      ...(definition.traffic_conflict_profile ? {
        traffic_conflict_profile: Object.freeze({ ...definition.traffic_conflict_profile }),
      } : {}),
    }));
  }

  return Object.freeze(projected);
}
