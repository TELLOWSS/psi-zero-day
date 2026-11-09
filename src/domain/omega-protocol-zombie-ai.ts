import type {Hazard,PlayerStats} from './patrol-survivors';
import {
 omegaFieldResolveCollision,OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT,
 type OmegaFieldObstacle,type OmegaFieldPoint,
} from './omega-protocol-field';
import {omegaFieldNextRoute} from './omega-protocol-navigation';

/**
 * Special-edition-only zombie director. Four genuinely distinct behaviours:
 * - drifter: deliberate direct pursuit and a short, visibly warned grab
 * - sprinter: pursues fast, locks the player's location, then straight-line rushes
 * - armored: high HP, heavy radius and a longer warned close-range slam
 * - stalker: circles to a flanking waypoint and commits to a locked pounce
 *
 * Only actual native WATCH Hazard instances are moved. Watch 'UNHELMETED'
 * workers outside OMEGA are never given a zombie brain. All incoming damage
 * remains native WATCH gun/blade HP; this module only controls movement and
 * the zombie's warned melee contact window. No timers, randomness, saves or
 * wall-clock requests, no real worker identity, no background costs.
 */
export type OmegaZombieKind='drifter'|'sprinter'|'armored'|'stalker';
export type OmegaZombiePhase='pursue'|'warning'|'charge'|'recovery';
export const OMEGA_ZOMBIE_KINDS=[
 'drifter','sprinter','armored','stalker',
] as const satisfies readonly OmegaZombieKind[];
export interface OmegaZombieBrain {
 readonly kind:OmegaZombieKind;
 phase:OmegaZombiePhase;
 timer:number;
 readonly slot:number;
 readonly orbitSign:1|-1;
 readonly seedHp:number;
 readonly speed:number;
 readonly damage:number;
 readonly warningDuration:number;
 readonly attackRadius:number;
 readonly attackTrigger:number;
 readonly cooldown:number;
 warnings:number;
 attacks:number;
 hits:number;
 damageDone:number;
 lockedX:number;
 lockedY:number;
 chargeResolved:boolean;
}
export interface OmegaZombieTick {
 readonly attackWindow:boolean;
 readonly contactDamage:number;
 readonly collidedWithWall:boolean;
}
const SPEC:Record<OmegaZombieKind,Readonly<{
 hp:number;speed:number;radius:number;damage:number;
 warning:number;reach:number;trigger:number;cooldown:number;chargeSpeed:number;chargeTime:number;
}>>={
 drifter:{hp:1,speed:74,radius:19,damage:11,warning:.62,reach:53,trigger:60,cooldown:.9,chargeSpeed:0,chargeTime:0},
 sprinter:{hp:.86,speed:116,radius:17,damage:16,warning:.52,reach:47,trigger:205,cooldown:1.1,chargeSpeed:340,chargeTime:.41},
 armored:{hp:3.1,speed:47,radius:30,damage:24,warning:.94,reach:76,trigger:91,cooldown:1.45,chargeSpeed:0,chargeTime:0},
 stalker:{hp:1.65,speed:98,radius:21,damage:19,warning:.66,reach:59,trigger:145,cooldown:1.2,chargeSpeed:245,chargeTime:.33},
};
const distance=(a:OmegaFieldPoint,b:OmegaFieldPoint)=>Math.hypot(a.x-b.x,a.y-b.y);
export function omegaZombieKindForSlot(slot:number,wave:number):OmegaZombieKind{
 if(!Number.isInteger(slot)||slot<0||!Number.isInteger(wave)||wave<1||wave>15)
  throw new RangeError('Invalid OMEGA infected zombie spawn slot');
 // Guarantee each opening pack of four has exactly one of each, and rotate
 // their order across sector routes. No 4th palette-only 'variant'.
 return OMEGA_ZOMBIE_KINDS[(slot+Math.floor((wave-1)/3))%4]!;
}
export function omegaCreateZombieBrain(
 h:Hazard,kind:OmegaZombieKind,slot:number,
):OmegaZombieBrain {
 if(h.type!=='UNHELMETED'||h.isStageBoss||h.hp<=0)
  throw new Error('OMEGA zombie controller requires a live native infected');
 const s=SPEC[kind];
 const hp=Math.max(1,Math.round(h.hp*s.hp));
 h.hp=hp;h.maxHp=hp;h.radius=s.radius;
 // Never let the native generic worker chase or deal untelegraphed contact
 // damage on top of the four isolated special-edition AI patterns.
 h.speed=0;h.damage=0;h.motion=undefined;h.vx=0;h.vy=0;
 return {
  kind,slot,orbitSign:slot%2===0?1:-1,seedHp:hp,
  phase:'pursue',timer:0,speed:s.speed,damage:s.damage,
  warningDuration:s.warning,attackRadius:s.reach,attackTrigger:s.trigger,
  cooldown:s.cooldown,
  warnings:0,attacks:0,hits:0,damageDone:0,
  lockedX:0,lockedY:1,chargeResolved:false,
 };
}
const move=(h:Hazard,point:OmegaFieldPoint,rate:number,dt:number,
 obstacles:readonly OmegaFieldObstacle[]):boolean=>{
 const dx=point.x-h.x,dy=point.y-h.y,len=Math.hypot(dx,dy);
 if(len<=.001||rate<=0)return false;
 const step=Math.min(len,rate*dt);
 const old={x:h.x,y:h.y};
 const next=omegaFieldResolveCollision(old,{
  x:h.x+dx/len*step,y:h.y+dy/len*step,
 },obstacles,h.radius);
 h.x=next.x;h.y=next.y;
 return Math.hypot(next.x-(old.x+dx/len*step),next.y-(old.y+dy/len*step))>1.5;
};
const navigate=(h:Hazard,target:OmegaFieldPoint,obstacles:readonly OmegaFieldObstacle[],
 speed:number,dt:number):boolean=>{
 const route=omegaFieldNextRoute(h,target,obstacles,OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT);
 return move(h,route?.next??target,speed,dt,obstacles);
};
const aim=(h:Hazard,target:OmegaFieldPoint):Readonly<{x:number;y:number}>=>{
 const d=Math.hypot(target.x-h.x,target.y-h.y)||1;
 return {x:(target.x-h.x)/d,y:(target.y-h.y)/d};
};
const phaseEnd=(brain:OmegaZombieBrain,phase:OmegaZombiePhase,time:number):void=>{
 brain.phase=phase;brain.timer=time;
};
export function omegaAdvanceZombieBrain(
 h:Hazard,brain:OmegaZombieBrain,player:Pick<PlayerStats,'x'|'y'>,
 obstacles:readonly OmegaFieldObstacle[],dt:number,
):OmegaZombieTick {
 if(!Number.isFinite(dt)||dt<0||dt>.1)throw new RangeError('Invalid zombie simulation delta');
 if(h.type!=='UNHELMETED'||h.hp<=0||dt===0||!Number.isFinite(player.x)||!Number.isFinite(player.y))
  return {attackWindow:false,contactDamage:0,collidedWithWall:false};
 if((h.isStunned??0)>0)return {attackWindow:false,contactDamage:0,collidedWithWall:false};
 const target={x:player.x,y:player.y};
 const gap=distance(h,target);
 let contactDamage=0,collidedWithWall=false,attackWindow=false;
 if(brain.phase==='recovery'){
  brain.timer=Math.max(0,brain.timer-dt);
  if(brain.timer<=0)phaseEnd(brain,'pursue',0);
 }else if(brain.phase==='warning'){
  brain.timer=Math.max(0,brain.timer-dt);
  if(brain.timer<=0){
   brain.attacks++;
   if(brain.kind==='sprinter'||brain.kind==='stalker'){
    phaseEnd(brain,'charge',SPEC[brain.kind].chargeTime);
    brain.chargeResolved=false;
   }else{
    attackWindow=true;
    if(gap<=brain.attackRadius+h.radius*.25)
     contactDamage=brain.damage;
    phaseEnd(brain,'recovery',brain.cooldown);
   }
  }
 }else if(brain.phase==='charge'){
  const s=SPEC[brain.kind];
  const old={x:h.x,y:h.y};
  const wanted={x:h.x+brain.lockedX*s.chargeSpeed*dt,
                y:h.y+brain.lockedY*s.chargeSpeed*dt};
  const moved=omegaFieldResolveCollision(old,wanted,obstacles,h.radius);
  h.x=moved.x;h.y=moved.y;
  collidedWithWall=Math.hypot(moved.x-wanted.x,moved.y-wanted.y)>1.5;
  brain.timer=Math.max(0,brain.timer-dt);
  if(!brain.chargeResolved&&distance(h,target)<=brain.attackRadius){
   attackWindow=true;contactDamage=brain.damage;brain.chargeResolved=true;
  }
  if(collidedWithWall||brain.timer<=0)phaseEnd(brain,'recovery',brain.cooldown);
 }else{
  if(gap<=brain.attackTrigger){
   brain.warnings++;
   const facing=aim(h,target);
   brain.lockedX=facing.x;brain.lockedY=facing.y;
   phaseEnd(brain,'warning',brain.warningDuration);
  }else if(brain.kind==='stalker'){
   // Genuine flank: orbit toward a waypoint perpendicular to the player line,
   // then pounce at the recorded position; never tunnel through scaffolds.
   const face=aim(h,target),sign=brain.orbitSign;
   const flank={x:player.x+face.y*sign*96,y:player.y-face.x*sign*96};
   const safe={x:Math.max(40,Math.min(OMEGA_FIELD_WIDTH-40,flank.x)),
               y:Math.max(40,Math.min(OMEGA_FIELD_HEIGHT-40,flank.y))};
   collidedWithWall=navigate(h,safe,obstacles,brain.speed,dt);
  }else{
   collidedWithWall=navigate(h,target,obstacles,brain.speed,dt);
  }
 }
 return {attackWindow,contactDamage,collidedWithWall};
}
export function omegaZombieThreatLabel(brain:OmegaZombieBrain):string{
 return ({drifter:'추격 감염체',sprinter:'질주 감염체',
  armored:'중장갑 감염체',stalker:'정예 잠복 감염체'} as const)[brain.kind];
}
