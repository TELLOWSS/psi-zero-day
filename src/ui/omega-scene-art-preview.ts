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
let lastReady:{image:HTMLImageElement;meta:Meta;key:string}|undefined;
function sceneImage(key:string):HTMLImageElement {
 let image=cache.get(key);
 if(!image){image=new Image();image.decoding='async';image.src=`/assets/omega/scene-art-preview/${key}.webp`;cache.set(key,image);}
 return image;
}
export function omegaSceneArtFrame(view:OmegaActorView):string {
 const heading=omegaFieldHeading(view.facingX,view.facingY);
 const index=Math.min(3,Math.max(0,Math.floor((view.gait?.phase??0)*4)));
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
 if(image.complete&&image.naturalWidth)lastReady={image,meta,key};
 // Keep the last decoded silver candidate while a new pose decodes; never
 // briefly flash the unrelated legacy character between frame requests.
 if(!lastReady)return true;
 const selected=lastReady,size=112/selected.meta.refHeight;
 ctx.canvas.dataset.omegaSceneArtFrame=selected.key;
 ctx.drawImage(selected.image,-selected.meta.anchorX*size,-selected.meta.anchorY*size,selected.meta.width*size,selected.meta.height*size);
 return true;
}
