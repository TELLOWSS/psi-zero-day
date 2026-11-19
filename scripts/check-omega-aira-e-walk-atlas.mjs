#!/usr/bin/env node
/** Source integrity of 4 ACTUAL hand-illustrated E walk poses.
 * Exact embedded WebP bytes are verified. Four painted keys != the missing
 * two E walk keys, much less complete 8×20 action art or occlusion masks.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const filename='public/assets/omega/aira-v2/e-walk-4key-atlas.svg';
const expectedSvg='0ccf69c8e54ff1d0149c5f0eb2f0cb9319fa2b2003f49a78e2f5e08c8e8a365d';
const expectedWebp='708c0e26cb48d58cec448a1b5696f03ba01c2de7d202e4af5821b63f01bf1867';
const sha=b=>createHash('sha256').update(b).digest('hex');
function fail(msg,detail=''){throw new Error('AIRA_V2_E_WALK_ASSET_INVALID '+msg+' '+detail);}
try{
 const bytes=await readFile(filename);
 if(sha(bytes)!==expectedSvg)fail('SVG_SHA256',sha(bytes));
 const svg=bytes.toString('utf8');
 if(!svg.startsWith('<svg ')||
   !/width="960" height="232" viewBox="0 0 960 232"/.test(svg))
  fail('SOURCE_DIMENSIONS');
 const body=svg.replace('http://www.w3.org/2000/svg','');
 if(/<script|<foreignObject|https?:\/\/|onload\s*=|onerror\s*=/i.test(body))
  fail('UNTRUSTED_SVG_CONTENT');
 const chunks=[...svg.matchAll(/<image\s[^>]*href="data:image\/webp;base64,([A-Za-z0-9+/=]+)"[^>]*\/>/g)];
 if(chunks.length!==1)fail('EMBEDDED_SOURCE_COUNT',String(chunks.length));
 const img=Buffer.from(chunks[0][1],'base64');
 if(sha(img)!==expectedWebp)fail('WEBP_SHA256',sha(img));
 if(img.toString('ascii',0,4)!=='RIFF'||img.toString('ascii',8,12)!=='WEBP')
  fail('WEBP_SIGNATURE');
 if(img.readUInt32LE(4)+8!==img.length)fail('WEBP_TRUNCATED');
 if(img.toString('ascii',12,16)==='VP8X'){
  const w=1+img.readUIntLE(24,3),h=1+img.readUIntLE(27,3);
  if(w!==960||h!==232)fail('WEBP_INTERNAL_DIMENSIONS',w+'×'+h);
 }
 console.log('AIRA_V2_E_WALK_SOURCE_VERIFIED: 4 genuine painted poses, 6 required per direction; no production approval');
}catch(e){console.error(String(e));process.exitCode=1;}
