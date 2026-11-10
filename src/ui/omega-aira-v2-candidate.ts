import {omegaFieldHeading,type OmegaActorView,type OmegaHeading} from './omega-protocol-actor-render';
import {drawOmegaAiraV2WalkRig} from './omega-aira-v2-walk-rig';
import {OmegaAiraV2WalkFrames} from './omega-aira-v2-walk-frames';
import {drawOmegaAiraV2DirectionalAction} from './omega-aira-v2-directional-action-rig';
import {drawOmegaAiraV2ShotVfx} from './omega-aira-v2-weapon-vfx';
import {OmegaAiraV2FireFrames} from './omega-aira-v2-fire-frames';
import {OmegaAiraV2DashFrames} from './omega-aira-v2-dash-frames';
import {OmegaAiraV2HitFrames} from './omega-aira-v2-hit-frames';
import {OmegaAiraV2SpecialFrames} from './omega-aira-v2-special-frames';
import {omegaG4SilverLabRequested,OMEGA_G4_SILVER_SCALE} from './omega-protocol-m12-combat-fidelity';

/**
 * AIRA V2: SILVER-WHITE / LAVENDER high ponytail, violet eyes,
 * white Ω tactical jacket, black armor and violet emissive trim.
 * The user explicitly reconfirmed this canonical appearance on 2026-11-09.
 * Earlier BLACK/ROSE candidate assets are NOT approved substitutions.
 * Current images require a fresh binary identity audit and must not be
 * counted as final silver AIRA sprites until reviewed against the source.
 *
 * This stage uses EIGHT independently illustrated neutral turnaround views,
 * extracted from the user's approved design sheet. No left/right mirroring.
 * It is NOT the approved 160-frame / 320-mask production animation pack.
 * The strict approved-art gate in omega-protocol-art-slot.ts remains locked.
 *
 * The source images must exist at public/assets/omega/aira-v2/<direction>-idle.webp
 * before production may enable this layer. Missing/undecoded assets fall
 * back to the old tactical debug actor instead of producing invisible play.
 */
export const OMEGA_AIRA_V2_ROOT='/assets/omega/aira-v2/' as const;
export const OMEGA_AIRA_V2_HEADINGS=['E','SE','S','SW','W','NW','N','NE'] as const;
export const OMEGA_AIRA_V2_IDENTITY='AIRA_V2_USER_APPROVED_20261109' as const;
export function omegaAiraV2Path(heading:OmegaHeading):string{
 return OMEGA_AIRA_V2_ROOT+heading.toLowerCase()+'-idle.webp';
}
/** Lift AIRA's screen presence without touching native Watch hitboxes.
 * Only 3 size bands are used to prevent constantly shifting character scale.
 * On unknown/fake Canvas contexts retain the historical fallback size.
 */
export function omegaAiraV2VisualHeight(canvasWidth:number):number{
 if(!Number.isFinite(canvasWidth)||canvasWidth<=0)return 118;
 if(canvasWidth>=1200)return 140;
 if(canvasWidth>=650)return 136;
 return 126;
}
const allowed=new Set<string>(OMEGA_AIRA_V2_HEADINGS);
interface CandidateImageRecord { image:HTMLImageElement; status:'loading'|'ready'|'failed' }
export class OmegaAiraV2CandidateImages {
 private readonly cache=new Map<OmegaHeading,CandidateImageRecord>();
 private readonly reviewSources=new Map<OmegaHeading,string>();
 get silverReviewActive():boolean{return this.reviewSources.size===8;}
 /** Explicit QA-only per-session overrides; never replace the shipped original
  * and never attribute old BLACK/ROSE E animation to silver AIRA.
  */
 setSilverReviewSources(sources:ReadonlyMap<OmegaHeading,string>|null):void{
  // Verify all original angles before touching the active renderer; a
  // partially selected or fabricated direction must never be accepted.
  const next=new Map<OmegaHeading,string>();
  if(sources){
   for(const heading of OMEGA_AIRA_V2_HEADINGS){
    const source=sources.get(heading);
    if(!source||!source.startsWith('blob:'))
     throw Error('Invalid silver preview source '+heading);
    next.set(heading,source);
   }
  }
  this.cache.clear();this.reviewSources.clear();
  for(const [heading,source] of next)this.reviewSources.set(heading,source);
  this.prepare();
 }
 readonly fireFrames=new OmegaAiraV2FireFrames();
 readonly dashFrames=new OmegaAiraV2DashFrames();
 readonly hitFrames=new OmegaAiraV2HitFrames();
 readonly specialFrames=new OmegaAiraV2SpecialFrames();
 readonly walkFrames=new OmegaAiraV2WalkFrames();
 prepare():void {
  if(typeof Image==='undefined')return;
  for(const heading of OMEGA_AIRA_V2_HEADINGS)this.load(heading);
  this.fireFrames.prepare();
  this.dashFrames.prepare();
  this.hitFrames.prepare();
  this.specialFrames.prepare();
  this.walkFrames.prepare();
 }
 private load(heading:OmegaHeading):CandidateImageRecord|null {
  if(typeof Image==='undefined'||!allowed.has(heading))return null;
  const existing=this.cache.get(heading);
  if(existing)return existing;
  const image=new Image();
  image.decoding='async';
  const record:CandidateImageRecord={image,status:'loading'};
  this.cache.set(heading,record);
  image.onload=()=>{
   record.status=image.naturalWidth>=64&&image.naturalHeight>=110?'ready':'failed';
  };
  image.onerror=()=>{record.status='failed';};
  image.src=this.reviewSources.get(heading)??omegaAiraV2Path(heading);
  if(image.complete&&image.naturalWidth>=64&&image.naturalHeight>=110)
   record.status='ready';
  return record;
 }
 image(heading:OmegaHeading):HTMLImageElement|null {
  const record=this.load(heading);
  return record?.status==='ready'?record.image:null;
 }
 hasAllDirections():boolean {
  return OMEGA_AIRA_V2_HEADINGS.every(h=>this.image(h)!==null);
 }
 status():Readonly<Record<OmegaHeading,boolean>> {
  return Object.fromEntries(OMEGA_AIRA_V2_HEADINGS.map(h=>[h,this.image(h)!==null])) as Record<OmegaHeading,boolean>;
 }
}
/**
 * Game-space boot pivot remains at (0,0), no changes to native Watch
 * hitbox/collision. The source is a *still* for that heading: movement is
 * a measured presentational transform, NOT claimed as a true painted cycle.
 */
export function drawOmegaAiraV2Candidate(
 ctx:CanvasRenderingContext2D,view:OmegaActorView,
 cache:OmegaAiraV2CandidateImages,
):boolean {
 const heading=omegaFieldHeading(view.facingX,view.facingY);
 const image=cache.image(heading);
 if(!image)return false;
 if(cache.silverReviewActive){
  // The silver AIRA user-original 384×512 neutral images are *not* the
  // older 192×336 BLACK/ROSE study. No invalid cutouts and never paint
  // mismatched E fire/dash/walk/hit atlases over the canonical character.
  const g4Review=typeof window!=='undefined'&&omegaG4SilverLabRequested(
   window.location.search,import.meta.env.DEV||import.meta.env.VITE_OMEGA_PROTOCOL_LAB==='1');
  // Compare real silver originals at the same world-foot plane as infected
  // bodies. The unchanged 8 angles are neutral STILL paintings; small native
  // posture transforms are NOT independent authored animation frames.
  const h=omegaAiraV2VisualHeight(Number(ctx.canvas?.width))*(g4Review?OMEGA_G4_SILVER_SCALE:1);
  const w=h*384/512;
  if(g4Review){
   const gaitSwing=view.gait?.active?Math.sin(view.gait.phase*Math.PI*2)*.012:0;
   const lean=view.dashing ? .06 : view.hurt ? -.04 : view.shooting ? -.025 : gaitSwing;
   ctx.save();ctx.rotate(lean);ctx.drawImage(image,-w/2,-h,w,h);ctx.restore();
  }else ctx.drawImage(image,-w/2,-h,w,h);
  return true;
 }
 const t=Number.isFinite(view.time)?view.time:0;
 const walk=view.gait?.active??view.moving;
 const phase=view.gait?.phase??(t*1.7%1);
 // The source-painted E walk already contains anatomical up/down motion.
 // Do NOT add the old cutout's extra 2.2px bob: it would lift the opaque
 // boots away from the native Watch ground foot contact on each step.
 const ePaintedWalk=heading==='E'&&cache.walkFrames.ready&&
  Boolean(view.gait?.active)&&!view.dashing&&!view.hurt&&
  !view.ultimate&&!view.finished&&!view.shooting;
 const bob=ePaintedWalk?0:walk?
  Math.abs(Math.sin(phase*Math.PI*2))*2.2:Math.sin(t*2.1)*.65;
 const actionAge=Math.max(0,Number.isFinite(view.actionAge)?view.actionAge??0:0);
 let lean=0,offsetX=0,offsetY=-bob;
 if(view.dashing){lean=.17;offsetX=-6;offsetY+=6;}
 else if(view.hurt){lean=-.12*Math.max(.3,1-actionAge*2);offsetY+=4;}
 else if(view.shooting){offsetX=-Math.max(0,4-actionAge*50);lean=-.035;}
 else if(view.ultimate){lean=-.055;offsetY-=3;}
 else if(view.finished){lean=.05;offsetY-=3;}
 // Painter's shadow remains tied to the same real player foot position.
 ctx.save();
 ctx.fillStyle='rgba(1,10,20,.34)';
 ctx.beginPath();ctx.ellipse(0,0,28,8,0,0,Math.PI*2);ctx.fill();
 ctx.translate(offsetX,offsetY);
 ctx.rotate(lean);
 if(view.hurt)ctx.globalAlpha=.80+.20*Math.sin(t*18)**2;
 // Natural-source aspect ratio 192:336. No horizontal flip.
 const h=omegaAiraV2VisualHeight(Number(ctx.canvas?.width)),w=h*192/336;
 // Back-facing original sprites (N, NW, NE) must cover the near shoulder /
 // pistol grip. This is a genuine world-space draw-order correction, never
 // a horizontally mirrored image or an invented projectile.
 const authoredEFire=heading==='E'&&cache.fireFrames.ready&&
  view.shooting&&!view.dashing&&!view.hurt&&!view.ultimate&&!view.finished;
 if(!authoredEFire)drawOmegaAiraV2ShotVfx(ctx,view,heading,h,'rear');
 const paintedSpecial=cache.specialFrames.draw(ctx,heading,view,
  h*(view.finished?1.28:1.67));
 const paintedHit=!paintedSpecial&&cache.hitFrames.draw(ctx,heading,view,h*1.20);
 const paintedDash=!paintedSpecial&&!paintedHit&&cache.dashFrames.draw(ctx,heading,view,h*1.43);
 const paintedFire=!paintedSpecial&&!paintedHit&&!paintedDash&&cache.fireFrames.draw(ctx,heading,view,h*1.14);
 const paintedWalk=!paintedSpecial&&!paintedHit&&!paintedDash&&!paintedFire&&
  cache.walkFrames.draw(ctx,heading,view,h*1.22);
 if(paintedSpecial||paintedHit||paintedDash||paintedFire||paintedWalk){
  // Original E paintings (including 4 real walk poses) take priority.
 }else if(drawOmegaAiraV2DirectionalAction(ctx,image,heading,view,h)){
  // On all eight ORIGINAL angle images, native fire/dash/hit/ultimate/finish
  // now have dedicated anatomical motion. This is an INTERIM technical rig,
  // never misreported as 146 separately hand-painted missing frames.
 }else if(walk&&!view.dashing&&!view.hurt&&!view.ultimate&&!view.finished){
  // Real eight-source articulated gait with two independent boot limbs.
  // Still art is the user's selected V2; this is interim skeletal motion
  // until independent painted production walk frames pass the art gate.
  drawOmegaAiraV2WalkRig(ctx,image,heading,phase,h);
 }else{
  ctx.drawImage(image,-w/2,-h,w,h);
 }
 // Source-dependent actual Watch shot bearing; not a fake static gun flash.
 if(!paintedSpecial&&!paintedHit&&!paintedFire&&!paintedDash)
  drawOmegaAiraV2ShotVfx(ctx,view,heading,h,'front');
 ctx.restore();
 return true;
}
