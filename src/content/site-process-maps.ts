import raw from '../../content/defense/site-process-maps-v1.json';
import type { DefenseContent, DefenseMapDefinition, DefensePad, DefensePoint, DefenseTowerId } from '../domain/defense';
import type {
  SiteInterventionAnchor, SiteProcessMapDefinition, SiteRouteDefinition, SiteRouteKind,
  SiteVisibilityZoneDefinition, SiteVerticalTransferDefinition, SiteZoneDefinition, SiteZoneKind,
  VerticalTransferKind,
} from '../domain/site-process-map';
import { siteProfileById } from './site-profiles';
import { validateDefenseContent, zeroBreachContent } from './defense';

const ROUTE_KINDS = new Set<SiteRouteKind>(['vehicle','worker','material']);
const ZONE_KINDS = new Set<SiteZoneKind>([
  'EXCAVATION','UNDER_SLAB','LOGISTICS_CONFLICT','LOW_VISIBILITY','OPENING','MATERIAL_STAGING','RESTRICTED',
  'EXISTING_STRUCTURE','TEMP_SUPPORT','EXTENSION_CONNECTION',
]);
const TRANSFER_KINDS = new Set<VerticalTransferKind>(['RAMP','MUCK_OPENING','STAIR','LIFT_OPENING']);
const TOWER_IDS = new Set<DefenseTowerId>(['PULSE','BURST','CONTROL','SENSOR']);
const RISK_IDS = new Set(['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS']);

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
function point(value: unknown, path: string): DefensePoint {
  if (!object(value) || !finite(value.x) || !finite(value.y)) throw new Error(`${path}: point required`);
  return Object.freeze({ x: value.x, y: value.y });
}
function points(value: unknown, path: string, min = 2): readonly DefensePoint[] {
  if (!Array.isArray(value) || value.length < min) throw new Error(`${path}: at least ${min} points required`);
  return Object.freeze(value.map((item, index) => point(item, `${path}[${index}]`)));
}
function pad(value: unknown, path: string): DefensePad {
  const p = point(value, path);
  if (!object(value) || typeof value.id !== 'string' || !value.id) throw new Error(`${path}.id required`);
  return Object.freeze({ id: value.id, x: p.x, y: p.y });
}
function route(value: unknown, path: string): SiteRouteDefinition {
  if (!object(value) || typeof value.id !== 'string' || !value.id || !ROUTE_KINDS.has(value.kind as SiteRouteKind)) {
    throw new Error(`${path}: invalid route`);
  }
  return Object.freeze({
    id: value.id,
    kind: value.kind as SiteRouteKind,
    points: points(value.points, `${path}.points`),
  });
}
function zone(value: unknown, path: string): SiteZoneDefinition {
  if (!object(value) || typeof value.id !== 'string' || !value.id || typeof value.label !== 'string' || !value.label
    || !ZONE_KINDS.has(value.kind as SiteZoneKind)) throw new Error(`${path}: invalid zone`);
  return Object.freeze({
    id: value.id,
    kind: value.kind as SiteZoneKind,
    label: value.label,
    points: points(value.points, `${path}.points`, 3),
  });
}
function visibility(value: unknown, path: string): SiteVisibilityZoneDefinition {
  if (!object(value) || typeof value.id !== 'string' || !value.id || typeof value.label !== 'string' || !value.label
    || !finite(value.radius) || value.radius <= 0 || !finite(value.severity) || value.severity < 0 || value.severity > 1) {
    throw new Error(`${path}: invalid visibility zone`);
  }
  return Object.freeze({
    id: value.id,
    label: value.label,
    center: point(value.center, `${path}.center`),
    radius: value.radius,
    severity: value.severity,
  });
}
function transfer(value: unknown, path: string): SiteVerticalTransferDefinition {
  if (!object(value) || typeof value.id !== 'string' || !value.id || typeof value.label !== 'string' || !value.label
    || !TRANSFER_KINDS.has(value.kind as VerticalTransferKind)) throw new Error(`${path}: invalid vertical transfer`);
  return Object.freeze({
    id: value.id,
    kind: value.kind as VerticalTransferKind,
    label: value.label,
    point: point(value.point, `${path}.point`),
  });
}
function anchor(value: unknown, path: string): SiteInterventionAnchor {
  const p = point(value, path);
  if (!object(value) || typeof value.id !== 'string' || !value.id || typeof value.label !== 'string' || !value.label
    || typeof value.reason !== 'string' || !value.reason || !TOWER_IDS.has(value.recommendedTower as DefenseTowerId)) {
    throw new Error(`${path}: invalid intervention anchor`);
  }
  return Object.freeze({
    id: value.id,
    x: p.x,
    y: p.y,
    recommendedTower: value.recommendedTower as DefenseTowerId,
    label: value.label,
    reason: value.reason,
  });
}
function unique(items: readonly { readonly id: string }[], path: string) {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`${path}: duplicate id ${item.id}`);
    ids.add(item.id);
  }
}
function inside(p: DefensePoint, width: number, height: number): boolean {
  return p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height;
}
function parseMap(value: unknown, index: number): SiteProcessMapDefinition {
  const path = `site process maps[${index}]`;
  if (!object(value) || typeof value.id !== 'string' || !value.id || typeof value.siteProfileId !== 'string'
    || !siteProfileById(value.siteProfileId) || typeof value.label !== 'string' || !value.label
    || value.width !== 1000 || value.height !== 600 || typeof value.primaryDefenseRouteId !== 'string') {
    throw new Error(`${path}: invalid map header`);
  }
  const routes = Array.isArray(value.routes) ? value.routes.map((item, i) => route(item, `${path}.routes[${i}]`)) : [];
  const pads = Array.isArray(value.pads) ? value.pads.map((item, i) => pad(item, `${path}.pads[${i}]`)) : [];
  const zones = Array.isArray(value.zones) ? value.zones.map((item, i) => zone(item, `${path}.zones[${i}]`)) : [];
  const visibilityZones = Array.isArray(value.visibilityZones)
    ? value.visibilityZones.map((item, i) => visibility(item, `${path}.visibilityZones[${i}]`)) : [];
  const verticalTransfers = Array.isArray(value.verticalTransfers)
    ? value.verticalTransfers.map((item, i) => transfer(item, `${path}.verticalTransfers[${i}]`)) : [];
  const interventionAnchors = Array.isArray(value.interventionAnchors)
    ? value.interventionAnchors.map((item, i) => anchor(item, `${path}.interventionAnchors[${i}]`)) : [];
  unique(routes, `${path}.routes`); unique(pads, `${path}.pads`); unique(zones, `${path}.zones`);
  unique(visibilityZones, `${path}.visibilityZones`); unique(verticalTransfers, `${path}.verticalTransfers`);
  unique(interventionAnchors, `${path}.interventionAnchors`);
  const primary = routes.find(item => item.id === value.primaryDefenseRouteId);
  if (!primary || primary.kind !== 'vehicle') throw new Error(`${path}: primary defense route must reference vehicle route`);
  for (const p of [...routes.flatMap(item => item.points), ...pads, ...zones.flatMap(item => item.points),
    ...visibilityZones.map(item => item.center), ...verticalTransfers.map(item => item.point), ...interventionAnchors]) {
    if (!inside(p, 1000, 600)) throw new Error(`${path}: point outside 1000x600 board`);
  }
  const rawModifiers = object(value.baseRiskModifiers) ? value.baseRiskModifiers : {};
  const baseRiskModifiers: Partial<Record<'NORMAL'|'SWIFT'|'ARMORED'|'SWARM'|'VEILED'|'BOSS', number>> = {};
  for (const [key, rawValue] of Object.entries(rawModifiers)) {
    if (!RISK_IDS.has(key) || !finite(rawValue) || rawValue < -30 || rawValue > 30) {
      throw new Error(`${path}.baseRiskModifiers.${key}: -30..30 required`);
    }
    baseRiskModifiers[key as keyof typeof baseRiskModifiers] = rawValue;
  }
  return Object.freeze({
    id: value.id,
    siteProfileId: value.siteProfileId,
    label: value.label,
    width: 1000,
    height: 600,
    primaryDefenseRouteId: value.primaryDefenseRouteId,
    routes: Object.freeze(routes),
    pads: Object.freeze(pads),
    zones: Object.freeze(zones),
    visibilityZones: Object.freeze(visibilityZones),
    verticalTransfers: Object.freeze(verticalTransfers),
    interventionAnchors: Object.freeze(interventionAnchors),
    baseRiskModifiers: Object.freeze(baseRiskModifiers),
  });
}

if (!object(raw) || raw.schemaVersion !== 1 || !Array.isArray(raw.maps)) {
  throw new Error('site-process-maps-v1.json: schemaVersion 1 and maps[] required');
}

export const siteProcessMaps: readonly SiteProcessMapDefinition[] = Object.freeze(raw.maps.map(parseMap));

export function siteProcessMapByProfile(profileId: string): SiteProcessMapDefinition | undefined {
  return siteProcessMaps.find(map => map.siteProfileId === profileId);
}

export function siteProcessMapByMapId(mapId: string): SiteProcessMapDefinition | undefined {
  return siteProcessMaps.find(map => map.id === mapId);
}

export function siteScenarioId(profileId: string): string {
  return `training-site:${profileId}`;
}

export function defenseMapFromSiteProcessMap(siteMap: SiteProcessMapDefinition): DefenseMapDefinition {
  const primary = siteMap.routes.find(route => route.id === siteMap.primaryDefenseRouteId)!;
  return Object.freeze({
    id: siteMap.id,
    width: siteMap.width,
    height: siteMap.height,
    path: Object.freeze(primary.points.map(p => Object.freeze([p.x, p.y] as const))),
    pads: siteMap.pads,
  });
}

export function defenseContentForSiteProfile(
  profileId: string,
  base: DefenseContent = zeroBreachContent,
): DefenseContent {
  const siteMap = siteProcessMapByProfile(profileId);
  if (!siteMap) throw new Error(`No G5 site map for profile: ${profileId}`);
  const projectedMap = defenseMapFromSiteProcessMap(siteMap);
  const baseMap = base.map as DefenseMapDefinition & { readonly nameTextId?: string };
  const map = {
    ...projectedMap,
    nameTextId: baseMap.nameTextId ?? 'defense.map.ramp-01.name',
  };
  return validateDefenseContent({
    ...base,
    contentVersion: `${base.contentVersion}+g5-map-family-01`,
    balanceStatus: 'G5_MAP_FAMILY_TOPOLOGY_PROOF',
    map,
    scenario: {
      ...base.scenario,
      id: siteScenarioId(profileId),
      mapId: map.id,
      eventId: null,
      eventContentVersion: null,
      mainStoryStatRewards: [],
    },
  });
}

export const siteDefenseContents: readonly DefenseContent[] = Object.freeze(
  siteProcessMaps.map(map => defenseContentForSiteProfile(map.siteProfileId)),
);

export function siteDefenseContentForScenario(scenarioId: string): DefenseContent | undefined {
  return siteDefenseContents.find(content => content.scenario.id === scenarioId);
}
