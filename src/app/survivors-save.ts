import type { PermanentUpgrades, PatrolStageId } from '../domain/patrol-survivors';
import { PATROL_STAGE_IDS } from '../domain/patrol-survivors';
export const STAGE_IDS: readonly PatrolStageId[] = PATROL_STAGE_IDS;
export const LAST_PATROL_STAGE_KEY = 'psi.survivors.last_played_stage';
export function resumePatrolStage(stage: unknown, unlocked: unknown, stars: unknown): PatrolStageId {
  const available = stagesFromSave(unlocked, stars);
  return available.find(id => id === stage) ?? 'stage_01';
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function safeNumber(v: unknown, max = Number.MAX_SAFE_INTEGER): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : 0;
  return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
}
export function parseSave(raw: string | null): unknown {
  try { return raw === null ? null : JSON.parse(raw); } catch { return null; }
}
export function validStages(v: unknown): PatrolStageId[] {
  return STAGE_IDS.filter(id => id === 'stage_01' || (Array.isArray(v) && v.includes(id)));
}
export function validStars(v: unknown): Record<string, boolean[]> {
  const result: Record<string, boolean[]> = {};
  if (record(v)) for (const id of STAGE_IDS) {
    const stars = v[id];
    if (Array.isArray(stars)) result[id] = [0, 1, 2].map(i => stars[i] === true);
  }
  return result;
}
export function validUpgrades(v: unknown): PermanentUpgrades {
  const data = record(v) ? v : {};
  return { vitality: safeNumber(data.vitality, 5), mobility: safeNumber(data.mobility, 5),
    intelligence: safeNumber(data.intelligence, 5), firstAid: safeNumber(data.firstAid, 1), reroll: safeNumber(data.reroll, 3) };
}

/** Recover the next mission for saves written before new stages existed. */
export function stagesFromSave(unlocked: unknown, stars: unknown): PatrolStageId[] {
  const ids=new Set(validStages(unlocked));const completed=validStars(stars);
  STAGE_IDS.forEach((id,i)=>{if(completed[id]?.[0] && STAGE_IDS[i+1]) ids.add(STAGE_IDS[i+1]!);});
  return STAGE_IDS.filter(id=>ids.has(id));
}
