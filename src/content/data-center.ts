import raw from '../../content/defense/data-center-v1.json';
import type { DefenseContent } from '../domain/defense';
import type { DataCenterPhase, DataCenterScenarioDefinition, DataCenterRuntimeState } from '../domain/data-center';
import type { EnergyState } from '../domain/site-profile';
import { siteProfileById } from './site-profiles';
import { validateDefenseContent, zeroBreachContent } from './defense';
import { validateSiteProcessMap } from './site-process-maps';

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function stringValue(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

if (!object(raw) || raw.schemaVersion !== 1 || !object(raw.scenario)) {
  throw new Error('data-center-v1.json: schemaVersion 1 and scenario required');
}

const scenarioRaw = raw.scenario;
if (!stringValue(scenarioRaw.id) || !stringValue(scenarioRaw.label)
  || !object(scenarioRaw.profileIds) || !object(scenarioRaw.map)) {
  throw new Error('data-center-v1.json: invalid scenario');
}

const phaseIds = ['MEP_ROUGH_IN','ELECTRICAL_UPS','ENERGIZATION','INTEGRATED_COMMISSIONING'] as const;
const profileIds = {} as Record<(typeof phaseIds)[number], string>;
for (const phase of phaseIds) {
  const id = scenarioRaw.profileIds[phase];
  if (!stringValue(id) || !siteProfileById(id)) {
    throw new Error(`data-center-v1.json: missing profile for ${phase}`);
  }
  profileIds[phase] = id;
}

export const dataCenterScenario: DataCenterScenarioDefinition = Object.freeze({
  id: scenarioRaw.id,
  label: scenarioRaw.label,
  profileIds: Object.freeze(profileIds),
  map: validateSiteProcessMap(scenarioRaw.map, 0),
});

export function dataCenterProfileIdForPhase(phase: DataCenterPhase): string {
  if (phase === 'COMPLETE') return dataCenterScenario.profileIds.INTEGRATED_COMMISSIONING;
  return dataCenterScenario.profileIds[phase];
}

export function initialDataCenterState(): DataCenterRuntimeState {
  return Object.freeze({
    scenarioId: dataCenterScenario.id,
    phase: 'MEP_ROUGH_IN',
    energyState: 'NOT_INSTALLED' as EnergyState,
    isolationState: 'UNDEFINED',
    interlockState: 'UNVERIFIED',
    commissioningState: 'NOT_STARTED',
    crossTradeConcurrency: 'HIGH',
    completedActions: Object.freeze([]),
    revision: 0,
  });
}

export function dataCenterDefenseContent(base: DefenseContent = zeroBreachContent): DefenseContent {
  const primary = dataCenterScenario.map.routes.find(route => route.id === dataCenterScenario.map.primaryDefenseRouteId)!;
  const map = {
    id: dataCenterScenario.map.id,
    nameTextId: (base.map as typeof base.map & { readonly nameTextId?: string }).nameTextId ?? 'defense.map.ramp-01.name',
    width: dataCenterScenario.map.width,
    height: dataCenterScenario.map.height,
    path: primary.points.map(point => [point.x, point.y] as const),
    pads: dataCenterScenario.map.pads,
  };

  return validateDefenseContent({
    ...base,
    contentVersion: `${base.contentVersion}+g7-data-center-01`,
    balanceStatus: 'G7_DATA_CENTER_RUNTIME_PROOF',
    map,
    scenario: {
      ...base.scenario,
      id: dataCenterScenario.id,
      mapId: map.id,
      eventId: null,
      eventContentVersion: null,
      mainStoryStatRewards: [],
    },
  });
}

export const dataCenterDefense = dataCenterDefenseContent();
