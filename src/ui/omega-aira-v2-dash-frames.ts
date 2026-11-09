import type {OmegaActorView,OmegaHeading} from './omega-protocol-actor-render';

/**
 * AIRA V2 independent E-facing DASH study: three illustrated poses taken
 * from the established original production sheet, not a mirrored idle pose.
 * The source SVG atlas is a separate review ZIP until its exact bytes are
 * imported and verified in the repository. Never request a missing asset
 * from production, and never mislabel it as the 160-frame approved art pack.
 */
export const OMEGA_AIRA_E_DASH_STUDY={
 path:'/assets/omega/aira-v2/e-dash-3key-atlas.svg',
 columns:3,
 cellWidth:280,
 cellHeight:220,
 atlasWidth:840,
 atlasHeight:220,
 bootLine:210,
 webpSha256:'50dacee2a0b89af9c3ba232df0cae71940beae7a67671b2041d7bbdc82006e50',
 svgSha256:'49efe48fea53e7b376ce003e577ad59ea97ea7518f5636a77527c9dd6919eac3',
 /** Flip only once the exact file and Chromium evidence are committed.
  * This lock is intentionally independent from the full 8x20 art gate.
  */
 binaryPresent:false,
 productionApproved:false,
} as const;
export const OMEGA_AIRA_E_DASH_DURATION=.22;
export type OmegaDashKeyframe=0|1|2;
export function omegaAiraDashKeyframeAt(age:number):OmegaDashKeyframe{
 if(!Number.isFinite(age)||age<0)return 0;
 if(age<.065)return 0; // acceleration / push-off
 if(age<.15)return 1;  // aerial translation
 return 2;              // crouched recovery
}
/** The immutable cropping/boot-pivot contract is independently testable
 * even while the art binary is not available on the runtime branch.
 */
export function omegaAiraDashSourceRect(frame:OmegaDashKeyframe,height:number):
 Readonly<{sx:number;sy:number;sw:number;sh:number;dx:number;dy:number;dw:number;dh:number}> {
 if(!Number.isFinite(height)||height<=0)throw new RangeError('Invalid E dash art height');
 const w=height*OMEGA_AIRA_E_DASH_STUDY.cellWidth/
  OMEGA_AIRA_E_DASH_STUDY.cellHeight;
 return {
  sx:frame*OMEGA_AIRA_E_DASH_STUDY.cellWidth,sy:0,
  sw:OMEGA_AIRA_E_DASH_STUDY.cellWidth,sh:OMEGA_AIRA_E_DASH_STUDY.cellHeight,
  dx:-w/2,dy:-height*OMEGA_AIRA_E_DASH_STUDY.bootLine/
   OMEGA_AIRA_E_DASH_STUDY.cellHeight,
  dw:w,dh:height,
 };
}
export class OmegaAiraV2DashFrames{
 private source:HTMLImageElement|null=null;
 private state:'locked'|'loading'|'ready'|'invalid'='locked';
 prepare():void{
  if(!OMEGA_AIRA_E_DASH_STUDY.binaryPresent||
     this.source||typeof Image==='undefined')return;
  const img=new Image();
  img.decoding='async';
  this.source=img;this.state='loading';
  const decoded=()=>img.naturalWidth===OMEGA_AIRA_E_DASH_STUDY.atlasWidth&&
    img.naturalHeight===OMEGA_AIRA_E_DASH_STUDY.atlasHeight;
  img.onload=()=>{this.state=decoded()?'ready':'invalid';};
  img.onerror=()=>{this.state='invalid';};
  img.src=OMEGA_AIRA_E_DASH_STUDY.path;
  if(img.complete)this.state=decoded()?'ready':'invalid';
 }
 get ready():boolean{return this.state==='ready';}
 draw(ctx:CanvasRenderingContext2D,heading:OmegaHeading,
      view:OmegaActorView,height:number):boolean{
  if(!this.ready||!this.source||heading!=='E'||
     !view.dashing||view.hurt||view.finished||view.ultimate||
     !Number.isFinite(height)||height<=0)return false;
  const age=view.actionAge??0;
  if(!Number.isFinite(age)||age<0||age>=OMEGA_AIRA_E_DASH_DURATION)return false;
  const frame=omegaAiraDashKeyframeAt(age);
  // The source art is 280×220. Width is larger during a fast dash;
  // the boot line is y=210, so the physical Watch foot pivot remains 0.
  const r=omegaAiraDashSourceRect(frame,height);
  ctx.drawImage(this.source,r.sx,r.sy,r.sw,r.sh,r.dx,r.dy,r.dw,r.dh);
  return true;
 }
}
