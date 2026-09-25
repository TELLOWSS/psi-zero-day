import raw from '../../content/defense/remodel-v1.json';
import type { DefenseContent } from '../domain/defense';
import type {
  AsBuiltConfidence, ConnectionState, IsolationState, RemodelAction, RemodelRuntimeState,
  RemodelScenarioDefinition, StructuralOpeningState, TempSupportState,
} from '../domain/remodel';
import { validateDefenseContent, zeroBreachContent } from './defense';
import { validateSiteProcessMap } from './site-process-maps';

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function stringValue(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

if (!object(raw) || raw.schemaVersion !== 1 || !object(raw.scenario)) {
  throw new Error('remodel-v1.json: schemaVersion 1 and scenario required');
}

const scenarioRaw = raw.scenario;
if (!stringValue(scenarioRaw.id) || !stringValue(scenarioRaw.profileId) || !stringValue(scenarioRaw.label)
  || !stringValue(scenarioRaw.legalScaleNote) || !object(scenarioRaw.riskHints) || !object(scenarioRaw.map)) {
  throw new Error('remodel-v1.json: invalid scenario');
}

export const remodelScenario: RemodelScenarioDefinition = Object.freeze({
  id: scenarioRaw.id,
  profileId: scenarioRaw.profileId,
  label: scenarioRaw.label,
  legalScaleNote: scenarioRaw.legalScaleNote,
  riskHints: Object.freeze({
    ...(typeof scenarioRaw.riskHints.NORMAL === 'number' ? { NORMAL: scenarioRaw.riskHints.NORMAL } : {}),
    ...(typeof scenarioRaw.riskHints.SWIFT === 'number' ? { SWIFT: scenarioRaw.riskHints.SWIFT } : {}),
    ...(typeof scenarioRaw.riskHints.ARMORED === 'number' ? { ARMORED: scenarioRaw.riskHints.ARMORED } : {}),
    ...(typeof scenarioRaw.riskHints.SWARM === 'number' ? { SWARM: scenarioRaw.riskHints.SWARM } : {}),
    ...(typeof scenarioRaw.riskHints.VEILED === 'number' ? { VEILED: scenarioRaw.riskHints.VEILED } : {}),
    ...(typeof scenarioRaw.riskHints.BOSS === 'number' ? { BOSS: scenarioRaw.riskHints.BOSS } : {}),
  }),
  map: validateSiteProcessMap(scenarioRaw.map, 0),
});

export function initialRemodelState(): RemodelRuntimeState {
  return Object.freeze({
    scenarioId: remodelScenario.id,
    phase: 'SURVEY_ISOLATION',
    asBuiltConfidence: 'LOW' as AsBuiltConfidence,
    isolationState: 'UNKNOWN' as IsolationState,
    tempSupportState: 'NOT_INSTALLED' as TempSupportState,
    structuralOpeningState: 'CLOSED' as StructuralOpeningState,
    connectionState: 'NOT_STARTED' as ConnectionState,
    completedActions: Object.freeze([] as RemodelAction[]),
    revision: 0,
  });
}

export function remodelDefenseContent(base: DefenseContent = zeroBreachContent): DefenseContent {
  const map = {
    id: remodelScenario.map.id,
    nameTextId: (base.map as typeof base.map & { readonly nameTextId?: string }).nameTextId ?? 'defense.map.ramp-01.name',
    width: remodelScenario.map.width,
    height: remodelScenario.map.height,
    path: remodelScenario.map.routes
      .find(route => route.id === remodelScenario.map.primaryDefenseRouteId)!
      .points.map(point => [point.x, point.y] as const),
    pads: remodelScenario.map.pads,
  };
  return validateDefenseContent({
    ...base,
    contentVersion: `${base.contentVersion}+g6-remodel-01`,
    balanceStatus: 'G6_REMODEL_RUNTIME_PROOF',
    map,
    scenario: {
      ...base.scenario,
      id: remodelScenario.id,
      mapId: map.id,
      eventId: null,
      eventContentVersion: null,
      mainStoryStatRewards: [],
    },
  });
}

export const remodelDefense = remodelDefenseContent();
