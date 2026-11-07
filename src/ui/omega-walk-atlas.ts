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
):OmegaStudyAtlasFrame {
 const pose=omegaMotionFrame('walk',elapsedSeconds,facingAngleRadians,reducedMotion);
 if(OMEGA_ART_CONTRACT.contactFramesPerDirection!==OMEGA_WALK_STUDY.rows){
  throw new Error('OMEGA frame contract does not match the reference atlas grid');
 }
 return Object.freeze({
  x:pose.directionIndex*OMEGA_WALK_STUDY.frameWidth,
  y:pose.frame*OMEGA_WALK_STUDY.frameHeight,
  width:OMEGA_WALK_STUDY.frameWidth,
  height:OMEGA_WALK_STUDY.frameHeight,
  direction:pose.direction,
  directionIndex:pose.directionIndex,
  frame:pose.frame,
  loopDurationSeconds:OMEGA_WALK_STUDY.rows/12,
  playable:false,
 });
}
