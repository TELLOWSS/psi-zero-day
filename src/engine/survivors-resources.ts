import type {SurvivorsGameState,TacticalItemId} from '../domain/patrol-survivors';
import {PATROL_DIFFICULTIES,type PatrolDifficulty} from '../domain/survivors-challenge';
export const SUPPLY_CYCLE:readonly TacticalItemId[]=['record_beacon','radio_battery','control_kit','field_rations','route_lantern'];
export const RESOURCE_PROFILES = {
  story:{controlCharge:1.6,logCharge:.3,batteryCharge:22,healChance:.05},
  standard:{controlCharge:1,logCharge:.15,batteryCharge:16,healChance:.035},
  hard:{controlCharge:.8,logCharge:.1,batteryCharge:14,healChance:.025},
  extreme:{controlCharge:.65,logCharge:.08,batteryCharge:12,healChance:.02},
} as const;
export function resourceProfile(difficulty:PatrolDifficulty='standard') {return RESOURCE_PROFILES[difficulty];}
export function earnedTacticalSupply(state:SurvivorsGameState,boss:boolean):TacticalItemId|null {
  const profile=PATROL_DIFFICULTIES[state.difficulty??'standard'];
  const gate=state.supplyGate??={nextControl:profile.supplyEvery,availableAt:0,cycle:0};
  if(!boss && (state.hazardsNeutralized<gate.nextControl || state.gameTime<gate.availableAt)) return null;
  const item=boss?'control_kit':SUPPLY_CYCLE[gate.cycle%SUPPLY_CYCLE.length]!;
  if(!boss)gate.cycle++;
  gate.nextControl=state.hazardsNeutralized+profile.supplyEvery;
  gate.availableAt=state.gameTime+profile.supplyCooldown;
  return item;
}
