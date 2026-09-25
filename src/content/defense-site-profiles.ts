import raw from '../../content/defense/site-profiles-v1.json';
import ko from '../../content/localization/defense-ko.json';
import type { DefenseEnemyId } from '../domain/defense';
import {
  constructionMethodMatchesProject,
  type ConstructionMethod,
  type EnergyState,
  type ProcessPhase,
  type ProjectArchetype,
  type SiteProfileDefinition,
  type VerticalLayer,
} from '../domain/defense-site-profile';

const RISK_IDS: readonly DefenseEnemyId[] = ['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS'];
const PROJECTS: readonly ProjectArchetype[] = ['APT_NEW_BUILD','APT_REMODEL','DATA_CENTER'];
const METHODS: readonly ConstructionMethod[] = [
  'BOTTOM_UP','TOP_DOWN','HORIZONTAL_EXTENSION','VERTICAL_EXTENSION',
  'STRUCTURAL_RECONFIGURATION','CONVENTIONAL','PHASED','MODULAR_PHASED',
];
const PHASES: readonly ProcessPhase[] = [
  'EXCAVATION','FOUNDATION_BASEMENT','RC_FRAME','ENVELOPE_MEP_FINISH',
  'TOP_SLAB','UNDER_SLAB_EXCAVATION','CONCURRENT_ABOVE_BELOW',
  'SURVEY_ISOLATION','SELECTIVE_DEMOLITION','STRUCTURAL_REINFORCEMENT',
  'EXTENSION_CONNECTION','MEP_REROUTE_FINISH','CIVIL_STRUCTURE','MEP_ROUGH_IN',
  'ELECTRICAL_UPS_BATTERY','COOLING_PLANT','WHITE_SPACE','COMMISSIONING_ENERGIZATION',
];
const LAYERS: readonly VerticalLayer[] = ['SURFACE','B1','B2','TYPICAL_FLOOR','ROOF_PLANT','SYSTEM_VIEW'];
const ENERGY: readonly EnergyState[] = ['NOT_INSTALLED','INSTALLED','TESTING','ENERGIZED','LOCKED_OUT','LIVE_CRITICAL'];
const textIds = new Set(Object.keys((ko as { messages: Record<string,string> }).messages));

const isRecord = (value: unknown): value is Record<string,unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const unit = (value: unknown): value is number => isFiniteNumber(value) && value >= 0 && value <= 1;
const str = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

export class SiteProfileContentError extends Error {
  constructor(readonly issues: readonly string[]) {
    super(`Invalid site profile content:\n${issues.join('\n')}`);
  }
}

export interface SiteProfileRegistry {
  readonly schemaVersion: 1;
  readonly status: string;
  readonly scoreNotice: 'GAME_PRIORITY_ONLY_NOT_STATUTORY_RISK_ASSESSMENT';
  readonly profiles: readonly SiteProfileDefinition[];
  readonly scenarioDefaults: Readonly<Record<string,string>>;
}

export function validateSiteProfiles(input: unknown): SiteProfileRegistry {
  const issues: string[] = [];
  if (!isRecord(input) || input.schemaVersion !== 1 || !Array.isArray(input.profiles) || !isRecord(input.scenarioDefaults)) {
    throw new SiteProfileContentError(['root: schemaVersion 1, profiles[], and scenarioDefaults required']);
  }
  if (input.scoreNotice !== 'GAME_PRIORITY_ONLY_NOT_STATUTORY_RISK_ASSESSMENT') {
    issues.push('root.scoreNotice: statutory-risk separation notice required');
  }

  const profiles: SiteProfileDefinition[] = [];
  const ids = new Set<string>();
  for (const [index,value] of input.profiles.entries()) {
    const path = `profiles[${index}]`;
    if (!isRecord(value)) { issues.push(`${path}: object required`); continue; }
    const project = value.projectArchetype;
    const method = value.constructionMethod;
    const phase = value.processPhase;
    if (!str(value.id)) issues.push(`${path}.id: required`);
    if (!PROJECTS.includes(project as ProjectArchetype)) issues.push(`${path}.projectArchetype: invalid`);
    if (!METHODS.includes(method as ConstructionMethod)) issues.push(`${path}.constructionMethod: invalid`);
    if (!PHASES.includes(phase as ProcessPhase)) issues.push(`${path}.processPhase: invalid`);
    if (PROJECTS.includes(project as ProjectArchetype) && METHODS.includes(method as ConstructionMethod)
      && !constructionMethodMatchesProject(project as ProjectArchetype, method as ConstructionMethod)) {
      issues.push(`${path}: construction method does not match project archetype`);
    }
    for (const key of ['labelTextId','methodTextId','phaseTextId'] as const) {
      if (!str(value[key]) || !textIds.has(String(value[key]))) issues.push(`${path}.${key}: missing localization`);
    }
    if (!isRecord(value.baseRiskModifiers)) issues.push(`${path}.baseRiskModifiers: required`);
    else for (const riskId of RISK_IDS) {
      const score = value.baseRiskModifiers[riskId];
      if (!isFiniteNumber(score) || score < -50 || score > 50) issues.push(`${path}.baseRiskModifiers.${riskId}: -50..50 required`);
    }

    if (!isRecord(value.defaults)) issues.push(`${path}.defaults: required`);
    else {
      if (!LAYERS.includes(value.defaults.verticalLayer as VerticalLayer)) issues.push(`${path}.defaults.verticalLayer: invalid`);
      for (const key of ['uncertainty','concurrency','logisticsCongestion','timePressure','asBuiltConfidence'] as const) {
        if (!unit(value.defaults[key])) issues.push(`${path}.defaults.${key}: 0..1 required`);
      }
      if (!ENERGY.includes(value.defaults.energyState as EnergyState)) issues.push(`${path}.defaults.energyState: invalid`);
    }

    if (!str(value.id) || !PROJECTS.includes(project as ProjectArchetype)
      || !METHODS.includes(method as ConstructionMethod) || !PHASES.includes(phase as ProcessPhase)
      || !isRecord(value.baseRiskModifiers) || !isRecord(value.defaults)) continue;
    if (ids.has(value.id)) issues.push(`${path}.id: duplicate ${value.id}`);
    ids.add(value.id);

    profiles.push({
      id:value.id,
      projectArchetype:project as ProjectArchetype,
      constructionMethod:method as ConstructionMethod,
      processPhase:phase as ProcessPhase,
      labelTextId:String(value.labelTextId),
      methodTextId:String(value.methodTextId),
      phaseTextId:String(value.phaseTextId),
      baseRiskModifiers:Object.fromEntries(RISK_IDS.map(id => [id, Number(value.baseRiskModifiers?.[id] ?? 0)])) as Record<DefenseEnemyId,number>,
      defaults:{
        verticalLayer:value.defaults.verticalLayer as VerticalLayer,
        uncertainty:Number(value.defaults.uncertainty),
        concurrency:Number(value.defaults.concurrency),
        logisticsCongestion:Number(value.defaults.logisticsCongestion),
        timePressure:Number(value.defaults.timePressure),
        asBuiltConfidence:Number(value.defaults.asBuiltConfidence),
        energyState:value.defaults.energyState as EnergyState,
      },
    });
  }

  const scenarioDefaults: Record<string,string> = {};
  for (const [scenarioId,profileId] of Object.entries(input.scenarioDefaults)) {
    if (!str(profileId) || !ids.has(profileId)) issues.push(`scenarioDefaults.${scenarioId}: unknown profile ${String(profileId)}`);
    else scenarioDefaults[scenarioId] = profileId;
  }

  if (!profiles.some(profile => profile.projectArchetype === 'APT_NEW_BUILD')) issues.push('profiles: APT_NEW_BUILD required');
  if (!profiles.some(profile => profile.projectArchetype === 'APT_REMODEL')) issues.push('profiles: APT_REMODEL required');
  if (!profiles.some(profile => profile.projectArchetype === 'DATA_CENTER')) issues.push('profiles: DATA_CENTER required');

  if (issues.length) throw new SiteProfileContentError(issues);
  return Object.freeze({
    schemaVersion:1,
    status:String(input.status ?? 'UNSPECIFIED'),
    scoreNotice:'GAME_PRIORITY_ONLY_NOT_STATUTORY_RISK_ASSESSMENT',
    profiles:Object.freeze(profiles),
    scenarioDefaults:Object.freeze(scenarioDefaults),
  });
}

export const siteProfileRegistry = validateSiteProfiles(raw);

export function siteProfileById(id: string): SiteProfileDefinition | undefined {
  return siteProfileRegistry.profiles.find(profile => profile.id === id);
}

export function siteProfileForScenario(scenarioId: string): SiteProfileDefinition {
  const profileId = siteProfileRegistry.scenarioDefaults[scenarioId]
    ?? siteProfileRegistry.scenarioDefaults['training-ramp-v1'];
  const profile = profileId ? siteProfileById(profileId) : undefined;
  if (!profile) throw new Error(`No site profile for scenario: ${scenarioId}`);
  return profile;
}
