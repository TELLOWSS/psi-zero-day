#!/usr/bin/env node
/**
 * Check exact bytes of the single approved-identity AIRA V2 E-facing dash
 * study. It does not approve the full 8x20 production animation or masks.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const filename='public/assets/omega/aira-v2/e-dash-3key-atlas.svg';
const expectedSvg='49efe48fea53e7b376ce003e577ad59ea97ea7518f5636a77527c9dd6919eac3';
const expectedWebp='50dacee2a0b89af9c3ba232df0cae71940beae7a67671b2041d7bbdc82006e50';
const digest=b=>createHash('sha256').update(b).digest('hex');
const fail=(msg,detail)=>{console.error('AIRA_E_DASH_ASSET_FAIL',msg,detail??'');process.exitCode=1;};
try{
 const data=await readFile(filename),svg=data.toString('utf8');
 if(digest(data)!==expectedSvg)fail('SVG_SHA256',digest(data));
 if(!svg.startsWith('<svg ')||!/width="840" height="220" viewBox="0 0 840 220"/.test(svg))
  fail('SOURCE_DIMENSIONS');
 const untrusted=svg.replace('http://www.w3.org/2000/svg','');
 if(/<script|<foreignObject|https?:\/\/|onload\s*=|onerror\s*=/i.test(untrusted))
  fail('UNSAFE_EXTERNAL_DEPENDENCY');
 const embedded=[...svg.matchAll(/<image\s[^>]*href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"[^>]*\/>/g)];
 if(embedded.length!==1)fail('EMBEDDED_WEBP_COUNT',embedded.length);
 else{
  const bytes=Buffer.from(embedded[0][1],'base64');
  if(digest(bytes)!==expectedWebp)fail('WEBP_SHA256',digest(bytes));
  if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')
   fail('SOURCE_NOT_WEBP');
  if(bytes.readUInt32LE(4)+8!==bytes.length)fail('TRUNCATED_RIFF');
  if(bytes.toString('ascii',12,16)==='VP8X'){
   const width=1+bytes.readUIntLE(24,3),height=1+bytes.readUIntLE(27,3);
   if(width!==840||height!==220)fail('INTERNAL_WEBP_DIMENSIONS',width+'x'+height);
  }
 }
 if(!process.exitCode)console.log('AIRA_E_DASH_ART_BYTES_VERIFIED',
  '3 distinct E dash poses; full 160-frame production approval=false');
}catch(error){fail('READ_EXCEPTION',String(error))}
