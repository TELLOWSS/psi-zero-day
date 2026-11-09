import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyCanonicalArtFolder,stageCanonicalArt} from '../scripts/stage-omega-canonical-art.mjs';
const slots=['E','SE','S','SW','W','NW','N','NE','M01'];
async function fixture(){
 const dir=await mkdtemp(join(tmpdir(),'omega-silver-fixture-'));
 const assetDir=join(dir,'game_sprites_384x512');
 await mkdir(assetDir,{recursive:true});
 const items=[];
 for(const [i,slot] of slots.entries()){
  // WebP VP8X header test fixture only, NOT an original image or an
  // illustration approval. Runtime extractor validates original WebPs.
  const buf=Buffer.alloc(64,i+1);
  buf.write('RIFF',0,'ascii');buf.writeUInt32LE(56,4);
  buf.write('WEBP',8,'ascii');buf.write('VP8X',12,'ascii');
  buf.writeUInt32LE(10,16);buf[20]=0x10;
  buf[24]=383&255;buf[25]=383>>8;buf[26]=0;
  buf[27]=511&255;buf[28]=511>>8;buf[29]=0;
  const relative='game_sprites_384x512/'+slot.toLowerCase()+'-silver-review.webp';
  await writeFile(join(dir,relative),buf);
  items.push({slot,preview_sprite:relative,
   webp_sha256:createHash('sha256').update(buf).digest('hex'),
   status:slot==='M01'?'design_candidate':'candidate'});
 }
 const manifest={main_games:['SIGNAL GUARD','SIGNAL WATCH'],
  production_game_ready:false,items};
 await writeFile(join(dir,'manifest.json'),JSON.stringify(manifest));
 return {dir,manifest};
}
test('verifies unique 384x512 alpha WebPs but does not approve incomplete 8-angle artwork',async t=>{
 const {dir}=await fixture();t.after(()=>rm(dir,{force:true,recursive:true}));
 const {audit}=await verifyCanonicalArtFolder(dir);
 assert.equal(audit.checked,9);assert.equal(audit.transparentWebP,true);
 assert.deepEqual(audit.mainGames,['SIGNAL GUARD','SIGNAL WATCH']);
 assert.equal(audit.deployAllowed,false);
 assert.equal(audit.fullEightAngleTurntableApproved,false);
});
test('stages review art in isolated path without changing Guard or Watch live assets',async t=>{
 const {dir}=await fixture();t.after(()=>rm(dir,{force:true,recursive:true}));
 const dest=await mkdtemp(join(tmpdir(),'omega-art-stage-'));
 t.after(()=>rm(dest,{force:true,recursive:true}));
 const staged=await stageCanonicalArt(dir,dest);
 assert.equal(staged.assets.length,9);
 const record=JSON.parse(await readFile(staged.metaPath,'utf8'));
 assert.equal(record.productionApproved,false);
 assert.equal(record.gameIntegrationActivated,false);
 assert.equal(record.assets[0].path,'/assets/omega/canonical-review/aira-v2/e.webp');
 assert.equal(record.assets.at(-1).path,'/assets/omega/canonical-review/male/m01.webp');
});
test('rejects tampered image, missing alpha, illegal paths and missing views',async t=>{
 const a=await fixture();t.after(()=>rm(a.dir,{force:true,recursive:true}));
 let corrupt=join(a.dir,a.manifest.items[0].preview_sprite);
 await writeFile(corrupt,Buffer.from('forged'));
 await assert.rejects(verifyCanonicalArtFolder(a.dir),/Incorrect SHA-256/);
 const b=await fixture();t.after(()=>rm(b.dir,{force:true,recursive:true}));
 b.manifest.items[0].preview_sprite='../private/key.webp';
 await writeFile(join(b.dir,'manifest.json'),JSON.stringify(b.manifest));
 await assert.rejects(verifyCanonicalArtFolder(b.dir),/Unsafe/);
 const c=await fixture();t.after(()=>rm(c.dir,{force:true,recursive:true}));
 c.manifest.items.pop();
 await writeFile(join(c.dir,'manifest.json'),JSON.stringify(c.manifest));
 await assert.rejects(verifyCanonicalArtFolder(c.dir),/Missing/);
 const d=await fixture();t.after(()=>rm(d.dir,{force:true,recursive:true}));
 d.manifest.main_games=['SIGNAL WATCH','SIGNAL GUARD'];
 await writeFile(join(d.dir,'manifest.json'),JSON.stringify(d.manifest));
 await assert.rejects(verifyCanonicalArtFolder(d.dir),/incorrect game labels/);
});
