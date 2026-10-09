import {PATROL_STAGE_IDS} from './patrol-survivors';
import type {OperationHandoff} from './survivors-operation-handoff';
const characters = ['player', 'kang_taesik', 'yoon_sungho', 'lee_jaehoon', 'lim_junho', 'safety_monitor', 'park', 'jung', 'yoon'];
export function isOperationHandoff(value: unknown): value is OperationHandoff {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  const stageIndex = PATROL_STAGE_IDS.findIndex(id => id === r.stageId);
  return r.version === 1 && characters.includes(String(r.characterId))
    && stageIndex >= 0 && r.stageNumber === stageIndex + 1
    && (r.outcome === 'victory' || r.outcome === 'defeat')
    && [r.zones, r.cartStops, r.rubbleCleared].every(v => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0)
    && typeof r.damageTaken === 'number' && Number.isFinite(r.damageTaken) && r.damageTaken >= 0
    && Array.isArray(r.stars) && r.stars.length === 3 && r.stars.every(v => typeof v === 'boolean');
}
