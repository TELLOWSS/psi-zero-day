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
let cachedHorizon:{width:number;height:number;canvas:HTMLCanvasElement}|undefined;
/** Distant, non-solid scenic plate; camera-derived parallax and no gameplay state. */
export function drawOmegaHorizonReview(ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan,camera:OmegaCameraState,zoom:number):boolean {
 if(plan.sector!==1||typeof Image==='undefined'||typeof document==='undefined')return false;
 if(!horizon){horizon=new Image();horizon.decoding='async';horizon.src=OMEGA_HORIZON_REVIEW_ASSET;}
 if(!horizon.complete||!horizon.naturalWidth||!horizon.naturalHeight)return false;
 const width=ctx.canvas.width,height=ctx.canvas.height;
 if(width<=0||height<=0||!Number.isFinite(zoom))return false;
 const band=Math.max(1,Math.round(Math.min(height*.38,width*.40)));
 if(!cachedHorizon||cachedHorizon.width!==width||cachedHorizon.height!==band){
  const canvas=document.createElement('canvas');canvas.width=width+240;canvas.height=band;
  const layer=canvas.getContext('2d');if(!layer)return false;
  layer.filter='brightness(1.28)';layer.drawImage(horizon,0,0,canvas.width,band);layer.filter='none';
  const fade=layer.createLinearGradient(0,band*.52,0,band);
  fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(1,'rgba(0,0,0,0)');
  layer.globalCompositeOperation='destination-in';layer.fillStyle=fade;layer.fillRect(0,0,canvas.width,band);
  cachedHorizon={width,height:band,canvas};
 }
 const baseline=omegaQuarterViewCamera(plan.entry,width,height,zoom);
 const shift=omegaG3ParallaxShift(camera,baseline,'far');
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=.78;
 ctx.drawImage(cachedHorizon.canvas,-120+shift.dx,0);ctx.restore();return true;
}
let texture:HTMLImageElement|undefined;
export function drawOmegaSurfaceReview(ctx:CanvasRenderingContext2D,plan:OmegaFieldPlan):boolean {
 if(plan.sector!==1||typeof Image==='undefined')return false;
 if(!texture){texture=new Image();texture.decoding='async';texture.src=OMEGA_SURFACE_REVIEW_ASSET;}
 if(!texture.complete||!texture.naturalWidth||!texture.naturalHeight)return false;
 ctx.save();ctx.globalAlpha=.55;
 // Fixed world coordinates make the concrete move with the actual field.
 // It remains below combat warnings, characters and all native solid props.
 ctx.beginPath();ctx.rect(0,0,OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT);ctx.clip();
 for(let y=0;y<OMEGA_FIELD_HEIGHT;y+=700)for(let x=0;x<OMEGA_FIELD_WIDTH;x+=700)
  ctx.drawImage(texture,x,y,700,700);
 ctx.restore();return true;
}
