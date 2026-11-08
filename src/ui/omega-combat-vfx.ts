import type {OmegaTechnicalFramePlacement} from './omega-stage-preview-bridge';
import type {OmegaPoint} from './omega-leg-ik';

/**
 * Original AIRA action VFX art: 4 effects x 8 genuine procedural frames.
 * Current binary archive is a separately delivered review pack.
 * This is NOT a substitute for 8-way character animations or an equipped skin.
 */
export const OMEGA_VFX_ATLAS=Object.freeze({
 columns:8,
 rows:4,
 cellWidth:384,
 cellHeight:384,
 width:3072,
 height:1536,
 actions:['muzzle','dash','hit','ultimate'] as const,
 releaseApproved:false,
});
export type OmegaVfxName=(typeof OMEGA_VFX_ATLAS.actions)[number];
export interface OmegaVfxFrame{
 readonly action:OmegaVfxName;
 readonly frame:number;
 readonly finished:boolean;
 readonly source:Readonly<{x:number;y:number;width:number;height:number}>;
 readonly destination:Readonly<{x:number;y:number;width:number;height:number}>;
 readonly opacity:number;
 readonly releaseApproved:false;
}
const durations:Readonly<Record<OmegaVfxName,number>>={
 muzzle:250,
 dash:410,
 hit:350,
 ultimate:1100,
};
const sizeRatio:Readonly<Record<OmegaVfxName,number>>={
 muzzle:1,
 dash:1.4,
 hit:1.15,
 ultimate:3,
};
const anchorFor=(pose:OmegaTechnicalFramePlacement,action:OmegaVfxName):OmegaPoint=>{
 switch(action){
  case 'muzzle': return pose.sockets.weaponMuzzle;
  case 'dash': return pose.sockets.hip;
  case 'hit': return pose.sockets.chest;
  case 'ultimate': return pose.sockets.hip;
 }
};
/** Fixed 32-cell addressing. Effect travels with a currently computed stage socket. */
export function omegaVfxFrame(
 pose:OmegaTechnicalFramePlacement,
 action:OmegaVfxName,
 elapsedMs:number,
 reducedMotion=false,
):OmegaVfxFrame {
 if(!Number.isFinite(elapsedMs))elapsedMs=0;
 const safe=Math.max(0,elapsedMs);
 const elapsed=Math.min(1,safe/durations[action]);
 const finished=safe>=durations[action];
 const frame=reducedMotion?4:Math.min(7,Math.floor(elapsed*8));
 const row=OMEGA_VFX_ATLAS.actions.indexOf(action);
 const size=Math.min(1536,Math.max(8,pose.destination.height*sizeRatio[action]));
 const anchor=anchorFor(pose,action);
 return {
  action,frame,finished,
  source:{x:frame*384,y:row*384,width:384,height:384},
  destination:{x:anchor.x-size/2,y:anchor.y-size/2,width:size,height:size},
  opacity:reducedMotion?.35:1,
  releaseApproved:false,
 };
}
/**
 * Canvas preview compositing (PNG atlas supplied by design lab).
 * Never invokes combat state changes, damage, item grants or unlocks.
 */
export function drawOmegaVfxPreview(
 ctx:CanvasRenderingContext2D,
 source:HTMLImageElement,
 frame:OmegaVfxFrame,
):boolean{
 if(source.naturalWidth!==OMEGA_VFX_ATLAS.width||
    source.naturalHeight!==OMEGA_VFX_ATLAS.height||frame.finished)return false;
 const s=frame.source,d=frame.destination;
 if(s.x<0||s.y<0||s.x+s.width>OMEGA_VFX_ATLAS.width||
    s.y+s.height>OMEGA_VFX_ATLAS.height||!Number.isFinite(d.x)||!Number.isFinite(d.y))return false;
 ctx.save();
 try{
  ctx.globalAlpha=Math.max(0,Math.min(1,frame.opacity));
  ctx.drawImage(source,s.x,s.y,s.width,s.height,d.x,d.y,d.width,d.height);
 }finally{ctx.restore()}
 return true;
}
