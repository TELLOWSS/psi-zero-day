#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

const manifest=JSON.parse(await readFile('content/art/omega-aira-v2-user-approved.json','utf8'));
let pass=true;
if(manifest.commercial_sprite_pack_approved!==false ||
   manifest.independently_handpainted_160_frames!==false ||
   manifest.status!=='USER_APPROVED_CHARACTER_IDENTITY_ONLY'){
 console.error('AIRA V2 stage must not claim final 160-frame approval');pass=false;
}
const headings=['e','se','s','sw','w','nw','n','ne'];
const expected=[...headings.map(h=>h+'-idle.webp'),'hero-splash.webp','portrait.webp'];
if(expected.length!==Object.keys(manifest.assets).length)pass=false;
for(const name of expected){
 const record=manifest.assets[name];
 if(!record||record.path!=='public/assets/omega/aira-v2/'+name){
  console.error('MISSING_ENTRY',name);pass=false;continue;
 }
 try{
  const bytes=await readFile(resolve(record.path));
  const hash=createHash('sha256').update(bytes).digest('hex');
  // WEBP RIFF file signature, image dimensions are also browser-decoded.
  const isWebp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  const valid=hash===record.sha256&&bytes.length===record.bytes&&isWebp;
  if(!valid){console.error('BAD_ASSET',name,{size:bytes.length,hash,isWebp});pass=false;}
  else console.log('ASSET_PASS',name,bytes.length);
 }catch(error){console.error('MISSING_ASSET',name,String(error));pass=false;}
}
if(!pass)process.exitCode=1;
else console.log('AIRA_V2_USER_APPROVED_NEUTRAL_ART_VERIFIED',
 expected.length,'files; production 160-frame animation still gated');
