import type {SurvivorsGameState, Hazard} from '../domain/patrol-survivors';
import {sanitizeInventory,storeEffects,STORE_ITEMS,type StoreInventory} from '../domain/survivors-store';
/** Paused transactions preserve earned perks, damage, timers and one-time grants. */
export function applyPremiumLoadout(state:SurvivorsGameState,inventory:StoreInventory):boolean {
  if(state.phase!=='paused')return false;
  const safe=sanitizeInventory(inventory),next=storeEffects(safe),previous=state.premiumGear;
  const old=previous?.effects??storeEffects({owned:[],equipped:[]});
  const used=previous?.used??previous?.equipped??[];
  const firstUse=safe.equipped.filter(id=>!used.includes(id));
  const p=state.player;
  p.maxHp=Math.max(1,p.maxHp+next.hp-old.hp);p.hp=Math.min(p.hp,p.maxHp);
  p.speed+=next.speed-old.speed;p.pickupRadius+=next.pickup-old.pickup;
  p.damageMultiplier+=next.damage-old.damage;p.cooldownReduction+=next.cooldown-old.cooldown;
  p.critRate+=next.crit-old.crit;p.regenRate+=next.regen-old.regen;
  const granted=firstUse.map(id=>STORE_ITEMS.find(item=>item.id===id)!.effects);
  const shield=Math.min(next.shield,(previous?.shield??0)+granted.reduce((sum,e)=>sum+(e.shield??0),0));
  state.premiumGear={equipped:safe.equipped,used:[...new Set([...used,...safe.equipped])],effects:next,shield,
    shieldCooldown:shield>0?0:next.shield>0?(previous?.shieldCooldown||next.shieldPeriod):previous?.shieldCooldown??0,feedback:0};
  if(state.fieldTactics){
    state.fieldTactics.lineCharges+=granted.reduce((sum,e)=>sum+(e.lines??0),0);
    state.fieldTactics.supportCharges+=granted.reduce((sum,e)=>sum+(e.support??0),0);
  }
  return true;
}
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
