import type { DefenseEnemyId, DefensePad, DefensePoint, DefenseTowerId } from './defense';

export type SiteRouteKind = 'vehicle' | 'worker' | 'material';
export type SiteZoneKind =
  | 'EXCAVATION'
  | 'UNDER_SLAB'
  | 'LOGISTICS_CONFLICT'
  | 'LOW_VISIBILITY'
  | 'OPENING'
  | 'MATERIAL_STAGING'
  | 'RESTRICTED'
  | 'EXISTING_STRUCTURE'
  | 'TEMP_SUPPORT'
  | 'EXTENSION_CONNECTION';

export type VerticalTransferKind = 'RAMP' | 'MUCK_OPENING' | 'STAIR' | 'LIFT_OPENING';

export interface SiteRouteDefinition {
  readonly id: string;
  readonly kind: SiteRouteKind;
  readonly points: readonly DefensePoint[];
}

export interface SiteZoneDefinition {
  readonly id: string;
  readonly kind: SiteZoneKind;
  readonly label: string;
  readonly points: readonly DefensePoint[];
}

export interface SiteVisibilityZoneDefinition {
  readonly id: string;
  readonly label: string;
  readonly center: DefensePoint;
  readonly radius: number;
  readonly severity: number;
}

export interface SiteVerticalTransferDefinition {
  readonly id: string;
  readonly kind: VerticalTransferKind;
  readonly label: string;
  readonly point: DefensePoint;
}

export interface SiteInterventionAnchor extends DefensePoint {
  readonly id: string;
  readonly recommendedTower: DefenseTowerId;
  readonly label: string;
  readonly reason: string;
}

export interface SiteProcessMapDefinition {
  readonly id: string;
  readonly siteProfileId: string;
  readonly label: string;
  readonly width: 1000;
  readonly height: 600;
  readonly primaryDefenseRouteId: string;
  readonly routes: readonly SiteRouteDefinition[];
  readonly pads: readonly DefensePad[];
  readonly zones: readonly SiteZoneDefinition[];
  readonly visibilityZones: readonly SiteVisibilityZoneDefinition[];
  readonly verticalTransfers: readonly SiteVerticalTransferDefinition[];
  readonly interventionAnchors: readonly SiteInterventionAnchor[];
  readonly baseRiskModifiers: Readonly<Partial<Record<DefenseEnemyId, number>>>;
}
