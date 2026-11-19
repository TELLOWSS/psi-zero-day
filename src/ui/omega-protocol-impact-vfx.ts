import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';

export interface OmegaImpactFx{
 readonly x:number;
 readonly y:number;
 readonly radius:number;
 readonly start:number;
 readonly until:number;
 readonly critical:boolean;
 readonly blocked:boolean;
 readonly damage:number;
 readonly seed:number;
}
export const OMEGA_IMPACT_FX_DURATION=.26;
export const OMEGA_MAX_IMPACT_FX=24;
const clamp=(v:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,v));
const hash=(id:string):number=>{
 let value=2166136261;
 for(let i=0;i<id.length;i++)value=Math.imul(value^id.charCodeAt(i),16777619);
 return value>>>0;
};
/** Only real impact feedback from the Watch simulation creates screen sparks.
 * Impact damage/critical/blocked labels cannot be invented by the renderer.
 * Uses in-session gameTime so pause freezes and expiry is deterministic.
 */
export function omegaAdvanceImpactFx(
 old:readonly OmegaImpactFx[],
 feedback:readonly ProjectileFeedback[],
 gameTime:number,
):OmegaImpactFx[]{
 if(!Number.isFinite(gameTime)||gameTime<0)throw new RangeError('Invalid impact time');
 const next=old.filter(effect=>effect.until>gameTime);
 for(const event of feedback){
  if(event.phase!=='impact'||!Number.isFinite(event.x)||!Number.isFinite(event.y)||
   !Number.isFinite(event.radius)||event.radius<0)continue;
  const applied=Number.isFinite(event.appliedDamage)?Math.max(0,event.appliedDamage??0):0;
  const radius=clamp((event.targetRadius??event.radius)*.4+8,9,33);
  next.push({
   x:event.x,y:event.y,radius,start:gameTime,
   until:gameTime+OMEGA_IMPACT_FX_DURATION,
   critical:Boolean(event.critical),blocked:Boolean(event.blocked),
   damage:applied,seed:hash(event.projectileId),
  });
 }
 return next.slice(-OMEGA_MAX_IMPACT_FX);
}
export function drawOmegaImpactFx(
 ctx:CanvasRenderingContext2D,
 effects:readonly OmegaImpactFx[],
 gameTime:number,
):void{
 if(!Number.isFinite(gameTime))return;
 for(const e of effects){
  if(e.until<=gameTime||e.start>gameTime)continue;
  const age=clamp((gameTime-e.start)/OMEGA_IMPACT_FX_DURATION,0,1);
  const opacity=(1-age)**1.6;
  const warm=e.critical?'#ffe6a6':e.blocked?'#ffad76':'#8cfaf2';
  ctx.save();
  ctx.globalAlpha=opacity;
  ctx.translate(e.x,e.y);
  // Cheap original vector flare; no per-hit image allocation or particles.
  ctx.strokeStyle=warm;ctx.fillStyle=warm;
  ctx.lineWidth=e.critical?4:2.7;ctx.lineCap='round';
  const size=e.radius*(.65+.9*age);
  const spin=(e.seed%12)*Math.PI/6;
  for(let i=0;i<6;i++){
   const theta=spin+i*Math.PI/3;
   const cs=Math.cos(theta),sn=Math.sin(theta);
   ctx.beginPath();ctx.moveTo(cs*size*.55,sn*size*.55);
   ctx.lineTo(cs*size,sn*size);ctx.stroke();
  }
  ctx.beginPath();ctx.arc(0,0,Math.max(1,size*.44),0,Math.PI*2);
  ctx.stroke();
  if(e.damage>0){
   ctx.font=e.critical?'900 17px system-ui':'800 13px system-ui';
   ctx.textAlign='center';ctx.shadowColor=warm;ctx.shadowBlur=8;
   ctx.fillText(String(Math.round(e.damage)),0,-20-age*28);
  }
  ctx.restore();
 }
}
