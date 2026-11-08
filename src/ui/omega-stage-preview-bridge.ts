import {OMEGA_DIRECTIONS,omegaMotionFrame} from './omega-operator-motion';
import {omegaFrameSocketGuide,type OmegaSocket,type OmegaSocketFrame} from './omega-equipment-socket-guide';
import type {OmegaPoint} from './omega-leg-ik';

/**
 * Maps technical eight-direction × six-phase study art to *world-space*
 * renderer coordinates. This is a development-only adapter: it MUST NOT be
 * attached to the selectable CharacterId table or combat reward system.
 */
export type OmegaPreviewProfile='mobile'|'desktop';
export interface OmegaTechnicalFramePlacement {
 readonly artStatus:'TECHNICAL_PREVIEW_ONLY';
 readonly playable:false;
 readonly source:Readonly<{x:number;y:number;width:number;height:number}>;
 readonly destination:Readonly<{x:number;y:number;width:number;height:number}>;
 readonly facing:typeof OMEGA_DIRECTIONS[number];
 readonly frame:number;
 readonly standing:OmegaSocketFrame['stance'];
 readonly sockets:Readonly<Record<OmegaSocket,OmegaPoint>>;
 readonly frameCell:OmegaPreviewProfile;
}
function finitePoint(point:OmegaPoint):boolean{
 return Number.isFinite(point.x)&&Number.isFinite(point.y);
}
export function omegaTechnicalFramePlacement(
 groundCenter:OmegaPoint,
 facingRadians:number,
 elapsedSeconds:number,
 displayHeight:number,
 profile:OmegaPreviewProfile='mobile',
 reducedMotion=false,
):OmegaTechnicalFramePlacement {
 if(!finitePoint(groundCenter)||!Number.isFinite(displayHeight)||displayHeight<=0||displayHeight>2048)
  throw new RangeError('OMEGA debug world position and sprite height must be finite');
 const motion=omegaMotionFrame('walk',elapsedSeconds,facingRadians,reducedMotion);
 const guide=omegaFrameSocketGuide(motion.direction,motion.frame);
 const cell=profile==='mobile'?{width:192,height:256}:{width:384,height:512};
 const width=displayHeight*384/512;
 const x=groundCenter.x-width/2;
 // Pelvis center in X, visual floor at Y=454 of a 512-unit source cell.
 // Frame-specific foot positions are visible as sockets, but do not create
 // a world-space stance lock: the game root path must do that later.
 const y=groundCenter.y-displayHeight*454/512;
 const sockets={} as Record<OmegaSocket,OmegaPoint>;
 for(const name of Object.keys(guide.sockets) as OmegaSocket[]){
  const p=guide.sockets[name];
  sockets[name]={x:x+(p.x/384)*width,y:y+(p.y/512)*displayHeight};
 }
 return {
  artStatus:'TECHNICAL_PREVIEW_ONLY',playable:false,
  source:{x:motion.directionIndex*cell.width,y:motion.frame*cell.height,width:cell.width,height:cell.height},
  destination:{x,y,width,height:displayHeight},
  facing:motion.direction,frame:motion.frame,standing:guide.stance,sockets,frameCell:profile,
 };
}

/**
 * Draw one authentic atlas cell (provided by the local inspector) and optional
 * socket markers. Does not create or imply attack, hit or equipment-occlusion art.
 */
export function drawOmegaTechnicalPreview(
 ctx:CanvasRenderingContext2D,
 atlas:HTMLImageElement,
 pose:OmegaTechnicalFramePlacement,
 opts:Readonly<{socketOverlay?:boolean;footOverlay?:boolean}>={},
):boolean {
 if(pose.playable!==false||pose.artStatus!=='TECHNICAL_PREVIEW_ONLY')
  throw new Error('OMEGA approval gate: runtime character rendering is disabled');
 const expected=pose.frameCell==='mobile'?1536:3072;
 if(atlas.naturalWidth!==expected||atlas.naturalHeight!==expected)return false;
 const s=pose.source,d=pose.destination;
 if(s.x<0||s.y<0||s.x+s.width>expected||s.y+s.height>expected)return false;
 ctx.drawImage(atlas,s.x,s.y,s.width,s.height,d.x,d.y,d.width,d.height);
 if(opts.socketOverlay||opts.footOverlay){
  ctx.save();
  ctx.lineWidth=Math.max(1,d.height/150);
  const drawMarker=(where:OmegaPoint,color:string)=>{
   ctx.beginPath();ctx.arc(where.x,where.y,Math.max(2,d.height/70),0,Math.PI*2);
   ctx.strokeStyle=color;ctx.stroke();
  };
  if(opts.socketOverlay){
   drawMarker(pose.sockets.radio,'#71f2e5');
   drawMarker(pose.sockets.rightWrist,'#b9bbff');
   drawMarker(pose.sockets.weaponMuzzle,'#ffcb80');
  }
  if(opts.footOverlay){
   drawMarker(pose.sockets.leftFoot,pose.standing.left?'#ff97c8':'#b0b0ba');
   drawMarker(pose.sockets.rightFoot,pose.standing.right?'#ff97c8':'#b0b0ba');
  }
  ctx.restore();
 }
 return true;
}
