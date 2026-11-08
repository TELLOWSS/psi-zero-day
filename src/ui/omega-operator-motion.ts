/**
 * OMEGA MASTER playable visual-motion contract.
 * This is a deterministic frame sampler for future authored character atlases.
 * It does NOT render missing artwork or grant character access.
 */
export const OMEGA_DIRECTIONS = ['E','SE','S','SW','W','NW','N','NE'] as const;
export type OmegaMotionName =
 'idle'|'walk'|'run'|'fire'|'combo'|'dash'|'hit'|'knockdown'|'recover'|'ultimate'|'victory'|'defeat';
export interface OmegaMotionSpec {
 readonly frames:number;
 readonly fps:number;
 readonly loop:boolean;
 readonly bodyMotion:'low'|'mid'|'high';
 readonly hairFollowThrough:boolean;
 readonly equipmentAnchors:true;
}
export const OMEGA_MOTIONS:Readonly<Record<OmegaMotionName,OmegaMotionSpec>>=Object.freeze({
 idle:{frames:6,fps:8,loop:true,bodyMotion:'low',hairFollowThrough:true,equipmentAnchors:true},
 walk:{frames:6,fps:12,loop:true,bodyMotion:'mid',hairFollowThrough:true,equipmentAnchors:true},
 run:{frames:8,fps:16,loop:true,bodyMotion:'high',hairFollowThrough:true,equipmentAnchors:true},
 fire:{frames:6,fps:18,loop:false,bodyMotion:'mid',hairFollowThrough:true,equipmentAnchors:true},
 combo:{frames:8,fps:18,loop:false,bodyMotion:'high',hairFollowThrough:true,equipmentAnchors:true},
 dash:{frames:8,fps:20,loop:false,bodyMotion:'high',hairFollowThrough:true,equipmentAnchors:true},
 hit:{frames:4,fps:16,loop:false,bodyMotion:'mid',hairFollowThrough:true,equipmentAnchors:true},
 knockdown:{frames:6,fps:12,loop:false,bodyMotion:'high',hairFollowThrough:true,equipmentAnchors:true},
 recover:{frames:7,fps:14,loop:false,bodyMotion:'mid',hairFollowThrough:true,equipmentAnchors:true},
 ultimate:{frames:14,fps:18,loop:false,bodyMotion:'high',hairFollowThrough:true,equipmentAnchors:true},
 victory:{frames:10,fps:10,loop:false,bodyMotion:'mid',hairFollowThrough:true,equipmentAnchors:true},
 defeat:{frames:8,fps:10,loop:false,bodyMotion:'mid',hairFollowThrough:true,equipmentAnchors:true},
});
export interface OmegaFrameSample {
 readonly motion:OmegaMotionName;
 readonly direction:typeof OMEGA_DIRECTIONS[number];
 readonly directionIndex:number;
 readonly frame:number;
 readonly frameCount:number;
 readonly finished:boolean;
 readonly reducedMotion:boolean;
}
/** 8 compass directions, mathematically continuous at -π/π and 0/2π. */
export function omegaFacingIndex(angleRadians:number):number {
 if(!Number.isFinite(angleRadians))return 2;
 const octant=Math.PI/4;
 return ((Math.round(angleRadians/octant)%8)+8)%8;
}
/** Stable and clamp-safe sampling. One-shot motion never wraps prematurely. */
export function omegaMotionFrame(
 motion:OmegaMotionName,
 elapsedSeconds:number,
 facingRadians:number,
 reducedMotion=false,
):OmegaFrameSample {
 const spec=OMEGA_MOTIONS[motion];
 const time=Number.isFinite(elapsedSeconds)?Math.max(0,elapsedSeconds):0;
 const framesElapsed=Math.floor(time*spec.fps);
 const finished=!spec.loop&&framesElapsed>=spec.frames;
 const frame=reducedMotion?0:spec.loop?framesElapsed%spec.frames:Math.min(spec.frames-1,framesElapsed);
 const directionIndex=omegaFacingIndex(facingRadians);
 return {
  motion,direction:OMEGA_DIRECTIONS[directionIndex]!,directionIndex,
  frame,frameCount:spec.frames,finished,reducedMotion,
 };
}
/**
 * Build-stage checks for signed-off artwork: all atlas files must carry
 * consistent identity, equipment/helmet silhouette, pivot/foot anchors.
 * These checks must never be treated as having produced animation images.
 */
export const OMEGA_ART_CONTRACT = Object.freeze({
 baseDirections:8,
 contactFramesPerDirection:6,
 portraitMinSize:[640,960] as const,
 gameplayTransparent:true,
 requiredSockets:['head','chest','back','leftWrist','rightWrist','hip','leftFoot','rightFoot'] as const,
 targetDevices:['390x844','844x390','1024x768','1440x900'] as const,
});
