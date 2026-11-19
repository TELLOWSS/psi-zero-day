#!/usr/bin/env node
/** OMEGA/AIRA approved-art binary gate. Standalone, no paid API or runtime calls.
 *
 * Default mode reports BLOCKED without failing a developer build. For actual
 * release, --require-final exits nonzero unless every binary + manual gate
 * is present. This script MUST NOT set the runtime approval flags.
 */
import {readFile,realpath,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,dirname,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';

const args=process.argv.slice(2);
const flag=(key)=>args.includes(key);
const option=(key,fallback)=>{
 const prefix=key+'=';
 const val=args.find(a=>a.startsWith(prefix));
 return val?val.slice(prefix.length):fallback;
};
const manifestFile=resolve(option('--manifest','content/art/omega-approved-v1.json'));
const assetsRoot=resolve(option('--root','public'));
const reportFile=resolve(option('--report','qa-omega-art/approved-art-audit.json'));
const requireFinal=flag('--require-final');
const DIRECTIONS=['E','SE','S','SW','W','NW','N','NE'];
const ACTIONS=[...Array(6).fill('walk'),...Array(3).fill('fire'),
 ...Array(3).fill('dash'),...Array(3).fill('hit'),
 ...Array(3).fill('ultimate'),...Array(2).fill('finish')];
const isSha=(s)=>typeof s==='string'&&/^[0-9a-f]{64}$/i.test(s);
const imageUrl=(s)=>typeof s==='string'&&
 /^\/assets\/omega\/approved\/[a-z0-9_-]+\.(png|webp)$/i.test(s);
const digest=(data)=>createHash('sha256').update(data).digest('hex');
const problems=[];
const block=(code,detail='')=>problems.push({code,detail});
const metrics={expectedDirections:8,expectedActorFrames:160,expectedEquipmentMasks:320,
 checkedActorFrames:0,checkedMasks:0,uniqueActorSourceHashes:0,uniqueActorPixelHashes:0,
 walkAdjacentPairs:0,almostStaticWalkPairs:0,footlineMismatches:0,emptyMasks:0,
 mirroredDirectionPairs:[],imageFormats:[],root:assetsRoot};
const allowedRoot=(p,base)=>{const rel=relative(base,p);
 return !isAbsolute(rel)&&rel!==''&&!rel.startsWith('..')&&rel.split(/[/\\]/).every(x=>x!=='..');
};
async function readAsset(path){
 if(!imageUrl(path))throw new Error('INVALID_ASSET_PATH '+String(path));
 const expected=resolve(assetsRoot,path.slice(1));
 if(!allowedRoot(expected,assetsRoot))throw new Error('ASSET_PATH_ESCAPE '+path);
 const real=await realpath(expected);
 const baseReal=await realpath(assetsRoot);
 if(!allowedRoot(real,baseReal))throw new Error('ASSET_SYMLINK_ESCAPE '+path);
 const info=await stat(real);
 if(!info.isFile()||info.size<40)throw new Error('ZERO_OR_INVALID_BINARY '+path);
 if(info.size>12*1024*1024)throw new Error('OVERSIZED_FRAME '+path);
 return readFile(real);
}
const rgbaDifference=(a,b,{mirror=false}={})=>{
 let changed=0,visible=0;
 const width=384,height=512;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,j=(y*width+(mirror?width-1-x:x))*4;
  const onA=a[i+3]>48,onB=b[j+3]>48;
  if(onA||onB)visible++;
  if((onA||onB)&&(Math.abs(a[i]-b[j])+Math.abs(a[i+1]-b[j+1])+
      Math.abs(a[i+2]-b[j+2])+Math.abs(a[i+3]-b[j+3]))>60)changed++;
 }
 return changed/Math.max(1,visible);
};
let manifest;
try{manifest=JSON.parse(await readFile(manifestFile,'utf8'));}
catch(error){block('FINAL_ART_MANIFEST_MISSING',String(error?.code||error?.message||error));}
if(manifest){
 if(manifest.identity!=='AIRA_MASTER'||manifest.status!=='ARTIST_APPROVED'||
    !manifest.artistSignoff?.trim()||manifest.visualQa!=='PASS'||
    manifest.combatQa!=='PASS'||manifest.mobileDeviceQa!=='PASS')
   block('ART_SIGNOFF_INCOMPLETE');
 if(manifest.width!==384||manifest.height!==512||manifest.feetLine!==454)
   block('FRAME_GEOMETRY_CONTRACT_MISMATCH');
 const headings=manifest.frames;
 if(!headings||typeof headings!=='object'||DIRECTIONS.some(h=>
    !Array.isArray(headings[h])||headings[h].length!==20))
   block('EIGHT_BY_TWENTY_FRAME_PACK_INCOMPLETE');
 if(!problems.some(p=>p.code==='EIGHT_BY_TWENTY_FRAME_PACK_INCOMPLETE')){
  // sharp already ships in the repository's devDependencies: no extra API.
  let sharp;
  try{sharp=(await import('sharp')).default;}
  catch(e){block('IMAGE_DECODER_UNAVAILABLE',String(e?.message||e));}
  if(sharp){
   const allFiles=new Set(),actorHashes=new Set(),actorPixels=new Set();
   let totalMaskPixels=0;
   const directionFirst=new Map();
   const errorsByType=new Map();
   const files=async()=>{
    for(const h of DIRECTIONS){
     let prev=null;
     for(let frameIndex=0;frameIndex<20;frameIndex++){
      const frame=headings[h][frameIndex];
      if(frame?.action!==ACTIONS[frameIndex]||frame?.authoredUnmirrored!==true){
       block('FRAME_ACTION_OR_DIRECTION_INVALID',h+':'+frameIndex);continue;
      }
      const roles=[['actor','actorSha256'],['rearMask','rearSha256'],['frontMask','frontSha256']];
      for(const [role,digestKey] of roles){
       const url=frame[role];
       try{
        if(!isSha(frame[digestKey]))throw new Error('SHA256_INVALID');
        if(allFiles.has(url))throw new Error('REUSED_FRAME_FILENAME');
        allFiles.add(url);
        const bytes=await readAsset(url);
        const actual=digest(bytes);
        if(actual.toLowerCase()!==frame[digestKey].toLowerCase())throw new Error('SHA256_MISMATCH');
        const image=sharp(bytes,{failOn:'error',limitInputPixels:300000});
        let meta;
        try{meta=await image.metadata();}
        catch(e){throw new Error('IMAGE_DECODE_FAILED '+String(e?.message||e));}
        if(meta.width!==384||meta.height!==512||!meta.hasAlpha)
         throw new Error('DIMENSIONS_OR_ALPHA_INVALID');
        let raw;
        try{raw=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});}
        catch(e){throw new Error('IMAGE_DECODE_FAILED '+String(e?.message||e));}
        if(raw.info.channels!==4)throw new Error('RGBA_CHANNELS_INVALID');
        const pixels=raw.data;
        if(role==='actor'){
         let opaque=0,transparent=0,soleBottom=-1;
         for(let y=0;y<512;y++)for(let x=0;x<384;x++){
          const alpha=pixels[(y*384+x)*4+3];
          if(alpha>220){opaque++;if(y>soleBottom)soleBottom=y;}
          else if(alpha<16)transparent++;
         }
         if(opaque<1200||transparent<800)throw new Error('ACTOR_ALPHA_OR_SILHOUETTE_EMPTY');
         if(frameIndex<6&&Math.abs(soleBottom-454)>2){
          metrics.footlineMismatches++;
          block('FOOTLINE_MISMATCH',h+':'+frameIndex+' sole='+soleBottom);
         }
         actorHashes.add(actual);
         actorPixels.add(digest(pixels));
         if(frameIndex===0)directionFirst.set(h,Buffer.from(pixels));
         if(frameIndex>0&&frameIndex<6&&prev){
          metrics.walkAdjacentPairs++;
          const variation=rgbaDifference(prev,pixels);
          if(variation<.01){metrics.almostStaticWalkPairs++;
           block('NEAR_IDENTICAL_WALK_FRAMES',h+':'+frameIndex+' change='+variation.toFixed(5));}
         }
         if(frameIndex<6)prev=Buffer.from(pixels);
         metrics.checkedActorFrames++;
        }else{
         metrics.checkedMasks++;
         // Fully transparent individual masks are valid; a completely
         // empty set of 320 masks is not real authored occlusion art.
         let ink=0;
         for(let i=3;i<pixels.length;i+=4)if(pixels[i]>16)ink++;
         if(ink===0)metrics.emptyMasks++;
         totalMaskPixels+=ink;
        }
        metrics.imageFormats.push(meta.format);
       }catch(e){
        const code=String(e?.message||e).split(' ')[0];
        errorsByType.set(code,(errorsByType.get(code)||0)+1);
        if(problems.length<45)block(code,h+':'+frameIndex+':'+role+' '+String(e?.message||e));
       }
      }
     }
    }
   };
   await files();
   metrics.imageFormats=[...new Set(metrics.imageFormats)].sort();
   metrics.uniqueActorSourceHashes=actorHashes.size;
   metrics.uniqueActorPixelHashes=actorPixels.size;
   metrics.errorCounts=Object.fromEntries(errorsByType);
   if(actorHashes.size!==160||actorPixels.size!==160)
    block('DUPLICATED_ACTOR_VISUAL_OR_BINARY',actorHashes.size+'/'+actorPixels.size);
   if(metrics.checkedActorFrames!==160||metrics.checkedMasks!==320)
    block('MISSING_ACTOR_OR_EQUIPMENT_IMAGE',metrics.checkedActorFrames+'/'+metrics.checkedMasks);
   if(totalMaskPixels===0)block('ALL_OCCLUSION_MASKS_EMPTY');
   // Identical horizontal flips are not independent NE/NW/E/W art.
   for(const [left,right] of [['E','W'],['NE','NW'],['SE','SW']]){
    const a=directionFirst.get(left),b=directionFirst.get(right);
    if(a&&b){
     const similarity=rgbaDifference(a,b,{mirror:true});
     metrics.mirroredDirectionPairs.push({pair:left+'/'+right,variation:similarity});
     if(similarity<.007)block('MIRRORED_DIRECTION_DUPLICATE',left+'/'+right);
    }
   }
  }
 }
}
const result={status:problems.length?'BLOCKED':'BINARY_QA_PASSED_NOT_RELEASED',
 releaseEligible:false, // binary audit is NOT license/artist/platform release authorization
 binaryAuditPassed:problems.length===0,requiresManualProductionApproval:true,
 manifest:manifestFile,metrics,problems,checkedAt:new Date().toISOString(),
 guidance:'Only a separate signed build and human device/art approval may set runtime APPROVED_ART and BINARY_AUDIT_PASSED.'};
await mkdir(dirname(reportFile),{recursive:true});
await writeFile(reportFile,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,problemCodes:[...new Set(problems.map(x=>x.code))],
 actorCount:metrics.checkedActorFrames,maskCount:metrics.checkedMasks,
 report:reportFile}));
if(requireFinal&&problems.length)process.exitCode=1;