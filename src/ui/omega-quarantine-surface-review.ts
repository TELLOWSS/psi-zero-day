import type {OmegaFieldPlan} from '../domain/omega-protocol-field';
import {OMEGA_FIELD_WIDTH,OMEGA_FIELD_HEIGHT} from '../domain/omega-protocol-field';

/** Unapproved local visual audition; the native floor and collision remain intact. */
export const OMEGA_SURFACE_REVIEW_ASSET='/assets/omega/sector01/concrete-surface-review.webp';
export function omegaSurfaceReviewRequested(query:string,dev:boolean):boolean {
 const q=new URLSearchParams(query);
 return dev&&q.get('omegaLab')==='1'&&q.get('omegaSurfaceReview')==='1';
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
