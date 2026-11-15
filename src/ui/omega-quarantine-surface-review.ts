import type {OmegaFieldPlan} from '../domain/omega-protocol-field';
import {OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT} from '../domain/omega-protocol-field';
import {omegaQuarterViewCamera,type OmegaCameraState} from './omega-protocol-camera';
import {omegaG3ParallaxShift} from './omega-protocol-m12-parallax';

/** Unapproved local visual audition; the native floor and collision remain intact. */
export const OMEGA_SURFACE_REVIEW_ASSET='/assets/omega/sector01/concrete-surface-review.webp';
export const OMEGA_HORIZON_REVIEW_ASSET='/assets/omega/sector01/construction-horizon-review.webp';
export function omegaSurfaceReviewRequested(query:string,dev:boolean):boolean {
 const q=new URLSearchParams(query);
 return dev&&q.get('omegaLab')==='1'&&q.get('omegaSurfaceReview')==='1';
}

let horizon:HTMLImageElement|undefined;
let detailedHorizon:HTMLImageElement|undefined;
let cachedHorizon:{width:number;height:number;detailed:boolean;canvas:HTMLCanvasElement}|undefined;
/** Distant, non-solid scenic plate; camera-derived parallax and no gameplay state. */
export function drawOmegaHorizonReview(ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,camera:OmegaCameraState,zoom:number,detailed=false):boolean {
 if(plan.sector!==1||typeof Image==='undefined'||typeof document==='undefined')return false;
 if(detailed&&!detailedHorizon){detailedHorizon=new Image();detailedHorizon.decoding='async';detailedHorizon.src='/assets/omega/scene-art-preview/buildings-v3.webp';}
 if(!detailed&&!horizon){horizon=new Image();horizon.decoding='async';horizon.src=OMEGA_HORIZON_REVIEW_ASSET;}
 const selected=detailed?detailedHorizon:horizon;
 if(!selected?.complete||!selected.naturalWidth||!selected.naturalHeight)return false;
 const width=ctx.canvas.width,height=ctx.canvas.height;
 if(width<=0||height<=0||!Number.isFinite(zoom))return false;
 // Keep the distant building layer near the horizon. Extending it too far
 // down the screen makes live actors look as though they stand on a facade.
 const band=Math.max(1,Math.round(Math.min(height*(detailed ? .32 : .38),width*.40)));
 if(!cachedHorizon||cachedHorizon.width!==width||cachedHorizon.height!==band||cachedHorizon.detailed!==detailed){
  const canvas=document.createElement('canvas');canvas.width=width+240;canvas.height=band;
  const layer=canvas.getContext('2d');if(!layer)return false;
  layer.filter='brightness(1.28)';
  if(detailed){
   // Cover without squeezing buildings horizontally; crop around the
   // architectural middle band, leaving the live field below unobstructed.
   const scale=Math.max(canvas.width/selected.naturalWidth,band/selected.naturalHeight);
   const sw=canvas.width/scale,sh=band/scale;
   const sx=(selected.naturalWidth-sw)/2;
   const sy=Math.max(0,Math.min(selected.naturalHeight-sh,selected.naturalHeight*.32-sh/2));
   layer.drawImage(selected,sx,sy,sw,sh,0,0,canvas.width,band);
  }else layer.drawImage(selected,0,0,canvas.width,band);
  layer.filter='none';
  const fade=layer.createLinearGradient(0,band*.52,0,band);
  fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,0)');
  layer.globalCompositeOperation='destination-in';layer.fillStyle=fade;layer.fillRect(0,0,canvas.width,band);
  cachedHorizon={width,height:band,detailed,canvas};
 }
 const baseline=omegaQuarterViewCamera(plan.entry,width,height,zoom);
 const shift=omegaG3ParallaxShift(camera,baseline,'far');
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=detailed ? .95 : .78;
 ctx.drawImage(cachedHorizon.canvas,-120+shift.dx,0);ctx.restore();return true;
}
let texture:HTMLImageElement|undefined;
let detailedTexture:HTMLImageElement|undefined;
let yard:HTMLImageElement|undefined;
/** Orthographic single-field ground art, projected by the real world camera. */
export function drawOmegaSceneYard(ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan):boolean {
 if(plan.sector!==1||typeof Image==='undefined')return false;
 if(!yard){yard=new Image();yard.decoding='async';yard.src='/assets/omega/scene-art-preview/yard-ground-v3.webp';}
 if(!yard.complete||!yard.naturalWidth||!yard.naturalHeight)return false;
 const sourceRatio=yard.naturalWidth/yard.naturalHeight,targetRatio=OMEGA_FIELD_WIDTH/OMEGA_FIELD_HEIGHT;
 const sw=sourceRatio>targetRatio?yard.naturalHeight*targetRatio:yard.naturalWidth;
 const sh=sourceRatio>targetRatio?yard.naturalHeight:yard.naturalWidth/targetRatio;
 ctx.drawImage(yard,(yard.naturalWidth-sw)/2,(yard.naturalHeight-sh)/2,sw,sh,0,0,OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT);
 return true;
}
export function drawOmegaSurfaceReview(ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,detailed=false):boolean {
 if(plan.sector!==1||typeof Image==='undefined')return false;
 if(detailed&&!detailedTexture){detailedTexture=new Image();detailedTexture.decoding='async';detailedTexture.src='/assets/omega/scene-art-preview/concrete-detail-v2.webp';}
 if(!detailed&&!texture){texture=new Image();texture.decoding='async';texture.src=OMEGA_SURFACE_REVIEW_ASSET;}
 const selected=detailed?detailedTexture:texture;
 if(!selected?.complete||!selected.naturalWidth||!selected.naturalHeight)return false;
 ctx.save();ctx.globalAlpha=detailed ? .82 : .55;
 // Fixed world coordinates make the concrete move with the actual field.
 // It remains below combat warnings, characters and all native solid props.
 ctx.beginPath();ctx.rect(0,0,OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT);ctx.clip();
 for(let y=0;y<OMEGA_FIELD_HEIGHT;y+=700)for(let x=0;x<OMEGA_FIELD_WIDTH;x+=700)
  ctx.drawImage(selected,x,y,700,700);
 ctx.restore();return true;
}
