import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
export const METAL_IMPACT_ART='/assets/survivors/metal-impact-sequence-v1.png';
const keys=[0,.07,.23,.46,.72,1] as const;
const origins=[[256,249],[249,252],[231,253],[256,256],[256,256],[256,256]] as const;
export function metalImpactFrame(age:number,duration:number){
 if(!Number.isFinite(age)||!Number.isFinite(duration)||age<0||duration<=0||age>=duration)return undefined;
 const t=age/duration;
 let frame=0;while(frame<4&&t>=keys[frame+1]!)frame++;
 const fraction=(t-keys[frame]!)/(keys[frame+1]!-keys[frame]!);
 return {frame,next:frame+1,blend:fraction*fraction*(3-2*fraction),alpha:t>.82?(1-t)/.18:1};
}
/** Authored silhouette changes replace the previous whole-stamp material animation. */
export function drawAuthoredMetalImpact(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement|undefined,event:Readonly<ProjectileFeedback>,age:number,duration:number,reduced:boolean,busy:boolean):boolean{
 if(reduced||event.worker||event.blocked||event.phase!=='impact'||!['RUNAWAY_CART','CRANE_BOSS'].includes(event.actorKind??'')||!atlas?.naturalWidth)return false;
 return drawAuthoredImpactSequence(ctx,atlas,event,age,duration,busy,origins);
}
export function drawAuthoredImpactSequence(ctx:CanvasRenderingContext2D,atlas:HTMLImageElement,event:Readonly<ProjectileFeedback>,age:number,duration:number,busy:boolean,origins:readonly (readonly [number,number])[],opacity=.9,extent=event.critical?104:76):boolean{
 const pose=metalImpactFrame(age,duration);if(!pose)return false;
 const cw=atlas.naturalWidth/3,ch=atlas.naturalHeight/2;
 ctx.save();ctx.rotate(event.angle);ctx.globalCompositeOperation='source-over';
 const stamp=(frame:number,weight:number)=>{
  const [ox,oy]=origins[frame]!;ctx.globalAlpha=pose.alpha*weight*(busy?Math.min(.65,opacity):opacity);
  ctx.drawImage(atlas,frame%3*cw,Math.floor(frame/3)*ch,cw,ch,-ox/512*extent,-oy/512*extent,extent,extent);
 };
 if(busy)stamp(pose.blend<.5?pose.frame:pose.next,1);
 else{stamp(pose.frame,1-pose.blend);stamp(pose.next,pose.blend);}
 ctx.restore();return true;
}
