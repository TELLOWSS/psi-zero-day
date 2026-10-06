import type {SpritePose} from './survivors-sprite-motion';
import {applyActorTorsoTransform} from './survivors-rig-renderer';
export const PLAYER_DIRECTIONAL_ART='/assets/survivors/player-walk-eight-v1.png';
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
interface Cell {canvas:HTMLCanvasElement;width:number;height:number}
interface Sheet {cells:Cell[];bodyHeight:number}
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
let loaded:Promise<HTMLImageElement>|undefined;
let sharedSheet:Sheet|undefined;
export function isDirectionalActor(actor:HTMLImageElement):boolean {return sheets.has(actor);}
export async function loadDirectionalActor(actor:HTMLImageElement):Promise<boolean> {
 if(actor.src.split('/').pop()!=='player-map.webp')return false;
 if(!loaded)loaded=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{loaded=undefined;reject(new Error('Eight-direction sheet unavailable'));};image.src=PLAYER_DIRECTIONAL_ART;});
 try {
  const image=await loaded;if(sharedSheet){sheets.set(actor,sharedSheet);return true;}
  const cells:Cell[]=[];let bodyHeight=0;
  for(let row=0;row<8;row++)for(let column=0;column<8;column++){
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(image.naturalWidth/8);canvas.height=Math.ceil(image.naturalHeight/8);
   const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(image,column*image.naturalWidth/8,row*image.naturalHeight/8,image.naturalWidth/8,image.naturalHeight/8,0,0,canvas.width,canvas.height);
   const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=0;
   for(let i=3;i<pixels.length;i+=4)if(pixels[i]!<32)transparent++;
   const {left,top,right,bottom}=actorBounds(pixels,canvas.width,canvas.height);
   if(right<left||transparent<canvas.width*canvas.height*.15)throw new Error('Invalid directional cell alpha');
   const crop=document.createElement('canvas');crop.width=right-left+1;crop.height=bottom-top+1;crop.getContext('2d')!.drawImage(canvas,left,top,crop.width,crop.height,0,0,crop.width,crop.height);
   cells.push({canvas:crop,width:crop.width,height:crop.height});bodyHeight=Math.max(bodyHeight,crop.height);
  }
  sharedSheet={cells,bodyHeight};sheets.set(actor,sharedSheet);return true;
 }catch{return false;}
}
function cell(actor:HTMLImageElement,pose:SpritePose):{sheet:Sheet;cell:Cell;direction:number}|undefined {
 const sheet=sheets.get(actor);if(!sheet)return;
 const direction=pose.direction??2;return {sheet,cell:sheet.cells[direction*8+directionalFrame(pose.authoredCycle??pose.cycle,pose.moving)]!,direction};
}
export function drawDirectionalBody(ctx:CanvasRenderingContext2D,actor:HTMLImageElement,height:number,pose:SpritePose,transform=true):boolean {
 const frame=cell(actor,pose);if(!frame)return false;
 const scale=height/frame.sheet.bodyHeight,w=frame.cell.width*scale,h=frame.cell.height*scale;
 ctx.save();if(transform)applyActorTorsoTransform(ctx,{...pose,directional:true},height,true);
 ctx.drawImage(frame.cell.canvas,-w/2,-h,w,h);ctx.restore();return true;
}
export function directionalSocket(actor:HTMLImageElement,pose:SpritePose|undefined,height:number,kind:'head'|'chest'|'back'|'belt'):({x:number;y:number;size:number;rear:boolean})|undefined {
 if(!pose)return;const frame=cell(actor,pose);if(!frame)return;
 const rear=frame.direction>=5;
 const chestX=[.62,.55,.5,.40,.36,.42,.5,.57][frame.direction]!;
 const x=kind==='head'?chestX:kind==='back'?1-chestX:chestX;
 const y=kind==='head'?.18:kind==='belt'?.55:.36;
 const scale=height/frame.sheet.bodyHeight;
 return {x:(x-.5)*frame.cell.width*scale,y:(y-1)*frame.cell.height*scale,size:height*(kind==='head'?.14:.22),rear};
}
