import { footTravel, soleContact } from './survivors-ground-contact';
import { ACTOR_RIGS, solveKnee, type ActorRig, type Joint, type LegRig } from './survivors-animation-rig';
import type { SpritePose } from './survivors-sprite-motion';
import {cachedGaitPhase,GAIT_PHASES} from './survivors-gait-phase';
interface SourceRect {x:number;y:number;width:number;height:number}
interface Prepared { texture:HTMLCanvasElement; legTexture:HTMLCanvasElement; rig:ActorRig; frames:Map<string,HTMLCanvasElement>; width:number }
const prepared = new WeakMap<HTMLImageElement,Prepared>();
const BODY=256, WIDTH=300, HEIGHT=320, ORIGIN_X=150, ORIGIN_Y=294;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const joint=(a:Joint,b:Joint,t:number):Joint=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)});
export function riggedTorsoOffset(phase:number,running:boolean,brace:number,action:number,blend:number,height:number):Joint {
 return {x:action*1.4*height/74,y:(Math.cos(phase/16*Math.PI*4)*(running?1.1:.55)*blend-brace*2)*height/74};
}

/** Keep attachments continuous while the expensive leg mesh remains cached. */
function torsoOffset(pose:SpritePose,height:number,rigged:boolean):Joint|null {
 if(rigged && (pose.gaitBlend>0 || pose.reaction>0 || pose.action>0)){
  const phase=pose.cycle/(Math.PI*2)*16;
  const dy=Math.round(pose.directionY*32)/32;
  const running=pose.stride/Math.sqrt(1-.64*dy*dy)>60;
  return riggedTorsoOffset(phase,running,pose.reaction,pose.action,pose.gaitBlend,height);
 }
 return null;
}
export function actorTorsoPoint(point:Joint,pose:SpritePose,height:number,rigged:boolean):Joint {
 const offset=torsoOffset(pose,height,rigged);
 if(offset) return {x:pose.facing*(point.x+offset.x+pose.lean*(point.y+offset.y)),y:point.y+offset.y};
 return {x:pose.facing*(point.x+(pose.lean+pose.action*.025)*point.y),y:(pose.scaleY-pose.action*.008)*point.y};
}
export function applyActorTorsoTransform(ctx:CanvasRenderingContext2D,pose:SpritePose,height:number,rigged:boolean):void {
 ctx.scale(pose.facing,1);
 const offset=torsoOffset(pose,height,rigged);
 if(offset){
  ctx.transform(1,0,pose.lean,1,0,0);ctx.translate(offset.x,offset.y);
 }else ctx.transform(1,0,pose.lean+pose.action*.025,pose.scaleY-pose.action*.008,0,0);
}
export function prepareActorRig(image:HTMLImageElement,source:SourceRect):void {
 const rig=ACTOR_RIGS[image.src.split('/').pop() ?? ''];
 if(!rig) return;
 const texture=document.createElement('canvas'); texture.height=BODY;texture.width=Math.ceil(BODY*source.width/source.height);
 const ctx=texture.getContext('2d'); if(!ctx)return;
 ctx.drawImage(image,source.x,source.y,source.width,source.height,0,0,texture.width,BODY);
 const legTexture=document.createElement('canvas');legTexture.width=texture.width;legTexture.height=BODY;
 const legCtx=legTexture.getContext('2d')!;legCtx.drawImage(texture,0,0);
 for(const polygon of rig.protected ?? []){legCtx.save();legCtx.beginPath();polygon.forEach((point,i)=>{if(i===0)legCtx.moveTo(point.x*texture.width,point.y*BODY);else legCtx.lineTo(point.x*texture.width,point.y*BODY)});legCtx.closePath();legCtx.clip();legCtx.clearRect(0,0,texture.width,BODY);legCtx.restore();}
 prepared.set(image,{texture,legTexture,rig,width:texture.width,frames:new Map()});
}
function triangle(ctx:CanvasRenderingContext2D,texture:HTMLCanvasElement,s:Joint[],d:Joint[]):void {
 const [a,b,c]=s as [Joint,Joint,Joint], [p,q,r]=d as [Joint,Joint,Joint];
 const x1=b.x-a.x,y1=b.y-a.y,x2=c.x-a.x,y2=c.y-a.y,det=x1*y2-x2*y1;
 if(Math.abs(det)<.001)return;
 const m11=((q.x-p.x)*y2-(r.x-p.x)*y1)/det,m21=((q.y-p.y)*y2-(r.y-p.y)*y1)/det;
 const m12=((r.x-p.x)*x1-(q.x-p.x)*x2)/det,m22=((r.y-p.y)*x1-(q.y-p.y)*x2)/det;
 ctx.save();ctx.beginPath();
 // Slight overlap at internal edges avoids antialias cracks in the textured mesh.
 const cx=(p.x+q.x+r.x)/3,cy=(p.y+q.y+r.y)/3;
 for(let i=0;i<d.length;i++){const v=d[i]!;const len=Math.max(.001,Math.hypot(v.x-cx,v.y-cy));const x=v.x+(v.x-cx)/len*.25,y=v.y+(v.y-cy)/len*.25;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
 ctx.closePath();ctx.clip();ctx.transform(m11,m21,m12,m22,p.x-m11*a.x-m12*a.y,p.y-m21*a.x-m22*a.y);ctx.drawImage(texture,0,0);ctx.restore();
}
function pixels(l:LegRig,width:number):LegRig {
 const p=(j:Joint):Joint=>({x:j.x*width,y:j.y*BODY});return {hip:p(l.hip),knee:p(l.knee),ankle:p(l.ankle),sole:p(l.sole)};
}
function rowAt(l:LegRig,y:number):Joint {
 if(y<=l.knee.y)return joint(l.hip,l.knee,(y-l.hip.y)/(l.knee.y-l.hip.y));
 if(y<=l.ankle.y)return joint(l.knee,l.ankle,(y-l.knee.y)/(l.ankle.y-l.knee.y));
 return joint(l.ankle,l.sole,(y-l.ankle.y)/(l.sole.y-l.ankle.y));
}
function legRows(p:Prepared,source:LegRig,other:LegRig,left:boolean):{y:number;lo:number;hi:number}[] {
 const image=p.legTexture.getContext('2d')!.getImageData(0,0,p.width,BODY).data;
 const rows=[];
 for(let i=0;i<=8;i++){
  const y=mix(source.hip.y,source.sole.y,i/8),center=rowAt(source,y),opposite=rowAt(other,Math.min(y,other.sole.y));
  const partition=(center.x+opposite.x)/2;
  const searchLo=Math.max(0,Math.floor(center.x-p.width*.24),left?0:Math.floor(partition));
  const searchHi=Math.min(p.width-1,Math.ceil(center.x+p.width*.24),left?Math.ceil(partition):p.width-1);
  let lo=searchHi,hi=searchLo;
  for(let x=searchLo;x<=searchHi;x++)for(let dy=-2;dy<=2;dy++){
   const sy=Math.max(0,Math.min(BODY-1,Math.round(y)+dy));
   if(image[(sy*p.width+x)*4+3]!>24){lo=Math.min(lo,x);hi=Math.max(hi,x);}
  }
  if(hi<=lo){lo=center.x-p.width*.09;hi=center.x+p.width*.09;}
  rows.push({y,lo:lo-1,hi:hi+1});
 }
 return rows;
}
const rowsCache=new WeakMap<Prepared,ReturnType<typeof legRows>[]>();
function bake(p:Prepared,phase:number,running:boolean,directionY:number,brace:number,action:number,blend:number,height:number,stride:number):HTMLCanvasElement {
 const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;const ctx=canvas.getContext('2d')!;
 ctx.translate(ORIGIN_X-p.width/2,ORIGIN_Y-BODY);
 const sources=[pixels(p.rig.left,p.width),pixels(p.rig.right,p.width)];
 let rows=rowsCache.get(p);if(!rows){rows=[legRows(p,sources[0]!,sources[1]!,true),legRows(p,sources[1]!,sources[0]!,false)];rowsCache.set(p,rows);}
 const cycle=phase/16*Math.PI*2;
 const torso=riggedTorsoOffset(phase,running,brace,action,blend,BODY);
 const torsoY=torso.y;
 const targets=sources.map((l,i)=>{
  const amplitude=brace>0?0:blend;const step=footTravel(cycle,i===1,running,directionY,amplitude,stride);
  const offsetX=step.x*BODY/height;
  const offsetY=(step.y-step.lift)*BODY/height;
  const hip={x:l.hip.x+torso.x,y:l.hip.y+torsoY};
  const ankle={x:l.ankle.x+offsetX,y:l.ankle.y+offsetY};
  const upper=Math.hypot(l.knee.x-l.hip.x,l.knee.y-l.hip.y)*1.04;
  const lower=Math.hypot(l.ankle.x-l.knee.x,l.ankle.y-l.knee.y)*1.04;
  const knee=solveKnee(hip,ankle,upper,lower,-1);
  return {hip,knee,ankle,sole:{x:l.sole.x+offsetX,y:l.sole.y+offsetY}};
 });
 // Far leg first; the intact torso covers the hip seam without changing the face or equipment.
 for(const i of [1,0]){
  const l=sources[i]!,target=targets[i]!,rr=rows[i]!;
  const dest=rr.map(row=>{const center=rowAt(l,row.y),fraction=(row.y-l.hip.y)/(l.sole.y-l.hip.y);let moved:Joint;
   if(row.y<=l.knee.y)moved=joint(target.hip,target.knee,(row.y-l.hip.y)/(l.knee.y-l.hip.y));
   else if(row.y<=l.ankle.y)moved=joint(target.knee,target.ankle,(row.y-l.knee.y)/(l.ankle.y-l.knee.y));
   else moved=joint(target.ankle,target.sole,(row.y-l.ankle.y)/(l.sole.y-l.ankle.y));
   // Keep pelvis anchored while the shin and boot follow their own joints.
   const widthScale=1-Math.sin(cycle+(i?Math.PI:0))*.025*fraction;
   return [{x:moved.x+(row.lo-center.x)*widthScale,y:moved.y},{x:moved.x+(row.hi-center.x)*widthScale,y:moved.y}];});
  for(let row=0;row<rr.length-1;row++){
   const a=rr[row]!,b=rr[row+1]!,d=dest[row]!,e=dest[row+1]!;
   const s0={x:a.lo,y:a.y},s1={x:a.hi,y:a.y},s2={x:b.lo,y:b.y},s3={x:b.hi,y:b.y};
   triangle(ctx,p.legTexture,[s0,s1,s2],[d[0]!,d[1]!,e[0]!]);triangle(ctx,p.legTexture,[s1,s3,s2],[d[1]!,e[1]!,e[0]!]);
  }
 }
 ctx.save();ctx.beginPath();ctx.rect(0,0,p.width,p.rig.waist*BODY+5);
 ctx.clip();ctx.translate(torso.x,torsoY);ctx.drawImage(p.texture,0,0);ctx.restore();
 for(const polygon of p.rig.protected ?? []){ctx.save();ctx.beginPath();polygon.forEach((point,i)=>{if(i===0)ctx.moveTo(point.x*p.width,point.y*BODY);else ctx.lineTo(point.x*p.width,point.y*BODY)});ctx.closePath();ctx.clip();ctx.translate(torso.x,torsoY);ctx.drawImage(p.texture,0,0);ctx.restore();}
 return canvas;
}
/** Cached textured joint poses: no redraw of dozens of mesh triangles during steady gameplay. */
export function drawRiggedActor(ctx:CanvasRenderingContext2D,image:HTMLImageElement,height:number,pose:SpritePose):boolean {
 const p=prepared.get(image);if(!p || (pose.gaitBlend===0 && pose.reaction===0 && pose.action===0))return false;
 const phase=cachedGaitPhase(pose.cycle);
 const dy=Math.round(pose.directionY*32)/32;
 const reaction=Math.round(pose.reaction*3)/3,action=Math.round(pose.action*2)/2;
 const stride=Math.round(pose.stride*10)/10;
 const running=pose.stride/Math.sqrt(1-.64*pose.directionY*pose.directionY)>60,blend=Math.round(pose.gaitBlend*4)/4;
 const key=`${phase}:${running}:${dy}:${reaction}:${action}:${blend}:${height}:${stride}`;
 let frame=p.frames.get(key);if(!frame){frame=bake(p,phase,running,dy,reaction,action,blend,height,stride);p.frames.set(key,frame);if(p.frames.size>GAIT_PHASES)p.frames.delete(p.frames.keys().next().value!);}
 else {p.frames.delete(key);p.frames.set(key,frame);}
 const scale=height/BODY;
 ctx.save();ctx.scale(pose.facing,1);ctx.transform(1,0,pose.lean,1,0,0);
 // Each support foot has a fixed ground contact; raised feet get a softer, smaller shadow.
 for(const opposite of [false,true]){const step=footTravel(phase/16*Math.PI*2,opposite,running,dy,reaction>0?0:blend,stride);const sole=opposite?p.rig.right.sole:p.rig.left.sole;const contact=soleContact(sole,p.width/BODY,height,step);ctx.fillStyle=`rgba(0,0,0,${step.planted?.35:.16})`;ctx.beginPath();ctx.ellipse(contact.x,contact.y+1,(step.planted?5:3)*height/74,2*height/74,0,0,Math.PI*2);ctx.fill();}
 const continuous=torsoOffset(pose,height,true)!;
 const cached=riggedTorsoOffset(phase,running,reaction,action,blend,height);
 ctx.translate(continuous.x-cached.x,continuous.y-cached.y);
 ctx.drawImage(frame,-ORIGIN_X*scale,-ORIGIN_Y*scale,WIDTH*scale,HEIGHT*scale);ctx.restore();return true;
}
