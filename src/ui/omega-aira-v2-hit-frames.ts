import type {OmegaActorView,OmegaHeading} from './omega-protocol-actor-render';

/**
 * Three independent illustrated E-direction HIT poses from the established
 * user-selected AIRA V2 original action sheet: flinch, stagger, knockback.
 * This is a verified-source ONE-DIRECTION preview, not a substitute for
 * the 8x20 original action pack or approved commercial front/rear masks.
 */
export const OMEGA_AIRA_E_HIT_STUDY={
 path:'/assets/omega/aira-v2/e-hit-3key-atlas.svg',
 direction:'E',
 columns:3,
 cellWidth:260,
 cellHeight:215,
 atlasWidth:780,
 atlasHeight:215,
 footLine:205,
 svgSha256:'0c9f33cd7063b359c462e00e800032427661f5af53e3343e2480c10aa9c15bef',
 webpSha256:'cb3477bfeb5e7210025047b216793267e783ed4c48c63ce76972750025132624',
 binaryPresent:true,
 productionApproved:false,
} as const;

export const OMEGA_AIRA_E_HIT_DURATION=.18;
export type OmegaHitKeyframe=0|1|2;
export function omegaAiraHitKeyframeAt(age:number):OmegaHitKeyframe{
 if(!Number.isFinite(age)||age<0)return 0;
 if(age<.052)return 0;
 if(age<.108)return 1;
 return 2;
}
export function omegaAiraHitSourceRect(frame:OmegaHitKeyframe,height:number):
 Readonly<{sx:number;sy:number;sw:number;sh:number;dx:number;dy:number;dw:number;dh:number}> {
 if(!Number.isFinite(height)||height<=0)throw new RangeError('Invalid E hit sprite size');
 const width=height*OMEGA_AIRA_E_HIT_STUDY.cellWidth/OMEGA_AIRA_E_HIT_STUDY.cellHeight;
 return {
  sx:frame*OMEGA_AIRA_E_HIT_STUDY.cellWidth,sy:0,
  sw:OMEGA_AIRA_E_HIT_STUDY.cellWidth,sh:OMEGA_AIRA_E_HIT_STUDY.cellHeight,
  dx:-width/2,dy:-height*OMEGA_AIRA_E_HIT_STUDY.footLine/
   OMEGA_AIRA_E_HIT_STUDY.cellHeight,
  dw:width,dh:height,
 };
}
export class OmegaAiraV2HitFrames{
 private atlas:HTMLImageElement|null=null;
 private state:'locked'|'loading'|'ready'|'failed'='locked';
 prepare():void{
  if(!OMEGA_AIRA_E_HIT_STUDY.binaryPresent||this.atlas||typeof Image==='undefined')return;
  const img=new Image();img.decoding='async';
  this.atlas=img;this.state='loading';
  const valid=()=>img.naturalWidth===OMEGA_AIRA_E_HIT_STUDY.atlasWidth&&
   img.naturalHeight===OMEGA_AIRA_E_HIT_STUDY.atlasHeight;
  img.onload=()=>{this.state=valid()?'ready':'failed';};
  img.onerror=()=>{this.state='failed';};
  img.src=OMEGA_AIRA_E_HIT_STUDY.path;
  if(img.complete)this.state=valid()?'ready':'failed';
 }
 get ready():boolean{return this.state==='ready';}
 draw(ctx:CanvasRenderingContext2D,heading:OmegaHeading,
      view:OmegaActorView,height:number):boolean{
  if(!this.ready||!this.atlas||heading!=='E'||!view.hurt||
    view.finished||view.ultimate||!Number.isFinite(height)||height<=0)return false;
  const age=view.actionAge??0;
  if(!Number.isFinite(age)||age<0||age>=OMEGA_AIRA_E_HIT_DURATION)return false;
  const r=omegaAiraHitSourceRect(omegaAiraHitKeyframeAt(age),height);
  ctx.drawImage(this.atlas,r.sx,r.sy,r.sw,r.sh,r.dx,r.dy,r.dw,r.dh);
  return true;
 }
}
