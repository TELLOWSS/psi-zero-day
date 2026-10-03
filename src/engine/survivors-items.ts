import type { SurvivorsGameState, TacticalItemId } from '../domain/patrol-survivors';

export const TACTICAL_ITEMS = {
  record_beacon: { atlasCell: 0, color: '#38bdf8' },
  radio_battery: { atlasCell: 1, color: '#fbbf24' },
  control_kit: { atlasCell: 2, color: '#4ade80' },
} as const;

export function applyTacticalItem(state: SurvivorsGameState, kind: TacticalItemId): void {
  if (kind === 'radio_battery') {
    state.ultimateCharge = Math.min(state.maxUltimateCharge, state.ultimateCharge + 30);
  } else if (kind === 'control_kit') {
    // Refresh rather than accumulate indefinite contact protection.
    state.controlKit = {charges: 2, remaining: 12};
  } else {
    for (const drop of state.drops) {
      if (!drop.isHeal && !drop.itemKind) { drop.x = state.player.x; drop.y = state.player.y; }
    }
  }
}

export function tacticalSupplyFor(count: number, designatedBoss: boolean): TacticalItemId | null {
  if (designatedBoss) return 'control_kit';
  if (count <= 0 || count % 12 !== 0) return null;
  return (['record_beacon', 'radio_battery', 'control_kit'] as const)[(count / 12 - 1) % 3]!;
}
