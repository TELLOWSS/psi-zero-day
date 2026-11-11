#!/usr/bin/env node
/**
 * M12-G5e actual React/Canvas silver AIRA action FX acceptance, four sizes.
 * Checks REAL live Watch-derived fire feedback and SHIFT dash events, not
 * event flags invented in the page/test. Hit art is contract-tested against
 * the native hurt flag; real inflicted hit may be nondeterministic per battle.
 *
 * Source is original SHA256-verified silver eight views + existing G5d 4
 * candidate walk WebPs. These FX are Canvas presentation, NOT new painted
 * fire/dash/hit frames or gameplay damage.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const dir=resolve('qa-omega-protocol-captures');
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const sizes=[['pc',1440,900,false],['tablet',1024,768,true],
 ['portrait',390,844,true],['landscape',844,390,true]];
const rows=[];let failures=0;
for(const [name,w,h,mobile] of sizes){
 const context=await browser.newContext({
  viewport:{width:w,height:h},deviceScaleFactor:1,
  ...(mobile?{hasTouch:true,isMobile:true}:{})});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const read=async()=>page.evaluate(async()=>{
  const {omegaG5eFx,OMEGA_G5E_ART_STATUS}=await import('/src/ui/omega-protocol-m12g5e-silver-action-fx.ts');
  const {OMEGA_PROTOCOL_APPROVED_ART,OMEGA_PROTOCOL_BINARY_AUDIT_PASSED}=await import('/src/ui/omega-protocol-art-slot.ts');
  const root=document.querySelector('main[data-omega-protocol-internal="true"]');
  const arena=document.querySelector('.omega-protocol-arena');
  const rect=s=>{
   const r=document.querySelector(s)?.getBoundingClientRect();
   return r?{x:r.x,y:r.y,w:r.width,h:r.height}:null;
  };
  return {
   source:root?.getAttribute('data-omega-m12g5e-source'),
   production:root?.getAttribute('data-omega-m12g5e-production'),
   realOriginal:root?.getAttribute('data-omega-aira-v2-ready'),
   action:omegaG5eFx.evidence(),
   strictGateLocked:OMEGA_PROTOCOL_APPROVED_ART===null&&
     OMEGA_PROTOCOL_BINARY_AUDIT_PASSED===false,
   artStatus:OMEGA_G5E_ART_STATUS,
   playerX:Number(arena?.getAttribute('data-omega-player-x')),
   canvas:rect('.omega-protocol-arena canvas'),
   overflow:document.documentElement.scrollWidth>innerWidth+3,
   preview:root?.getAttribute('data-omega-m12g5d-preview'),
  };
 });
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaM12G5e=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('main[data-omega-protocol-internal="true"]').waitFor({timeout:25000});
  await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:30000});
  const original=await read();
  await page.screenshot({path:dir+'/m12g5e-AUTHENTIC-SILVER-ORIGINAL-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  // Genuine auto-fire events from running Watch engine: no mocked view.shooting.
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(async()=>{
   const {omegaG5eFx}=await import('/src/ui/omega-protocol-m12g5e-silver-action-fx.ts');
   return omegaG5eFx.evidence().counts.fire>0;
  },null,{timeout:16000});
  const afterFire=await read();
  // A real SHIFT key instructs native OMEGA CombatSession.dash(); no state hack.
  await page.keyboard.press('Shift');
  await page.waitForFunction(async()=>{
   const {omegaG5eFx}=await import('/src/ui/omega-protocol-m12g5e-silver-action-fx.ts');
   return omegaG5eFx.evidence().counts.dash>0;
  },null,{timeout:13000});
  const afterDash=await read();
  await page.screenshot({path:dir+'/m12g5e-NATIVE-FIRE-DASH-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  await page.keyboard.up('ArrowRight');
  // Existing G5d original four WebPs reused only for actual E gait; no
  // image-generation dashboard or debug rectangles are in this art pack.
  await page.locator('[data-omega-g5d-load="true"]').click();
  await page.locator('[data-omega-g5c-feedback="ready"]').waitFor({timeout:30000});
  await page.locator('[data-omega-g5c-toggle="true"]').click();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(680);
  const actualWalk=await page.evaluate(async()=>{
   const {omegaG5cReview}=await import('/src/ui/omega-protocol-m12g5c-local-art-review.ts');
   return {ready:omegaG5cReview.ready,active:omegaG5cReview.active,
    evidence:omegaG5cReview.evidence(),
    proofs:omegaG5cReview.sessionProof?.assets.map(x=>({
     file:x.file,sha256:x.sha256,toeRow:x.toeRow,
    }))??[]};
  });
  await page.screenshot({path:dir+'/m12g5e-ACTUAL-WALK-PROVENANCE-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  await page.keyboard.up('ArrowRight');
  await page.locator('[data-omega-g5c-toggle="true"]').click();
  const reverted=await read();
  const pass=original.source==='ORIGINAL_SILVER_SOURCE_WITH_NATIVE_EVENT_FX_DEV_ONLY'&&
   original.production==='unapproved-visual-study'&&original.realOriginal==='true'&&
   original.action.counts.fire===0&&original.action.counts.dash===0&&
   original.strictGateLocked&&original.artStatus.final160Approved===0&&
   original.artStatus.final320MasksApproved===0&&original.artStatus.productionApproved===false&&
   !original.overflow&&original.canvas?.h>h*.5&&
   afterFire.action.counts.fire>0&&
   afterDash.action.counts.dash>0&&afterDash.playerX>original.playerX+6&&
   actualWalk.ready&&actualWalk.active&&actualWalk.evidence.draws>0&&
   actualWalk.proofs.length===4&&
   actualWalk.proofs.every(x=>x.sha256.length===64&&x.toeRow>=480)&&
   reverted.preview==='off'&&reverted.strictGateLocked&&errors.length===0;
  const record={name,w,h,pass,original,afterFire,afterDash,actualWalk,
   reverted:{preview:reverted.preview,source:reverted.source,strictGateLocked:reverted.strictGateLocked},
   errors,independentPaintedFireDashHitFramesCreated:0,
   actualAndroidPhysicalFPSMeasured:false};
  rows.push(record);
  if(!pass)throw Error('G5e actual event-only source-Cohesion test failed '+JSON.stringify(record));
  console.log('QA_PASS M12_G5E',name,JSON.stringify({
   nativeFire:afterFire.action.counts.fire,nativeDash:afterDash.action.counts.dash,
   moved:afterDash.playerX-original.playerX,
   sourceWalk:actualWalk.evidence,
   artistApprovedNewFrames:0}));
 }catch(error){
  failures++;
  if(rows.at(-1)?.name!==name)rows.push({name,w,h,pass:false,error:String(error),errors});
  else{rows.at(-1).pass=false;rows.at(-1).error=String(error);}
  console.error('QA_FAIL M12_G5E',name,String(error));
  try{await page.screenshot({path:dir+'/m12g5e-FAIL-'+name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(dir+'/m12g5e-real-native-silver-event-action-report.json',JSON.stringify({
 failures,rows,approvedOriginalFireFrames:0,approvedOriginalDashFrames:0,
 approvedOriginalHitFrames:0,strict160Frames:0,strict320Masks:0,
 publicGameChanged:false,paidRuntimeApiUsed:false,
},null,2));
if(failures)process.exitCode=1;
