import {afterEach,describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {
 OMEGA_G5C_ORIGINAL_E_SHA256,OMEGA_G5C_ART_POLICY,OMEGA_G5C_FILE_NAMES,
 omegaG5cLabRequested,omegaG5cSelectionCheck,omegaG5cHashSelectionCheck,
 omegaG5cPixelsChanged,omegaG5cPixelProof,OmegaG5cLocalPainterlyReview,
} from '../src/ui/omega-protocol-m12g5c-local-art-review';
import type {OmegaActorView} from '../src/ui/omega-protocol-actor-render';

afterEach(()=>vi.unstubAllGlobals());
function sample(n:number){
 return {name:OMEGA_G5C_FILE_NAMES[n]!,size:20000,type:'image/webp'} as File;
}
const pose=(phase:number,active=true):OmegaActorView=>({
 facingX:1,facingY:0,time:5,moving:active,
 shooting:false,dashing:false,hurt:false,finished:false,ultimate:false,
 gait:{active,phase,distanceTravelled:30*phase,
  left:{x:-10,y:0,planted:true},right:{x:12,y:0,planted:false}},
});
describe('M12-G5c strict zero-API original-source in-game review (not production approval)',()=>{
 it('restricts dev lab, preserves original E GitHub hash and artist approval counts',()=>{
  const roster=JSON.parse(readFileSync('content/art/omega-canonical-silver-roster.json','utf8'));
  expect(OMEGA_G5C_ORIGINAL_E_SHA256).toBe(roster.female[0].sha256);
  expect(OMEGA_G5C_ART_POLICY).toMatchObject({
   status:'AWAITING_FOUR_INDEPENDENT_PAINTED_WEBPS',previewOnly:true,
   finalSourceFramesApproved:0,finalMasksApproved:0,
   productionApproved:false,mayReplaceDefaultArt:false,
  });
  expect(omegaG5cLabRequested('?omegaLab=1&omegaM12G5c=1',true)).toBe(true);
  expect(omegaG5cLabRequested('?omegaLab=1&omegaM12G5c=1',false)).toBe(false);
  for(const u of [
   '?omegaM12G5c=1','?omegaLab=1&omegaM12G5c=true',
   '?omegaLab=1&omegaM12G5c=1&omegaSilverPreview=repo',
   '?omegaLab=1&omegaM12G5c=1&omegaM12G4=1',
   '?omegaLab=1&omegaM12G5c=1&omegaM12G5=1',
   '?omegaLab=1&omegaM12G5c=1&omegaM12G5b=1',
   '?omegaLab=1&omegaM12G5c=1&omegaG5VectorStudy=1',
  ])expect(omegaG5cLabRequested(u,true)).toBe(false);
 });
 it('requires four exact numbered WebPs, no duplicate filename, nonempty and bounded payload',()=>{
  const originals=[0,1,2,3].map(sample);
  expect(omegaG5cSelectionCheck(originals)).toBe(true);
  expect(omegaG5cSelectionCheck([originals[0]!,originals[0]!,originals[2]!,originals[3]!])).toBe(false);
  expect(omegaG5cSelectionCheck(originals.slice(1))).toBe(false);
  expect(omegaG5cSelectionCheck([...originals,{name:'e.svg',size:20000,type:'image/svg+xml'}])).toBe(false);
  expect(omegaG5cSelectionCheck([...originals.slice(0,3),{...sample(3),size:5}])).toBe(false);
  expect(omegaG5cSelectionCheck([...originals.slice(0,3),{...sample(3),size:8e6}])).toBe(false);
  expect(omegaG5cSelectionCheck([...originals.slice(0,3),{...sample(3),type:'image/png'}])).toBe(false);
 });
 it('prevents reused SHA even with different filenames or metadata',()=>{
  const hashes=['1','2','3','4'].map(v=>v.repeat(64));
  expect(omegaG5cHashSelectionCheck(hashes,OMEGA_G5C_ORIGINAL_E_SHA256)).toBe(true);
  expect(omegaG5cHashSelectionCheck([hashes[0]!,hashes[0]!,hashes[2]!,hashes[3]!],OMEGA_G5C_ORIGINAL_E_SHA256)).toBe(false);
  expect(omegaG5cHashSelectionCheck([OMEGA_G5C_ORIGINAL_E_SHA256,...hashes.slice(1)],OMEGA_G5C_ORIGINAL_E_SHA256)).toBe(false);
  expect(omegaG5cHashSelectionCheck(hashes,'bad')).toBe(false);
 });
 it('rejects flat backgrounds and fake boots, measures true 384x512 alpha silhouette',()=>{
  const px=new Uint8ClampedArray(384*512*4);
  expect(()=>omegaG5cPixelProof(px)).toThrow('alpha/boot');
  for(let y=19;y<510;y++)for(let x=123;x<233;x++)
   px[(y*384+x)*4+3]=230;
  const proof=omegaG5cPixelProof(px);
  expect(proof.alphaFraction).toBeGreaterThan(.20);
  expect(proof.silhouetteHeight).toBe(491);
  expect(proof.toeRow).toBe(509);
  const clone=new Uint8ClampedArray(px);
  expect(omegaG5cPixelsChanged(px,clone)).toBe(0);
  clone[(19*384+140)*4]=230;
  expect(omegaG5cPixelsChanged(px,clone)).toBeGreaterThan(0);
  expect(omegaG5cPixelsChanged(px,new Uint8ClampedArray(1))).toBe(0);
 });
 it('import/preview are all-or-nothing, transparent, transient and E native-gait-only',async()=>{
  const revoked:string[]=[];let i=0;
  vi.stubGlobal('URL',{
   createObjectURL:()=>`blob:art-${++i}`,
   revokeObjectURL:(u:string)=>revoked.push(u),
  });
  class Decoded{
   decoding='';naturalWidth=384;naturalHeight=512;src='';
   async decode(){return undefined;}
  }
  vi.stubGlobal('Image',Decoded);
  vi.stubGlobal('crypto',{subtle:{
   digest:async(_algorithm:string,bytes:ArrayBuffer)=>{
    const n=new Uint8Array(bytes)[0]!;
    return new Uint8Array(32).fill(n).buffer;
   },
  }});
  let currentImage='';
  vi.stubGlobal('document',{
   createElement:()=>({width:384,height:512,
    getContext:()=>({
     drawImage:(image:Decoded)=>{currentImage=image.src;},
     getImageData:()=>{
      const shift=(Number(currentImage.match(/(\d+)$/)?.[1]??'1')-1)*22;
      const pixels=new Uint8ClampedArray(384*512*4);
      for(let y=30;y<503;y++)for(let x=100+shift;x<205+shift;x++){
       const ix=(y*384+x)*4;
       pixels[ix]=170;pixels[ix+1]=130;pixels[ix+2]=205;pixels[ix+3]=238;
      }
      return {data:pixels};
     },
    }),
   }),
  });
  const review=new OmegaG5cLocalPainterlyReview();
  expect(review.ready).toBe(false);
  expect(review.activate(true)).toBe(false);
  const testFiles=[1,2,3,4].map((byte,n)=>({
   ...sample(n),arrayBuffer:async()=>new Uint8Array([byte,byte,byte]).buffer,
  })) as unknown as File[];
  const proof=await review.import(testFiles);
  expect(proof.status).toBe('SESSION_PREVIEW_ONLY_NOT_ART_APPROVED');
  expect(proof.artworkSignoff).toBe(false);
  expect(proof.assets).toHaveLength(4);
  expect(proof.changedPixelFraction.every(x=>x>.018)).toBe(true);
  expect(review.ready).toBe(true);
  const drawCalls:unknown[][]=[];
  const ctx={drawImage:(...args:unknown[])=>drawCalls.push(args)} as unknown as CanvasRenderingContext2D;
  expect(review.draw(ctx,pose(.12),120)).toBe(false);
  expect(review.activate(true)).toBe(true);
  for(const ph of [.12,.32,.58,.88])expect(review.draw(ctx,pose(ph),120)).toBe(true);
  expect(review.evidence()).toMatchObject({draws:4,frames:[0,1,2,3]});
  expect(review.draw(ctx,pose(.32,false),120)).toBe(false);
  expect(review.draw(ctx,{...pose(.33),facingX:-1},120)).toBe(false);
  expect(review.draw(ctx,{...pose(.33),dashing:true},120)).toBe(false);
  expect(review.draw(ctx,{...pose(.33),shooting:true},120)).toBe(false);
  expect(drawCalls).toHaveLength(4);
  review.dispose();
  expect(review.active).toBe(false);
  expect(review.sessionProof).toBe(null);
  expect(revoked).toHaveLength(4);
 });
});
