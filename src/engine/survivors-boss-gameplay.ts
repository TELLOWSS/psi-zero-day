import gameplayJson from '../../content/design/survivors-boss-gameplay-v1.json';
import incidentJson from '../../content/design/survivors-boss-incidents-v1.json';
import { PATROL_STAGE_IDS, type PatrolStageId } from '../domain/patrol-survivors';
import type {
  BossCombatArchetype,
  BossEncounterTier,
  BossGameplayContent,
  BossGameplayDefinition,
  BossPrimarySkill,
} from '../domain/survivors-boss-gameplay';

const ARCHETYPES = new Set<BossCombatArchetype>(['ACTION','PATTERN','PUZZLE','SURVIVAL','MULTI','FINAL']);
const SKILLS = new Set<BossPrimarySkill>(['DODGE','POSITION','READ','TIMING','ROUTE','MASTERY']);
const TIERS = new Set<BossEncounterTier>(['REGULAR','MAJOR','CHAPTER','FINAL']);
const INCIDENT_BOSS_IDS = new Set(incidentJson.incidents.map(row => row.bossId));

function isStageId(value: string): value is PatrolStageId {
  return (PATROL_STAGE_IDS as readonly string[]).includes(value);
}

export function validateBossGameplayContent(value: unknown = gameplayJson): string[] {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') return ['content must be an object'];
  const root = value as { stages?: unknown; perceivedRatio?: { gameplay?: unknown; safetyExplanation?: unknown } };
  if (!Array.isArray(root.stages)) return ['stages must be an array'];
  if (root.stages.length !== PATROL_STAGE_IDS.length) errors.push(`expected 50 stages, got ${root.stages.length}`);

  const stageIds = new Set<string>();
  const bossIds = new Set<string>();

  for (const [index, raw] of root.stages.entries()) {
    if (!raw || typeof raw !== 'object') { errors.push(`stage[${index}] must be an object`); continue; }
    const row = raw as Record<string, unknown>;
    const label = typeof row.stageId === 'string' ? row.stageId : `stage[${index}]`;

    if (typeof row.stageId !== 'string' || !isStageId(row.stageId)) errors.push(`${label}: invalid stageId`);
    else if (stageIds.has(row.stageId)) errors.push(`${label}: duplicate stageId`);
    else stageIds.add(row.stageId);

    if (typeof row.bossId !== 'string' || !INCIDENT_BOSS_IDS.has(row.bossId)) errors.push(`${label}: bossId does not resolve to incident source`);
    else if (bossIds.has(row.bossId)) errors.push(`${label}: duplicate bossId`);
    else bossIds.add(row.bossId);

    if (typeof row.combatArchetype !== 'string' || !ARCHETYPES.has(row.combatArchetype as BossCombatArchetype)) errors.push(`${label}: invalid combatArchetype`);
    if (typeof row.primarySkill !== 'string' || !SKILLS.has(row.primarySkill as BossPrimarySkill)) errors.push(`${label}: invalid primarySkill`);
    if (typeof row.encounterTier !== 'string' || !TIERS.has(row.encounterTier as BossEncounterTier)) errors.push(`${label}: invalid encounterTier`);

    const stageNumber = Number(row.stageNumber);
    if (!Number.isInteger(stageNumber) || stageNumber < 1 || stageNumber > 50) errors.push(`${label}: invalid stageNumber`);
    if (typeof row.burstWindowSeconds !== 'number' || row.burstWindowSeconds <= 0) errors.push(`${label}: invalid burstWindowSeconds`);

    const phaseCount = Number(row.phaseCount);
    if (row.encounterTier === 'REGULAR' && phaseCount !== 2) errors.push(`${label}: regular boss must have 2 phases`);
    if ((row.encounterTier === 'MAJOR' || row.encounterTier === 'CHAPTER') && phaseCount !== 3) errors.push(`${label}: major/chapter boss must have 3 phases`);
    if (row.encounterTier === 'FINAL' && phaseCount !== 4) errors.push(`${label}: final boss must have 4 phases`);

    const intro = row.intro as Record<string, unknown> | undefined;
    if (!intro || typeof intro.firstPlaySeconds !== 'number' || typeof intro.replaySkippableAfterSeconds !== 'number') {
      errors.push(`${label}: invalid intro timing`);
    }
  }

  for (const stageId of PATROL_STAGE_IDS) if (!stageIds.has(stageId)) errors.push(`missing ${stageId}`);

  const ratio = root.perceivedRatio;
  if (!ratio || ratio.gameplay !== 80 || ratio.safetyExplanation !== 20) errors.push('perceived ratio must remain 80/20');

  return errors;
}

const validationErrors = validateBossGameplayContent();
if (validationErrors.length) throw new Error('Invalid Survivors boss gameplay content: '+validationErrors.join('; '));

export const SURVIVORS_BOSS_GAMEPLAY = gameplayJson as BossGameplayContent;

export const BOSS_GAMEPLAY_BY_STAGE: ReadonlyMap<PatrolStageId, BossGameplayDefinition> =
  new Map(SURVIVORS_BOSS_GAMEPLAY.stages.map(row => [row.stageId, row]));

export function bossGameplayForStage(stageId: PatrolStageId): BossGameplayDefinition {
  const definition = BOSS_GAMEPLAY_BY_STAGE.get(stageId);
  if (!definition) throw new Error(`Missing boss gameplay definition for ${stageId}`);
  return definition;
}
