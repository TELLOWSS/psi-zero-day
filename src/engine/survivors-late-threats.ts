import type {Hazard,HazardType} from '../domain/patrol-survivors';
import type {PatrolDifficulty} from '../domain/survivors-challenge';
/** Authored late-wave diversity; never reacts to the player's weapon or upgrades. */
export function lateThreatVariant(type:HazardType,time:number,difficulty:PatrolDifficulty,roll:number):Hazard['variant'] {
  const onset=difficulty==='story'?130:difficulty==='standard'?90:difficulty==='hard'?75:60;
  if(time<onset||roll>.65)return undefined;
  return type==='RUNAWAY_CART'?'reinforced_cart':type==='GAS_LEAK'?(roll<.32?'pulse_gas':'split_gas'):undefined;
}
