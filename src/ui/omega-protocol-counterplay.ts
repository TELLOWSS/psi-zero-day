import type {Hazard,PlayerStats} from '../domain/patrol-survivors';
import type {OmegaZombieBrain} from '../domain/omega-protocol-zombie-ai';
import type {OmegaFieldObstacle} from '../domain/omega-protocol-field';

/**
 * M04-D5: presentation-only counterplay cues sourced from live Watch hazard
 * motions and OMEGA zombie brains. No new warning/attack timers, collision,
 * invulnerability, HP or user-save mutations. Lines show locked DIRECTION,
 * not a promised wall-penetrating charge endpoint.
 */
export interface OmegaCounterplayCue {
 readonly id:string;
 readonly kind:'cart'|'zombie';
 readonly label:string;
 readonly phase:'warning'|'charge';
 readonly seconds:number;
 readonly x:number; readonly y:number;
 readonly directionX:number; readonly directionY:number;
 readonly radius:number;
 readonly bodyRadius:number;
 readonly directionLength:number;
}

const zombieLabel={
 drifter:'감염체 접근 타격',
 sprinter:'질주 감염체 돌진',
 armored:'장갑 감염체 강타',
 stalker:'잠복 감염체 도약',
} as const;

export function omegaCounterplayCues(
 hazards:readonly Hazard[],brainFor:(id:string)=>OmegaZombieBrain|null,
):readonly OmegaCounterplayCue[]{
 const cues:OmegaCounterplayCue[]=[];
 for(const h of hazards){
  if(h.hp<=0)continue;
  if(h.type==='RUNAWAY_CART'){
   const motion=h.motion;
   if(!motion||(motion.phase!=='warning'&&motion.phase!=='charge'))continue;
   const magnitude=Math.hypot(motion.directionX,motion.directionY);
   if(!Number.isFinite(magnitude)||magnitude<.95)continue;
   cues.push({
    id:h.id,kind:'cart',label:'폭주 운반장비 돌진',
    phase:motion.phase,seconds:motion.phase==='warning'?Math.max(0,motion.timer):0,
    x:h.x,y:h.y,directionX:motion.directionX/magnitude,directionY:motion.directionY/magnitude,
    radius:h.radius,bodyRadius:h.radius,directionLength:175,
   });
   continue;
  }
  if(h.type!=='UNHELMETED')continue;
  const brain=brainFor(h.id);
  if(!brain||(brain.phase!=='warning'&&brain.phase!=='charge'))continue;
  const magnitude=Math.hypot(brain.lockedX,brain.lockedY);
  if(!Number.isFinite(magnitude)||magnitude<.95)continue;
  cues.push({
   id:h.id,kind:'zombie',label:zombieLabel[brain.kind],
   phase:brain.phase,seconds:brain.phase==='warning'?Math.max(0,brain.timer):0,
   x:h.x,y:h.y,directionX:brain.lockedX/magnitude,directionY:brain.lockedY/magnitude,
   radius:brain.attackRadius,bodyRadius:h.radius,
   // Direction preview only for the two truly travelling charge archetypes.
   directionLength:brain.kind==='sprinter'?150:brain.kind==='stalker'?100:0,
  });
 }
 return cues;
}

/** Select a REAL nearby warning, not an invented ETA or aim assistance. */
export function omegaNearestCounterplayCue(
 cues:readonly OmegaCounterplayCue[],player:Pick<PlayerStats,'x'|'y'>,
):OmegaCounterplayCue|null{
 if(!cues.length)return null;
 return [...cues].sort((a,b)=>{
  const da=Math.hypot(a.x-player.x,a.y-player.y),db=Math.hypot(b.x-player.x,b.y-player.y);
  // A live charge is immediately active, then rank other threats by range.
  const pa=a.phase==='charge'?0:1,pb=b.phase==='charge'?0:1;
  return pa-pb||da-db||a.id.localeCompare(b.id);
 })[0]??null;
}
export function omegaDashAvailability(
 player:Pick<PlayerStats,'dashCooldown'|'isDashing'>,
):Readonly<{ready:boolean;remaining:number;label:string}>{
 const value=player.dashCooldown??0;
 if(!Number.isFinite(value)||value<0)
  return {ready:false,remaining:0,label:'회피 상태 확인'};
 const remaining=Math.max(0,value);
 if(player.isDashing)return {ready:false,remaining,label:'회피 중'};
 return remaining>0
  ?{ready:false,remaining,label:'회피 '+remaining.toFixed(1)+'초 후'}
  :{ready:true,remaining:0,label:'회피 가능'};
}
/**
 * World-space symbols use the same live locked heading as HP collision logic.
 * No forecast is drawn through cover as an allegedly guaranteed hit lane.
 */
/** Ray/AABB clipping against the SAME OMEGA solid cover shapes as native
 * projectile/collision terrain. Guidance cannot visibly cut THROUGH cover.
 * The ray is a facing preview, not an exact future impact forecast.
 */
export function omegaCounterplayVisibleLength(
 cue:OmegaCounterplayCue,obstacles:readonly OmegaFieldObstacle[],
):number{
 let visible=cue.directionLength;
 if(visible<=0)return 0;
 for(const o of obstacles){
  const r=Math.max(0,cue.bodyRadius);
  const bounds=[
   {p:cue.x,v:cue.directionX,min:o.x-r,max:o.x+o.width+r},
   {p:cue.y,v:cue.directionY,min:o.y-r,max:o.y+o.height+r},
  ];
  let enter=0,exit=visible;
  let intersects=true;
  for(const b of bounds){
   if(Math.abs(b.v)<1e-9){
    if(b.p<b.min||b.p>b.max){intersects=false;break;}
    continue;
   }
   const t0=(b.min-b.p)/b.v,t1=(b.max-b.p)/b.v;
   enter=Math.max(enter,Math.min(t0,t1));
   exit=Math.min(exit,Math.max(t0,t1));
   if(exit<enter){intersects=false;break;}
  }
  if(intersects&&enter<=exit)visible=Math.min(visible,Math.max(0,enter-4));
 }
 return visible;
}

export function drawOmegaCounterplayCues(
 ctx:CanvasRenderingContext2D,cues:readonly OmegaCounterplayCue[],gameTime:number,
 obstacles:readonly OmegaFieldObstacle[]=[],
):void{
 const pulse=.65+.18*Math.sin(gameTime*12);
 for(const cue of cues){
  const active=cue.phase==='charge';
  const color=cue.kind==='cart'?'#ffc66e':'#ff90d6';
  ctx.save();
  ctx.globalAlpha=active?.9:pulse;
  ctx.strokeStyle=color;ctx.lineWidth=active?6:4;
  ctx.setLineDash(active?[]:[12,9]);
  ctx.beginPath();ctx.arc(cue.x,cue.y,Math.max(cue.kind==='cart'?32:25,cue.radius),0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);
  const visibleLength=omegaCounterplayVisibleLength(cue,obstacles);
  if(visibleLength>=20){
   // Solid cover ends the cue before the actual physical collision boundary.
   const ex=cue.x+cue.directionX*visibleLength;
   const ey=cue.y+cue.directionY*visibleLength;
   ctx.lineWidth=active?7:4;ctx.setLineDash(active?[]:[12,8]);
   ctx.beginPath();ctx.moveTo(cue.x,cue.y);ctx.lineTo(ex,ey);ctx.stroke();
   ctx.setLineDash([]);
   ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(ex,ey);
   ctx.lineTo(ex-cue.directionX*18-cue.directionY*10,ey-cue.directionY*18+cue.directionX*10);
   ctx.lineTo(ex-cue.directionX*18+cue.directionY*10,ey-cue.directionY*18-cue.directionX*10);
   ctx.closePath();ctx.fill();
  }
  ctx.restore();
 }
}
