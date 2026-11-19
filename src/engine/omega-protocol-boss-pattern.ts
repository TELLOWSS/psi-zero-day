import type {OmegaFieldPoint} from '../domain/omega-protocol-field';

export type OmegaBossAttack='crane_drop'|'power_sweep';
export type OmegaBossAttackPhase='warning'|'strike'|'recovery';
export type OmegaBossLane='vertical'|'horizontal';
export interface OmegaBossTelegraph{
 readonly wave:9|15;
 readonly attack:OmegaBossAttack;
 readonly attackNumber:number;
 readonly phase:OmegaBossAttackPhase;
 readonly timer:number;
 readonly warningDuration:number;
 readonly center:OmegaFieldPoint;
 readonly radius:number;
 readonly lane:OmegaBossLane;
 readonly laneHalfWidth:number;
 readonly empowered:boolean;
 readonly hitResolved:boolean;
}
export interface OmegaBossPatternResult{
 readonly next:OmegaBossTelegraph;
 readonly hit:boolean;
 readonly wentToStrike:boolean;
}
const finite=(n:number)=>Number.isFinite(n);
const cap=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
/** One fair, readable warning is always visible before a strike. */
export function omegaCreateBossTelegraph(
 wave:9|15,actor:OmegaFieldPoint,bossHpFraction=1,attackNumber=0,
):OmegaBossTelegraph{
 if(!finite(actor.x)||!finite(actor.y)||!finite(bossHpFraction))throw new RangeError('Invalid boss telegraph input');
 const empowered=bossHpFraction<=.5;
 const attack=wave===9?'crane_drop':'power_sweep';
 return {
  wave,attack,attackNumber,phase:'warning',
  warningDuration:empowered?1.15:1.55,
  timer:empowered?1.15:1.55,
  center:{x:cap(actor.x,40,1360),y:cap(actor.y,40,860)},
  radius:empowered?107:89,
  lane:attackNumber%2===0?'horizontal':'vertical',
  laneHalfWidth:empowered?53:37,
  empowered,
  hitResolved:false,
 };
}
export function omegaBossInStrikeZone(
 attack:OmegaBossTelegraph,actor:OmegaFieldPoint,
):boolean{
 if(!finite(actor.x)||!finite(actor.y))return false;
 if(attack.attack==='crane_drop'){
  return Math.hypot(actor.x-attack.center.x,actor.y-attack.center.y)<=attack.radius;
 }
 return attack.lane==='horizontal'
  ?Math.abs(actor.y-attack.center.y)<=attack.laneHalfWidth
  :Math.abs(actor.x-attack.center.x)<=attack.laneHalfWidth;
}
/**
 * Deterministic attack timer. Exactly one hit event may happen per attack,
 * even when frame duration straddles warning and strike boundaries.
 * Each new warning re-locks to a *new* player location, not a homing strike.
 */
export function omegaAdvanceBossTelegraph(
 current:OmegaBossTelegraph,dt:number,actor:OmegaFieldPoint,
 bossHpFraction:number,
):OmegaBossPatternResult{
 if(!finite(dt)||dt<0||dt>.25)throw new RangeError('Invalid boss attack delta');
 if(!finite(bossHpFraction))throw new RangeError('Invalid boss HP fraction');
 let next=current,remaining=dt,hit=false,wentToStrike=false;
 for(let attempts=0;attempts<4&&remaining>0;attempts++){
  if(remaining<next.timer){
   next={...next,timer:next.timer-remaining};
   remaining=0;break;
  }
  remaining-=next.timer;
  if(next.phase==='warning'){
   hit=!next.hitResolved&&omegaBossInStrikeZone(next,actor);
   wentToStrike=true;
   next={...next,phase:'strike',timer:.20,hitResolved:true};
  }else if(next.phase==='strike'){
   next={...next,phase:'recovery',timer:next.empowered?.72:.92};
  }else{
   next=omegaCreateBossTelegraph(next.wave,actor,bossHpFraction,next.attackNumber+1);
  }
 }
 return {next,hit,wentToStrike};
}
