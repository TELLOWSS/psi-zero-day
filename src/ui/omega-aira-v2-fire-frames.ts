import type {OmegaActorView,OmegaHeading} from './omega-protocol-actor-render';

/**
 * Original painted ACTION KEY POSES extracted from the user-established
 * AIRA V2 animation sheet. These are three real distinct illustrated
 * right-facing poses, not cutout limb shifts of one idle illustration.
 *
 * The three original WebP frames are now embedded as a self-contained local
 * SVG. The underlying WebP bytes have a pinned SHA-256 and are checked in
 * CI. This verifies the E-direction study, NOT 8-way production approval.
 */
export const OMEGA_AIRA_E_FIRE_STUDY={
 path:'/assets/omega/aira-v2/e-fire-3key-atlas.svg',
 columns:3,
 sourceWidth:240,
 sourceHeight:240,
 expectedAtlasWidth:720,
 expectedAtlasHeight:240,
 sha256:'43c1a388f8c9c2e9177d416eeb9383309fbbc2baec2a6c9600918c84c02a65cc',
 svgSha256:'28de189058511fd350f2bee99a24e2d5bef07525e0a996a8f8530ff09b961d36',
 /** This source file is committed. Runtime still fails closed until browser
  * image decode verifies its 720×240 dimensions. The complete art pack is
  * explicitly not artist-approved.
  */
 binaryPresent:true,
 productionApproved:false,
} as const;
export const OMEGA_AIRA_FIRE_STUDY_SHOT_SECONDS=.165;
export type OmegaAiraFireKeyframe=0|1|2;
export function omegaAiraFireKeyframeAt(seconds:number):OmegaAiraFireKeyframe{
 if(!Number.isFinite(seconds)||seconds<0)return 0;
 if(seconds<.045)return 0; // aim / anticipation
 if(seconds<.105)return 1; // discharge / recoil
 return 2; // recover
}
type CompleteImage=HTMLImageElement;
export class OmegaAiraV2FireFrames {
 private image:CompleteImage|null=null;
 private status:'unavailable'|'loading'|'ready'|'failed'='unavailable';
 prepare():void {
  if(!OMEGA_AIRA_E_FIRE_STUDY.binaryPresent||this.image||
      typeof Image==='undefined')return;
  const image=new Image();
  image.decoding='async';
  this.image=image;this.status='loading';
  image.onload=()=>{
   this.status=image.naturalWidth===OMEGA_AIRA_E_FIRE_STUDY.expectedAtlasWidth&&
    image.naturalHeight===OMEGA_AIRA_E_FIRE_STUDY.expectedAtlasHeight?'ready':'failed';
  };
  image.onerror=()=>{this.status='failed';};
  image.src=OMEGA_AIRA_E_FIRE_STUDY.path;
  if(image.complete)this.status=image.naturalWidth===720&&
   image.naturalHeight===240?'ready':'failed';
 }
 get ready():boolean{return this.status==='ready';}
 /** Draw only the true E side action with the same native Watch launch cue.
  * All other directions continue to use the selected 8-way AIRA V2 art,
  * never mirror the E fire sprite into false 7-direction poses.
  */
 draw(ctx:CanvasRenderingContext2D,heading:OmegaHeading,
  view:OmegaActorView,height:number):boolean{
  if(!this.ready||!this.image||heading!=='E'||!view.shooting||
     view.dashing||view.hurt||view.ultimate||view.finished||
     !Number.isFinite(height)||height<=0)return false;
  const age=view.actionAge;
  if(age!==undefined&&(!Number.isFinite(age)||age<0||
     age>=OMEGA_AIRA_FIRE_STUDY_SHOT_SECONDS))return false;
  const frame=omegaAiraFireKeyframeAt(age??0);
  // Artwork's two boot contacts occupy atlas row 236/240.
  // Keep the native player world foot-pivot within 2 px at 118-px display.
  const w=height,h=height;
  ctx.drawImage(this.image,frame*240,0,240,240,-w/2,-h,w,h);
  return true;
 }
}
