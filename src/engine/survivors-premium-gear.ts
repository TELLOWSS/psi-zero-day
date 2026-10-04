import type {SurvivorsGameState, Hazard} from '../domain/patrol-survivors';
/** Simulation owns cadence; menus, pauses and level-up screens do not recharge equipment. */
export function tickPremiumGear(state:SurvivorsGameState,dt:number):void {
  const gear=state.premiumGear;
  if(!gear || state.phase !== 'playing' || dt <= 0) return;
  gear.feedback=Math.max(0,gear.feedback-dt);
  state.ultimateCharge=Math.min(state.maxUltimateCharge,state.ultimateCharge+gear.effects.ultimate*dt);
  if(gear.shieldCooldown>0) {
    gear.shieldCooldown=Math.max(0,gear.shieldCooldown-dt);
    if(gear.shieldCooldown===0){gear.shield=gear.effects.shield;gear.feedback=.6;}
  }
}
export function absorbPremiumDamage(state:SurvivorsGameState,damage:number):number {
  const gear=state.premiumGear;
  if(!gear || gear.shield<=0) return damage;
  const absorbed=Math.min(gear.shield,Math.max(0,damage));
  gear.shield-=absorbed;
  gear.feedback=.45;
  if(gear.shield===0) gear.shieldCooldown=gear.effects.shieldPeriod;
  return Math.max(0,damage-absorbed);
}
export function premiumHazardSpeed(state:SurvivorsGameState,hazard:Hazard):number {
  const suppression=state.premiumGear?.effects.suppression ?? 0;
  if(!suppression || (hazard.type !== 'GAS_LEAK' && hazard.type !== 'RUNAWAY_CART')) return 1;
  return Math.hypot(hazard.x-state.player.x,hazard.y-state.player.y)<=180 ? 1-suppression : 1;
}
