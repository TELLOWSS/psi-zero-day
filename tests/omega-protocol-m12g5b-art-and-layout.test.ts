import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {
 OMEGA_G5B_ART_APPROVAL,OMEGA_G5B_EXPECTED_E_WALK,
 OMEGA_G5B_SIGNED_PAINTERLY_CANDIDATE,omegaG5bLabRequested,
 omegaG5bReviewability,omegaG5bNeverBypassProduction,
 type OmegaG5bPainterlyCandidate,
} from '../src/ui/omega-protocol-m12g5b-art-gate';
const sourceHash='a'.repeat(64);
const sample=():OmegaG5bPainterlyCandidate=>({
 identity:'SILVER_AIRA_V2_E_WALK',
 intent:'ARTIST_PAINTED_INDEPENDENT_FRAMES',
 status:'REVIEW_ONLY',productionApproved:false,
 artistSignoff:'QA test fixture only',visualReview:'PASS',
 widths:[384,384,384,384],heights:[512,512,512,512],
 paths:[...OMEGA_G5B_EXPECTED_E_WALK],
 sourceSha256:['1','2','3','4'].map(x=>x.repeat(64)),
 independentlyPainted:true,sourceAnchorSha256:sourceHash,
});
describe('M12-G5b painterly native source review and portrait viewport safety',()=>{
 it('never enables 4 missing original E painted frames or 160/320 approved art',()=>{
  expect(OMEGA_G5B_ART_APPROVAL.status).toBe('BLOCKED_NO_PAINTERLY_SOURCES');
  expect(OMEGA_G5B_ART_APPROVAL.finalApprovedSourceFrameCount).toBe(0);
  expect(OMEGA_G5B_ART_APPROVAL.finalApprovedMaskCount).toBe(0);
  expect(OMEGA_G5B_ART_APPROVAL.currentlyInProduction).toBe(false);
  expect(OMEGA_G5B_SIGNED_PAINTERLY_CANDIDATE).toBe(null);
  expect(omegaG5bReviewability(OMEGA_G5B_SIGNED_PAINTERLY_CANDIDATE,sourceHash)).toBe('MISSING');
  for(const direction of ['E','W','NE','S'] as const)
   expect(omegaG5bNeverBypassProduction(direction)).toBe(false);
 });
 it('requires explicit isolated DEV lab and rejects collisions with old G4/G5 modes',()=>{
  const good='?omegaLab=1&omegaM12G5b=1';
  expect(omegaG5bLabRequested(good,true)).toBe(true);
  for(const bad of [
   '?omegaM12G5b=1','?omegaLab=1&omegaM12G5b=0',
   good+'&omegaSilverPreview=repo',good+'&omegaG5VectorStudy=1',
   good+'&omegaM12G4=1',good+'&omegaM12G5=1',
  ])expect(omegaG5bLabRequested(bad,true)).toBe(false);
  expect(omegaG5bLabRequested(good,false)).toBe(false);
 });
 it('only marks signed four independent full-resolution local E painted WebPs reviewable, never production-approved',()=>{
  expect(omegaG5bReviewability(sample(),sourceHash)).toBe('REVIEWABLE_NOT_APPROVED');
  expect(omegaG5bReviewability(sample(),'not-a-hash')).toBe('MISSING');
  expect(omegaG5bReviewability({...sample(),artistSignoff:' '},sourceHash)).toBe('MISSING');
  expect(omegaG5bReviewability({...sample(),visualReview:'PENDING'} as OmegaG5bPainterlyCandidate,sourceHash)).toBe('MISSING');
  expect(omegaG5bReviewability({...sample(),sourceAnchorSha256:'b'.repeat(64)},sourceHash)).toBe('MISSING');
  expect(omegaG5bReviewability({...sample(),productionApproved:true} as unknown as OmegaG5bPainterlyCandidate,sourceHash)).toBe('MISSING');
 });
 it('rejects reused still source, SVG vector study and duplicate frames / invalid dimensions',()=>{
  const base=sample();
  expect(omegaG5bReviewability({...base,paths:[base.paths[0],base.paths[0],...base.paths.slice(2)]},sourceHash)).toBe('MISSING');
  expect(omegaG5bReviewability({...base,paths:[...base.paths.slice(0,3),'/assets/omega/g5/silver-east-walk-3.svg']},sourceHash)).toBe('MISSING');
  expect(omegaG5bReviewability({...base,sourceSha256:[base.sourceSha256[0],base.sourceSha256[0],...base.sourceSha256.slice(2)]},sourceHash)).toBe('MISSING');
  expect(omegaG5bReviewability({...base,sourceSha256:[sourceHash,...base.sourceSha256.slice(1)]},sourceHash)).toBe('MISSING');
  expect(omegaG5bReviewability({...base,widths:[384,192,384,384]},sourceHash)).toBe('MISSING');
 });
 it('the CSS uses a REAL 4-row review shell without changing non-review 3-row layout',()=>{
  const css=readFileSync('src/ui/omega-protocol-playtest.css','utf8');
  const game=readFileSync('src/ui/OmegaProtocolPlaytest.tsx','utf8');
  expect(css).toMatch(/\.omega-protocol-lab\[data-omega-review-layout="true"\]\s*\{\s*grid-template-rows:\s*auto auto minmax\(0,1fr\) auto;/);
  expect(css).toMatch(/max-width:480px\) and \(orientation:portrait/);
  expect(game).toContain("data-omega-review-layout={silverPreviewRequested?'true':'false'}");
  expect(game).toContain("data-omega-m12g5b-art={g5bPainterlyReview?OMEGA_G5B_ART_APPROVAL.status:'off'}");
 });
});
