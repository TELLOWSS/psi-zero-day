import type {Hazard,PlayerStats} from './patrol-survivors';

/**
 * OMEGA PROTOCOL ONLY — fictional infected hard-hat zombies and hostile
 * industrial machines in the isolated quarantine simulation. Never armed
 * in normal Watch safety gameplay. Real player/hazard world coordinates,
 * engine hit points and cooldowns; unaffected ordinary survivors are NOT
 * combat targets in this mode.
 */
export const OMEGA_BLADE_COOLDOWN=.52;
export const OMEGA_BLADE_COMBO_WINDOW=.9;
export const OMEGA_BLADE_RANGE=105;
export const OMEGA_BLADE_ARC_DOT=.48;
export type OmegaBladeComboStep=1|2|3;
export type OmegaBladeTarget=Pick<Hazard,'id'|'x'|'y'|'hp'|'maxHp'|'radius'|'type'|'isStageBoss'>;
export type OmegaBladePlayer=Pick<PlayerStats,'x'|'y'>;
// UNHELMETED is an engine compatibility ID only. Within OMEGA it means
// HELMET_ZOMBIE (fictional infected NPC), NOT the normal Watch worker model.
const bladeTargets=new Set<Hazard['type']>(['UNHELMETED','RUNAWAY_CART','FALLING_DEBRIS','CRANE_BOSS']);
export function omegaBladeEligible(target:OmegaBladeTarget):boolean{
 return target.hp>0&&bladeTargets.has(target.type);
}
export function omegaBladeNextCombo(previous:OmegaBladeComboStep,elapsed:number):OmegaBladeComboStep {
 return Number.isFinite(elapsed)&&elapsed>=0&&elapsed<=OMEGA_BLADE_COMBO_WINDOW
  ?(previous===3?1:previous+1) as OmegaBladeComboStep:1;
}
/** Arc collision is independently tested before mutating native enemy HP. */
export function omegaBladeTargetInArc(
 player:OmegaBladePlayer,target:OmegaBladeTarget,
 facing:{x:number;y:number},
 range=OMEGA_BLADE_RANGE,
):boolean{
 if(!omegaBladeEligible(target)||!Number.isFinite(range)||range<=0||
  ![player.x,player.y,target.x,target.y,facing.x,facing.y].every(Number.isFinite))return false;
 const bearing=Math.hypot(facing.x,facing.y);
 if(bearing<.01)return false;
 const dx=target.x-player.x,dy=target.y-player.y;
 const dist=Math.hypot(dx,dy);
 if(dist>range+Math.max(0,target.radius))return false;
 if(dist<.001)return true;
 return (dx*facing.x+dy*facing.y)/(dist*bearing)>=OMEGA_BLADE_ARC_DOT;
}
export function omegaBladeDamage(
 step:OmegaBladeComboStep,target:OmegaBladeTarget,
 damageMultiplier=1,bladeEdge=0,
):number{
 if(!omegaBladeEligible(target))return 0;
 if(!Number.isFinite(damageMultiplier)||damageMultiplier<=0||
  !Number.isFinite(bladeEdge)||bladeEdge<0)return 0;
 const base=step===3?42:step===2?30:25;
 const final=base*Math.min(2,damageMultiplier)*(1+.15*Math.min(3,bladeEdge));
 // Boss attacks must be earned over many defended melee windows, never
 // one-shot with a huge sword swing or stacked premium gear.
 return Math.min(final,target.isStageBoss?target.maxHp*.032:final);
}
