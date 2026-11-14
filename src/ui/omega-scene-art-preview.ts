import metadata from './omega-scene-art-preview-metadata.json';
import {omegaFieldHeading,type OmegaActorView,type OmegaHeading} from './omega-protocol-actor-render';
import type {OmegaArtAction} from './omega-protocol-art-motion';

/**
 * M12-G5o: user-authored candidate-source preview only, NEVER approved art.
 * 12 E FIRE/DASH/HIT are the exact original SHA-256 source crops from the
 * separate G5n QA source, not newly generated or composited frame replacements.
 */
export function omegaSceneArtRequested(search:string, enabled:boolean):boolean {
 const q=new URLSearchParams(search);
 return enabled&&q.get('omegaLab')==='1'&&q.get('omegaSceneArt')==='1';
}
export type OmegaSceneArtView=OmegaActorView&{readonly sceneAction?:OmegaArtAction};
type Meta={width:number;height:number;anchorX:number;anchorY:number;refHeight:number;sha256:string};
const frames:Record<string,Meta>=metadata;
const cache=new Map<string,HTMLImageElement>();
let lastReady:{image:HTMLImageElement;meta:Meta;key:string}|undefined;
const diagonalWalk:Partial<Record<OmegaHeading,'E'|'W'>>={
 NE:'E',SE:'E',NW:'W',SW:'W',
};
export function omegaSceneDiagonalFallback(heading:OmegaHeading):'E'|'W'|null {
 return diagonalWalk[heading]??null;
}
function fourFrame(phase:number):number{
 const p=Number.isFinite(phase)?Math.max(0,Math.min(.999999,phase)):0;
 return Math.floor(p*4);
}
export function omegaSceneActionFrameIndex(action:'fire'|'dash'|'hit',age:number):number{
 const maxDuration=action==='fire'?.165:action==='dash'?.22:.15;
 const normalized=(Number.isFinite(age)?Math.max(0,age):0)/maxDuration;
 return fourFrame(normalized);
}
function sceneAction(view:OmegaSceneArtView):'fire'|'dash'|'hit'|null {
 // The real session's native action is authoritative. Merely aiming, being
 // close to an enemy or walking cannot fabricate a FIRE/HIT or DASH event.
 if(view.sceneAction!==undefined){
  return view.sceneAction==='fire'||view.sceneAction==='dash'||view.sceneAction==='hit'
   ?view.sceneAction:null;
 }
 return view.hurt?'hit':view.dashing?'dash':view.shooting?'fire':null;
}
export function omegaSceneArtFrame(view:OmegaSceneArtView):string {
 const heading=omegaFieldHeading(view.facingX,view.facingY);
 const action=sceneAction(view);
 if(action&&(heading==='W'||heading==='E')){
  return action+'-'+heading+'-'+omegaSceneActionFrameIndex(action,view.actionAge??0);
 }
 if(view.gait?.active){
  const source=diagonalWalk[heading]??heading;
  const key='walk-'+source+'-'+fourFrame(view.gait.phase);
  // A real four-pose E/W/N/S candidate already exists in GitHub. When no
  // diagonal paintings are yet authorized, reuse the NEAREST_SIDE painted
  // source instead of locking the hero to a static sticker-like idle.
  // Deliberately not 8-direction final art or a synthesized new frame.
  if(frames[key])return key;
 }
 return 'idle-'+heading;
}
export function drawOmegaSceneArt(ctx:CanvasRenderingContext2D,view:OmegaSceneArtView):boolean{
 if(typeof Image==='undefined')return false;
 const heading=omegaFieldHeading(view.facingX,view.facingY);
 const desired=omegaSceneArtFrame(view),meta=frames[desired];
 if(!meta)return false;
 let image=cache.get(desired);
 if(!image){
  image=new Image();image.decoding='async';
  image.src='/assets/omega/scene-art-preview/'+desired+'.webp';
  cache.set(desired,image);
 }
 if(image.complete&&image.naturalWidth===meta.width&&image.naturalHeight===meta.height)
  lastReady={image,meta,key:desired};
 // Keep a decoded silver painted candidate on screen while the next pose
 // decodes; never flicker to the unrelated legacy vector actor.
 if(!lastReady)return true;
 const selected=lastReady,size=112/selected.meta.refHeight;
 if(!Number.isFinite(size)||size<=0)return false;
 const dataset=ctx.canvas.dataset;
 dataset.omegaSceneArtFrame=selected.key;
 dataset.omegaSceneArtRequestedFrame=desired;
 dataset.omegaSceneArtHeading=heading;
 dataset.omegaSceneArtDiagonalFallback=view.gait?.active&&diagonalWalk[heading]
  ?diagonalWalk[heading]:'none';
 dataset.omegaSceneArtNativeAction=view.sceneAction??'not-supplied';
 ctx.drawImage(selected.image,-selected.meta.anchorX*size,
  -selected.meta.anchorY*size,selected.meta.width*size,selected.meta.height*size);
 return true;
}
