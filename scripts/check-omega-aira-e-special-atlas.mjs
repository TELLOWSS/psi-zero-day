#!/usr/bin/env node
/**
 * Byte-for-byte verification of E-only AIRA V2 original cinematic studies.
 * These two files add 5 unique key illustrations and ZERO mask approvals;
 * never treat this check as authorization of the final 160-frame pack.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=[
 {name:'ultimate',path:'public/assets/omega/aira-v2/e-ultimate-3key-atlas.svg',
  width:960,height:240,frames:3,bytes:184709,
  svg:'a4eff32520ea38066c24376cca2dc3798bbe426499837f7b1f45487adc1bd03d',
  webp:'35a598c5b94359f5f2088437a4ae453769685980e5d3e06d9d680421250e6a6a'},
 {name:'finish',path:'public/assets/omega/aira-v2/e-finish-2key-atlas.svg',
  width:1160,height:240,frames:2,bytes:317190,
  svg:'d42ac751dab5680c5f959df81dab0369cf6e7af740959f078689d3cf4cf5fea4',
  webp:'4179e2e0e49dde8a33e3614c6bba5ff57228ec8ec2bacfbe794e9d859487bcd4'},
];
const digest=b=>createHash('sha256').update(b).digest('hex');
let failed=false;
function fail(label,detail=''){
 console.error('OMEGA_AIRA_E_SPECIAL_SOURCE_FAIL',label,String(detail));failed=true;
}
for(const spec of files){
 try{
  const bytes=await readFile(spec.path),svg=bytes.toString('utf8');
  if(bytes.length!==spec.bytes)fail(spec.name+'_SIZE',bytes.length);
  if(digest(bytes)!==spec.svg)fail(spec.name+'_SVG_SHA256',digest(bytes));
  if(!svg.startsWith('<svg ')||!svg.includes(`width="${spec.width}" height="${spec.height}"`)||
   !svg.includes(`viewBox="0 0 ${spec.width} ${spec.height}"`))
    fail(spec.name+'_DIMENSIONS');
  const safe=svg.replace('http://www.w3.org/2000/svg','');
  if(/<script|<foreignObject|https?:\/\/|onload\s*=|onerror\s*=|javascript:/i.test(safe))
    fail(spec.name+'_UNSAFE_REFERENCE');
  const match=[...svg.matchAll(/<image\s[^>]*href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"[^>]*\/>/g)];
  if(match.length!==1){fail(spec.name+'_EMBEDDED_COUNT',match.length);continue;}
  const embedded=Buffer.from(match[0][1],'base64');
  if(digest(embedded)!==spec.webp)fail(spec.name+'_WEBP_SHA256',digest(embedded));
  if(embedded.toString('ascii',0,4)!=='RIFF'||
   embedded.toString('ascii',8,12)!=='WEBP'||
   embedded.readUInt32LE(4)+8!==embedded.length)
    fail(spec.name+'_RIFF_LENGTH');
  console.log('AIRA_E_SPECIAL_ART_SHA256_VERIFIED',spec.name,
   spec.width+'x'+spec.height,spec.frames,'illustrated poses',
   'production160Approved=false');
 }catch(e){fail(spec.name+'_READ',e);}
}
if(failed)process.exitCode=1;
else console.log('AIRA_E_SPECIAL_5_KEY_ART_VERIFIED; 8-way release still BLOCKED');
