#!/usr/bin/env node
/**
 * Browser-source QA for the ACTUAL SIGNAL GUARD SVG battlefield (not OMEGA).
 * Uses GitHub-committed SHA256-pinned silver AIRA S original, only in Vite DEV
 * with ?omegaSilverPreview=repo. Guard has NO player-controlled 8-way actor.
 * These screenshots are responsive browser simulation, not physical devices.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const out=resolve('qa-omega-protocol-captures');await mkdir(out,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const errors=[],screens=[];let result={pass:false};
async function enterGuard(page){
 await page.locator('.rg-card.is-guard').click();
 await page.locator('[data-defense-screen="guard-home"]').waitFor({timeout:25000});
 await page.locator('[data-guard-stage]').first().locator('button').first().click();
 await page.locator('[data-defense-screen="support-select"]').waitFor({timeout:20000});
 await page.locator('[data-support="COORDINATOR"]').click();
 await page.locator('[data-defense-screen="combat"][data-reignition-mode="guard-v2"]')
  .waitFor({timeout:25000});
}
try{
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen'));
 await page.goto('http://127.0.0.1:4173/?omegaSilverPreview=repo',
  {waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('.rg-home[data-omega-silver-preview="ready"]').waitFor({timeout:30000});
 await enterGuard(page);
 await page.locator('[data-omega-silver-guard-review="svg-loaded"]').waitFor({timeout:30000});
 const image=page.locator('.zb-board image[data-omega-silver-guard-source="sha256-verified-south"]');
 const inspected=await image.evaluate(element=>{
  if(!(element instanceof SVGImageElement))return {valid:false};
  const r=element.getBoundingClientRect(),bbox=element.getBBox();
  return {
   valid:true,href:element.getAttribute('href'),
   width:bbox.width,height:bbox.height,paintRect:r.width*r.height,
   marker:element.closest('[data-omega-silver-guard-review]')?.getAttribute('data-omega-silver-guard-heading'),
  };
 });
 if(!inspected.valid||!inspected.href?.startsWith('blob:')||
    inspected.marker!=='S'||inspected.width!==51||
    inspected.height!==68||inspected.paintRect<=0)
  throw Error('Original AIRA did not reach the real Guard battlefield SVG '+JSON.stringify(inspected));
 for(const [name,width,height] of [
  ['desktop',1440,900],['portrait',390,844],['landscape',844,390]]){
  await page.setViewportSize({width,height});
  await page.waitForTimeout(250);
  const probe=await page.evaluate(()=>{
   const board=document.querySelector('.zb-board');
   const operator=document.querySelector('[data-omega-silver-guard-review]');
   return {
    current:operator?.getAttribute('data-omega-silver-guard-review'),
    actor:operator?.getAttribute('data-omega-silver-guard-role'),
    map:document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-map'),
    overflow:document.documentElement.scrollWidth>innerWidth+12,
    displayed:!!board&&!!operator&&operator.closest('svg')===board,
   };
  });
  if(probe.current!=='svg-loaded'||probe.actor!=='noncombat-observer'||
     !probe.displayed||probe.overflow)
   throw Error('AIRA Guard source viewport invalid '+name+' '+JSON.stringify(probe));
  const filename='AIRA-SILVER-REAL-GUARD-'+name+'.png';
  await page.screenshot({path:resolve(out,filename),fullPage:true});
  screens.push({name,width,height,filename,actualGuardSvg:true});
 }
 await page.locator('.zb-start-wave').click();
 await page.waitForFunction(()=>{
  const shell=document.querySelector('[data-defense-screen="combat"]');
  return Number(shell?.getAttribute('data-tick'))>3;
 },undefined,{timeout:25000});
 if(await page.locator('[data-omega-silver-guard-review="svg-loaded"]').count()!==1)
  throw Error('AIRA source disappeared during a real Guard wave');
 // An ordinary user URL must have ZERO silver observer in the actual game.
 const other=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const baseline=await other.newPage();
 await baseline.addInitScript(()=>localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen'));
 await baseline.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:45000});
 await enterGuard(baseline);
 if(await baseline.locator('[data-omega-silver-guard-review]').count()!==0)
  throw Error('AIRA review leaked into the normal Guard game');
 await other.close();
 result={pass:errors.length===0,realSignalGuardBattlefieldSvg:true,
   originalSouthArtworkOnly:true,realGuardWaveRunning:true,
   noPublicPreview:true,realActionAnimationsComplete:false,
   realAndroidDeviceTested:false,productionChanged:false,
   screenChecks:screens.length,screens,errors};
 if(errors.length)process.exitCode=1;
 console.log(result.pass?'QA_PASS':'QA_FAIL',
  'Real Guard in-world silver original review '+JSON.stringify({
   source:'SHA256-original-S',wave:true,viewports:screens.length,main:false,errors}));
 await ctx.close();
}catch(error){
 result={pass:false,error:String(error),screens,errors};
 process.exitCode=1;console.error('QA_EXCEPTION','real Guard original AIRA review',String(error));
}finally{
 await writeFile(resolve(out,'silver-REAL-Guard-source-qa.json'),JSON.stringify(result,null,2));
 await browser.close();
}
