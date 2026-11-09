#!/usr/bin/env node
/**
 * PSI ZERO DAY: import original AIRA silver-lavender and OMEGA male artwork
 * without inventing missing frames or silently changing two live games.
 *
 * Usage:
 *   node scripts/stage-omega-canonical-art.mjs /path/to/unzipped/OMEGA_CANONICAL_SILVER_ART_20261109 --stage
 *
 * Preflight (default) validates WebP RIFF, actual width/height, transparent
 * alpha feature, unique binary hashes, model identity and source-art SHA256.
 * --stage copies art ONLY into review paths. Production Guard/Watch and
 * official AIRA 160-frame approval remain untouched.
 */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const repoRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const slots=['E','SE','S','SW','W','NW','N','NE','M01'];
const female=slots.slice(0,8);
const target=Object.freeze({width:384,height:512});
const isRecord=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const sha=buf=>createHash('sha256').update(buf).digest('hex');
function dimensions(buf){
 if(buf.length<30||buf.toString('ascii',0,4)!=='RIFF'||
    buf.toString('ascii',8,12)!=='WEBP'||
    buf.toString('ascii',12,16)!=='VP8X')
   throw Error('Expected extended WebP with transparency');
 const flags=buf[20];
 if((flags&0x10)===0)throw Error('No WebP alpha channel');
 const width=1+buf[24]+(buf[25]<<8)+(buf[26]<<16);
 const height=1+buf[27]+(buf[28]<<8)+(buf[29]<<16);
 return {width,height};
}
const safeFile=(dir,relative)=>{
 if(typeof relative!=='string'||!/^(game_sprites_384x512)\/[a-z0-9-]+\.webp$/.test(relative))
  throw Error('Unsafe or unexpected sprite file path');
 const full=resolve(dir,relative);
 if(!full.startsWith(resolve(dir)+'/'))throw Error('Sprite escapes asset root');
 return full;
};
export async function verifyCanonicalArtFolder(dir){
 const manifest=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
 if(!isRecord(manifest)||!Array.isArray(manifest.items)||
    manifest.production_game_ready!==false||
    !Array.isArray(manifest.main_games)||
    manifest.main_games.join('|')!=='SIGNAL GUARD|SIGNAL WATCH')
   throw Error('Invalid/released character manifest or incorrect game labels');
 const entries=new Map();
 const binaries=new Map();
 const hashes=new Set();
 for(const item of manifest.items){
  if(!isRecord(item)||!slots.includes(item.slot)||entries.has(item.slot))
   throw Error('Unknown/duplicate artwork direction slot');
  const file=safeFile(dir,item.preview_sprite);
  const bytes=await readFile(file);
  if(!/^[a-f0-9]{64}$/.test(item.webp_sha256)||
     sha(bytes)!==item.webp_sha256)
   throw Error('Incorrect SHA-256 for '+item.slot);
  const dims=dimensions(bytes);
  if(dims.width!==target.width||dims.height!==target.height)
   throw Error('Incorrect PNG-equivalent boot pivot canvas dimensions '+item.slot);
  if(hashes.has(item.webp_sha256))throw Error('Mirrored/duplicate frame binary '+item.slot);
  hashes.add(item.webp_sha256);
  entries.set(item.slot,item);
  binaries.set(item.slot,bytes);
 }
 if(entries.size!==9||slots.some(s=>!entries.has(s))||
    female.some(s=>entries.get(s).status==='production_approved'))
  throw Error('Missing or improperly approved canonical views');
 return {entries,binaries,
  audit:{checked:9,femaleSlots:8,maleCandidates:1,
   distinctHashes:hashes.size,transparentWebP:true,dimensions:target,
   mainGames:['SIGNAL GUARD','SIGNAL WATCH'],
   fullEightAngleTurntableApproved:false,
   animationFramesApproved:false,
   deployAllowed:false}};
}
export async function stageCanonicalArt(folder,dest=repoRoot){
 const {entries,binaries,audit}=await verifyCanonicalArtFolder(folder);
 const base=join(dest,'public/assets/omega/canonical-review');
 const out=[];
 for(const slot of slots){
  const filename=slot==='M01'?'male/m01.webp':'aira-v2/'+slot.toLowerCase()+'.webp';
  const path=join(base,filename);
  await mkdir(dirname(path),{recursive:true});
  // Every actual byte already checked against the original source manifest.
  await writeFile(path,binaries.get(slot));
  out.push({slot,path:'/assets/omega/canonical-review/'+filename,
   sha256:entries.get(slot).webp_sha256,quality:entries.get(slot).status});
 }
 const metaPath=join(dest,'content/art/omega-canonical-review-staging.json');
 await mkdir(dirname(metaPath),{recursive:true});
 await writeFile(metaPath,JSON.stringify({
  source:'AIRA V2 SILVER canonical original art review package',
  mainGames:audit.mainGames,assetStage:'REVIEW_ONLY',
  productionApproved:false,gameIntegrationActivated:false,
  note:'NW perspective and action animations require re-authoring. Never count this staging package as 8 approved game directions.',
  assets:out,audit,
 },null,2)+'\n','utf8');
 return {metaPath,assets:out,audit};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const folder=process.argv[2];
 if(!folder){console.error('Usage: node scripts/stage-omega-canonical-art.mjs <extracted-pack> [--stage]');process.exitCode=2;}
 else{
  try{
   const result=process.argv.includes('--stage')
    ?await stageCanonicalArt(resolve(folder))
    :await verifyCanonicalArtFolder(resolve(folder));
   console.log(JSON.stringify(result.audit,null,2));
   console.log(process.argv.includes('--stage')?'STAGED: REVIEW ONLY, NO LIVE GAME CHANGE':'PREFLIGHT PASS: NO FILES MODIFIED');
  }catch(error){console.error('ART_QUALITY_GATE_FAILED',error.message);process.exitCode=1;}
 }
}
