import type {SpritePose} from './survivors-sprite-motion';
import {applyActorTorsoTransform} from './survivors-rig-renderer';
export const PLAYER_DIRECTIONAL_ART='/assets/survivors/player-walk-eight-v1.png';
export const PLAYER_PASSING_ART='/assets/survivors/player-walk-passing-v1.png';
export const PLAYER_ACTION_ART='/assets/survivors/player-command-eight-v1.png';
const PHASES=[0,1,1.5,2,3,4,5,5.5,6,7] as const;
const FRAMES=[0,1,8,2,3,4,5,9,6,7] as const;
const FRAMES_PER_DIRECTION=11;
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
interface Cell {canvas:HTMLCanvasElement;width:number;height:number;anchor:number}
interface Frame {sheet:Sheet;cell:{width:number;height:number;anchor:number};direction:number;weights:{frame:number;weight:number}[]}
interface Sheet {cells:Cell[];bodyHeight:number;composite:HTMLCanvasElement;light:HTMLCanvasElement;key:string;lightKey:string;lastPose?:SpritePose;lastFrame?:Frame}
function actorBounds(pixels:Uint8ClampedArray,width:number,height:number):{left:number;top:number;right:number;bottom:number} {
 const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let largest=0,result={left:width,top:height,right:-1,bottom:-1};
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
  if(tail>largest){largest=tail;result={left,top,right,bottom};}
 }
 return result;
}
const sheets=new WeakMap<HTMLImageElement,Sheet>();
let loaded:Promise<HTMLImageElement[]>|undefined;
let sharedSheet:Sheet|undefined;
export function isDirectionalActor(actor:HTMLImageElement):boolean {return sheets.has(actor);}
export async function loadDirectionalActor(actor:HTMLImageElement):Promise<boolean> {
 if(actor.src.split('/').pop()!=='player-map.webp')return false;
 if(!loaded)loaded=Promise.all([PLAYER_DIRECTIONAL_ART,PLAYER_PASSING_ART,PLAYER_ACTION_ART].map(src=>new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{loaded=undefined;reject(new Error('Directional sheet unavailable'));};image.src=src;})));
 try {
  const images=await loaded;if(sharedSheet){sheets.set(actor,sharedSheet);return true;}
  const cells:Cell[]=[];let bodyHeight=0;
  for(let row=0;row<8;row++)for(let column=0;column<FRAMES_PER_DIRECTION;column++){
   const image=images[column<8?0:column<10?1:2]!,columns=column<8?8:2,rows=column<10?8:4;
   const sourceColumn=column<8?column:column<10?column-8:row%2,sourceRow=column<10?row:Math.floor(row/2);
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(image.naturalWidth/columns);canvas.height=Math.ceil(image.naturalHeight/rows);
   const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
   if(column===10&&(row===3||row===5)){ctx.translate(canvas.width,0);ctx.scale(-1,1);}
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
   cells.push({canvas:crop,width:crop.width,height:crop.height,anchor:weight?weightedX/weight:crop.width/2});bodyHeight=Math.max(bodyHeight,crop.height);
  }
  // Normalize scale before interpolation: differing source crop heights must not double the helmet.
  for(const c of cells){const scale=bodyHeight/c.height;c.width*=scale;c.anchor*=scale;c.height=bodyHeight;}
  const composite=document.createElement('canvas');
  composite.width=Math.ceil(Math.max(...cells.map(c=>Math.max(c.anchor,c.width-c.anchor)))*2+4);composite.height=bodyHeight;
  const light=document.createElement('canvas');light.width=composite.width;light.height=composite.height;
  sharedSheet={cells,bodyHeight,composite,light,key:'',lightKey:''};sheets.set(actor,sharedSheet);return true;
 }catch{return false;}
}
function cell(actor:HTMLImageElement,pose:SpritePose):Frame|undefined {
 const sheet=sheets.get(actor);if(!sheet)return;
 if(sheet.lastPose===pose)return sheet.lastFrame;
 const direction=pose.direction??2;
 const action=!pose.moving?directionalActionFrame(pose.actionProgress??0):undefined;
 const weights=action===undefined?directionalFrameWeights(pose.authoredCycle??pose.cycle,pose.moving,pose.gaitBlend):[{frame:action,weight:1}];
 const shape={width:0,height:0,anchor:0};
 for(const sample of weights){const c=sheet.cells[direction*FRAMES_PER_DIRECTION+sample.frame]!;shape.width+=c.width*sample.weight;shape.height+=c.height*sample.weight;shape.anchor+=c.anchor*sample.weight;}
 const result={sheet,cell:shape,direction,weights};sheet.lastPose=pose;sheet.lastFrame=result;return result;
}
export function drawDirectionalBody(ctx:CanvasRenderingContext2D,actor:HTMLImageElement,height:number,pose:SpritePose,transform=true):boolean {
 const frame=cell(actor,pose);if(!frame)return false;
 const sheet=frame.sheet,key=frame.direction+':'+frame.weights.map(w=>w.frame+':'+w.weight).join(',');
 if(sheet.key!==key){
  const composite=sheet.composite,paint=composite.getContext('2d')!;
  paint.clearRect(0,0,composite.width,composite.height);paint.globalCompositeOperation='lighter';
  for(const sample of frame.weights){const c=sheet.cells[frame.direction*FRAMES_PER_DIRECTION+sample.frame]!;paint.globalAlpha=sample.weight;paint.drawImage(c.canvas,composite.width/2-c.anchor,composite.height-c.height,c.width,c.height);}
  paint.globalAlpha=1;paint.globalCompositeOperation='source-over';sheet.key=key;
 }
 const scale=height/sheet.bodyHeight,w=sheet.composite.width*scale,h=sheet.composite.height*scale;
 ctx.save();if(transform)applyActorTorsoTransform(ctx,{...pose,directional:true},height,true);
 ctx.drawImage(sheet.composite,-w/2,-h,w,h);ctx.restore();return true;
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
 ctx.drawImage(sheet.light,-w/2,-h,w,h);ctx.restore();return true;
}
export function directionalSocket(actor:HTMLImageElement,pose:SpritePose|undefined,height:number,kind:'head'|'chest'|'back'|'belt'):({x:number;y:number;size:number;rear:boolean})|undefined {
 if(!pose)return;const frame=cell(actor,pose);if(!frame)return;
 const rear=frame.direction>=5;
 const chestX=[.62,.55,.5,.40,.36,.42,.5,.57][frame.direction]!;
 const x=kind==='head'?chestX:kind==='back'?1-chestX:chestX;
 const y=kind==='head'?.18:kind==='belt'?.55:.36;
 const scale=height/frame.sheet.bodyHeight;
 return {x:(x*frame.cell.width-frame.cell.anchor)*scale,y:(y-1)*frame.cell.height*scale,size:height*(kind==='head'?.14:.22),rear};
}
