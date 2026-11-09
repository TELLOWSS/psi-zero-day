#!/usr/bin/env node
/**
 * Verify exact source file, embedded lossless WebP and native dimensions.
 * Passing this test does not authorize all 8 direction/20 action frames,
 * independent occlusion masks, or commercial-production signoff.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const file='public/assets/omega/aira-v2/e-hit-3key-atlas.svg';
const expectedSvg='0c9f33cd7063b359c462e00e800032427661f5af53e3343e2480c10aa9c15bef';
const expectedWebp='cb3477bfeb5e7210025047b216793267e783ed4c48c63ce76972750025132624';
const digest=b=>createHash('sha256').update(b).digest('hex');
const fail=(reason,data)=>{
 console.error('AIRA_E_HIT_ASSET_FAIL',reason,data??'');
 process.exitCode=1;
};
try{
 const fileBytes=await readFile(file);
 const source=fileBytes.toString('utf8');
 if(digest(fileBytes)!==expectedSvg)fail('SVG_SHA256',digest(fileBytes));
 if(!source.startsWith('<svg ')||
    !/width="780" height="215" viewBox="0 0 780 215"/.test(source))
  fail('SOURCE_DIMENSIONS');
 const noNamespace=source.replace('http://www.w3.org/2000/svg','');
 if(/<script|<foreignObject|https?:\/\/|onload\s*=|onerror\s*=/i.test(noNamespace))
  fail('UNSAFE_EXTERNAL_DEPENDENCY');
 const embedded=[...source.matchAll(
  /<image\s[^>]*href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"[^>]*\/>/g)];
 if(embedded.length!==1)fail('EMBEDDED_WEBP_COUNT',embedded.length);
 else{
  const bytes=Buffer.from(embedded[0][1],'base64');
  if(digest(bytes)!==expectedWebp)fail('WEBP_SHA256',digest(bytes));
  if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')
   fail('NOT_WEBP');
  if(bytes.readUInt32LE(4)+8!==bytes.length)fail('TRUNCATED_WEBP');
  if(bytes.toString('ascii',12,16)==='VP8X'){
   const w=1+bytes.readUIntLE(24,3),h=1+bytes.readUIntLE(27,3);
   if(w!==780||h!==215)fail('WEBP_DIMENSIONS',w+'x'+h);
  }
 }
 if(!process.exitCode)console.log('AIRA_E_HIT_STUDY_SOURCE_VERIFIED',
  '3 independent illustrated E-direction hit poses; full commercial approval=false');
}catch(err){fail('READ_EXCEPTION',String(err))}
