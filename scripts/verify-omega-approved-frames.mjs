#!/usr/bin/env node
/**
 * The only supported bridge from artist review to playable Omega AIRA.
 * Fails when any genuine 8×20 action, front/back equipment alpha mask,
 * binary checksum, physical NE view or QA signoff is missing.
 */
import {existsSync,readFileSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {omegaDetectNWNEBitmapMirroring} from './omega-art-mirror-audit.mjs';
const ACTIONS=['walk','walk','walk','walk','walk','walk','fire','fire','fire',
 'dash','dash','dash','hit','hit','hit','ultimate','ultimate','ultimate','finish','finish'];
const DIR=['E','SE','S','SW','W','NW','N','NE'];
const candidate=process.argv.find((v,i,a)=>a[i-1]==='--manifest');
const path=resolve(candidate??'content/art/omega-approved-release.json');
const root=resolve('public');
const result={status:'blocked',pathsChecked:0,reason:[],requiredDirections:DIR.length,requiredFrames:160,requiredImages:480};
function issue(message){if(result.reason.length<25)result.reason.push(message)}
const valid64=s=>typeof s==='string'&&/^[\da-f]{64}$/i.test(s);
function safeUri(uri){
 if(typeof uri!=='string'||!/^\/assets\/omega\/approved\/[a-z\d_.\/-]+\.(png|webp)$/.test(uri)||uri.includes('..'))return null;
 const abs=resolve(root,'.'+uri);
 if(!(abs.startsWith(root+sep)||abs===root))return null;
 return abs;
}
async function checkFile(uri,digest,kind){
 const filename=safeUri(uri);
 if(!filename||!valid64(digest)){issue('BAD_'+kind+'_PATH_OR_DIGEST');return false}
 if(!existsSync(filename)){issue('MISSING_'+kind+':'+uri);return false}
 const bytes=readFileSync(filename);
 if(createHash('sha256').update(bytes).digest('hex').toLowerCase()!==digest.toLowerCase()){issue('SHA_MISMATCH_'+kind+':'+uri);return false}
 result.pathsChecked++;
 try{
  const meta=await sharp(bytes).metadata();
  if(meta.width<96||meta.height<128||!meta.hasAlpha){issue('BAD_'+kind+'_TRANSPARENCY_OR_SIZE:'+uri);return false}
  const stats=await sharp(bytes).stats();
  // At least some transparency is required; opaque collage background is forbidden.
  const alpha=stats.channels[3];
  if(!alpha||alpha.min>=250){issue('OPAQUE_'+kind+':'+uri);return false}
  if(alpha.max<24||alpha.mean<(kind==='ACTOR'?6:0.15)){
   issue('EMPTY_OR_INVALID_ALPHA_'+kind+':'+uri);return false;
  }
  return true;
 }catch(e){issue('UNDECODABLE_'+kind+':'+uri);return false}
}
async function main(){
 if(!existsSync(path)){issue('APPROVED_MANIFEST_MISSING');return}
 let m;
 try{m=JSON.parse(readFileSync(path,'utf8'))}catch{issue('MANIFEST_NOT_JSON');return}
 if(m.identity!=='AIRA_MASTER'||m.approval!=='ARTIST_APPROVED'||typeof m.artistSignoff!=='string'||!m.artistSignoff.trim()){issue('SIGNOFF_MISSING');return}
 for(const key of ['visualQa','deviceQa','combatQa'])if(m[key]!=='PASS')issue(key+'_INCOMPLETE');
 if(result.reason.length)return;
 const artDigests=new Set();
 let allOk=true;
 for(const direction of DIR){
  const frames=m.frames?.[direction];
  if(!Array.isArray(frames)||frames.length!==20){issue('MISSING_20_FRAMES_'+direction);allOk=false;continue}
  for(let i=0;i<20;i++){
   const f=frames[i],label=direction+'_'+i;
   if(!f||f.action!==ACTIONS[i]||f.mirrored!==false){issue('INVALID_MOTION_OR_MIRROR_'+label);allOk=false;continue}
   if(artDigests.has(f.sha256)){issue('DUPLICATE_ART_'+label);allOk=false}
   artDigests.add(f.sha256);
   if(!Array.isArray(f.feet)||f.feet.length!==2||[...f.feet,f.radio,f.muzzle].some(p=>!p||![p.x,p.y].every(Number.isFinite))){issue('BAD_SOCKETS_'+label);allOk=false;continue}
   for(const [kind,uri,digest] of [
    ['ACTOR',f.art,f.sha256],['FRONT_OCCLUSION',f.frontOcclusion,f.frontSha256],['BACK_OCCLUSION',f.backOcclusion,f.backSha256]
   ])if(!await checkFile(uri,digest,kind))allOk=false;
  }
 }
 if(allOk&&result.reason.length===0&&result.pathsChecked===480){
  try{
   const sixNW=m.frames.NW.slice(0,6).map(f=>safeUri(f.art));
   const sixNE=m.frames.NE.slice(0,6).map(f=>safeUri(f.art));
   const mirror=await omegaDetectNWNEBitmapMirroring(sixNW,sixNE);
   result.mirrorAudit={
    method:mirror.method,
    scores:mirror.scores.map(score=>Math.round(score*10000)/10000),
    peak:Math.round(mirror.peak*10000)/10000,
    mean:Math.round(mirror.mean*10000)/10000,
    suspectedMirror:mirror.suspectedMirror
   };
   if(mirror.suspectedMirror)issue('NE_IS_FLIPPED_NW_BITMAP');
  }catch(e){issue('MIRROR_ANALYSIS_FAILED:'+String(e))}
 }
 if(allOk&&result.reason.length===0&&result.pathsChecked===480)result.status='ready';
 else if(result.pathsChecked!==480)issue('LESS_THAN_480_BINARY_CHECKS');
}
await main();
console.log(JSON.stringify(result,null,2));
if(result.status!=='ready')process.exitCode=1;
