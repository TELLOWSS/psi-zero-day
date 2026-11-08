#!/usr/bin/env node
/**
 * PSI ZERO DAY / OMEGA: pixel-based 8×6 motion QA.
 * This diagnostic cannot prove lifelike joints, rights, or equipment rigging.
 * Usage: node scripts/audit-omega-motion-study.mjs --atlas FILE --manifest FILE [--report FILE] [--release]
 */
import sharp from 'sharp';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const DIRECTIONS=['E','SE','S','SW','W','NW','N','NE'];
function avg(x){return x.reduce((a,b)=>a+b,0)/x.length;}
function round(n,places){return Math.round(n*10**places)/10**places;}
export function silhouetteChange(a,b){
 if(a.length!==b.length)throw Error('Mismatched masks');
 let union=0,different=0;
 for(let i=0;i<a.length;i++){if(a[i]||b[i])union++;if(Boolean(a[i])!==Boolean(b[i]))different++;}
 return union?different/union:0;
}
export function flippedSilhouetteIoU(a,b,w,h){
 if(a.length!==w*h||b.length!==w*h)throw Error('Invalid mask dimensions');
 let intersection=0,union=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const first=a[y*w+x]!==0,second=b[y*w+w-1-x]!==0;
  if(first||second)union++;
  if(first&&second)intersection++;
 }
 return union?intersection/union:1;
}
export async function auditOmegaMotionStudy(atlasPath,manifestPath){
 const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
 const rawFile=readFileSync(atlasPath);
 const sha256=createHash('sha256').update(rawFile).digest('hex');
 const expected=manifest.atlas?.sha256??null;
 const checksumOk=expected===null||sha256===expected;
 const {data,info}=await sharp(rawFile,{limitInputPixels:120_000_000})
  .ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const columns=8,rows=6;
 if(info.width%columns||info.height%rows)throw Error('Atlas is not a divisible 8x6 grid');
 if(info.channels!==4)throw Error('Image must decode to four RGBA channels');
 const w=info.width/columns,h=info.height/rows;
 const masks=Array.from({length:columns},()=>[]);
 const directions=[];
 for(let dir=0;dir<columns;dir++){
  let baseline=-1,maxBaselineDrift=0;
  const feet=[];
  for(let frame=0;frame<rows;frame++){
   const mask=new Uint8Array(w*h);
   let visible=0,maxY=-1,lowerXSum=0,lowerCount=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const index=((frame*h+y)*info.width+(dir*w+x))*info.channels+3;
    if(data[index]<120)continue;
    mask[y*w+x]=1;visible++;maxY=Math.max(maxY,y);
    if(y>=Math.floor(h*.82)){lowerXSum+=x;lowerCount++;}
   }
   if(!visible)throw Error('Transparent-only cell '+DIRECTIONS[dir]+' '+frame);
   masks[dir].push(mask);
   if(baseline<0)baseline=maxY;
   else maxBaselineDrift=Math.max(maxBaselineDrift,Math.abs(maxY-baseline));
   feet.push(lowerCount?lowerXSum/lowerCount:0);
  }
  const diffs=masks[dir].map((v,i)=>silhouetteChange(v,masks[dir][(i+1)%rows]));
  directions.push({
   direction:DIRECTIONS[dir],
   meanAdjacentSilhouetteChangePct:round(100*avg(diffs),2),
   floorDriftMaxPx:maxBaselineDrift,
   lowerFootRegionCentroidSpanPx:round(Math.max(...feet)-Math.min(...feet),2),
   allSixFramesNonIdentical:diffs.every(x=>x>0)
  });
 }
 const mirrorValues=Array.from({length:rows},(_,i)=>flippedSilhouetteIoU(masks[7][i],masks[5][i],w,h));
 const mirror={
  meanIoU:round(avg(mirrorValues),4),minimumIoU:round(Math.min(...mirrorValues),4),
  maximumIoU:round(Math.max(...mirrorValues),4),
  suspectedMirror:Math.max(...mirrorValues)>=.99,threshold:.99,
  evidence:'NE compared to horizontally reversed NW for six walk phases'
 };
 const blockers=[];
 if(manifest.status!=='ARTIST_AUTHORED_APPROVED')blockers.push('UNAPPROVED_ART_PROVENANCE');
 if(manifest.releaseApproved!==true||manifest.doNotInstallAsPlayableCharacter!==false)blockers.push('NO_SIGNED_ART_APPROVAL');
 if(!expected)blockers.push('MISSING_ATLAS_SHA256');
 if(!checksumOk)blockers.push('ATLAS_SHA256_MISMATCH');
 if(mirror.suspectedMirror)blockers.push('NE_IS_MIRRORED_NW');
 if(directions.some(r=>!r.allSixFramesNonIdentical))blockers.push('DUPLICATE_GAIT_PHASE');
 if(!existsSync(resolve('public/assets/omega/aira-anchor-metadata.json')))blockers.push('NO_PRODUCTION_EQUIPMENT_SOCKETS');
 return {
  spec:'OMEGA_8x6_PIXEL_AUDIT_V1',assetName:String(manifest.id??'unidentified'),
  input:{atlas:atlasPath,imageSha256:sha256,expectedSha256:expected,sha256Matches:checksumOk,dimensions:[info.width,info.height],cell:[w,h],directions:DIRECTIONS,rows},
  evidence:{mirroredNWNE:mirror,perDirection:directions,all48FramesPresent:true},
  interpretation:{statedProvenance:manifest.status??'unknown',artworkIsArtistApproved:manifest.releaseApproved===true,
   playableArtReady:blockers.length===0,releaseBlockers:blockers,
   caution:'Frame changes and level floor baseline do not establish anatomical gait, stance-foot IK, equipment occlusion, intellectual property rights, or actual game performance.'}
 };
}
if(import.meta.url===(process.argv[1]?pathToFileURL(resolve(process.argv[1])).href:'')){
 const args=process.argv.slice(2),arg=flag=>{const i=args.indexOf(flag);return i<0?null:args[i+1]??null};
 if(!arg('--atlas')||!arg('--manifest')){console.error('Requires --atlas file --manifest file');process.exit(2);}
 try{
  const r=await auditOmegaMotionStudy(resolve(arg('--atlas')),resolve(arg('--manifest')));
  const payload=JSON.stringify(r,null,2)+'\n';
  if(arg('--report'))writeFileSync(resolve(arg('--report')),payload);
  process.stdout.write(payload);
  if(args.includes('--release')&&!r.interpretation.playableArtReady)process.exitCode=1;
 }catch(e){console.error(JSON.stringify({error:String(e)}));process.exitCode=2;}
}
