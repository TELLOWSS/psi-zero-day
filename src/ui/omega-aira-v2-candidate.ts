import {omegaFieldHeading,type OmegaActorView,type OmegaHeading} from './omega-protocol-actor-render';

/**
 * AIRA V2: the 2026-11-09 user-selected black/rose tactical design.
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
const allowed=new Set<string>(OMEGA_AIRA_V2_HEADINGS);
interface CandidateImageRecord { image:HTMLImageElement; status:'loading'|'ready'|'failed' }
export class OmegaAiraV2CandidateImages {
 private readonly cache=new Map<OmegaHeading,CandidateImageRecord>();
 prepare():void {
  if(typeof Image==='undefined')return;
  for(const heading of OMEGA_AIRA_V2_HEADINGS)this.load(heading);
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
  image.src=omegaAiraV2Path(heading);
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
  return Object.fromEntries(OMEGA_AIRA_V2_HEADINGS.map(h=>[h,this.image(h)!==null]))
   as Record<OmegaHeading,boolean>;
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
 const t=Number.isFinite(view.time)?view.time:0;
 const walk=view.gait?.active??view.moving;
 const phase=view.gait?.phase??(t*1.7%1);
 const bob=walk?Math.abs(Math.sin(phase*Math.PI*2))*2.2:Math.sin(t*2.1)*.65;
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
 const h=118,w=h*192/336;
 ctx.drawImage(image,-w/2,-h,w,h);
 ctx.restore();
 return true;
}
