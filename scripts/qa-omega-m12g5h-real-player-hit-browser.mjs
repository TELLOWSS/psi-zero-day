#!/usr/bin/env node
/**
 * M12-G5h actual PLAYER DAMAGE & AIRA HIT source evidence.
 * Real native OMEGA drifter warned attack reaches actual WATCH player HP.
 * No fabricated collision/HP events, no "set player hurt" or screenshot mock.
 * The only art is the ORIGINAL four SHA-verified silver E WALK WebPs reused
 * as visibly different body poses; no new independently painted HIT frames.
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
const sizes=[['desktop',1440,900,false],['tablet',1024,768,true],
 ['portrait',390,844,true],['landscape',844,390,true]];
let failures=0;const rows=[];
for(const [name,w,h,mobile] of sizes){
 const context=await browser.newContext({viewport:{width:w,height:h},
  deviceScaleFactor:1,...(mobile?{hasTouch:true,isMobile:true}:{})});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 const read=async()=>page.evaluate(async()=>{
  const {omegaG5gNativePoseStudy,OMEGA_G5H_ART_GATE}=await import('/src/ui/omega-protocol-m12g5g-native-pose.ts');
  const {omegaG5cReview}=await import('/src/ui/omega-protocol-m12g5c-local-art-review.ts');
  const {OMEGA_PROTOCOL_APPROVED_ART,OMEGA_PROTOCOL_BINARY_AUDIT_PASSED}=await import('/src/ui/omega-protocol-art-slot.ts');
  const root=document.querySelector('main[data-omega-protocol-internal="true"]');
  const a=document.querySelector('.omega-protocol-arena');
  return {
   source:root?.getAttribute('data-omega-m12g5h-native-hit'),
   art:root?.getAttribute('data-omega-m12g5h-final-art'),
   sourceOrigin:root?.getAttribute('data-omega-m12g5g-source'),
   silverReady:root?.getAttribute('data-omega-aira-v2-ready'),
   preview:root?.getAttribute('data-omega-m12g5d-preview'),
   reviewActive:omegaG5cReview.active,
   hashes:omegaG5cReview.sessionProof?.assets.map(x=>x.sha256)??[],
   poses:omegaG5gNativePoseStudy.evidence(),
   hp:Number(a?.getAttribute('data-omega-g5h-player-hp')),
   warnings:Number(a?.getAttribute('data-omega-g5h-zombie-warnings')),
   hits:Number(a?.getAttribute('data-omega-g5h-zombie-hits')),
   damage:Number(a?.getAttribute('data-omega-g5h-zombie-damage')),
   zombiePhase:a?.getAttribute('data-omega-g5h-zombie-phase'),
   realLastDamage:Number(a?.getAttribute('data-omega-g5h-last-damage-remaining')),
   realGunHits:Number(a?.getAttribute('data-omega-qa-gun-hits')),
   playerX:Number(a?.getAttribute('data-omega-player-x')),
   strictLocked:OMEGA_PROTOCOL_APPROVED_ART===null&&!OMEGA_PROTOCOL_BINARY_AUDIT_PASSED,
   artApproval:OMEGA_G5H_ART_GATE,
   overflow:document.documentElement.scrollWidth>innerWidth+3,
   canvasHeight:document.querySelector('.omega-protocol-arena canvas')?.getBoundingClientRect().height??0,
  };
 });
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaM12G5h=1&omegaQaState=combatHit',{
   waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('main[data-omega-protocol-internal="true"]').waitFor({timeout:25000});
  await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:30000});
  await page.evaluate(async()=>{
   const {omegaG5gNativePoseStudy}=await import('/src/ui/omega-protocol-m12g5g-native-pose.ts');
   // Async import only once; synchronous exact runtime instance observed.
   window.__omegaG5hHitQa=omegaG5gNativePoseStudy;
  });
  const initial=await read();
  await page.screenshot({path:dir+'/m12g5h-ORIGINAL-E-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  await page.locator('[data-omega-g5d-load="true"]').click();
  await page.locator('[data-omega-g5c-feedback="ready"]').waitFor({timeout:30000});
  await page.locator('[data-omega-g5c-toggle="true"]').click();
  const afterLoad=await read();
  await page.evaluate(hp=>{window.__omegaG5hInitialHp=hp;},afterLoad.hp);
  // Actual user key direction: E. Do not fake body-facing or damage states.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(120);
  await page.keyboard.up('ArrowRight');
  const hit=await (await page.waitForFunction(()=>{
   const actor=window.__omegaG5hHitQa.evidence();
   const a=document.querySelector('.omega-protocol-arena');
   const h=Number(a?.getAttribute('data-omega-g5h-player-hp'));
   const hits=Number(a?.getAttribute('data-omega-g5h-zombie-hits'));
   const warnings=Number(a?.getAttribute('data-omega-g5h-zombie-warnings'));
   const damage=Number(a?.getAttribute('data-omega-g5h-zombie-damage'));
   const initial=Number(window.__omegaG5hInitialHp);
   // A genuine native Watch damage must have progressed through all 4
   // original AIRA body poses; a single-frame hit is NOT sufficient.
   return actor.counts.hit>0&&actor.sourceFrames.hit.length===4&&
    hits>0&&warnings>0&&damage>0&&h<initial
    ?{currentHp:h,initialHp:initial,hitCount:hits,warnings,damage,
      bodyFrames:actor.sourceFrames.hit,renderCount:actor.counts.hit}:false;
  },null,{timeout:24000,polling:'raf'})).jsonValue();
  const observed=await read();
  await page.screenshot({path:dir+'/m12g5h-NATIVE-REAL-PLAYER-HIT-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  await page.locator('[data-omega-g5c-toggle="true"]').click();
  const restored=await read();
  await page.screenshot({path:dir+'/m12g5h-RESTORED-ORIGINAL-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  const pass=initial.source==='real-zombie-contact-hp-damage-required'&&
   initial.art==='zero-independent-painterly-art-approved'&&
   initial.silverReady==='true'&&initial.strictLocked&&initial.poses.counts.hit===0&&
   afterLoad.reviewActive&&afterLoad.hashes.length===4&&
   afterLoad.hashes.every(x=>x.length===64)&&
   afterLoad.realGunHits===0&&
   hit.renderCount>0&&hit.hitCount>0&&hit.warnings>0&&hit.damage>0&&
   hit.currentHp<hit.initialHp&&hit.currentHp>0&&
   hit.bodyFrames.length===4&&observed.poses.sourceFrames.hit.length===4&&
   observed.artApproval.independentPainterlyActionSourcesApproved===0&&
   observed.artApproval.independentPainterlyInfectedSourcesApproved===0&&
   observed.artApproval.final160Approved===0&&
   observed.artApproval.final320MasksApproved===0&&
   restored.reviewActive===false&&restored.preview==='off'&&
   restored.strictLocked&&!observed.overflow&&observed.canvasHeight>h*.52&&errors.length===0;
  const record={name,w,h,pass,initial,afterLoad,hit,observed,
   restored:{preview:restored.preview,active:restored.reviewActive,locked:restored.strictLocked},
   errors,realPhysicalAndroidFPS:false,independentNewPaintedSprites:0};
  rows.push(record);
  if(!pass)throw Error('G5h real native HP damage event must trigger actual AIRA HIT source '+JSON.stringify(record));
  console.log('QA_PASS M12_G5H',name,JSON.stringify({
   playerHp:hit.initialHp+'->'+hit.currentHp,
   genuineZombieWarnings:hit.warnings,genuineNativeHits:hit.hitCount,
   sourceFrames:hit.bodyFrames,originalHashes:afterLoad.hashes.map(x=>x.slice(0,12)),
   humanPaintedNewFramesApproved:0}));
 }catch(e){
  failures++;
  if(rows.at(-1)?.name!==name)rows.push({name,w,h,pass:false,error:String(e),errors});
  else{rows.at(-1).pass=false;rows.at(-1).error=String(e);}
  console.error('QA_FAIL M12_G5H',name,String(e));
  try{await page.screenshot({path:dir+'/m12g5h-FAIL-'+name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(dir+'/m12g5h-real-native-player-hit-4size-report.json',JSON.stringify({
 failures,rows,completeIndependentCombatArtApproved:0,approvedInfectedOriginalArt:0,
 original160Approved:0,occlusion320Approved:0,mainMerged:false,productionDeployed:false,
},null,2));
if(failures)process.exitCode=1;
