import raw from '../../content/defense/site-profiles-v1.json';
import type { DefenseEnemyId } from '../domain/defense';
import type { ConstructionMethod, ProcessPhase, ProjectArchetype, SiteProfileDefinition } from '../domain/site-profile';

const RISK_IDS: readonly DefenseEnemyId[] = ['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS'];
const PROJECTS: readonly ProjectArchetype[] = ['APT_NEW_BUILD','APT_REMODEL','DATA_CENTER'];
const METHODS: readonly ConstructionMethod[] = [
  'BOTTOM_UP','TOP_DOWN','HORIZONTAL_EXTENSION','VERTICAL_EXTENSION','STRUCTURAL_RECONFIGURATION',
  'CONVENTIONAL','PHASED','MODULAR_PHASED',
];
const PHASES: readonly ProcessPhase[] = [
  'EXCAVATION','RC_FRAME','UNDER_SLAB_EXCAVATION','CONCURRENT_ABOVE_BELOW','SURVEY_ISOLATION',
  'SELECTIVE_DEMOLITION','OLD_NEW_CONNECTION','MEP_ROUGH_IN','ELECTRICAL_UPS','COMMISSIONING',
];

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateProfile(value: unknown, index: number): SiteProfileDefinition {
  if (!object(value)) throw new Error(`site profiles[${index}]: object required`);
  const { id, projectArchetype, constructionMethod, processPhase, label, mapFamily, baseRiskScores } = value;
  if (typeof id !== 'string' || !id) throw new Error(`site profiles[${index}].id required`);
  if (!PROJECTS.includes(projectArchetype as ProjectArchetype)) throw new Error(`site profiles[${index}]: invalid projectArchetype`);
  if (!METHODS.includes(constructionMethod as ConstructionMethod)) throw new Error(`site profiles[${index}]: invalid constructionMethod`);
  if (!PHASES.includes(processPhase as ProcessPhase)) throw new Error(`site profiles[${index}]: invalid processPhase`);
  if (typeof label !== 'string' || !label || typeof mapFamily !== 'string' || !mapFamily) {
    throw new Error(`site profiles[${index}]: label/mapFamily required`);
  }
  if (!object(baseRiskScores)) throw new Error(`site profiles[${index}].baseRiskScores required`);
  const scores = {} as Record<DefenseEnemyId, number>;
  for (const riskId of RISK_IDS) {
    const score = baseRiskScores[riskId];
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100) {
      throw new Error(`site profiles[${index}].baseRiskScores.${riskId}: 0-100 required`);
    }
    scores[riskId] = score;
  }
  return Object.freeze({
    id,
    projectArchetype: projectArchetype as ProjectArchetype,
    constructionMethod: constructionMethod as ConstructionMethod,
    processPhase: processPhase as ProcessPhase,
    label,
    mapFamily,
    baseRiskScores: Object.freeze(scores),
  });
}

if (!object(raw) || raw.schemaVersion !== 1 || !Array.isArray(raw.profiles)) {
  throw new Error('site-profiles-v1.json: schemaVersion 1 and profiles[] required');
}

export const siteProfiles: readonly SiteProfileDefinition[] = Object.freeze(raw.profiles.map(validateProfile));
export const defaultSiteProfile = siteProfiles.find(profile => profile.id === 'apt-new-bottom-up-rc-frame') ?? siteProfiles[0]!;

export function siteProfileById(id: string): SiteProfileDefinition | undefined {
  return siteProfiles.find(profile => profile.id === id);
}

export function siteProfilesForProject(projectArchetype: ProjectArchetype): readonly SiteProfileDefinition[] {
  return siteProfiles.filter(profile => profile.projectArchetype === projectArchetype);
}
