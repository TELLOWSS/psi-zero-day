import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import {
 OMEGA_G5D_ACTUAL_E_WALK,OMEGA_G5D_ART_GATE,
 omegaG5dLabRequested,omegaG5dImportRepoCandidates,
} from '../src/ui/omega-protocol-m12g5d-actual-source';
import type {OmegaG5cLocalPainterlyReview,OmegaG5cReviewProof} from '../src/ui/omega-protocol-m12g5c-local-art-review';

const physical=()=>OMEGA_G5D_ACTUAL_E_WALK.map((s,i)=>{
 const bytes=readFileSync('public'+s.path);
 return {i,bytes,sha:createHash('sha256').update(bytes).digest('hex'),
  gitSha:createHash('sha1').update(Buffer.concat([
   Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex')};
});
describe('M12-G5d-2 FOUR real binary E-WALK WebP assets and native approval lock',()=>{
 it('stores all four actual artist-candidate WebP binaries in repo with EXACT original ZIP SHA256 and git blob SHA1',()=>{
  const items=physical();
  expect(items).toHaveLength(4);
  for(const item of items){
   const spec=OMEGA_G5D_ACTUAL_E_WALK[item.i]!;
   expect(item.bytes.length).toBe(spec.bytes);
   expect(item.sha).toBe(spec.sha256);
   expect(item.gitSha).toBe(spec.gitBlobSha);
   expect(item.bytes.toString('ascii',0,4)).toBe('RIFF');
   expect(item.bytes.toString('ascii',8,12)).toBe('WEBP');
  }
  expect(new Set(items.map(x=>x.sha)).size).toBe(4);
 });
 it('never calls these four generated candidates approved 160 or approved 320 masks',()=>{
  expect(OMEGA_G5D_ART_GATE).toMatchObject({
   sourceFourOriginalBinaryWebPsCommitted:true,
   origin:'AI_SHEET_FOUR_DISTINCT_CROPS',
   usableInDevPreviewOnly:true,
   humanArtDirectionApproved:false,
   final160ApprovedFrameCount:0,final320ApprovedMaskCount:0,
   automaticLiveGameSwap:false,productionReleaseAllowed:false,
  });
 });
 it('is inaccessible outside explicit isolated dev lab mode',()=>{
  expect(omegaG5dLabRequested('?omegaLab=1&omegaM12G5d=1',true)).toBe(true);
  expect(omegaG5dLabRequested('?omegaLab=1&omegaM12G5d=1',false)).toBe(false);
  for(const query of [
   '?omegaM12G5d=1','?omegaLab=1&omegaM12G5d=true',
   '?omegaLab=1&omegaM12G5d=1&omegaSilverPreview=1',
   '?omegaLab=1&omegaM12G5d=1&omegaM12G5=1',
   '?omegaLab=1&omegaM12G5d=1&omegaM12G5c=1',
  ])expect(omegaG5dLabRequested(query,true)).toBe(false);
 });
 it('fetches real four exact bytes and checks each SHA before accepting SESSION preview only',async()=>{
  let calls=0,disposes=0;let passed:File[]=[];
  const proof={status:'SESSION_PREVIEW_ONLY_NOT_ART_APPROVED',
   assets:OMEGA_G5D_ACTUAL_E_WALK.map(a=>({file:a.file,sha256:a.sha256})),
   changedPixelFraction:[.42,.42,.35,.41],artworkSignoff:false,
   independentPaintedArtVerified:false} as unknown as OmegaG5cReviewProof;
  const review={
   dispose:()=>{disposes++;},
   import:async(files:File[])=>{passed=files;return proof;},
  } as unknown as OmegaG5cLocalPainterlyReview;
  const fakeFetch=async (input:string|URL|Request)=>{
   const path=String(input);const entry=OMEGA_G5D_ACTUAL_E_WALK.find(x=>x.path===path);
   if(!entry)throw new Error('unexpected path');
   calls++;
   return new Response(readFileSync('public'+entry.path),{status:200,
    headers:{'Content-Type':'image/webp'}});
  };
  const result=await omegaG5dImportRepoCandidates(review,fakeFetch as typeof fetch);
  expect(result).toBe(proof);
  expect(calls).toBe(4);
  expect(disposes).toBe(1);
  expect(passed.map(f=>f.name)).toEqual(OMEGA_G5D_ACTUAL_E_WALK.map(x=>x.file));
  expect(passed.map(f=>f.size)).toEqual(OMEGA_G5D_ACTUAL_E_WALK.map(x=>x.bytes));
 });
 it('rejects even one wrong byte or missing URL and fails closed with review disposed',async()=>{
  let disposed=0,accepted=0;
  const review={dispose:()=>{disposed++;},import:async()=>{accepted++;throw Error('should not execute');}}
   as unknown as OmegaG5cLocalPainterlyReview;
  const wrong=async (input:string|URL|Request)=>{
   const path=String(input),entry=OMEGA_G5D_ACTUAL_E_WALK.find(x=>x.path===path)!;
   const b=Buffer.from(readFileSync('public'+entry.path));
   if(path.includes('walk-2'))b[b.length-3]^=1;
   return new Response(b,{status:200});
  };
  await expect(omegaG5dImportRepoCandidates(review,wrong as typeof fetch))
   .rejects.toThrow(/SHA-256 changed/);
  expect(accepted).toBe(0);
  expect(disposed).toBeGreaterThanOrEqual(2);
  const notFound=async ()=>new Response('missing',{status:404});
  await expect(omegaG5dImportRepoCandidates(review,notFound as typeof fetch))
   .rejects.toThrow(/missing/);
  expect(accepted).toBe(0);
 });
});
