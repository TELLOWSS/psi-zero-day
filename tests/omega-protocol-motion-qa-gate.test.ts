import {describe,it,expect} from 'vitest';
import {
 OMEGA_8DIR_STUDY_AUDIT,omegaMotionReviewGate,
} from '../src/ui/omega-protocol-motion-qa-gate';

describe('OMEGA 8-view source sprite quality is not faked by unique PNG hashes',()=>{
 it('blocks known study with actual 16/40 nearly motionless transitions and 6px foot mismatch',()=>{
  const actual=omegaMotionReviewGate(OMEGA_8DIR_STUDY_AUDIT);
  expect(OMEGA_8DIR_STUDY_AUDIT).toMatchObject({
   sourceDirections:8,walkFramesPerDirection:6,comparedPairs:40,
   almostStaticPairs:16,sourceFootPixel:460,approvedFootPixel:454,
  });
  expect(actual.releaseEligible).toBe(false);
  expect(actual.problems).toContain('ALMOST_STATIC_GAIT_TRANSITIONS');
  expect(actual.problems).toContain('FOOT_PIVOT_CONTRACT_MISMATCH');
  expect(actual.problems).toContain('AUTHORED_160_FRAMES_MISSING');
  expect(actual.problems).toContain('AUTHORED_320_MASKS_MISSING');
  expect(actual.problems).toContain('REAL_DEVICE_SIGNOFF_MISSING');
 });
 it('does not accept count padding, missing device proof or invalid metrics',()=>{
  expect(omegaMotionReviewGate({...OMEGA_8DIR_STUDY_AUDIT,almostStaticPairs:-1})
   .problems).toContain('INVALID_AUDIT_NUMBERS');
  expect(omegaMotionReviewGate({...OMEGA_8DIR_STUDY_AUDIT,comparedPairs:0})
   .problems).toContain('GAIT_ADJACENCY_AUDIT_MISSING');
  expect(omegaMotionReviewGate({...OMEGA_8DIR_STUDY_AUDIT,sourceDirections:7})
   .problems).toContain('EIGHT_DIRECTIONS_REQUIRED');
  expect(omegaMotionReviewGate({...OMEGA_8DIR_STUDY_AUDIT,sourceFootPixel:454})
   .problems).not.toContain('FOOT_PIVOT_CONTRACT_MISMATCH');
 });
 it('requires every independently checked technical and release gate',()=>{
  const complete=omegaMotionReviewGate({
   sourceDirections:8,walkFramesPerDirection:6,comparedPairs:40,
   almostStaticPairs:0,sourceFootPixel:454,approvedFootPixel:454,
   independentHeroIdentityApproved:true,handAuthoredActionFrames:160,
   approvedFrontBackMasks:320,approvedAssetDigestProof:true,realDevicePass:true,
  });
  expect(complete).toMatchObject({releaseEligible:true,problems:[]});
  const blocked=omegaMotionReviewGate({...OMEGA_8DIR_STUDY_AUDIT,
   almostStaticPairs:0,sourceFootPixel:454,independentHeroIdentityApproved:true,
   handAuthoredActionFrames:160,approvedFrontBackMasks:320,approvedAssetDigestProof:true,
  });
  expect(blocked.releaseEligible).toBe(false);
  expect(blocked.problems).toEqual(['REAL_DEVICE_SIGNOFF_MISSING']);
 });
});
