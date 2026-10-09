import type { CanonicalCharacterId, CharacterId } from './patrol-survivors';
import type { OperationHandoff } from './survivors-operation-handoff';

/** Maps a legacy selection to its current playable role without changing old records. */
export function canonicalHandoffRole(characterId: CharacterId): CanonicalCharacterId {
  if (characterId === 'park') return 'kang_taesik';
  if (characterId === 'jung' || characterId === 'yoon') return 'player';
  return characterId;
}

/** Only count actions that are already recorded by the game engine. */
export const HANDOFF_ROLE_METRIC = {
  player: 'zones',
  kang_taesik: 'rubbleCleared',
  yoon_sungho: 'rubbleCleared',
  lee_jaehoon: 'zones',
  lim_junho: 'cartStops',
  safety_monitor: 'zones',
} as const satisfies Record<CanonicalCharacterId, 'zones' | 'cartStops' | 'rubbleCleared'>;

export function roleHandoffSignal(record: OperationHandoff) {
  const roleId = canonicalHandoffRole(record.characterId);
  const metric = HANDOFF_ROLE_METRIC[roleId];
  const count = record[metric];
  return { roleId, metric, count, recorded: count > 0, outcome: record.outcome } as const;
}
