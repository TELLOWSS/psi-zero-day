import {OMEGA_ART_CONTRACT,OMEGA_DIRECTIONS,omegaMotionFrame} from './omega-operator-motion';

/**
 * Offline 8x6 *prototype* atlas address map.
 * No path is supplied here: art is distributed in a separate ZIP, and is NOT
 * present on production or approved for any playable CharacterId.
 * Source rects may be used only by the isolated design-review viewer.
 */
export const OMEGA_WALK_STUDY = Object.freeze({
 frameWidth:384,
 frameHeight:512,
 columns:8,
 rows:6,
 width:3072,
 height:3072,
 directionOrder:OMEGA_DIRECTIONS,
 artistApproved:false,
 prototypeOnly:true,
 uniqueRearRight:false,
 authenticFootIk:false,
 actualGameplayIntegration:false,
});
/** Same non-playable study at quarter RGBA memory for mobile preview; not FPS-tested. */
export const OMEGA_WALK_STUDY_MOBILE = Object.freeze({
 frameWidth:192,frameHeight:256,columns:8,rows:6,width:1536,height:1536,
 prototypeOnly:true,artistApproved:false,
});

export interface OmegaStudyAtlasFrame {
 readonly x:number; readonly y:number; readonly width:number;readonly height:number;
 readonly direction:typeof OMEGA_DIRECTIONS[number];
 readonly directionIndex:number;
 readonly frame:number;
 readonly loopDurationSeconds:number;
 readonly playable:false;
}
export function omegaWalkStudyAtlasFrame(
 elapsedSeconds:number,facingAngleRadians:number,reducedMotion=false,
 profile:'desktop'|'mobile'='desktop',
):OmegaStudyAtlasFrame {
 const pose=omegaMotionFrame('walk',elapsedSeconds,facingAngleRadians,reducedMotion);
 const grid=profile==='mobile'?OMEGA_WALK_STUDY_MOBILE:OMEGA_WALK_STUDY;
 if(OMEGA_ART_CONTRACT.contactFramesPerDirection!==grid.rows){
  throw new Error('OMEGA frame contract does not match the reference atlas grid');
 }
 return Object.freeze({
  x:pose.directionIndex*grid.frameWidth,
  y:pose.frame*grid.frameHeight,
  width:grid.frameWidth,
  height:grid.frameHeight,
  direction:pose.direction,
  directionIndex:pose.directionIndex,
  frame:pose.frame,
  loopDurationSeconds:grid.rows/12,
  playable:false,
 });
}
