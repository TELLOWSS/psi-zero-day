#!/usr/bin/env node
/**
 * Validate imported OMEGA production assets before enabling the selectable
 * player skin. Run "node scripts/check-omega-operator-art.mjs --release".
 *
 * Without --release, missing assets are reported as a work-in-progress,
 * not passed off as a playable character. No generated/placeholder sprites.
 */
import {readFileSync,existsSync,statSync} from 'node:fs';
import {join} from 'node:path';
const root=process.cwd();
const resources=[
 {label:'front-facing full-body portrait',path:'public/assets/omega/aira-master-portrait.webp',kind:'webp',minBytes:30000},
 {label:'8-way locomotion and turn contact atlas',path:'public/assets/omega/aira-contact-8x6.png',kind:'png',columns:8,rows:6,minCellWidth:80,minCellHeight:115},
 {label:'8-way attack + combo atlas',path:'public/assets/omega/aira-attack-8x8.png',kind:'png',columns:8,rows:8,minCellWidth:80,minCellHeight:115},
 {label:'8-way dash + hit atlas',path:'public/assets/omega/aira-reaction-8x8.png',kind:'png',columns:8,rows:8,minCellWidth:80,minCellHeight:115},
 {label:'8-way ultimate atlas',path:'public/assets/omega/aira-ultimate-8x14.png',kind:'png',columns:8,rows:14,minCellWidth:80,minCellHeight:115},
 {label:'8-way victory + defeat atlas',path:'public/assets/omega/aira-finish-8x10.png',kind:'png',columns:8,rows:10,minCellWidth:80,minCellHeight:115},
 {label:'equipment and foot-anchor metadata',path:'public/assets/omega/aira-anchor-metadata.json',kind:'json'},
];
function pngMetadata(bytes){
 if(bytes.length<26||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||bytes.toString('ascii',12,16)!=='IHDR')throw Error('Invalid PNG IHDR');
 return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),color:bytes[25]};
}
function validate(entry){
 const filename=join(root,entry.path);
 if(!existsSync(filename))return {label:entry.label,status:'missing',path:entry.path};
 try{
  const buffer=readFileSync(filename);
  if(buffer.length<(entry.minBytes??100))throw Error('Suspiciously small file');
  if(entry.kind==='webp'&&!(buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP'))throw Error('Invalid WebP container');
  if(entry.kind==='png'){
   const {width,height,color}=pngMetadata(buffer);
   if(width%entry.columns||height%entry.rows)throw Error('Atlas dimensions are not divisible by the expected frame grid');
   if(width/entry.columns<entry.minCellWidth||height/entry.rows<entry.minCellHeight)throw Error('Atlas frames are too small');
   if(![4,6].includes(color))throw Error('Atlas must include transparency (PNG alpha channel)');
  }
  if(entry.kind==='json'){
   const meta=JSON.parse(buffer.toString('utf8'));
   if(meta.identity!=='AIRA_MASTER'||meta.directions!==8)throw Error('Invalid anchor metadata identity/direction contract');
   const sockets=['head','chest','back','leftWrist','rightWrist','hip','leftFoot','rightFoot'];
   if(!sockets.every(key=>meta.sockets?.includes(key)))throw Error('Required equipment and foot sockets missing');
  }
  return {label:entry.label,path:entry.path,status:'present'};
 }catch(error){return {label:entry.label,path:entry.path,status:'invalid',message:String(error)};}
}
const report=resources.map(validate);
const isRelease=process.argv.includes('--release');
let ready=report.every(r=>r.status==='present');
let pixelApproval=null;
const approvalManifest='content/art/omega-production-art-approval.json';
if(isRelease){
 // Even complete PNG headers cannot certify non-mirrored, artist-authored art.
 if(!existsSync(join(root,approvalManifest))){
  ready=false;
  pixelApproval={status:'missing',reason:'Artist provenance and signed-off SHA256 are required'};
 }else if(ready){
  try{
   const {auditOmegaMotionStudy}=await import('./audit-omega-motion-study.mjs');
   const pixels=await auditOmegaMotionStudy(join(root,'public/assets/omega/aira-contact-8x6.png'),join(root,approvalManifest));
   pixelApproval={status:pixels.interpretation.playableArtReady?'pass':'fail',checks:pixels.interpretation.releaseBlockers,
    mirror:pixels.evidence.mirroredNWNE,sha256Matches:pixels.input.sha256Matches};
   ready=ready&&pixels.interpretation.playableArtReady;
  }catch(error){ready=false;pixelApproval={status:'error',reason:String(error)};}
 }else{
  ready=false;
  pixelApproval={status:'blocked',reason:'Required runtime resources are missing'};
 }
}
console.log(JSON.stringify({name:'OMEGA_OPERATOR_ART',playableArtReady:ready,resources:report,
 ...(isRelease?{pixelApproval}:{} )},null,2));
if(isRelease&&!ready)process.exitCode=1;
