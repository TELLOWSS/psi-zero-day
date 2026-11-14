import metadata from './omega-scene-art-preview-metadata.json';
import {omegaFieldHeading,type OmegaActorView,type OmegaHeading} from './omega-protocol-actor-render';
import type {OmegaArtAction} from './omega-protocol-art-motion';
import type {ProjectileFeedback} from '../domain/survivors-projectile-feedback';
import {OMEGA_ACTOR_FIRE_CUE_MS} from './omega-protocol-actor-cues';

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
/**
 * Render-only afterglow from the ACTUAL engine's handheld launch events.
 * The 90ms muzzle/weapon bearing remains owned by omegaAdvanceActorFireCue;
 * preserving the timestamp here permits the existing 75ms authored recoil
 * follow-through to finish after the muzzle has ceased, without firing again.
 * No events, gameplay cooldowns, shots, damage or session state are created.
 */
export function omegaSceneNativeFireHoldUntil(
 previousUntil:number,
 events:readonly Pick<ProjectileFeedback,'phase'|'kind'>[],
 gameTime:number,
):number{
 if(!Number.isFinite(gameTime)||gameTime<0)return 0;
 const lifetime=OMEGA_ACTOR_FIRE_CUE_MS/1000;
 let until=Number.isFinite(previousUntil)&&
  previousUntil>gameTime-lifetime&&previousUntil<=gameTime+lifetime
   ?previousUntil:0;
 for(const event of events){
  if(event.phase==='launch'&&(event.kind==='radio'||event.kind==='grout_slug'))
   until=gameTime+lifetime;
 }
 return until;
}
type Meta={width:number;height:number;anchorX:number;anchorY:number;refHeight:number;sha256:string};
const frames:Record<string,Meta>=metadata;
const cache=new Map<string,HTMLImageElement>();
// Source SHA is verified in tests; this is only a responsive DEV preload.
const eastBattleKeys=['fire','dash','hit'].flatMap(action=>
 Array.from({length:4},(_,i)=>action+'-E-'+i));
const neighborWalkKeys=['E','W'].flatMap(heading=>
 Array.from({length:4},(_,i)=>'walk-'+heading+'-'+i));
const previewWarmKeys=[...eastBattleKeys,...neighborWalkKeys];
function loadPreviewImage(key:string):HTMLImageElement{
 let img=cache.get(key);
 if(!img){
  img=new Image();img.decoding='async';
  img.src='/assets/omega/scene-art-preview/'+key+'.webp';
  cache.set(key,img);
 }
 return img;
}
/** Explicit QA-scene only: finish decoding exact original E combat 12
 * before a 90ms Watch gun cue can start. Does not touch game state. */
export function omegaPrimeSceneArtSources():void{
 if(typeof Image==='undefined')return;
 for(const key of previewWarmKeys){
  const img=loadPreviewImage(key);
  // decode() is asynchronous; errors stay visible in the QA browser proof.
  if(!img.complete)void img.decode().catch(()=>undefined);
 }
}
export function omegaScenePreloadStatus():Readonly<{readyEast:number;totalEast:12}>{
 let readyEast=0;
 for(const key of eastBattleKeys){
  const img=cache.get(key),meta=frames[key];
  if(img&&meta&&img.complete&&img.naturalWidth===meta.width&&img.naturalHeight===meta.height)
   readyEast++;
 }
 return {readyEast,totalEast:12};
}
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
 const battleSource=heading==='W'||heading==='E'?heading:diagonalWalk[heading];
 // Native weapon aim may turn the body E→SE during a 90ms actual gunshot.
 // Do not let the body turning diagonally replace a genuine FIRE/HIT/DASH
 // reaction with a WALK sticker. Reuse an EXISTING side-action painting only
 // while true diagonal action paintings are unapproved.
 if(action&&battleSource){
  return action+'-'+battleSource+'-'+omegaSceneActionFrameIndex(action,view.actionAge??0);
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
 const image=loadPreviewImage(desired);
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
 dataset.omegaSceneArtActionAge=Number.isFinite(view.actionAge)
  ?String(view.actionAge):'unavailable';
 ctx.drawImage(selected.image,-selected.meta.anchorX*size,
  -selected.meta.anchorY*size,selected.meta.width*size,selected.meta.height*size);
 return true;
}
