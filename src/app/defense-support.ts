import type { DefenseSupportId } from '../domain/defense';

export const DEFENSE_SUPPORT_CHARACTER_IDS: Readonly<Record<DefenseSupportId, string>> = Object.freeze({
  COORDINATOR: 'kang_taesik',
  OBSERVER: 'lim_junho',
  COMMANDER: 'player',
  REBAR_LEAD: 'yoon_sungho',
  ENGINEER: 'lee_jaehoon',
});

export function defenseSupportCharacterId(supportId: DefenseSupportId): string {
  return DEFENSE_SUPPORT_CHARACTER_IDS[supportId];
}
