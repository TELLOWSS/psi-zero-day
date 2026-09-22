import packageInfo from '../../package.json';
import type {
  DefenseContent, DefenseEnemyState, DefenseOutcomeApplication, DefenseRunState, DefenseSaveDocument,
  DefenseSaveEnvelope, DefenseSaveInspection, DefenseScenarioRecord, DefenseTowerState,
} from '../domain';
import type { StoragePort } from '../platform/storage';

export const DEFENSE_SAVE_KEY = 'psi-zero-day.defense.save.v1';
export const DEFENSE_SAVE_SCHEMA_VERSION = 1 as const;

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const integer = (value: unknown): value is number => finite(value) && Number.isInteger(value);
const nonNegativeInteger = (value: unknown): value is number => integer(value) && value >= 0;
const nonNegative = (value: unknown): value is number => finite(value) && value >= 0;
const nonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const uniqueStrings = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every(nonEmptyString) && new Set(value).size === value.length;

function validSlowEffect(value: unknown): boolean {
  return record(value)
    && nonEmptyString(value.sourceId)
    && finite(value.fraction) && value.fraction >= 0 && value.fraction < 1
    && nonNegativeInteger(value.startTick) && nonNegativeInteger(value.endTick)
    && value.endTick >= value.startTick;
}

function validEnemy(value: unknown): value is DefenseEnemyState {
  return record(value)
    && nonEmptyString(value.id)
    && ['NORMAL','SWIFT','ARMORED','SWARM','VEILED','BOSS'].includes(String(value.enemyId))
    && nonNegative(value.hp)
    && nonNegative(value.distance)
    && nonNegativeInteger(value.spawnSequence)
    && nonNegativeInteger(value.revealUntilTick)
    && Array.isArray(value.slowEffects) && value.slowEffects.every(validSlowEffect)
    && typeof value.bossPhaseTriggered === 'boolean'
    && nonNegativeInteger(value.bossArmorFromTick)
    && nonNegativeInteger(value.bossArmorUntilTick);
}

function validTower(value: unknown): value is DefenseTowerState {
  return record(value)
    && nonEmptyString(value.id)
    && nonEmptyString(value.padId)
    && ['PULSE','BURST','CONTROL','SENSOR'].includes(String(value.towerId))
    && ['L1','L2','L3A','L3B'].includes(String(value.levelId))
    && ['FIRST','STRONG'].includes(String(value.targetMode))
    && nonNegative(value.invested)
    && nonNegativeInteger(value.attackCooldown)
    && nonNegativeInteger(value.revealCooldown);
}

export function isDefenseRunState(value: unknown): value is DefenseRunState {
  if (!record(value)) return false;
  return nonEmptyString(value.runId)
    && value.mode === 'TRAINING'
    && value.variant === 'STANDARD'
    && ['READY','RUNNING','INTERMISSION','WON','LOST'].includes(String(value.status))
    && typeof value.paused === 'boolean'
    && (value.speed === 1 || value.speed === 2)
    && nonNegativeInteger(value.tick)
    && integer(value.waveId) && value.waveId >= 1 && value.waveId <= 10
    && nonNegativeInteger(value.waveTick)
    && nonNegativeInteger(value.intermissionRemaining)
    && nonNegative(value.shield)
    && nonNegative(value.resource)
    && Array.isArray(value.towers) && value.towers.every(validTower)
    && Array.isArray(value.enemies) && value.enemies.every(validEnemy)
    && Array.isArray(value.spawnedByGroup) && value.spawnedByGroup.every(nonNegativeInteger)
    && nonNegativeInteger(value.nextTowerSequence)
    && nonNegativeInteger(value.nextEnemySequence)
    && (value.supportId === 'COORDINATOR' || value.supportId === 'OBSERVER')
    && nonNegativeInteger(value.supportCooldownRemaining)
    && nonNegativeInteger(value.freezeMovementUntilTick)
    && nonNegativeInteger(value.revealAllUntilTick)
    && nonNegativeInteger(value.rangeBonusUntilTick)
    && nonNegativeInteger(value.completedWaves);
}

function validRecord(value: unknown): value is DefenseScenarioRecord {
  return record(value)
    && nonEmptyString(value.scenarioId)
    && nonNegativeInteger(value.finishedRuns)
    && nonNegativeInteger(value.clears)
    && integer(value.bestStars) && value.bestStars >= 0 && value.bestStars <= 3
    && nonNegativeInteger(value.bestScore)
    && nonNegative(value.bestShield)
    && nonNegativeInteger(value.bestCompletedWaves)
    && (value.lastResultRunId === null || nonEmptyString(value.lastResultRunId))
    && (value.updatedAt === null || nonEmptyString(value.updatedAt));
}

export function isDefenseSaveDocument(value: unknown): value is DefenseSaveDocument {
  return record(value)
    && (value.activeRun === null || isDefenseRunState(value.activeRun))
    && Array.isArray(value.records) && value.records.every(validRecord)
    && new Set(value.records.map(item => item.scenarioId)).size === value.records.length
    && uniqueStrings(value.cosmeticIds)
    && uniqueStrings(value.claimIds)
    && uniqueStrings(value.settledRunIds);
}

export function emptyDefenseSaveDocument(): DefenseSaveDocument {
  return Object.freeze({
    activeRun: null,
    records: Object.freeze([]),
    cosmeticIds: Object.freeze([]),
    claimIds: Object.freeze([]),
    settledRunIds: Object.freeze([]),
  });
}

/** Fast local corruption check only. */
export function defensePayloadChecksum(document: DefenseSaveDocument): string {
  const input = JSON.stringify(document);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function encodeDefenseSave(
  document: DefenseSaveDocument,
  content: DefenseContent,
  revision: number,
  savedAt = new Date().toISOString(),
): string {
  const envelope: DefenseSaveEnvelope = {
    namespace: 'defense',
    schemaVersion: DEFENSE_SAVE_SCHEMA_VERSION,
    rulesVersion: content.rulesVersion,
    contentVersion: content.contentVersion,
    buildVersion: packageInfo.version,
    revision,
    savedAt,
    checksum: defensePayloadChecksum(document),
    payload: document,
  };
  return JSON.stringify(envelope);
}

export function decodeDefenseSave(raw: string): DefenseSaveEnvelope | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!record(parsed)
      || parsed.namespace !== 'defense'
      || parsed.schemaVersion !== DEFENSE_SAVE_SCHEMA_VERSION
      || !nonEmptyString(parsed.rulesVersion)
      || !nonEmptyString(parsed.contentVersion)
      || !nonEmptyString(parsed.buildVersion)
      || !nonNegativeInteger(parsed.revision)
      || !nonEmptyString(parsed.savedAt)
      || !nonEmptyString(parsed.checksum)
      || !isDefenseSaveDocument(parsed.payload)) return null;
    if (defensePayloadChecksum(parsed.payload) !== parsed.checksum) return null;
    return parsed as unknown as DefenseSaveEnvelope;
  } catch {
    return null;
  }
}

export async function inspectDefenseSave(storage: StoragePort, content: DefenseContent): Promise<DefenseSaveInspection> {
  let raw: string | null;
  try {
    raw = await storage.read(DEFENSE_SAVE_KEY);
  } catch (error) {
    return { kind: 'storage-error', issue: error instanceof Error ? error.message : String(error) };
  }
  if (raw === null) return { kind: 'empty', document: emptyDefenseSaveDocument(), revision: 0 };
  const envelope = decodeDefenseSave(raw);
  if (!envelope) return { kind: 'corrupt', raw, issue: '저장 데이터의 형식 또는 무결성 확인에 실패했습니다.' };
  if (envelope.rulesVersion !== content.rulesVersion || envelope.contentVersion !== content.contentVersion) {
    return {
      kind: 'version-mismatch',
      document: envelope.payload,
      revision: envelope.revision,
      savedAt: envelope.savedAt,
      savedRulesVersion: envelope.rulesVersion,
      savedContentVersion: envelope.contentVersion,
    };
  }
  return { kind: 'ready', document: envelope.payload, revision: envelope.revision, savedAt: envelope.savedAt };
}

export async function writeDefenseSave(
  storage: StoragePort,
  content: DefenseContent,
  document: DefenseSaveDocument,
  previousRevision: number,
  savedAt = new Date().toISOString(),
): Promise<{ readonly revision: number; readonly savedAt: string }> {
  const revision = previousRevision + 1;
  await storage.write(DEFENSE_SAVE_KEY, encodeDefenseSave(document, content, revision, savedAt));
  return { revision, savedAt };
}

export function withDefenseActiveRun(document: DefenseSaveDocument, activeRun: DefenseRunState | null): DefenseSaveDocument {
  return { ...document, activeRun };
}

export function resumeDefenseRun(run: DefenseRunState): DefenseRunState {
  return { ...run, paused: true };
}

export function firstClearClaimId(content: DefenseContent): string {
  return `first-clear:${content.scenario.id}:${content.scenario.rewardVersion}`;
}

export function threeStarClaimId(content: DefenseContent): string {
  return `three-star:${content.scenario.id}:${content.scenario.rewardVersion}`;
}

export function applyDefenseOutcome(
  document: DefenseSaveDocument,
  content: DefenseContent,
  run: DefenseRunState,
  result: { readonly won: boolean; readonly stars: 0 | 1 | 2 | 3; readonly score: number; readonly completedWaves: number; readonly shield: number },
  updatedAt = new Date().toISOString(),
): DefenseOutcomeApplication {
  if (run.status !== 'WON' && run.status !== 'LOST') throw new Error('Defense outcome requires a finished run');
  if (document.settledRunIds.includes(run.runId)) {
    return { document, awardedCosmeticIds: Object.freeze([]), applied: false };
  }

  const previous = document.records.find(record => record.scenarioId === content.scenario.id);
  const record: DefenseScenarioRecord = {
    scenarioId: content.scenario.id,
    finishedRuns: (previous?.finishedRuns ?? 0) + 1,
    clears: (previous?.clears ?? 0) + (result.won ? 1 : 0),
    bestStars: Math.max(previous?.bestStars ?? 0, result.stars) as 0 | 1 | 2 | 3,
    bestScore: Math.max(previous?.bestScore ?? 0, result.score),
    bestShield: Math.max(previous?.bestShield ?? 0, result.shield),
    bestCompletedWaves: Math.max(previous?.bestCompletedWaves ?? 0, result.completedWaves),
    lastResultRunId: run.runId,
    updatedAt,
  };

  const claimIds = new Set(document.claimIds);
  const cosmeticIds = new Set(document.cosmeticIds);
  const awarded: string[] = [];

  if (result.won) {
    const claim = firstClearClaimId(content);
    if (!claimIds.has(claim)) {
      claimIds.add(claim);
      cosmeticIds.add(content.scenario.firstClearCosmetic);
      awarded.push(content.scenario.firstClearCosmetic);
    }
  }
  if (result.won && result.stars === 3) {
    const claim = threeStarClaimId(content);
    if (!claimIds.has(claim)) {
      claimIds.add(claim);
      cosmeticIds.add(content.scenario.threeStarCosmetic);
      awarded.push(content.scenario.threeStarCosmetic);
    }
  }

  const records = document.records.some(item => item.scenarioId === record.scenarioId)
    ? document.records.map(item => item.scenarioId === record.scenarioId ? record : item)
    : [...document.records, record];

  return {
    document: {
      activeRun: null,
      records,
      cosmeticIds: [...cosmeticIds],
      claimIds: [...claimIds],
      settledRunIds: [...document.settledRunIds, run.runId],
    },
    awardedCosmeticIds: awarded,
    applied: true,
  };
}

export function startCurrentVersionDocument(document: DefenseSaveDocument): DefenseSaveDocument {
  return {
    activeRun: null,
    records: document.records,
    cosmeticIds: document.cosmeticIds,
    claimIds: document.claimIds,
    settledRunIds: document.settledRunIds,
  };
}
