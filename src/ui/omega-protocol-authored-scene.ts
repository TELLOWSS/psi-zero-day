import type {OmegaFieldObstacle,OmegaFieldPlan} from '../domain/omega-protocol-field';
import {OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT} from '../domain/omega-protocol-field';

/**
 * Source-authored 2.5D field visuals. This is a REAL game scene asset
 * (not a marketing screenshot): ground and prop images are positioned
 * in exactly the same 1400x900 world as Watch movement and collision.
 *
 * SVG sources are original and local, so no network/AI/paid calls are
 * performed by the gameplay loop. A failed decode uses the older Canvas
 * painter as a fail-safe, not an invisible blocked route.
 */
export const OMEGA_SECTOR01_ART_ROOT='/assets/omega/sector01/' as const;
export const OMEGA_SECTOR01_PROP_TYPES=['container','scaffold','machine','barrier'] as const;
export function omegaAuthoredAssetPaths():readonly string[]{
 return [
  OMEGA_SECTOR01_ART_ROOT+'night-yard-floor.svg',
  ...OMEGA_SECTOR01_PROP_TYPES.map(kind=>OMEGA_SECTOR01_ART_ROOT+kind+'.svg'),
 ];
}
const cache=new Map<string,HTMLImageElement>();
function readyImage(src:string):HTMLImageElement|null{
 if(typeof Image==='undefined')return null;
 let img=cache.get(src);
 if(!img){
  img=new Image();
  // No untrusted URLs: paths are built solely from this code's fixed list.
  img.decoding='async';
  img.src=src;
  cache.set(src,img);
 }
 return img.complete&&img.naturalWidth>0&&img.naturalHeight>0?img:null;
}
export function omegaPrepareAuthoredScene():void{
 for(const path of omegaAuthoredAssetPaths())readyImage(path);
}
export function omegaDrawAuthoredFloor(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,
):boolean{
 if(plan.sector!==1)return false;
 const image=readyImage(OMEGA_SECTOR01_ART_ROOT+'night-yard-floor.svg');
 if(!image)return false;
 ctx.drawImage(image,0,0,OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT);
 return true;
}
export function omegaDrawAuthoredProp(
 ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,o:OmegaFieldObstacle,
):boolean{
 if(plan.sector!==1)return false;
 if(!OMEGA_SECTOR01_PROP_TYPES.includes(o.kind))return false;
 const image=readyImage(OMEGA_SECTOR01_ART_ROOT+o.kind+'.svg');
 if(!image)return false;
 // Lower edge is tied to existing solid footprint, while the drawn
 // superstructure rises upward to create honest occlusion depth.
 const rise=o.kind==='scaffold'?95:o.kind==='machine'?80:o.kind==='barrier'?38:72;
 const bleed=12;
 ctx.drawImage(image,o.x-bleed,o.y-rise,
  o.width+bleed*2,o.height+rise+17);
 return true;
}
