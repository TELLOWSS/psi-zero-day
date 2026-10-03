import type { SurvivorsGameState, TacticalItemId } from '../domain/patrol-survivors';

export const TACTICAL_ITEMS = {
  record_beacon: { atlasCell: 2, color: '#38bdf8' },
  radio_battery: { atlasCell: 3, color: '#fbbf24' },
  control_kit: { atlasCell: 4, color: '#4ade80' },
  field_rations: { atlasCell: 5, color: '#fb923c' },
  route_lantern: { atlasCell: 6, color: '#22d3ee' },
} as const;
export const SUPPLY_CYCLE: readonly TacticalItemId[] = ['record_beacon','radio_battery','control_kit','field_rations','route_lantern'];

export function applyTacticalItem(state: SurvivorsGameState, kind: TacticalItemId): void {
  if (kind === 'radio_battery') {
    state.ultimateCharge = Math.min(state.maxUltimateCharge, state.ultimateCharge + 30);
  } else if (kind === 'control_kit') {
    state.controlKit = {charges: 2, remaining: 12};
  } else if (kind === 'field_rations') {
    // Refresh duration, never stack regeneration or increase maximum HP.
    state.fieldRecovery = {remaining: 8};
  } else if (kind === 'route_lantern') {
    state.routeLantern = {remaining: 10};
  } else {
    for (const drop of state.drops) {
      if (!drop.isHeal && !drop.itemKind) { drop.x = state.player.x; drop.y = state.player.y; }
    }
  }
}

export function tickTacticalItems(state: SurvivorsGameState, dt: number): void {
  if (state.fieldRecovery) {
    const elapsed=Math.min(state.fieldRecovery.remaining,dt);
    state.player.hp=Math.min(state.player.maxHp,state.player.hp+elapsed*3);
    state.fieldRecovery.remaining=Math.max(0,state.fieldRecovery.remaining-dt);
    if(state.fieldRecovery.remaining===0) state.fieldRecovery=undefined;
  }
  if(state.routeLantern) {
    state.routeLantern.remaining=Math.max(0,state.routeLantern.remaining-dt);
    if(state.routeLantern.remaining===0) state.routeLantern=undefined;
  }
}

export function tacticalSupplyFor(count: number, designatedBoss: boolean): TacticalItemId | null {
  if (designatedBoss) return 'control_kit';
  if (count <= 0 || count % 12 !== 0) return null;
  return SUPPLY_CYCLE[(count / 12 - 1) % SUPPLY_CYCLE.length]!;
}
