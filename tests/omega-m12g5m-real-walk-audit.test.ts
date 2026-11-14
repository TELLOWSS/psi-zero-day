import {describe,it,expect} from 'vitest';
import {OMEGA_G5D_ACTUAL_E_WALK} from '../src/ui/omega-protocol-m12g5d-actual-source';
import {OMEGA_G5C_ORIGINAL_E_SHA256,type OmegaG5cReviewProof} from '../src/ui/omega-protocol-m12g5c-local-art-review';
import {omegaVerifiedG5dWalkCards,omegaVisualAuditGroupFrames,omegaVisualAuditLayout,omegaVisualAuditNextFrame} from '../src/ui/omega-candidate-art-audit';

const verified=():OmegaG5cReviewProof=>({
 status:'SESSION_PREVIEW_ONLY_NOT_ART_APPROVED',
 assets:OMEGA_G5D_ACTUAL_E_WALK.map((ref,i)=>({
  file:ref.file,sha256:ref.sha256,width:384 as const,height:512 as const,
  alphaFraction:.3,silhouetteHeight:460,toeRow:485+i,
 })),
 changedPixelFraction:[.2,.2,.2,.2],
 originalEastSha256:OMEGA_G5C_ORIGINAL_E_SHA256,
 independentPaintedArtVerified:false,artworkSignoff:false,
});
describe('M12-G5m real silver E walk visual QA without invented candidate art',()=>{
 it('stays fail closed until all four repo originals are independently SHA verified',()=>{
  expect(omegaVerifiedG5dWalkCards(null)).toEqual([]);
  const proof=verified();
  expect(omegaVerifiedG5dWalkCards({...proof,assets:proof.assets.slice(0,3)})).toEqual([]);
  expect(omegaVerifiedG5dWalkCards({...proof,assets:proof.assets.map((a,i)=>i===2?{...a,sha256:'0'.repeat(64)}:a)})).toEqual([]);
  expect(omegaVerifiedG5dWalkCards({...proof,assets:proof.assets.map((a,i)=>i===1?{...a,toeRow:512}:a)})).toEqual([]);
 });
 it('requires genuine four distinct SHA hashes and source file paths, never new art approval',()=>{
  const cards=omegaVerifiedG5dWalkCards(verified());
  expect(cards).toHaveLength(4);
  expect(new Set(cards.map(x=>x.imageUrl)).size).toBe(4);
  expect(cards.map(x=>x.file)).toEqual(OMEGA_G5D_ACTUAL_E_WALK.map(x=>x.file));
  expect(cards.every(x=>x.kind==='source'&&x.width===384&&x.height===512)).toBe(true);
 });
 it('shows verified E walk in 0-3 order and keeps each foot aligned to the same virtual ground',()=>{
  const frames=omegaVisualAuditGroupFrames(omegaVerifiedG5dWalkCards(verified()),'walk','walk');
  expect(frames.map(x=>x.file)).toEqual([0,1,2,3].map(i=>'aira-east-walk-'+i+'.webp'));
  for(const frame of frames){
   const box=omegaVisualAuditLayout(frame);
   expect(box.top+frame.foot.y*box.scale).toBeCloseTo(314);
   expect(box.left+frame.foot.x*box.scale).toBeCloseTo(180);
  }
  expect(omegaVisualAuditGroupFrames(frames,'walk','fire')).toEqual([]);
 });
 it('allows four manual steps without timer, frame synthesis, or camera/world changes',()=>{
  let frame=0;
  const results=[frame];
  for(let i=0;i<4;i++){frame=omegaVisualAuditNextFrame(frame,1);results.push(frame);}
  expect(results).toEqual([0,1,2,3,0]);
 });
});
