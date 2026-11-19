#!/usr/bin/env node
// Verify real illustrated art BYTES, not just SVG filename or copied comments.
// SVG is a self-contained local UTF-8 transport for the original alpha WebP.
// This does not sign off the full 8x20 action-sprite production pack.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const path='public/assets/omega/aira-v2/e-fire-3key-atlas.svg';
const expectedSvg='28de189058511fd350f2bee99a24e2d5bef07525e0a996a8f8530ff09b961d36';
const expectedWebp='43c1a388f8c9c2e9177d416eeb9383309fbbc2baec2a6c9600918c84c02a65cc';
const sha=b=>createHash('sha256').update(b).digest('hex');
const fail=(code,extra)=>{console.error('AIRA_E_FIRE_ASSET_FAIL',code,extra??'');process.exitCode=1};
try{
 const svgBytes=await readFile(path),svg=svgBytes.toString('utf8');
 if(sha(svgBytes)!==expectedSvg)fail('SVG_HASH_MISMATCH',sha(svgBytes));
 if(!svg.startsWith('<svg ')||!/width="720" height="240" viewBox="0 0 720 240"/.test(svg))
  fail('ATLAS_SIZE_MISMATCH');
 if(/<script|<foreignObject|https?:\/\//i.test(svg.replace('http://www.w3.org/2000/svg','')))
  fail('UNTRUSTED_EXTERNAL_DEPENDENCY');
 const images=[...svg.matchAll(/<image\s[^>]*href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"[^>]*\/>/g)];
 if(images.length!==1)fail('EMBEDDED_IMAGE_COUNT',images.length);
 else{
  const bytes=Buffer.from(images[0][1],'base64');
  const digest=sha(bytes);
  if(digest!==expectedWebp)fail('EMBEDDED_WEBP_DIGEST',digest);
  if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')
   fail('NOT_WEBP_BYTES');
  if(bytes.readUInt32LE(4)+8!==bytes.length)fail('TRUNCATED_RIFF');
  if(bytes.toString('ascii',12,16)==='VP8X'){
   const width=1+bytes.readUIntLE(24,3),height=1+bytes.readUIntLE(27,3);
   if(width!==720||height!==240)fail('WEBP_INTERNAL_DIMENSIONS',String(width)+'x'+height);
  }
 }
 if(!process.exitCode)console.log('AIRA_E_FIRE_ART_BYTES_VERIFIED',
  '3 source paintings, embedded WebP SHA-256 pinned, SVG SHA-256 pinned;',
  'FULL_160_FRAME_APPROVAL=false');
}catch(error){fail('ASSET_READ_EXCEPTION',String(error))}
