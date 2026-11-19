import {describe,it,expect} from 'vitest';
import candidate from '../content/art/omega-aira-production-candidate.json';
import {OMEGA_PROTOCOL_APPROVED_ART,OMEGA_PROTOCOL_BINARY_AUDIT_PASSED} from '../src/ui/omega-protocol-art-slot';
describe('AIRA candidate art is explicitly excluded from approved runtime',()=>{
 it('maintains original-versus-mirrored provenance and 8x20 frame contract',()=>{
  expect(candidate.sourceViews).toHaveLength(5);
  expect(candidate.mirroredAndMustRedraw).toEqual(['SW','W','NW']);
  expect(candidate.candidateMotionFrames).toBe(160);
  expect(Object.values(candidate.motionFrameLayout).reduce((a,b)=>a+b,0)).toBe(20);
  expect(candidate.imageSpec.walkFootPivotY).toBe(454);
  expect(candidate.audit.distinctSha256).toBe(160);
 });
 it('cannot claim release-ready sprite or approved gear masks',()=>{
  expect(candidate.releaseEligible).toBe(false);
  expect(candidate.artistApproval).toBe(false);
  expect(candidate.actualAuthoredAnimationFramesApproved).toBe(0);
  expect(candidate.equipmentFrontRearMasksApproved).toBe(0);
  expect(candidate.reviewedArchive.binaryInGitHub).toBe(false);
  expect(OMEGA_PROTOCOL_APPROVED_ART).toBeNull();
  expect(OMEGA_PROTOCOL_BINARY_AUDIT_PASSED).toBe(false);
 });
});
