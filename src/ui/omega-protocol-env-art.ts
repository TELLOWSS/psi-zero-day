import {OMEGA_FIELD_HEIGHT,OMEGA_FIELD_WIDTH,type OmegaFieldPlan} from '../domain/omega-protocol-field';
import type {Omega3DBudget} from './omega-protocol-atmosphere-3d';
import type {OmegaCameraState} from './omega-protocol-camera';

/**
 * Authored painterly environment backdrops (vistas) and isometric 3/4 arena
 * floor textures across all 5 OMEGA sectors (15 connected zones).
 *
 * Purely presentational: zero mutations to field plans, native collision
 * boxes, boss danger telegraphs, or Watch simulation physics.
 */

export const OMEGA_ENV_ART_ROOT='/assets/omega/env/' as const;
const SECTORS=[1,2,3,4,5] as const;
const imageCache=new Map<string,HTMLImageElement>();
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));

export function omegaEnvArtPaths():readonly string[] {
 const paths:string[]=[];
 for(const sector of SECTORS){
  paths.push(`${OMEGA_ENV_ART_ROOT}sector-${sector}-vista.webp`);
  paths.push(`${OMEGA_ENV_ART_ROOT}sector-${sector}-floor.webp`);
 }
 return paths;
}

function readyEnvImage(src:string):HTMLImageElement|null {
 if(typeof Image==='undefined')return null;
 let img=imageCache.get(src);
 if(!img){
  img=new Image();
  img.decoding='async';
  img.src=src;
  imageCache.set(src,img);
 }
 return img.complete&&img.naturalWidth>0&&img.naturalHeight>0?img:null;
}

export function omegaPrepareEnvArt():void {
 for(const path of omegaEnvArtPaths())readyEnvImage(path);
}

/**
 * Draws a seamlessly tiled, camera-parallaxed painterly 3D concept vista
 * behind the elevated/ground 3/4 arena deck in screen space.
 */
export function drawOmegaPaintedVista(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
 camera:OmegaCameraState,
 width:number,
 height:number,
 budget:Omega3DBudget,
):boolean {
 if(!Number.isInteger(plan.sector)||plan.sector<1||plan.sector>5||
    !Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||
    !Number.isFinite(camera.scale)||!Number.isFinite(camera.projectedOffsetX)||
    !Number.isFinite(camera.projectedOffsetY))
  return false;
 const img=readyEnvImage(`${OMEGA_ENV_ART_ROOT}sector-${plan.sector}-vista.webp`);
 if(!img)return false;

 const aspect=img.naturalWidth/img.naturalHeight;
 const targetH=height*1.12;
 const tileW=Math.max(width,targetH*aspect);
 const scroll=camera.projectedOffsetX*camera.scale*0.16;
 const baseIndex=-Math.floor(scroll/tileW);
 const offsetX=((scroll%tileW)+tileW)%tileW-tileW;
 const offsetY=clamp(camera.projectedOffsetY*camera.scale*0.06,-height*0.06,height*0.06)-height*0.06;

 ctx.save();
 ctx.setTransform(1,0,0,1,0,0);
 const tiles=Math.ceil((width-offsetX)/tileW)+1;
 for(let i=0;i<tiles;i++){
  const dx=offsetX+i*tileW;
  const mirrored=Math.abs(baseIndex+i)%2===1;
  ctx.save();
  if(mirrored){
   ctx.translate(dx+tileW,offsetY);
   ctx.scale(-1,1);
   ctx.drawImage(img,0,0,tileW,targetH);
  }else{
   ctx.drawImage(img,dx,offsetY,tileW,targetH);
  }
  ctx.restore();
 }
 // Integrate painterly backdrop cleanly behind active deck silhouettes & beams.
 ctx.fillStyle=budget.tier==='mobile'?'rgba(4,9,16,.32)':'rgba(4,9,16,.26)';
 ctx.fillRect(0,0,width,height);
 ctx.restore();
 return true;
}

/**
 * Draws the painted 3/4 isometric open floor artwork within the exact
 * 1400x900 native arena deck footprint.
 */
export function drawOmegaPaintedFloor(
 ctx:CanvasRenderingContext2D,
 plan:OmegaFieldPlan,
):boolean {
 if(!Number.isInteger(plan.sector)||plan.sector<1||plan.sector>5)return false;
 const img=readyEnvImage(`${OMEGA_ENV_ART_ROOT}sector-${plan.sector}-floor.webp`);
 if(!img)return false;
 ctx.save();
 ctx.globalAlpha=0.78;
 ctx.drawImage(img,0,0,OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT);
 ctx.restore();
 return true;
}
