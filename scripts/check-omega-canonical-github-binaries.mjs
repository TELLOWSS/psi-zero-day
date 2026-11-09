#!/usr/bin/env node
/**
 * Exact source binary quality gate for user-confirmed silver/lavender AIRA V2
 * and ONE male M01 neutral pose. This audits art files already IN GITHUB.
 *
 * A passed file integrity gate is NEVER direction/animation/art approval.
 * Incorrect NW and missing independent movement drawings still block release.
 */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const headings=['E','SE','S','SW','W','NW','N','NE'],slots=[...headings,'M01'];
const sources=JSON.parse(await readFile('content/art/omega-canonical-silver-roster.json','utf8'));
const browserRoster=JSON.parse(await readFile('public/omega-canonical-art-review/roster.json','utf8'));
if(sources.source_stage!=='review_only'||sources.game_integration_enabled!==false||
 sources.release_allowed!==false||sources.main_menu_image_approved!==false||
 sources.full_eight_direction_turnaround_approved!==false||
 sources.action_animation_approved!==false||
 browserRoster.production_approved!==false||browserRoster.stage!=='review_only'||
 browserRoster.main_games.join('|')!=='SIGNAL GUARD|SIGNAL WATCH')throw Error(
 'Unsafe canonical art release flag: silver source candidates are NOT ready for gameplay');
const manifest=new Map([...sources.female,sources.male].map(r=>[r.slot,r.sha256]));
if(manifest.size!==9||slots.some(h=>!manifest.has(h))||
 Object.keys(browserRoster.sha256_by_slot).sort().join(',')!==[...slots].sort().join(','))
 throw Error('Missing/extra direction or male original file');
const report=[];
for(const slot of slots){
 const path=slot==='M01'?'public/assets/omega/canonical-review/male/m01.webp':
  'public/assets/omega/canonical-review/aira-v2/'+slot.toLowerCase()+'.webp';
 const bytes=await readFile(path);
 const digest=createHash('sha256').update(bytes).digest('hex');
 if(digest!==manifest.get(slot)||digest!==browserRoster.sha256_by_slot[slot])
  throw Error('Original silver image changed without original-file approval: '+slot);
 const image=sharp(bytes,{failOn:'error'});
 const meta=await image.metadata();
 if(meta.format!=='webp'||meta.width!==384||meta.height!==512||!meta.hasAlpha)
  throw Error('Real source transparent WebP 384x512 missing: '+slot);
 const {data,info}=await image.ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.channels!==4)throw Error('Canonical RGBA channel mismatch: '+slot);
 let opaque=0,transparent=0;
 let top=512,bottom=-1,left=384,right=-1;
 for(let y=0;y<512;y++)for(let x=0;x<384;x++){
  const alpha=data[(y*384+x)*4+3];
  if(alpha<8)transparent++;
  if(alpha>=64){
   opaque++;
   top=Math.min(y,top);bottom=Math.max(y,bottom);
   left=Math.min(x,left);right=Math.max(x,right);
  }
 }
 const pixels=384*512,opaqueFraction=opaque/pixels,transparencyFraction=transparent/pixels;
 // A cropped poster/fake opaque backdrop cannot pass as a character sprite.
 if(opaqueFraction<.15||opaqueFraction>.50||
  transparencyFraction<.45||transparencyFraction>.84||
  bottom<490||top>35||left<2||right>381)
  throw Error('Original character alpha silhouette/boot alignment invalid: '+
   slot+' '+JSON.stringify({opaqueFraction,transparencyFraction,top,bottom,left,right}));
 report.push({slot,sha256:digest,pixels,bytes:bytes.length,
  opaqueFraction:Number(opaqueFraction.toFixed(4)),
  transparencyFraction:Number(transparencyFraction.toFixed(4)),
  extent:{top,bottom,left,right},
  quality:slot==='NW'?'REDRAW_REQUIRED':slot==='M01'?'MALE_DESIGN_CANDIDATE':'REVIEW_ONLY'});
}
if(new Set(report.map(x=>x.sha256)).size!==9)
 throw Error('Duplicate or mirrored original source assets');
const result={
 passed:true,originalSourceImages:report.length,femaleViews:8,maleCandidates:1,
 sha256Matches:9,alphaSilhouetteMatches:9,
 identityReference:'silver-white/lavender ponytail, violet eyes, white Omega tactical coat',
 artReviewPending:true,eightDirectionsApproved:false,
 productionAnimation160Approved:false,
 originalOcclusionMasks320Approved:false,
 originalNWMustBeRedrawn:true,
 liveSignalGuardChanged:false,liveSignalWatchChanged:false,
 mergeOrProductionDeployPermitted:false,assets:report,
};
console.log('QA_PASS original GitHub AIRA V2 + M01 transparent binary integrity',
 JSON.stringify(result));
