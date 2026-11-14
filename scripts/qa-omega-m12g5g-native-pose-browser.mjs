#!/usr/bin/env node
/**
 * M12-G5g REAL React/Canvas native E combat body-pose switching QA.
 * Four viewports; no fake attack flags or damage mutation, no artist signoff.
 * Only existing exact SHA-verified G5d E WALK 4 painterly WebPs are used,
 * repurposed as different body silhouettes in FIRE/DASH/HIT DEVELOPMENT LAB.
 * An FX-composite walk pose does NOT become a commercial original action.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const folder=resolve('qa-omega-protocol-captures');
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
let failures=0;const rows=[];
for(const [name,w,h,mobile] of [
 ['desktop',1440,900,false],['tablet',1024,768,true],
 ['portrait',390,844,true],['landscape',844,390,true],
]){
 const context=await browser.newContext({viewport:{width:w,height:h},
  deviceScaleFactor:1,...(mobile?{hasTouch:true,isMobile:true}:{})});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 const read=async()=>page.evaluate(async()=>{
  const {omegaG5gNativePoseStudy,OMEGA_G5G_ART_APPROVAL}=await import('/src/ui/omega-protocol-m12g5g-native-pose.ts');
  const {omegaG5cReview}=await import('/src/ui/omega-protocol-m12g5c-local-art-review.ts');
  const art=await import('/src/ui/omega-protocol-art-slot.ts');
  const root=document.querySelector('main[data-omega-protocol-internal="true"]');
  const arena=document.querySelector('.omega-protocol-arena');
  const canvas=document.querySelector('.omega-protocol-arena canvas')?.getBoundingClientRect();
  return {
   status:root?.getAttribute('data-omega-m12g5g-source'),
   artGate:root?.getAttribute('data-omega-m12g5g-art-gate'),
   silverReady:root?.getAttribute('data-omega-aira-v2-ready'),
   nativeProbe:arena?.getAttribute('data-omega-qa-mode'),
   nativeHits:Number(arena?.getAttribute('data-omega-qa-gun-hits')??0),
   nativeX:Number(arena?.getAttribute('data-omega-player-x')),
   pose:omegaG5gNativePoseStudy.evidence(),
   reviewActive:omegaG5cReview.active,
   walk:omegaG5cReview.evidence(),
   proofs:omegaG5cReview.sessionProof?.assets.map(p=>({
    name:p.file,sha256:p.sha256,toe:p.toeRow,
   }))??[],
   approval:OMEGA_G5G_ART_APPROVAL,
   strictLocked:art.OMEGA_PROTOCOL_APPROVED_ART===null&&art.OMEGA_PROTOCOL_BINARY_AUDIT_PASSED===false,
   screen:{canvasHeight:canvas?.height??0,scrollWidth:document.documentElement.scrollWidth,
     innerWidth},
  };
 });
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaM12G5g=1&omegaQaState=combatGun',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('main[data-omega-protocol-internal="true"]').waitFor({timeout:25000});
  // Freeze the real encounter while original art is decoded and screenshots
  // are taken. Otherwise auto-fire can end the fixture before the dash input.
  await page.getByRole('button',{name:'일시정지'}).click();
  await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:30000});
  await page.evaluate(async()=>{
   const {omegaG5gNativePoseStudy}=await import('/src/ui/omega-protocol-m12g5g-native-pose.ts');
   // Pin same Vite module, use synchronous Playwright poll for 90ms events.
   window.__omegaG5gNativePoseQa=omegaG5gNativePoseStudy;
  });
  const original=await read();
  await page.screenshot({path:folder+'/m12g5g-SILVER-ORIGINAL-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  // Explicit user action: load the four existing SHA256-verified G5d WebPs,
  // then opt in. No downloaded/derived G5f/G5g local candidate file used.
  await page.locator('[data-omega-g5d-load="true"]').click();
  await page.locator('[data-omega-g5c-feedback="ready"]').waitFor({timeout:30000});
  await page.locator('[data-omega-g5c-toggle="true"]').click();
  const active=await read();
  await page.getByRole('button',{name:'계속하기'}).click();
  // Drive ACTUAL user DASH first, before the test target's live health can
  // fall to zero and a phase/reward prompt legitimately disables combat
  // inputs. The previous QA waited for several hits first and PC/tablet
  // sometimes reached a terminal encounter phase before Shift.
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(155);
  await page.keyboard.press('Shift');
  const dash=await (await page.waitForFunction(()=>{
   const e=window.__omegaG5gNativePoseQa.evidence();
   return e.counts.dash>0?{counts:e.counts,poseFrames:e.sourceFrames}:false;
  },null,{timeout:13000,polling:'raf'})).jsonValue();
  await page.keyboard.up('ArrowRight');
  // Real engine automatic gun fire and actual enemy HP loss; neither firing
  // nor enemy HP is synthesized from instrumentation.
  const fire=await (await page.waitForFunction(()=>{
   const e=window.__omegaG5gNativePoseQa.evidence();
   const hits=Number(document.querySelector('.omega-protocol-arena')
     ?.getAttribute('data-omega-qa-gun-hits')??0);
   return e.counts.fire>0&&hits>0?{counts:e.counts,poseFrames:e.sourceFrames,realNativeHits:hits}:false;
  },null,{timeout:18000,polling:'raf'})).jsonValue();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(550);
  const activeMoving=await read();
  await page.screenshot({path:folder+'/m12g5g-REAL-NATIVE-ACTION-POSE-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  await page.keyboard.up('ArrowRight');
  await page.locator('[data-omega-g5c-toggle="true"]').click();
  const restored=await read();
  await page.screenshot({path:folder+'/m12g5g-RESTORED-ORIGINAL-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  const pass=original.status==='sha-verified-4-walk-poses-reused-for-action'&&
   original.artGate==='source-derived-unapproved'&&
   original.silverReady==='true'&&original.nativeProbe==='combatGun'&&
   original.strictLocked&&original.pose.counts.fire===0&&
   original.pose.counts.dash===0&&
   active.reviewActive&&active.proofs.length===4&&
   active.proofs.every(x=>x.sha256.length===64&&x.toe>=480)&&
   fire.realNativeHits>0&&fire.counts.fire>0&&
   dash.counts.dash>0&&
   activeMoving.nativeX>original.nativeX+12&&
   activeMoving.pose.sourceFrames.fire.length>0&&
   activeMoving.pose.sourceFrames.dash.length>0&&
   activeMoving.walk.draws>0&&
   activeMoving.approval.actionIndependentPaintedSources===0&&
   !activeMoving.approval.commercialReleaseAllowed&&
   restored.reviewActive===false&&restored.strictLocked&&
   activeMoving.screen.canvasHeight>h*.52&&
   activeMoving.screen.scrollWidth<=w+3&&errors.length===0;
  const record={name,w,h,pass,original,active,fire,dash,
   activeMoving,restored:{preview:restored.reviewActive,locked:restored.strictLocked},
   errors,actualIndependentPaintedActionFrames:0,
   genuineFourOriginalWalkWebPsReused:true,realAndroidFPS:false};
  rows.push(record);
  if(!pass)throw Error('G5g native silver four-source action body QA failed: '+JSON.stringify(record));
  console.log('QA_PASS M12_G5G',name,JSON.stringify({
   sourceSHA:active.proofs.map(x=>x.sha256.slice(0,12)),
   fireSourceFrames:activeMoving.pose.sourceFrames.fire,
   dashSourceFrames:activeMoving.pose.sourceFrames.dash,
   realHits:fire.realNativeHits,realMovement:activeMoving.nativeX-original.nativeX,
   finalArtApproved:0,
  }));
 }catch(error){
  failures++;
  if(rows.at(-1)?.name!==name)rows.push({name,w,h,pass:false,error:String(error),errors});
  else{rows.at(-1).pass=false;rows.at(-1).error=String(error);}
  console.error('QA_FAIL M12_G5G',name,String(error));
  try{await page.screenshot({path:folder+'/m12g5g-FAIL-'+name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(folder+'/m12g5g-real-native-4-source-body-pose-report.json',JSON.stringify({
 failures,rows,
 originalPainterlyEWalkSHAValidated:true,
 independentPainterlyFireDashHitApproved:0,commercial160Approved:0,
 production320MasksApproved:0,mainMerged:false,productionDeployed:false,
},null,2));
if(failures)process.exitCode=1;
