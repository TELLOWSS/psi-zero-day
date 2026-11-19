#!/usr/bin/env node
/** M12-G5m: REAL G5d SHA-pinned AIRA silver E-walk 4 WebPs in React review modal.
 * This deliberately DOES NOT substitute fake 12-action or 16-infected files.
 * Real four-device emulation is not an Android physical-device FPS test.
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
const rows=[];let failures=0;
for(const [name,w,h,mobile] of [
 ['desktop',1440,900,false],['tablet',1024,768,true],
 ['portrait',390,844,true],['landscape',844,390,true],
]){
 const context=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,
  ...(mobile?{hasTouch:true,isMobile:true}:{})});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaM12G5d=1&omegaQaState=combatGun',
    {waitUntil:'domcontentloaded',timeout:45000});
  const main=page.locator('main[data-omega-protocol-internal="true"]');
  await main.waitFor({timeout:25000});
  await page.getByRole('button',{name:'일시정지'}).click({timeout:20000});
  await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:30000});
  const auditButton=page.locator('[data-omega-g5m-walk-review="true"]');
  if(await auditButton.isEnabled())throw Error('Review became enabled before SHA verified 4 original WebPs');
  await page.locator('[data-omega-g5d-load="true"]').click();
  await page.locator('[data-omega-g5c-feedback="ready"]').waitFor({timeout:30000});
  await auditButton.waitFor({state:'visible'});
  if(!(await auditButton.isEnabled()))throw Error('Verified SHA original art did not enable walk review');
  const proof=await page.evaluate(async()=>{
   const {omegaG5cReview}=await import('/src/ui/omega-protocol-m12g5c-local-art-review.ts');
   const {OMEGA_G5D_ACTUAL_E_WALK}=await import('/src/ui/omega-protocol-m12g5d-actual-source.ts');
   return {
    hashes:omegaG5cReview.sessionProof?.assets.map(x=>x.sha256)??[],
    expected:OMEGA_G5D_ACTUAL_E_WALK.map(x=>x.sha256),
    artworkSignoff:omegaG5cReview.sessionProof?.artworkSignoff??null,
    sourceFiles:omegaG5cReview.sessionProof?.assets.map(x=>x.file)??[],
   };
  });
  if(proof.hashes.length!==4||JSON.stringify(proof.hashes)!==JSON.stringify(proof.expected)||
     proof.artworkSignoff!==false)throw Error('Original 4 exact SHA or unapproved gate failed '+JSON.stringify(proof));
  const arena=page.locator('.omega-protocol-arena');
  const before=await arena.evaluate(el=>({
   x:el.getAttribute('data-omega-player-x'),
   hits:el.getAttribute('data-omega-qa-gun-hits'),
  }));
  await auditButton.click();
  const dialog=page.locator('[data-omega-g5k-audit="walk"]');
  await dialog.waitFor({timeout:10000});
  if(await dialog.locator('[data-omega-g5l-pose]').count()!==4)
   throw Error('The four source thumbnails are not distinct and visible');
  const checked=[];
  for(let i=0;i<4;i++){
   if(i>0)await page.getByRole('button',{name:'다음 원화 프레임'}).click();
   await page.waitForFunction(expected=>{
    const pane=document.querySelector('[data-omega-g5k-audit="walk"]');
    if(!pane||pane.querySelector('[data-omega-g5l-frame]')?.getAttribute('data-omega-g5l-frame')!==String(expected))return false;
    const images=[...pane.querySelectorAll('.omega-art-audit-card .omega-art-audit-stage img')];
    return images.length===2&&images.every(x=>x.complete&&x.naturalWidth===384&&x.naturalHeight===512);
   },i,{timeout:16000,polling:100});
   const actual=await dialog.locator('.omega-art-audit-card').last().getAttribute('data-omega-g5k-frame');
   const expected='aira-east-walk-'+i+'.webp';
   if(actual!==expected)throw Error('Wrong live source '+actual+' expected '+expected);
   checked.push(actual);
   await page.screenshot({path:folder+'/m12g5m-REAL-WALK-'+name+'-pose-'+i+'.png',
    fullPage:false,animations:'disabled'});
  }
  // Left/right keyboard should change ONLY the manual frame selection, not
  // resume or dash the live Watch engine under the fixed overlay.
  await page.keyboard.press('ArrowRight');
  if(await dialog.locator('[data-omega-g5l-frame]').getAttribute('data-omega-g5l-frame')!=='0')
   throw Error('ArrowRight did not wrap frame 3→0');
  await page.keyboard.press('ArrowLeft');
  if(await dialog.locator('[data-omega-g5l-frame]').getAttribute('data-omega-g5l-frame')!=='3')
   throw Error('ArrowLeft did not wrap frame 0→3');
  await page.keyboard.press('Shift');
  await page.keyboard.press('f');
  await page.keyboard.press('q');
  const during=await arena.evaluate(el=>({
   x:el.getAttribute('data-omega-player-x'),
   hits:el.getAttribute('data-omega-qa-gun-hits'),
  }));
  if(before.x!==during.x||before.hits!==during.hits)
   throw Error('Paused game changed while reviewer keys were active '+JSON.stringify({before,during}));
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'detached',timeout:10000});
  const resume=page.getByRole('button',{name:'계속하기'});
  if(!(await resume.isVisible()))throw Error('Review exit unexpectedly resumed game');
  const dimension=await page.evaluate(()=>({
   width:document.documentElement.scrollWidth,
   viewport:window.innerWidth,
   originalAuditCount:document.querySelectorAll('[data-omega-g5k-audit]').length,
  }));
  if(dimension.width>dimension.viewport+3||dimension.originalAuditCount!==0||errors.length)
   throw Error('Layout overflow or page JS error '+JSON.stringify({dimension,errors}));
  rows.push({name,w,h,pass:true,proof:{sha256Matches:4,artworkSignoff:false},
   frames:checked,keyboardBlocked:true,gameStillPaused:true,dimension,pageErrors:errors});
  console.log('QA_PASS M12_G5M',name,JSON.stringify(rows.at(-1)));
 }catch(error){
  failures++;rows.push({name,w,h,pass:false,error:String(error),errors});
  console.error('QA_FAIL M12_G5M',name,String(error));
  try{await page.screenshot({path:folder+'/m12g5m-FAIL-'+name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(folder+'/m12g5m-real-4-source-review-report.json',
 JSON.stringify({failures,rows,sourceFourShaVerified:true,productionApproved:false,
  actual12ActionAssetsAvailable:false,actual16InfectedAssetsAvailable:false,
  androidHardwareTested:false,mainMerged:false,productionDeployed:false},null,2));
if(failures)process.exitCode=1;
