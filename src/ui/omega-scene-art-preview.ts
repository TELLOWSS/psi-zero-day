import metadata from './omega-scene-art-preview-metadata.json';
import {omegaFieldHeading, type OmegaActorView} from './omega-protocol-actor-render';

/** Explicit visual audition only. This is not the approved production pack. */
export function omegaSceneArtRequested(search:string, enabled:boolean):boolean {
 const q=new URLSearchParams(search);
 return enabled&&q.get('omegaLab')==='1'&&q.get('omegaSceneArt')==='1';
}
type Meta={width:number;height:number;anchorX:number;anchorY:number;refHeight:number};
const frames:Record<string,Meta>=metadata;
const cache=new Map<string,HTMLImageElement>();
type ReadyFrame={image:CanvasImageSource;meta:Meta;key:string};
const rasters=new Map<string,ReadyFrame>();
let lastReady:ReadyFrame|undefined;
let priorReady:ReadyFrame|undefined;
let transitionStarted=0;
let lastTime=-1;
/** World-distance cycle: avoid turning a 38-unit contact track into a
 * visually frantic full four-pose walk every few animation frames. */
export const OMEGA_SCENE_WALK_CYCLE_DISTANCE=120;
export const OMEGA_SCENE_WALK_BLEND_SECONDS=.045;
function sceneImage(key:string):HTMLImageElement {
 let image=cache.get(key);
 if(!image){image=new Image();image.decoding='async';image.src=`/assets/omega/scene-art-preview/${key}.webp`;cache.set(key,image);}
 return image;
}
function preparedFrame(key:string,image:HTMLImageElement,meta:Meta):ReadyFrame {
 const existing=rasters.get(key);if(existing)return existing;
 if(typeof document==='undefined')return {key,image,meta};
 // Game actors render near 112 world pixels tall. Downsample once at 2x
 // that size rather than resampling a 500–900px source on every frame.
 const ratio=Math.min(1,224/meta.refHeight),canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(meta.width*ratio));canvas.height=Math.max(1,Math.round(meta.height*ratio));
 const context=canvas.getContext('2d');if(!context)return {key,image,meta};
 context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
 context.drawImage(image,0,0,canvas.width,canvas.height);
 const sx=canvas.width/meta.width,sy=canvas.height/meta.height;
 const result={key,image:canvas,meta:{width:canvas.width,height:canvas.height,
  anchorX:meta.anchorX*sx,anchorY:meta.anchorY*sy,refHeight:meta.refHeight*sy}};
 rasters.set(key,result);return result;
}
export function omegaSceneArtFrame(view:OmegaActorView):string {
 const heading=omegaFieldHeading(view.facingX,view.facingY);
 const distance=Math.max(0,view.gait?.distanceTravelled??0);
 const index=Math.min(3,Math.floor((distance%OMEGA_SCENE_WALK_CYCLE_DISTANCE)/OMEGA_SCENE_WALK_CYCLE_DISTANCE*4));
 if((view.hurt||view.dashing)&&['W','S','N'].includes(heading)){
  const action=view.hurt?'hit':'dash';
  const duration=view.hurt ? .15 : .22;
  return `${action}-${heading}-${Math.min(3,Math.floor(Math.max(0,view.actionAge??0)/duration*4))}`;
 }
 if(view.gait?.active&&['W','E','S','N'].includes(heading))return `walk-${heading}-${index}`;
 if((heading==='W'||heading==='S')&&view.shooting)return `fire-${heading}-${Math.min(3,Math.floor(Math.max(0,view.actionAge??0)/.09*4))}`;
 return `idle-${heading}`;
}
export function drawOmegaSceneArt(ctx:CanvasRenderingContext2D,view:OmegaActorView):boolean {
 if(typeof Image==='undefined')return false;
 const key=omegaSceneArtFrame(view),meta=frames[key];if(!meta)return false;
 // The native dash and hit windows are shorter than an image download.
 // Start loading only the available action poses for the current heading.
 const heading=omegaFieldHeading(view.facingX,view.facingY);
 for(const action of ['fire','dash','hit'])for(let i=0;i<4;i++){
  const candidate=`${action}-${heading}-${i}`;
  if(frames[candidate])sceneImage(candidate);
 }
 const image=sceneImage(key);
 if(view.time<lastTime||view.time-lastTime>.3){lastReady=undefined;priorReady=undefined;}
 lastTime=view.time;
 if(image.complete&&image.naturalWidth&&lastReady?.key!==key){
  const oldHeading=lastReady?.key.split('-')[1];
  // Blend walking poses of the same view only; attack, hit, and turning
  // remain immediate so warning and combat feedback retain their timing.
  priorReady=lastReady&&key.startsWith('walk-')&&lastReady.key.startsWith('walk-')&&oldHeading===heading?lastReady:undefined;
  transitionStarted=view.time;
  lastReady=preparedFrame(key,image,meta);
 }
 // Keep the last decoded silver candidate while a new pose decodes; never
 // briefly flash the unrelated legacy character between frame requests.
 if(!lastReady)return true;
 const selected=lastReady;
 ctx.canvas.dataset.omegaSceneArtFrame=selected.key;
 const baseAlpha=ctx.globalAlpha;
 const paint=(frame:ReadyFrame,alpha:number)=>{
  const size=112/frame.meta.refHeight;
  ctx.globalAlpha=baseAlpha*alpha;
  ctx.drawImage(frame.image,-frame.meta.anchorX*size,-frame.meta.anchorY*size,frame.meta.width*size,frame.meta.height*size);
 };
 const blend=Math.max(0,Math.min(1,(view.time-transitionStarted)/OMEGA_SCENE_WALK_BLEND_SECONDS));
 ctx.save();
 if(priorReady&&blend<1){paint(priorReady,1-blend);paint(selected,blend);}
 else {priorReady=undefined;paint(selected,1);}
 ctx.restore();
 return true;
}
