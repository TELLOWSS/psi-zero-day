#!/usr/bin/env node
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';

const dir=await mkdtemp(join(tmpdir(),'omega-binary-audit-'));
const asset=join(dir,'public/assets/omega/approved');
await mkdir(asset,{recursive:true});
const sha=(buf)=>createHash('sha256').update(buf).digest('hex');
const W=384,H=512;
const makeActor=async(index,foot=454)=>{
 const px=Buffer.alloc(W*H*4);
 const paint=(x1,y1,x2,y2,color)=>{
  for(let y=y1;y<=y2;y++)for(let x=x1;x<=x2;x++){
   const i=(y*W+x)*4;for(let n=0;n<4;n++)px[i+n]=color[n];
  }
 };
 paint(162,355,211,foot,[170,220,255,255]);
 // Different hand-defined technical silhouette details every pose:
 // != approved character art; deliberately synthetic tests only.
 const x=158+(index*11)%42;
 paint(x,370,x+19,394,[index%255,(index*3)%255,210,255]);
 paint(167,418+(index%15),201,432+(index%15),[(index*7)%255,48,220,255]);
 return sharp(px,{raw:{width:W,height:H,channels:4}}).png().toBuffer();
};
const mask=(opaque)=>{const px=Buffer.alloc(W*H*4);if(opaque){
 for(let y=360;y<380;y++)for(let x=185;x<195;x++){let k=(y*W+x)*4;
 px[k]=180;px[k+1]=90;px[k+2]=160;px[k+3]=90;}}
 return sharp(px,{raw:{width:W,height:H,channels:4}}).png().toBuffer();
};
const baseMask=await mask(false),inkMask=await mask(true);
const DIRECTIONS=['E','SE','S','SW','W','NW','N','NE'];
const ACTIONS=[...Array(6).fill('walk'),...Array(3).fill('fire'),...Array(3).fill('dash'),...Array(3).fill('hit'),...Array(3).fill('ultimate'),...Array(2).fill('finish')];
const frames={};
let index=0;
for(const d of DIRECTIONS){
 frames[d]=[];
 for(let i=0;i<20;i++){
  const prefix=`omega_${d.toLowerCase()}_${String(i).padStart(2,'0')}`;
  const source=await makeActor(index);
  const urls=[prefix+'_actor.png',prefix+'_rear.png',prefix+'_front.png'];
  const masks=[source,i===0&&d==='E'?inkMask:baseMask,baseMask];
  for(let role=0;role<3;role++)await writeFile(join(asset,urls[role]),masks[role]);
  frames[d].push({action:ACTIONS[i],authoredUnmirrored:true,
   actor:'/assets/omega/approved/'+urls[0],
   rearMask:'/assets/omega/approved/'+urls[1],
   frontMask:'/assets/omega/approved/'+urls[2],
   actorSha256:sha(source),rearSha256:sha(masks[1]),frontSha256:sha(masks[2])});
  index++;
 }
}
const manifest={identity:'AIRA_MASTER',status:'ARTIST_APPROVED',
 artistSignoff:'SYNTHETIC QA TEST ONLY (NOT REAL APPROVAL)',
 visualQa:'PASS',combatQa:'PASS',mobileDeviceQa:'PASS',
 width:W,height:H,feetLine:454,frames};
const manifestPath=join(dir,'synthetic-manifest.json');
const script=resolve('scripts/check-omega-approved-art.mjs');
const run=(required=true)=>{
 const report=join(dir,'report.json');
 const result=spawnSync(process.execPath,[script,'--manifest='+manifestPath,
  '--root='+join(dir,'public'),'--report='+report,...(required?['--require-final']:[])],
  {encoding:'utf8',timeout:60000});
 if(result.error)throw result.error;
 return {code:result.status,out:result.stdout.trim(),report};
};
const readReport=async(r)=>JSON.parse(await readFile(r.report,'utf8'));
const cases=[];
const check=(condition,label)=>{if(!condition)throw new Error('FAILED: '+label);};
try{
 await writeFile(manifestPath,JSON.stringify(manifest));
 let r=run();let record=await readReport(r);
 check(r.code===0&&record.status==='BINARY_QA_PASSED_NOT_RELEASED'&&
  record.metrics.checkedActorFrames===160&&record.metrics.checkedMasks===320,
  '160+320 synthetic VALID structure');
 cases.push({name:'SYNTHETIC complete 160+320 (never artist release)',pass:true});
 // Alter one actor file, preserving manifest hash: must catch corruption.
 const e=frames.E[0];const first=join(asset,e.actor.split('/').at(-1));
 const original=await readFile(first);
 await writeFile(first,Buffer.alloc(100,3));
 r=run();record=await readReport(r);
 check(r.code!==0&&record.problems.some(x=>x.code==='SHA256_MISMATCH'),'bad binary checksum');
 cases.push({name:'Damaged binary checksum',pass:true});
 await writeFile(first,original);
 // Manifest hash can be updated to hide corruption; decoder must still fail.
 await writeFile(first,Buffer.alloc(100,3));
 e.actorSha256=sha(await readFile(first));await writeFile(manifestPath,JSON.stringify(manifest));
 r=run();record=await readReport(r);
 check(r.code!==0&&record.problems.some(x=>x.code==='IMAGE_DECODE_FAILED'),'bad image bytes');
 cases.push({name:'Undecodable or zero-byte image',pass:true});
 await writeFile(first,original);e.actorSha256=sha(original);
 // Replacing another frame with first source must fail unique image hash.
 const e2=frames.E[1],second=join(asset,e2.actor.split('/').at(-1));
 const secondOriginal=await readFile(second);
 await writeFile(second,original);e2.actorSha256=sha(original);
 await writeFile(manifestPath,JSON.stringify(manifest));
 r=run();record=await readReport(r);
 check(r.code!==0&&record.problems.some(x=>x.code==='DUPLICATED_ACTOR_VISUAL_OR_BINARY'),
  'duplicated actor content');
 cases.push({name:'Repeated AIRA character pose despite new filename',pass:true});
 await writeFile(second,secondOriginal);e2.actorSha256=sha(secondOriginal);
 // Wrong opaque foot sole position even if SHA is correct.
 const badFoot=await makeActor(0,441);await writeFile(first,badFoot);
 e.actorSha256=sha(badFoot);await writeFile(manifestPath,JSON.stringify(manifest));
 r=run();record=await readReport(r);
 check(r.code!==0&&record.problems.some(x=>x.code==='FOOTLINE_MISMATCH'),
  'bad pixel footline');
 cases.push({name:'13px boot-to-ground pivot mismatch',pass:true});
 await writeFile(first,original);e.actorSha256=sha(original);
 // Remove mandatory equipment mask, even when its pixels are all transparent.
 const maskPath=join(asset,frames.E[0].rearMask.split('/').at(-1));
 const maskOriginal=await readFile(maskPath);await rm(maskPath);
 await writeFile(manifestPath,JSON.stringify(manifest));
 r=run();record=await readReport(r);
 check(r.code!==0&&record.problems.some(x=>x.code==='MISSING_ACTOR_OR_EQUIPMENT_IMAGE'),
  'missing equipment layer');
 cases.push({name:'Absent rear-occlusion layer',pass:true});
 await writeFile(maskPath,maskOriginal);
 // Signoff is necessary, albeit not sufficient for real human approval.
 manifest.artistSignoff='';await writeFile(manifestPath,JSON.stringify(manifest));
 r=run();record=await readReport(r);
 check(r.code!==0&&record.problems.some(x=>x.code==='ART_SIGNOFF_INCOMPLETE'),'signoff');
 cases.push({name:'Missing artist/manual review signature',pass:true});
 console.log(JSON.stringify({status:'PASS',cases,checked:cases.length,
  note:'Valid fixture is computer-generated, NEVER actual approved art'},null,2));
}catch(e){console.error(String(e));process.exitCode=1;}
finally{await rm(dir,{recursive:true,force:true});}