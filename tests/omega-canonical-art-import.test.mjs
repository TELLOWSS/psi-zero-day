import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyCanonicalArtFolder,inspectCanonicalArtFolder,stageCanonicalArt} from '../scripts/stage-omega-canonical-art.mjs';
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
 const {audit}=await inspectCanonicalArtFolder(dir);
 assert.equal(audit.checked,9);assert.equal(audit.transparentWebP,true);
 assert.deepEqual(audit.mainGames,['SIGNAL GUARD','SIGNAL WATCH']);
 assert.equal(audit.deployAllowed,false);
 assert.equal(audit.fullEightAngleTurntableApproved,false);
});
test('rejects substituted artwork even if it passes its OWN manifest hashes',async t=>{
 const {dir}=await fixture();t.after(()=>rm(dir,{force:true,recursive:true}));
 const dest=await mkdtemp(join(tmpdir(),'omega-art-stage-'));
 t.after(()=>rm(dest,{force:true,recursive:true}));
 // The fixture is a valid-looking WebP with valid self-reported SHA-256.
 // It must never pass our fixed identity list or write unapproved art.
 await assert.rejects(verifyCanonicalArtFolder(dir),/canonical SILVER source SHA-256 mismatch/);
 await assert.rejects(stageCanonicalArt(dir,dest),/canonical SILVER source SHA-256 mismatch/);
 await assert.rejects(
  readFile(join(dest,'content/art/omega-canonical-review-staging.json'),'utf8'),
  /ENOENT/);
});
test('pins all nine exact sources, NW redraw and two live game names',async()=>{
 const roster=JSON.parse(await readFile(new URL(
  '../content/art/omega-canonical-silver-roster.json',import.meta.url),'utf8'));
 assert.equal(roster.game_integration_enabled,false);
 assert.equal(roster.main_menu_image_approved,false);
 assert.equal(roster.full_eight_direction_turnaround_approved,false);
 assert.deepEqual(roster.live_games,['SIGNAL GUARD','SIGNAL WATCH']);
 const all=[...roster.female,roster.male];
 assert.equal(all.length,9);
 assert.equal(new Set(all.map(x=>x.slot)).size,9);
 assert.equal(new Set(all.map(x=>x.sha256)).size,9);
 assert.equal(all.every(x=>/^[a-f0-9]{64}$/.test(x.sha256)),true);
 assert.match(roster.female.find(x=>x.slot==='NW').quality,/REDRAW_REQUIRED/);
 assert.match(roster.canonical_reference,/silver-white/);
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

test('web preview trust list matches exactly the checked-in SILVER source pins',async()=>{
 const main=JSON.parse(await readFile(new URL(
  '../content/art/omega-canonical-silver-roster.json',import.meta.url),'utf8'));
 const view=JSON.parse(await readFile(new URL(
  '../public/omega-canonical-art-review/roster.json',import.meta.url),'utf8'));
 const source=new Map([...main.female,main.male].map(x=>[x.slot,x.sha256]));
 assert.equal(view.stage,'review_only');
 assert.equal(view.production_approved,false);
 assert.deepEqual(view.main_games,['SIGNAL GUARD','SIGNAL WATCH']);
 assert.deepEqual(Object.keys(view.sha256_by_slot).sort(),[...source.keys()].sort());
 for(const [slot,hash] of source)assert.equal(view.sha256_by_slot[slot],hash);
});
