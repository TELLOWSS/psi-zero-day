import type {SpritePose} from './survivors-sprite-motion';
import {applyActorTorsoTransform} from './survivors-rig-renderer';
import {actorTorsoPoint} from './survivors-rig-renderer';
import {CHARACTER_CONTACT_ART,contactFrameWeights} from './survivors-contact-art';
import {FootContactTracker,swingContactPoints,type FootPoint} from './survivors-foot-lock';
import {drawContactMesh} from './survivors-contact-mesh';
import {DIRECTIONAL_WORN_CALIBRATIONS} from './survivors-worn-equipment-plan';
const footContacts=new FootContactTracker();
const contactSheets=new Map<string,Promise<Sheet|undefined>>();
export const PLAYER_DIRECTIONAL_ART='/assets/survivors/player-walk-eight-v1.png';
export const PLAYER_PASSING_ART='/assets/survivors/player-walk-passing-v1.png';
export const PLAYER_ACTION_ART='/assets/survivors/player-command-eight-v1.png';
export const PLAYER_CHECK_ART='/assets/survivors/player-equipment-check-eight-v1.png';
const PHASES=[0,1,1.5,2,3,4,5,5.5,6,7] as const;
const FRAMES=[0,1,8,2,3,4,5,9,6,7] as const;
const FRAMES_PER_DIRECTION=12;
export function directionalActionFrame(progress:number):number|undefined {
 if(!Number.isFinite(progress)||progress<.12||progress>=.56)return;
 return 10;
}
export function movementDirection(dx:number,dy:number,previous=2):number {
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<.015)return previous;
 const angle=Math.atan2(dy,dx),turn=Math.PI*2,center=previous*Math.PI/4;
 const difference=Math.abs(((angle-center+Math.PI)%turn+turn)%turn-Math.PI);
 if(difference<Math.PI/8+.06)return previous;
 return ((Math.round(angle/(Math.PI/4))%8)+8)%8;
}
export function directionalFrame(cycle:number,moving:boolean):number {
 if(!Number.isFinite(cycle))return 0;
 const phase=((cycle%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI*2);
 return moving?Math.floor(phase*8)%8:Math.round(phase*2)%2*4;
}
export function directionalFrameWeights(cycle:number,moving:boolean,gaitBlend=moving?1:0):{frame:number;weight:number}[] {
 const safe=Number.isFinite(cycle)?cycle:0,phase=((safe%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*8;
 // Keep the authored pose sharp; a short boundary bridge avoids sustained double limbs.
 let index=0;while(index+1<PHASES.length&&phase>=PHASES[index+1]!)index++;
 const start=PHASES[index]!,end=PHASES[index+1]??8;
 const frame=FRAMES[index]!,next=FRAMES[(index+1)%FRAMES.length]!;
 const t=Math.max(0,((phase-start)/(end-start)-.82)/.18),smooth=t*t*(3-2*t);
 const rawGait=Math.max(0,Math.min(1,Number.isFinite(gaitBlend)?gaitBlend:0));
 const gait=rawGait*rawGait*(3-2*rawGait);
 const weights=new Map<number,number>();
 const add=(f:number,w:number)=>{if(w>0)weights.set(f,(weights.get(f)??0)+w);};
 add(frame,(1-smooth)*gait);add(next,smooth*gait);
 add(directionalFrame(safe,false),1-gait);
 return [...weights].map(([frame,weight])=>({frame,weight}));
}
export function directionalPoseWeights(pose:SpritePose):{frame:number;weight:number}[] {
 const base=directionalFrameWeights(pose.authoredCycle??pose.cycle,pose.moving,pose.gaitBlend);
 const check=pose.equipmentCheck??0;
 if(!pose.moving&&pose.action===0&&pose.reaction===0&&Number.isFinite(check)&&check>0&&check<1){
  const t=Math.max(0,Math.min(1,check/.15,(1-check)/.15)),blend=t*t*(3-2*t);
  return [...base.map(sample=>({...sample,weight:sample.weight*(1-blend)})),{frame:11,weight:blend}].filter(sample=>sample.weight>0);
 }
 const progress=pose.actionProgress??0;
 if(pose.moving||(pose.actionKind!==undefined&&pose.actionKind!=='shot')||directionalActionFrame(progress)===undefined)return base;
 // Short entry/recovery bridges keep the held command sharp without an abrupt silhouette swap.
 const t=Math.max(0,Math.min(1,(progress-.12)/.08,(.56-progress)/.08)),blend=t*t*(3-2*t);
 return [...base.map(sample=>({...sample,weight:sample.weight*(1-blend)})),{frame:10,weight:blend}].filter(sample=>sample.weight>0);
}
interface Cell {canvas:HTMLCanvasElement;width:number;height:number;anchor:number;coreWidth?:number;feet:{x:number;y:number}[]}
interface Frame {sheet:Sheet;cell:{width:number;height:number;anchor:number;coreWidth:number};direction:number;facing:number;weights:{frame:number;weight:number;direction?:number}[]}
interface Sheet {cells:Cell[];bodyHeight:number;composite:HTMLCanvasElement;light:HTMLCanvasElement;key:string;lightKey:string;characterId?:string;contact?:boolean;contactPose?:SpritePose;contactFeet?:FootPoint[];lastPose?:SpritePose;lastFrame?:Frame}
function actorBounds(pixels:Uint8ClampedArray,width:number,height:number,isolate=false):{left:number;top:number;right:number;bottom:number;component?:Int32Array} {
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let largest=0,component:Int32Array|undefined,result={left:width,top:height,right:-1,bottom:-1};
 // Adjacent cell helmet fragments must not become this actor's foot pivot.
 for(let start=0;start<seen.length;start++){
  if(seen[start]||pixels[start*4+3]!<32)continue;
  let head=0,tail=1,left=width,top=height,right=-1,bottom=-1;queue[0]=start;seen[start]=1;
  while(head<tail){const index=queue[head++]!,x=index%width,y=Math.floor(index/width);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   // Avoid a fresh neighbor array for every opaque pixel during mobile loading.
   let next=index-1;if(x>0&&!seen[next]&&pixels[next*4+3]!>=32){seen[next]=1;queue[tail++]=next;}
   next=index+1;if(x<width-1&&!seen[next]&&pixels[next*4+3]!>=32){seen[next]=1;queue[tail++]=next;}
   next=index-width;if(y>0&&!seen[next]&&pixels[next*4+3]!>=32){seen[next]=1;queue[tail++]=next;}
   next=index+width;if(y<height-1&&!seen[next]&&pixels[next*4+3]!>=32){seen[next]=1;queue[tail++]=next;}
  }
  if(tail>largest){largest=tail;result={left,top,right,bottom};if(isolate)component=queue.slice(0,tail);}
 }
 return {...result,component};
}
const sheets=new WeakMap<HTMLImageElement,Sheet>();
async function loadContactSheet(src:string):Promise<Sheet>{
 const id=src.split('/').pop()!.replace(/-contact-v\d+\.png$/,'');
 const supplementSrc=`/assets/survivors/contact/${id}-contact-supplement-${id==='yoon_sungho'?'v3':'v2'}.png`;
 const [{contactLayouts},[image,supplement]]=await Promise.all([import('./survivors-art-frame-layouts'),Promise.all([src,supplementSrc].map(url=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;})))]);
 const layout=contactLayouts[id as keyof typeof contactLayouts];
 const gestures=id==='player'?await Promise.all([PLAYER_ACTION_ART,PLAYER_CHECK_ART].map(url=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;}))):[];
 const cells:Cell[]=[];let bodyHeight=0;
 for(let direction=0;direction<8;direction++)for(let row=0;row<8;row++){
  const gesture=row>=6&&id==='player';
  const supplemental=(row===1&&!(id==='kang_taesik'&&direction===3))||row===5,source=(gesture?gestures[row-6]:supplemental?supplement:image)!,columns=gesture?2:supplemental&&id!=='yoon_sungho'?4:8;
  const sourceRow=supplemental?(id==='yoon_sungho'?(row===1?1:4):Math.floor(direction/4)+(row===5?2:0)):row===0?0:row===1?1:row===2?2:row===3?(layout.bands.length===6?3:4):4-(layout.bands.length===5?1:0);
  const supplementBands=(layout as typeof layout & {supplementBands?:{y:number;height:number}[]}).supplementBands;
  const band=gesture?{y:Math.floor(direction/2)*source.naturalHeight/4,height:source.naturalHeight/4}:supplemental?supplementBands![sourceRow]!:layout.bands[row>=6?0:sourceRow]!;
  const column=direction%columns;
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(source.naturalWidth/columns);canvas.height=Math.ceil(band.height);
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
  const mirror=gesture&&[3,5].includes(direction)||supplemental&&(row===5&&direction===3&&['player','lee_jaehoon','lim_junho'].includes(id)||row===1&&(id==='kang_taesik'&&direction<=2||id==='safety_monitor'&&[0,1,3].includes(direction)));
  if(mirror){ctx.translate(canvas.width,0);ctx.scale(-1,1);}
  ctx.drawImage(source,column*source.naturalWidth/columns,band.y,source.naturalWidth/columns,band.height,0,0,canvas.width,canvas.height);ctx.setTransform(1,0,0,1,0,0);
  const imageData=ctx.getImageData(0,0,canvas.width,canvas.height),pixels=imageData.data,{left,top,right,bottom,component}=actorBounds(pixels,canvas.width,canvas.height,true);
  const main=new Uint8Array(canvas.width*canvas.height);for(const index of component!)main[index]=1;
  for(let i=0;i<main.length;i++)if(!main[i])pixels[i*4+3]=0;ctx.putImageData(imageData,0,0);
  if(right-left<8||bottom-top<24)throw new Error('Empty contact art frame');
  const crop=document.createElement('canvas');crop.width=right-left+1;crop.height=bottom-top+1;crop.dataset.contactSheet=src;crop.dataset.contactFrame=String(row);crop.getContext('2d')!.drawImage(canvas,left,top,crop.width,crop.height,0,0,crop.width,crop.height);
  let sum=0,count=0;for(let y=top+Math.floor(crop.height*.46);y<=top+Math.floor(crop.height*.58);y++)for(let x=left;x<=right;x++)if(pixels[(y*canvas.width+x)*4+3]!>=32){sum+=x-left;count++;}
  const anchor=count?sum/count:crop.width/2;
  let torsoSum=0,torsoRows=0;for(let y=top+Math.floor(crop.height*.46);y<=top+Math.floor(crop.height*.58);y++){let lo=right,hi=left;for(let x=left;x<=right;x++)if(pixels[(y*canvas.width+x)*4+3]!>=32){lo=Math.min(lo,x);hi=Math.max(hi,x);}if(hi>=lo){torsoSum+=hi-lo+1;torsoRows++;}}
  const coreWidth=torsoRows?torsoSum/torsoRows:crop.width*.5;
  const feet=[0,1].map(side=>{let sum=0,count=0,sole=top;for(let y=top+Math.floor(crop.height*.86);y<=bottom;y++)for(let x=left;x<=right;x++)if((x-left<anchor?0:1)===side&&pixels[(y*canvas.width+x)*4+3]!>=32){sum+=x-left;count++;sole=Math.max(sole,y);}return {x:count?sum/count:anchor,y:count?sole-top:crop.height-1};});
  // The contact flags name anatomical feet, independently of their screen order.
  const angle=(direction+(row===1?.5:0))*Math.PI/4;
  const forward=(p:FootPoint)=>p.x*Math.cos(angle)+p.y*Math.sin(angle);
  const leftForward=row===2||row===5||row<2||row>=6;
  const first=forward(feet[0]!)>=forward(feet[1]!)?0:1;
  const leftIndex=leftForward?first:1-first;
  cells.push({canvas:crop,width:crop.width,height:crop.height,anchor,coreWidth,feet:[feet[leftIndex]!,feet[1-leftIndex]!]});bodyHeight=Math.max(bodyHeight,crop.height);
 }
 for(const c of cells){const scale=bodyHeight/c.height;c.width*=scale;c.anchor*=scale;if(c.coreWidth)c.coreWidth*=scale;c.feet=c.feet.map(p=>({x:p.x*scale,y:p.y*scale}));c.height=bodyHeight;}
 const composite=document.createElement('canvas');composite.width=Math.ceil(Math.max(...cells.map(c=>Math.max(c.anchor,c.width-c.anchor)))*2+4);composite.height=bodyHeight;
 composite.dataset.contactSheet=src;
 const light=document.createElement('canvas');light.width=composite.width;light.height=composite.height;
 return {cells,bodyHeight,composite,light,key:'',lightKey:'',characterId:id,contact:true};
}
let loaded:Promise<HTMLImageElement[]>|undefined;
let sharedSheet:Sheet|undefined;
export function isDirectionalActor(actor:HTMLImageElement):boolean {return sheets.has(actor);}
export async function loadDirectionalActor(actor:HTMLImageElement):Promise<boolean> {
 const contactArt=CHARACTER_CONTACT_ART[actor.src.split('/').pop()??''];
 if(contactArt){let pending=contactSheets.get(contactArt);if(!pending){pending=loadContactSheet(contactArt).catch(()=>{contactSheets.delete(contactArt);return undefined;});contactSheets.set(contactArt,pending);}const contact=await pending;if(contact){sheets.set(actor,contact);return true;}}
 if(actor.src.split('/').pop()!=='player-map.webp')return false;
 if(!loaded)loaded=Promise.all([PLAYER_DIRECTIONAL_ART,PLAYER_PASSING_ART,PLAYER_ACTION_ART,PLAYER_CHECK_ART].map(src=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{loaded=undefined;reject(new Error('Directional sheet unavailable'));};image.src=src;})));
 try {
  const images=await loaded;if(sharedSheet){sheets.set(actor,sharedSheet);return true;}
  const cells:Cell[]=[];let bodyHeight=0;
  for(let row=0;row<8;row++)for(let column=0;column<FRAMES_PER_DIRECTION;column++){
   const image=images[column<8?0:column<10?1:column===10?2:3]!,columns=column<8?8:2,rows=column<10?8:4;
   const sourceColumn=column<8?column:column<10?column-8:row%2,sourceRow=column<10?row:Math.floor(row/2);
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(image.naturalWidth/columns);canvas.height=Math.ceil(image.naturalHeight/rows);
   const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
   if(column>=10&&(row===3||row===5)){ctx.translate(canvas.width,0);ctx.scale(-1,1);}
   ctx.drawImage(image,sourceColumn*image.naturalWidth/columns,sourceRow*image.naturalHeight/rows,image.naturalWidth/columns,image.naturalHeight/rows,0,0,canvas.width,canvas.height);
   const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=0;
   for(let i=3;i<pixels.length;i+=4)if(pixels[i]!<32)transparent++;
   const {left,top,right,bottom}=actorBounds(pixels,canvas.width,canvas.height);
   if(right<left||transparent<canvas.width*canvas.height*.15)throw new Error('Invalid directional cell alpha');
   const crop=document.createElement('canvas');crop.width=right-left+1;crop.height=bottom-top+1;crop.getContext('2d')!.drawImage(canvas,left,top,crop.width,crop.height,0,0,crop.width,crop.height);
   // Align the pelvis, not the swinging boot/arm bounding-box midpoint.
   let weightedX=0,weight=0;
   for(let y=top+Math.floor(crop.height*.46);y<=top+Math.floor(crop.height*.6);y++)for(let x=left;x<=right;x++){
    const alpha=pixels[(y*canvas.width+x)*4+3]!;if(alpha<32)continue;
    weightedX+=(x-left)*alpha;weight+=alpha;
   }
   const anchor=weight?weightedX/weight:crop.width/2;
   const feet=[0,1].map(side=>{let sum=0,count=0,sole=top;
    for(let y=top+Math.floor(crop.height*.86);y<=bottom;y++)for(let x=left;x<=right;x++){
     if((x-left<anchor?0:1)!==side||pixels[(y*canvas.width+x)*4+3]!<32)continue;
     sum+=x-left;count++;sole=Math.max(sole,y);
    }
    return {x:count?sum/count:anchor,y:count?sole-top:crop.height-1};
   });
   cells.push({canvas:crop,width:crop.width,height:crop.height,anchor,feet});bodyHeight=Math.max(bodyHeight,crop.height);
  }
  // Normalize scale before interpolation: differing source crop heights must not double the helmet.
  for(const c of cells){const scale=bodyHeight/c.height;c.width*=scale;c.anchor*=scale;c.feet=c.feet.map(p=>({x:p.x*scale,y:p.y*scale}));c.height=bodyHeight;}
  const composite=document.createElement('canvas');
  composite.width=Math.ceil(Math.max(...cells.map(c=>Math.max(c.anchor,c.width-c.anchor)))*2+4);composite.height=bodyHeight;
  const light=document.createElement('canvas');light.width=composite.width;light.height=composite.height;
  sharedSheet={cells,bodyHeight,composite,light,key:'',lightKey:''};sheets.set(actor,sharedSheet);return true;
 }catch{return false;}
}
function cell(actor:HTMLImageElement,pose:SpritePose):Frame|undefined {
 const sheet=sheets.get(actor);if(!sheet)return;
 if(sheet.lastPose===pose)return sheet.lastFrame;
 let contact=sheet.contact?contactFrameWeights(pose.contactCycle??pose.authoredCycle??pose.cycle,pose.gaitBlend,Boolean(pose.turning),pose.visualAngle??(pose.direction??2)*Math.PI/4):undefined;
 if(contact&&sheet.characterId==='player'&&!pose.moving&&!pose.turning){const gesture=directionalPoseWeights(pose).find(s=>s.frame>=10);if(gesture){const direction=Math.round((pose.visualAngle??(pose.direction??2)*Math.PI/4)/(Math.PI/4)+8)%8;contact=[...contact.map(s=>({...s,weight:s.weight*(1-gesture.weight)})),{direction,frame:gesture.frame===10?6:7,weight:gesture.weight}].filter(s=>s.weight>0);}}
 const direction=contact?contact.reduce((a,b)=>a.weight>=b.weight?a:b).direction:pose.direction??2;
 const weights:Frame['weights']=contact??directionalPoseWeights(pose);
 const shape={width:0,height:0,anchor:0,coreWidth:0};
 for(const sample of weights){const c=sheet.cells[(sample.direction??direction)*(sheet.contact?8:FRAMES_PER_DIRECTION)+sample.frame]!;shape.width+=c.width*sample.weight;shape.height+=c.height*sample.weight;shape.anchor+=c.anchor*sample.weight;shape.coreWidth+=(c.coreWidth??c.width*.5)*sample.weight;}
 const strongest=weights.reduce((a,b)=>a.weight>=b.weight?a:b);
 const facing=direction+(sheet.contact&&strongest.frame===1?.5:0);
 const result={sheet,cell:shape,direction,facing,weights};sheet.lastPose=pose;sheet.lastFrame=result;return result;
}
export function drawDirectionalBody(ctx:CanvasRenderingContext2D,actor:HTMLImageElement,height:number,pose:SpritePose,transform=true):boolean {
 const frame=cell(actor,pose);if(!frame)return false;
 const sheet=frame.sheet,key=frame.direction+':'+frame.weights.map(w=>w.direction+':'+w.frame+':'+w.weight).join(',');
 if(sheet.key!==key){
  const composite=sheet.composite,paint=composite.getContext('2d')!;
  paint.clearRect(0,0,composite.width,composite.height);paint.globalCompositeOperation='lighter';
  for(const sample of frame.weights){const c=sheet.cells[(sample.direction??frame.direction)*(sheet.contact?8:FRAMES_PER_DIRECTION)+sample.frame]!;paint.globalAlpha=sample.weight;paint.drawImage(c.canvas,composite.width/2-c.anchor,composite.height-c.height,c.width,c.height);}
  paint.globalAlpha=1;paint.globalCompositeOperation='source-over';sheet.key=key;
 }
 const scale=height/sheet.bodyHeight,w=sheet.composite.width*scale,h=sheet.composite.height*scale;
 ctx.save();if(transform)applyActorTorsoTransform(ctx,{...pose,directional:true},height,true);
 if(sheet.contact&&transform&&pose.entity&&pose.worldX!==undefined&&pose.worldY!==undefined&&pose.clock!==undefined){
  const source=rawBootSockets(frame,height);
  let desired=source;
  if(pose.moving&&!pose.turning){const scale=height/sheet.bodyHeight,keys=[0,1,2,3].map(phase=>{const c=sheet.cells[frame.direction*8+2+phase]!;return c.feet.map(p=>({x:(p.x-c.anchor)*scale,y:(p.y-c.height)*scale}));});
   const swing=swingContactPoints(pose.contactCycle??0,keys,height);
   desired=source.map((p,i)=>({x:p.x+(swing[i]!.x-p.x)*pose.gaitBlend,y:p.y+(swing[i]!.y-p.y)*pose.gaitBlend}));
  }
  const worldSource=desired.map(p=>actorTorsoPoint(p,{...pose,directional:true},height,true));
  const phase=pose.turning&&!pose.moving?(((pose.visualAngle??0)/Math.PI)%1+1)%1:((pose.contactCycle??0)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)/(Math.PI*2);
  const flags=pose.turning&&!pose.moving?[phase<.5,phase>=.5]:pose.moving?[phase<.5,phase>=.5]:[true,true];
  const held=footContacts.sample(pose.entity,pose.worldX,pose.worldY,pose.clock,worldSource,flags,height*.45);
  const o=actorTorsoPoint({x:0,y:0},{...pose,directional:true},height,true),u=actorTorsoPoint({x:1,y:0},{...pose,directional:true},height,true),v=actorTorsoPoint({x:0,y:1},{...pose,directional:true},height,true);
  const a=u.x-o.x,b=u.y-o.y,c=v.x-o.x,d=v.y-o.y,det=a*d-b*c;
  const target=held.map(p=>({x:((p.x-o.x)*d-(p.y-o.y)*c)/det,y:((p.y-o.y)*a-(p.x-o.x)*b)/det}));
  sheet.contactPose=pose;sheet.contactFeet=target;
  drawContactMesh(ctx,sheet.composite,source,target,height);
  const error=Math.max(...target.map((p,i)=>{const projected=actorTorsoPoint(p,{...pose,directional:true},height,true);return Math.hypot(projected.x-held[i]!.x,projected.y-held[i]!.y);}));
  ctx.canvas.dataset.contactArt='true';ctx.canvas.dataset.contactError=String(error);
 }else ctx.drawImage(sheet.composite,-w/2,-h,w,h);ctx.restore();return true;
}
/** Reuse the exact sprite alpha for local light, without tinting the surrounding scene. */
export function drawDirectionalLight(ctx:CanvasRenderingContext2D,actor:HTMLImageElement,height:number,pose:SpritePose,color:string,strength:number):boolean {
 const sheet=sheets.get(actor);if(!sheet||!Number.isFinite(strength)||strength<=0)return false;
 const key=sheet.key+':'+color;
 if(sheet.lightKey!==key){
  const paint=sheet.light.getContext('2d')!;paint.clearRect(0,0,sheet.light.width,sheet.light.height);
  paint.drawImage(sheet.composite,0,0);paint.globalCompositeOperation='source-in';paint.fillStyle=color;paint.fillRect(0,0,sheet.light.width,sheet.light.height);
  paint.globalCompositeOperation='source-over';sheet.lightKey=key;
 }
 const scale=height/sheet.bodyHeight,w=sheet.light.width*scale,h=sheet.light.height*scale;
 ctx.save();applyActorTorsoTransform(ctx,{...pose,directional:true},height,true);ctx.globalAlpha*=Math.min(.24,strength);
 if(sheet.contactPose===pose&&sheet.contactFeet){const frame=cell(actor,pose)!;drawContactMesh(ctx,sheet.light,rawBootSockets(frame,height),sheet.contactFeet,height);}else ctx.drawImage(sheet.light,-w/2,-h,w,h);ctx.restore();return true;
}
export function directionalSocket(actor:HTMLImageElement,pose:SpritePose|undefined,height:number,kind:'head'|'chest'|'back'|'belt'|'wrist'|'tempo'):({x:number;y:number;size:number;rear:boolean})|undefined {
 if(!pose)return;const frame=cell(actor,pose);if(!frame)return;
 const rear=frame.facing>=4.5;
 const chestXs=[.62,.55,.5,.40,.36,.42,.5,.57],base=Math.floor(frame.facing)%8,fraction=frame.facing%1;
 const chestX=chestXs[base]!*(1-fraction)+chestXs[(base+1)%8]!*fraction;
 const x=kind==='head'?chestX:kind==='back'?1-chestX:chestX;
 const profile=DIRECTIONAL_WORN_CALIBRATIONS[frame.sheet.characterId??''];
 const y=kind==='head'?.18:kind==='belt'?profile?.beltY??.55:kind==='wrist'?profile?.wristY??.43:profile?.chestY??.36;
 const scale=height/frame.sheet.bodyHeight;
 const wristX=profile?(profile.wristX[base]!*(1-fraction)+profile.wristX[(base+1)%8]!*fraction):0;
 const offset=kind==='wrist'?wristX:kind==='tempo'?(x-.5)*2+.30:(x-.5)*2;
 return {x:(frame.sheet.contact?offset*frame.cell.coreWidth:x*frame.cell.width-frame.cell.anchor)*scale,y:(y-1)*frame.cell.height*scale,size:height*(kind==='head'?.14:.22),rear};
}
/** Alpha-derived boot contacts follow the same authored frame weights as the body. */
export function directionalBootSockets(actor:HTMLImageElement,pose:SpritePose,height:number):{x:number;y:number}[] {
 const frame=cell(actor,pose);if(!frame)return [];
 if(frame.sheet.contactPose===pose&&frame.sheet.contactFeet)return frame.sheet.contactFeet;
 return rawBootSockets(frame,height);
}
function rawBootSockets(frame:Frame,height:number):FootPoint[]{return [0,1].map(side=>{let x=0,y=0;for(const sample of frame.weights){const c=frame.sheet.cells[(sample.direction??frame.direction)*(frame.sheet.contact?8:FRAMES_PER_DIRECTION)+sample.frame]!;x+=(c.feet[side]!.x-c.anchor)*sample.weight;y+=(c.feet[side]!.y-c.height)*sample.weight;}const scale=height/frame.sheet.bodyHeight;return {x:x*scale,y:y*scale};});}
export function renderedDirection(actor:HTMLImageElement,pose:SpritePose):number{return Math.round(cell(actor,pose)?.facing??pose.direction??2)%8;}

/** Only authored hands/tools cover hardware; a generic chest rectangle would erase the wrist brace. */
export function directionalHandMasks(actor:HTMLImageElement,pose:SpritePose,height:number):{x:number;y:number;width:number;height:number}[]{
 const frame=cell(actor,pose);if(!frame)return [];
 const id=frame.sheet.characterId??'player',wrist=directionalSocket(actor,pose,height,'wrist')!,chest=directionalSocket(actor,pose,height,'chest')!;
 if(chest.rear||id==='kang_taesik')return [];
 const cos=Math.cos(frame.facing*Math.PI/4),sin=Math.sin(frame.facing*Math.PI/4);
 const box=(x:number,top:number,bottom:number,width:number)=>({x:x-width*height/2,y:(top-1)*height,width:width*height,height:(bottom-top)*height});
 if(id==='yoon_sungho')return [box(wrist.x,.405,.465,.20)];
 if(id==='lee_jaehoon')return [box(chest.x+height*(.12*cos+.06*sin),.20,.435,.14)];
 if(id==='lim_junho')return [box(wrist.x,.22,.30,.12)];
 if(id==='safety_monitor')return [box(wrist.x,.22,.30,.12),box(chest.x+height*.09*cos,.35,.45,.24)];
 return [box(wrist.x+height*.035*cos,.31,.44,.24)];
}
