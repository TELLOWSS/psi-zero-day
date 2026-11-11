import {omegaFieldHeading,type OmegaActorView} from './omega-protocol-actor-render';
import {OMEGA_G5D_ACTUAL_E_WALK} from './omega-protocol-m12g5d-actual-source';

/**
 * M12-G5e: camera-space visual responses to REAL engine-originated FIRE/DASH/
 * HIT. This is intentionally an authored Canvas FX composite of the ORIGINAL
 * silver AIRA painting, NOT 12 independent painted character animation frames.
 * No new projectile, damage, collision, AI, weapon power, or unlock state.
 */
export const OMEGA_G5E_ART_STATUS={
 originalFourWalkWebPs:OMEGA_G5D_ACTUAL_E_WALK.length,
 paintedFireFramesApproved:0,
 paintedDashFramesApproved:0,
 paintedHitFramesApproved:0,
 final160Approved:0,
 final320MasksApproved:0,
 productionApproved:false,
 rendering:'ORIGINAL_SILVER_SOURCE_WITH_NATIVE_EVENT_FX_DEV_ONLY',
} as const;
export type OmegaG5eNativeAction='fire'|'dash'|'hit';
export interface OmegaG5eVisualCue{
 readonly action:OmegaG5eNativeAction;
 readonly frame:0|1|2|3;
 readonly strength:number;
 readonly recoil:number;
 readonly directionRadians:number;
 readonly visualHeight:number;
 readonly muzzleX:number;
 readonly muzzleY:number;
}
export function omegaG5eLabRequested(search:string,isDevelopment:boolean):boolean{
 if(!isDevelopment)return false;
 const p=new URLSearchParams(search);
 return p.get('omegaLab')==='1'&&p.get('omegaM12G5e')==='1'&&
  !['omegaSilverPreview','omegaM12G4','omegaM12G5',
    'omegaM12G5b','omegaM12G5c','omegaM12G5d',
    'omegaG5VectorStudy'].some(k=>p.has(k));
}
const finite=(x:number|undefined,fallback=0):number=>
 typeof x==='number'&&Number.isFinite(x)?x:fallback;
const clamp=(x:number,a:number,b:number):number=>Math.min(b,Math.max(a,x));
/** No FX for idle, fake/expired shot, the other 7 directions, terminal,
 * or a non-finite engine age. Priority matches native HIT > DASH > FIRE. */
export function omegaG5eCue(view:OmegaActorView,height:number):OmegaG5eVisualCue|null{
 if(omegaFieldHeading(view.facingX,view.facingY)!=='E'||
   !Number.isFinite(height)||height<=0||view.ultimate||view.finished)return null;
 if(!Number.isFinite(view.actionAge)||view.actionAge===undefined||
    view.actionAge<0)return null;
 const age=view.actionAge;
 let action:OmegaG5eNativeAction;
 let duration:number;
 if(view.hurt){action='hit';duration=.26;}
 else if(view.dashing){action='dash';duration=.32;}
 else if(view.shooting){action='fire';duration=.15;}
 else return null;
 if(age>duration)return null;
 const progress=clamp(age/duration,0,.99999);
 const frame=Math.floor(progress*4) as 0|1|2|3;
 const strength=1-progress;
 const dx=finite(view.weaponFacingX,view.facingX);
 const dy=finite(view.weaponFacingY,view.facingY);
 const directionRadians=Math.hypot(dx,dy)>1e-6?Math.atan2(dy,dx):0;
 // Existing original WebP rifle muzzle: approx (x=334,y=200) in 384x512.
 // The source boot contact is near y=486. This is not a gameplay hitbox.
 return {action,frame,strength,
  recoil:action==='fire'?height*.057*Math.pow(strength,1.45):0,
  directionRadians,visualHeight:height,
  muzzleX:height*(334-192)/512,
  muzzleY:-height*(486-200)/512};
}

function path(ctx:CanvasRenderingContext2D,points:readonly [number,number][]):void{
 ctx.beginPath();
 points.forEach(([x,y],i)=>{if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});
 ctx.stroke();
}
/** Presentation-only full-frame painterly compositing, preserving face,
 * original hair, white asymmetrical coat, violet rifle and foot origin. */
export class OmegaG5eNativeActionFx{
 private counts:Record<OmegaG5eNativeAction,number>={fire:0,dash:0,hit:0};
 private keyframes:Record<OmegaG5eNativeAction,Set<number>>={
  fire:new Set(),dash:new Set(),hit:new Set(),
 };
 evidence():Readonly<{counts:Readonly<Record<OmegaG5eNativeAction,number>>;
    frames:Readonly<Record<OmegaG5eNativeAction,readonly number[]>>}>{
  return {counts:{...this.counts},frames:{
   fire:[...this.keyframes.fire].sort(),dash:[...this.keyframes.dash].sort(),
   hit:[...this.keyframes.hit].sort(),
  }};
 }
 reset():void{
  this.counts={fire:0,dash:0,hit:0};
  for(const frames of Object.values(this.keyframes))frames.clear();
 }
 draw(ctx:CanvasRenderingContext2D,image:CanvasImageSource,
  view:OmegaActorView,height:number):boolean{
  const cue=omegaG5eCue(view,height);
  if(!cue)return false;
  const h=cue.visualHeight,w=h*384/512;
  const ix=-w/2,iy=-h;
  ctx.save();
  // Actual native DASH / HIT event alone permits one or two original-art
  // afterimages. This does not synthesize additional character artwork.
  if(cue.action==='dash'){
   const distance=h*(.34+.28*cue.strength);
   for(let j=2;j>=1;j--){
    ctx.save();
    ctx.globalAlpha=clamp(.10+.12*cue.strength-(j-1)*.05,0,.22);
    ctx.translate(-distance*j*.5,0);
    ctx.drawImage(image,ix,iy,w,h);
    ctx.restore();
   }
   const glow=ctx.createLinearGradient(-distance,-h*.63,h*.11,-h*.63);
   glow.addColorStop(0,'rgba(135,77,243,0)');
   glow.addColorStop(.65,'rgba(172,133,255,.28)');
   glow.addColorStop(1,'rgba(246,230,255,0)');
   ctx.fillStyle=glow;ctx.fillRect(-distance,-h*.88,distance+h*.12,h*.57);
  }
  ctx.save();
  if(cue.action==='fire'){
   // The recoil transform moves the entire existing painted source by a
   // few local pixels, never moves the actual player in world physics.
   ctx.translate(-cue.recoil,0);
   ctx.rotate(-.015*cue.strength);
  }else if(cue.action==='dash'){
   ctx.translate(h*.035*cue.strength,-h*.006);
   ctx.rotate(.035*cue.strength);
  }else{
   ctx.translate(-h*.028*cue.strength,h*.016*cue.strength);
   ctx.rotate(-.058*cue.strength);
  }
  ctx.drawImage(image,ix,iy,w,h);
  ctx.restore();
  if(cue.action==='fire'){
   // Real native watch gun feedback only, not an invented projectile.
   // Muzzle is fixed to authentic right-facing rifle painting.
   ctx.save();ctx.translate(cue.muzzleX-cue.recoil,cue.muzzleY);
   ctx.rotate(cue.directionRadians);
   const flash=h*(.24+.12*cue.strength);
   const grd=ctx.createRadialGradient(1,0,0,3,0,flash);
   grd.addColorStop(0,'rgba(255,255,246,.95)');
   grd.addColorStop(.17,'rgba(252,204,255,.94)');
   grd.addColorStop(.35,'rgba(208,95,255,.75)');
   grd.addColorStop(.7,'rgba(137,62,219,.23)');
   grd.addColorStop(1,'rgba(137,62,219,0)');
   ctx.globalAlpha=clamp(.50+.5*cue.strength,0,1);
   ctx.fillStyle=grd;ctx.beginPath();ctx.arc(0,0,flash,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#fff7ee';ctx.lineWidth=clamp(h*.015,1.3,3.3);
   path(ctx,[[0,-1],[flash*.40,-flash*.18],[flash*.73,0],[flash*.46,flash*.09]]);
   path(ctx,[[0,0],[flash*.32,flash*.27],[flash*.6,flash*.12]]);
   ctx.restore();
  }else if(cue.action==='hit'){
   // Actual player damage flash only: a lightweight shield crack ring.
   ctx.save();ctx.globalAlpha=clamp(.18+.37*cue.strength,0,.55);
   ctx.strokeStyle='#f2a4e1';ctx.lineWidth=2;
   ctx.beginPath();ctx.ellipse(0,-h*.46,h*.36,h*.48,-.2,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#cb78ff';ctx.lineWidth=clamp(h*.016,1.5,3);
   path(ctx,[[-h*.35,-h*.70],[-h*.23,-h*.64],[-h*.14,-h*.76]]);
   path(ctx,[[h*.22,-h*.32],[h*.30,-h*.40],[h*.35,-h*.33]]);
   ctx.restore();
  }
  ctx.restore();
  this.counts[cue.action]++;
  this.keyframes[cue.action].add(cue.frame);
  return true;
 }
}
export const omegaG5eFx=new OmegaG5eNativeActionFx();
