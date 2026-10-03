import { ACTOR_RIGS, footstep, solveKnee, type ActorRig, type Joint, type LegRig } from './survivors-animation-rig';
import type { SpritePose } from './survivors-sprite-motion';
interface SourceRect {x:number;y:number;width:number;height:number}
interface Prepared { texture:HTMLCanvasElement; rig:ActorRig; frames:Map<string,HTMLCanvasElement>; width:number }
const prepared = new WeakMap<HTMLImageElement,Prepared>();
const BODY=192, WIDTH=224, HEIGHT=240, ORIGIN_X=112, ORIGIN_Y=220;
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const joint=(a:Joint,b:Joint,t:number):Joint=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)});
export function prepareActorRig(image:HTMLImageElement,source:SourceRect):void {
 const rig=ACTOR_RIGS[image.src.split('/').pop() ?? ''];
 if(!rig) return;
 const texture=document.createElement('canvas'); texture.height=BODY;texture.width=Math.ceil(BODY*source.width/source.height);
 const ctx=texture.getContext('2d'); if(!ctx)return;
 ctx.drawImage(image,source.x,source.y,source.width,source.height,0,0,texture.width,BODY);
 prepared.set(image,{texture,rig,width:texture.width,frames:new Map()});
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
 const image=p.texture.getContext('2d')!.getImageData(0,0,p.width,BODY).data;
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
function bake(p:Prepared,phase:number,running:boolean,directionY:number,brace:number,action:number,blend:number):HTMLCanvasElement {
 const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;const ctx=canvas.getContext('2d')!;
 ctx.translate(ORIGIN_X-p.width/2,ORIGIN_Y-BODY);
 const sources=[pixels(p.rig.left,p.width),pixels(p.rig.right,p.width)];
 let rows=rowsCache.get(p);if(!rows){rows=[legRows(p,sources[0]!,sources[1]!,true),legRows(p,sources[1]!,sources[0]!,false)];rowsCache.set(p,rows);}
 const cycle=phase/16*Math.PI*2;
 const torsoY=(Math.cos(cycle*2)*(running?1.1:.55)*blend-brace*2)*BODY/74;
 const targets=sources.map((l,i)=>{
  const step=footstep(cycle,i===1,running);const amplitude=brace>0?0:blend;
  const offsetX=step.offset*Math.sqrt(Math.max(0,1-directionY*directionY))*BODY/74*amplitude;
  const offsetY=(step.offset*directionY*.34-step.lift)*BODY/74*amplitude;
  const hip={x:l.hip.x+(action*1.4)*BODY/74,y:l.hip.y+torsoY};
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
   triangle(ctx,p.texture,[s0,s1,s2],[d[0]!,d[1]!,e[0]!]);triangle(ctx,p.texture,[s1,s3,s2],[d[1]!,e[1]!,e[0]!]);
  }
 }
 ctx.save();ctx.beginPath();ctx.rect(0,0,p.width,BODY);
 // Subtract only the leg regions; low hanging hands and tools outside these regions remain intact.
 for(const rr of rows){ctx.moveTo(rr[0]!.lo,rr[0]!.y+3);for(const row of rr)ctx.lineTo(row.lo,row.y+3);for(const row of [...rr].reverse())ctx.lineTo(row.hi,row.y+3);ctx.closePath();}
 ctx.clip('evenodd');ctx.translate(action*1.4*BODY/74,torsoY);ctx.drawImage(p.texture,0,0);ctx.restore();
 return canvas;
}
/** Cached textured joint poses: no redraw of dozens of mesh triangles during steady gameplay. */
export function drawRiggedActor(ctx:CanvasRenderingContext2D,image:HTMLImageElement,height:number,pose:SpritePose):boolean {
 const p=prepared.get(image);if(!p || (pose.gaitBlend===0 && pose.reaction===0))return false;
 const phase=Math.floor(pose.cycle/(Math.PI*2)*16)%16;
 const dy=Math.round(pose.directionY*2)/2;
 const reaction=Math.round(pose.reaction*3)/3,action=Math.round(pose.action*2)/2;
 const running=pose.stride===66,blend=Math.round(pose.gaitBlend*4)/4;
 const key=`${phase}:${running}:${dy}:${reaction}:${action}:${blend}`;
 let frame=p.frames.get(key);if(!frame){frame=bake(p,phase,running,dy,reaction,action,blend);p.frames.set(key,frame);if(p.frames.size>24)p.frames.delete(p.frames.keys().next().value!);}
 else {p.frames.delete(key);p.frames.set(key,frame);}
 const scale=height/BODY;
 ctx.save();ctx.scale(pose.facing,1);ctx.transform(1,0,pose.lean,1,0,0);
 // Each support foot has a fixed ground contact; raised feet get a softer, smaller shadow.
 for(const opposite of [false,true]){const step=pose.reaction>0?{offset:0,planted:true}:footstep(pose.cycle,opposite,running);ctx.fillStyle=`rgba(0,0,0,${step.planted?.35:.16})`;ctx.beginPath();ctx.ellipse(((opposite?5:-5)+step.offset*Math.sqrt(Math.max(0,1-dy*dy))*blend)*height/74,(step.offset*dy*.34*blend+1)*height/74,(step.planted?5:3)*height/74,2*height/74,0,0,Math.PI*2);ctx.fill();}
 ctx.drawImage(frame,-ORIGIN_X*scale,-ORIGIN_Y*scale,WIDTH*scale,HEIGHT*scale);ctx.restore();return true;
}
