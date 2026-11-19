import type {OmegaActorView,OmegaHeading} from './omega-protocol-actor-render';

/** Four genuinely DISTINCT illustrated E-facing WALK source poses from
 * the original user-selected AIRA V2 production sheet. Not synthetic
 * cutouts, mirrored sprites, interpolation output or the full 6-key row.
 *
 * The game's real distance-driven gait phase advances the source frame.
 * No movement/footstep animation on wall collision, paused native movement
 * or the other seven directions before their own art is available.
 */
export const OMEGA_AIRA_E_WALK_STUDY={
 path:'/assets/omega/aira-v2/e-walk-4key-atlas.svg',
 direction:'E',count:4,
 cellWidth:240,cellHeight:232,atlasWidth:960,atlasHeight:232,
 footLine:227,
 svgSha256:'0ccf69c8e54ff1d0149c5f0eb2f0cb9319fa2b2003f49a78e2f5e08c8e8a365d',
 webpSha256:'708c0e26cb48d58cec448a1b5696f03ba01c2de7d202e4af5821b63f01bf1867',
 binaryPresent:true,productionApproved:false,
} as const;
export type OmegaAiraWalkPaintedKey=0|1|2|3;
export function omegaAiraWalkPaintedFrameAt(phase:number):OmegaAiraWalkPaintedKey{
 if(!Number.isFinite(phase))return 0;
 const normalized=((phase%1)+1)%1;
 return Math.min(3,Math.floor(normalized*4)) as OmegaAiraWalkPaintedKey;
}
export function omegaAiraWalkPaintedSourceRect(
 frame:OmegaAiraWalkPaintedKey,displayHeight:number,
):Readonly<{sx:number;sy:number;sw:number;sh:number;dx:number;dy:number;dw:number;dh:number}>{
 if(!Number.isFinite(displayHeight)||displayHeight<=0)
  throw new RangeError('Invalid AIRA walk sprite height');
 const art=OMEGA_AIRA_E_WALK_STUDY;
 const drawWidth=displayHeight*art.cellWidth/art.cellHeight;
 return {
  sx:frame*art.cellWidth,sy:0,sw:art.cellWidth,sh:art.cellHeight,
  dx:-drawWidth/2,dy:-displayHeight*art.footLine/art.cellHeight,
  dw:drawWidth,dh:displayHeight,
 };
}
export class OmegaAiraV2WalkFrames{
 private image:HTMLImageElement|null=null;
 private status:'unavailable'|'loading'|'ready'|'failed'='unavailable';
 prepare():void{
  if(!OMEGA_AIRA_E_WALK_STUDY.binaryPresent||this.image||typeof Image==='undefined')
   return;
  const img=new Image();img.decoding='async';this.image=img;
  this.status='loading';
  const valid=()=>img.naturalWidth===OMEGA_AIRA_E_WALK_STUDY.atlasWidth&&
   img.naturalHeight===OMEGA_AIRA_E_WALK_STUDY.atlasHeight;
  img.onload=()=>{this.status=valid()?'ready':'failed';};
  img.onerror=()=>{this.status='failed';};
  img.src=OMEGA_AIRA_E_WALK_STUDY.path;
  if(img.complete)this.status=valid()?'ready':'failed';
 }
 get ready():boolean{return this.status==='ready';}
 draw(ctx:CanvasRenderingContext2D,heading:OmegaHeading,view:OmegaActorView,
  displayHeight:number):boolean{
  const gait=view.gait;
  if(!this.ready||!this.image||heading!=='E'||!gait?.active||
   view.dashing||view.hurt||view.ultimate||view.finished||view.shooting||
   !Number.isFinite(displayHeight)||displayHeight<=0)return false;
  // Real native collision-corrected player path alone advances this image.
  const phase=gait.phase;
  if(!Number.isFinite(phase))return false;
  const index=omegaAiraWalkPaintedFrameAt(phase);
  const rect=omegaAiraWalkPaintedSourceRect(index,displayHeight);
  ctx.drawImage(this.image,rect.sx,rect.sy,rect.sw,rect.sh,
   rect.dx,rect.dy,rect.dw,rect.dh);
  return true;
 }
}
