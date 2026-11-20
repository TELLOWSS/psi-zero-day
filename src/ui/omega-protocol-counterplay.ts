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
 const t=Number.isFinite(gameTime)?gameTime:0;
 const pulse=.72+.28*Math.sin(t*13);
 for(const cue of cues){
  const active=cue.phase==='charge';
  const rgb=cue.kind==='cart'?'255,176,74':'255,84,126';
  const hiHex=cue.kind==='cart'?'#ffd58a':'#ff9ebb';
  const baseRadius=Math.max(cue.kind==='cart'?30:23,cue.radius*0.86);
  const angle=Math.atan2(cue.directionY,cue.directionX);
  const visibleLength=omegaCounterplayVisibleLength(cue,obstacles);

  ctx.save();
  ctx.translate(cue.x,cue.y);

  // 1. Soft floor-projected holographic danger pool around attacker feet.
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  const poolGrad=ctx.createRadialGradient?.(0,0,4,0,0,baseRadius*1.12);
  if(poolGrad&&typeof poolGrad.addColorStop==='function'){
   poolGrad.addColorStop(0,`rgba(${rgb},${(active?0.24:0.13*pulse).toFixed(3)})`);
   poolGrad.addColorStop(0.72,`rgba(${rgb},${(active?0.16:0.09*pulse).toFixed(3)})`);
   poolGrad.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=poolGrad;
  }else{
   ctx.fillStyle=`rgba(${rgb},${(active?0.18:0.10).toFixed(3)})`;
  }
  ctx.beginPath();ctx.arc(0,0,baseRadius*1.12,0,Math.PI*2);ctx.fill();

  // Crisp 1.6px outer perimeter ring + converging countdown telegraph ring.
  ctx.strokeStyle=`rgba(${rgb},${(active?0.78:0.52*pulse).toFixed(3)})`;
  ctx.lineWidth=active?2.0:1.5;
  ctx.setLineDash(active?[]:[8,6]);
  ctx.beginPath();ctx.arc(0,0,baseRadius,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);

  if(!active&&cue.seconds>0){
   const shrink=Math.max(0.28,Math.min(1,cue.seconds/0.65));
   ctx.strokeStyle=`rgba(255,240,224,${(0.55*pulse).toFixed(3)})`;
   ctx.lineWidth=1.4;
   ctx.beginPath();
   ctx.arc(0,0,baseRadius*shrink,angle-0.95,angle+0.95);
   ctx.stroke();
  }
  ctx.restore();

  // 2. Obstacle-clipped tactical charge corridor (replaces raw circle + stick arrow).
  if(visibleLength>=20&&Number.isFinite(angle)){
   const halfW=Math.min(20,Math.max(11,cue.bodyRadius*0.68));
   const farHalfW=halfW*(active?0.84:0.68);

   ctx.save();
   ctx.rotate(angle);
   ctx.globalCompositeOperation='lighter';

   // Tapered holographic danger lane fill clipped strictly at cover boundary.
   ctx.beginPath();
   ctx.moveTo(0,-halfW);
   ctx.lineTo(visibleLength,-farHalfW);
   ctx.lineTo(visibleLength,farHalfW);
   ctx.lineTo(0,halfW);
   ctx.closePath();

   const laneGrad=ctx.createLinearGradient?.(0,0,visibleLength,0);
   if(laneGrad&&typeof laneGrad.addColorStop==='function'){
    laneGrad.addColorStop(0,`rgba(${rgb},${(active?0.34:0.20*pulse).toFixed(3)})`);
    laneGrad.addColorStop(0.65,`rgba(${rgb},${(active?0.22:0.12*pulse).toFixed(3)})`);
    laneGrad.addColorStop(1,`rgba(${rgb},0.03)`);
    ctx.fillStyle=laneGrad;
   }else{
    ctx.fillStyle=`rgba(${rgb},${(active?0.22:0.13).toFixed(3)})`;
   }
   ctx.fill();

   // Clip animated scrolling chevrons inside exact lane bounds so cover stops visuals cleanly.
   ctx.save();
   ctx.clip();
   const spacing=30;
   const scroll=(t*(active?220:120))%spacing;
   ctx.strokeStyle=`rgba(255,244,232,${(active?0.74:0.48*pulse).toFixed(3)})`;
   ctx.lineWidth=active?2.0:1.5;
   ctx.lineCap='round';ctx.lineJoin='round';
   for(let d=scroll-spacing*0.4;d<visibleLength-4;d+=spacing){
    if(d<8)continue;
    const frac=d/Math.max(1,visibleLength);
    const cw=(halfW+(farHalfW-halfW)*frac)*0.56;
    ctx.beginPath();
    ctx.moveTo(d-8,-cw);ctx.lineTo(d+4,0);ctx.lineTo(d-8,cw);
    ctx.stroke();
   }
   ctx.restore();

   // Crisp dual laser boundary rails along lane edges.
   ctx.strokeStyle=`rgba(${rgb},${(active?0.82:0.54*pulse).toFixed(3)})`;
   ctx.lineWidth=active?1.8:1.3;
   ctx.beginPath();
   ctx.moveTo(0,-halfW);ctx.lineTo(visibleLength,-farHalfW);
   ctx.moveTo(0,halfW);ctx.lineTo(visibleLength,farHalfW);
   ctx.stroke();

   // Glowing terminal bracket at clipped endpoint (or arrowhead cap).
   ctx.strokeStyle=hiHex;
   ctx.lineWidth=2.0;
   ctx.beginPath();
   ctx.moveTo(visibleLength-7,-farHalfW*0.85);
   ctx.lineTo(visibleLength,0);
   ctx.lineTo(visibleLength-7,farHalfW*0.85);
   ctx.stroke();

   ctx.restore();
  }
  ctx.restore();
 }
}
