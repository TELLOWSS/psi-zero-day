/** PSI operator growth contract. Pure domain: no browser, UI, clock or storage dependencies. */
export const OPERATOR_PROFILE_VERSION = 1 as const;
export const OPERATOR_MAX_LEVEL = 20;
export type OperatorProfile = {
  version: 1;
  revision: number;
  xp: number;
  settledRuns: string[];
  clearedStages: string[];
  confirmedEvidence: string[];
  completedResearch: string[];
};
export type OperatorRunReceipt = {
  runId: string;
  stageId: string;
  episode: 1 | 2;
  outcome: 'won' | 'lost';
  completedFieldIds: string[];
  verifiedEvidenceIds: string[];
  newResearchObjectiveIds: string[];
};
type Failure = { ok: false; error: 'invalid-profile' | 'invalid-receipt' | 'revision-conflict' };
type Settlement = { ok: true; profile: OperatorProfile; awardedXp: number; duplicate: boolean } | Failure;
const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 256 && !/[\u0000-\u001f]/.test(v);
const isIds = (v: unknown): v is string[] => Array.isArray(v) && v.every(isId) && new Set(v).size === v.length;
export function createOperatorProfile(): OperatorProfile {
  return { version: 1, revision: 0, xp: 0, settledRuns: [], clearedStages: [], confirmedEvidence: [], completedResearch: [] };
}
export function validOperatorProfile(v: unknown): v is OperatorProfile {
  if (!v || typeof v !== 'object') return false;
  const p = v as OperatorProfile;
  return p.version === 1 && isCount(p.revision) && p.revision < Number.MAX_SAFE_INTEGER
    && isCount(p.xp) && isIds(p.settledRuns) && isIds(p.clearedStages)
    && isIds(p.confirmedEvidence) && isIds(p.completedResearch);
}
export function operatorProgress(xp: number) {
  let remaining = isCount(xp) ? xp : 0;
  let level = 1;
  while (level < OPERATOR_MAX_LEVEL) {
    const cost = 120 + 20 * (level - 1);
    if (remaining < cost) break;
    remaining -= cost;
    level++;
  }
  return { level, earnedAbilityPoints: Math.floor(level / 2), currentXp: level === 20 ? 0 : remaining,
    nextLevelXp: level === 20 ? null : 120 + 20 * (level - 1) };
}
/** Migrate only the new profile. Preserve legacy and future save fields verbatim. Never infer historical XP/evidence. */
export function migrateOperatorSave<T extends Record<string, unknown>>(saved: T):
  { ok: true; save: T & { operatorProfile: OperatorProfile }; migrated: boolean } | Failure {
  if (saved.operatorProfile !== undefined && !validOperatorProfile(saved.operatorProfile)) return { ok: false, error: 'invalid-profile' };
  const migrated = saved.operatorProfile === undefined;
  const profile = migrated ? createOperatorProfile() : snapshotOperatorProfile(saved.operatorProfile as OperatorProfile);
  return { ok: true, save: { ...saved, operatorProfile: profile }, migrated };
}
/** Freeze growth for the running operation by copying the entry profile. */
export function snapshotOperatorProfile(p: OperatorProfile): OperatorProfile {
  return { ...p, settledRuns: [...p.settledRuns], clearedStages: [...p.clearedStages],
    confirmedEvidence: [...p.confirmedEvidence], completedResearch: [...p.completedResearch] };
}
/** Receipts must be supplied by a verified engine adapter, never inferred from shots or arbitrary UI selection. */
export function settleOperatorRun(p: OperatorProfile, r: OperatorRunReceipt, expectedRevision: number): Settlement {
  if (!validOperatorProfile(p)) return { ok: false, error: 'invalid-profile' };
  if (!r || !isId(r.runId) || !/^CH-0[1-5]$/.test(r.stageId) || ![1, 2].includes(r.episode)
    || !['won', 'lost'].includes(r.outcome) || !isIds(r.completedFieldIds) || r.completedFieldIds.length > 5
    || !isIds(r.verifiedEvidenceIds) || !isIds(r.newResearchObjectiveIds)) return { ok: false, error: 'invalid-receipt' };
  if (expectedRevision !== p.revision) return { ok: false, error: 'revision-conflict' };
  if (p.settledRuns.includes(r.runId)) return { ok: true, profile: p, awardedXp: 0, duplicate: true };
  const stage = 'EP0' + r.episode + ':' + r.stageId;
  const firstWin = r.outcome === 'won' && !p.clearedStages.includes(stage);
  // Beginner repeat field XP is capped at 30 per completed operation; no failure penalty.
  const fieldXp = Math.min(r.completedFieldIds.length * 10, r.episode === 1 && p.clearedStages.includes(stage) ? 30 : 50);
  const evidence = r.verifiedEvidenceIds.filter(id => !p.confirmedEvidence.includes(id)).slice(0, 3);
  const research = r.newResearchObjectiveIds.filter(id => !p.completedResearch.includes(id));
  const awardedXp = fieldXp + evidence.length * 20 + (firstWin ? 60 : 0) + research.length * 20;
  if (!Number.isSafeInteger(p.xp + awardedXp)) return { ok: false, error: 'invalid-profile' };
  const profile: OperatorProfile = { ...p, revision: p.revision + 1, xp: p.xp + awardedXp,
    settledRuns: [...p.settledRuns, r.runId], clearedStages: firstWin ? [...p.clearedStages, stage] : [...p.clearedStages],
    confirmedEvidence: [...p.confirmedEvidence, ...evidence], completedResearch: [...p.completedResearch, ...research] };
  return { ok: true, profile, awardedXp, duplicate: false };
}
