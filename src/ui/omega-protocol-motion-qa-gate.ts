/**
 * Build-time / review-time art gating, never a combat-engine unlock.
 * Binary/pixel evidence must come from real source frames, not filenames,
 * descriptive art boards, a localStorage toggle or visual promises.
 */
export interface OmegaMotionAudit {
 readonly sourceDirections:number;
 readonly walkFramesPerDirection:number;
 readonly comparedPairs:number;
 readonly almostStaticPairs:number;
 readonly sourceFootPixel:number; // opaque boot sole; alpha > 128
 readonly shadowBottomPixel:number; // translucent world shadow; alpha > 16
 readonly approvedFootPixel:number;
 readonly independentHeroIdentityApproved:boolean;
 readonly handAuthoredActionFrames:number;
 readonly approvedFrontBackMasks:number;
 readonly approvedAssetDigestProof:boolean;
 readonly realDevicePass:boolean;
}
export interface OmegaMotionGate {
 readonly releaseEligible:boolean;
 readonly problems:readonly string[];
}
export function omegaMotionReviewGate(audit:OmegaMotionAudit):OmegaMotionGate{
 const problems:string[]=[];
 const counts=[audit.sourceDirections,audit.walkFramesPerDirection,
  audit.comparedPairs,audit.almostStaticPairs,audit.sourceFootPixel,audit.shadowBottomPixel,
  audit.approvedFootPixel,audit.handAuthoredActionFrames,
  audit.approvedFrontBackMasks];
 if(counts.some(n=>!Number.isSafeInteger(n)||n<0)){
  problems.push('INVALID_AUDIT_NUMBERS');
  return {releaseEligible:false,problems};
 }
 if(audit.sourceDirections!==8)problems.push('EIGHT_DIRECTIONS_REQUIRED');
 if(audit.walkFramesPerDirection<6)problems.push('SIX_WALK_PHASES_REQUIRED');
 if(audit.comparedPairs<40)problems.push('GAIT_ADJACENCY_AUDIT_MISSING');
 // Zero near-static transitions is a quality floor, not proof of acting.
 if(audit.almostStaticPairs>0)problems.push('ALMOST_STATIC_GAIT_TRANSITIONS');
 if(audit.sourceFootPixel!==audit.approvedFootPixel)
  problems.push('FOOT_PIVOT_CONTRACT_MISMATCH');
 if(!audit.independentHeroIdentityApproved)problems.push('MAIN_HERO_IDENTITY_UNAPPROVED');
 if(audit.handAuthoredActionFrames<160)problems.push('AUTHORED_160_FRAMES_MISSING');
 if(audit.approvedFrontBackMasks<320)problems.push('AUTHORED_320_MASKS_MISSING');
 if(!audit.approvedAssetDigestProof)problems.push('BINARY_SHA256_PROOF_MISSING');
 if(!audit.realDevicePass)problems.push('REAL_DEVICE_SIGNOFF_MISSING');
 return Object.freeze({releaseEligible:problems.length===0,problems:Object.freeze(problems)});
}
/** The exact locally measured 2026-11-08 8×6 vector QA source, NOT the
 * signed-off 160-frame game-character atlas. */
export const OMEGA_8DIR_STUDY_AUDIT:OmegaMotionAudit=Object.freeze({
 sourceDirections:8,walkFramesPerDirection:6,comparedPairs:40,
 almostStaticPairs:16,sourceFootPixel:441,shadowBottomPixel:460,approvedFootPixel:454,
 independentHeroIdentityApproved:false,handAuthoredActionFrames:0,
 approvedFrontBackMasks:0,approvedAssetDigestProof:false,realDevicePass:false,
});
