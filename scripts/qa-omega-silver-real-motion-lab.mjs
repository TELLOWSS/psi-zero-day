#!/usr/bin/env node
/** REAL user-selected silver AIRA source art and male M01.
 * This runs the review cockpit in GitHub Actions Chromium at 4 viewport
 * sizes; it does not claim production-ready animations or real Android QA.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const out=resolve('qa-omega-protocol-captures');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[],screens=[];
page.on('pageerror',e=>errors.push(String(e)));
let result={pass:false};
try{
 await page.goto('http://127.0.0.1:4173/omega-canonical-art-review/motion-lab.html',
  {waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('body[data-assets-ready="ready"]').waitFor({timeout:20000});
 const label=await page.locator('#loaded').innerText();
 if(label!=='9 / 9')throw Error('Nine authentic WebPs not loaded: '+label);
 const viewports=[
  ['desktop',1440,900],['phone',390,844],
  ['landscape',844,390],['tablet',820,1180],
 ];
 for(const [name,width,height] of viewports){
  await page.setViewportSize({width,height});
  await page.locator('button[data-heading="NW"]').click();
  await page.locator('button[data-action="walk"]').click();
  await page.waitForTimeout(125);
  const data=await page.evaluate(()=>({
   loaded:document.body.dataset.assetsReady,heading:document.body.dataset.heading,
   action:document.body.dataset.action,scroll:document.documentElement.scrollWidth,
   hasCanvas:!!document.querySelector('canvas'),
  }));
  if(data.loaded!=='ready'||data.heading!=='NW'||data.action!=='walk'||
     data.scroll>width+12||!data.hasCanvas)
   throw Error('Broken responsive original source review '+name+': '+JSON.stringify(data));
  const filename='AIRA-SILVER-REAL-MOTION-'+name+'-'+width+'x'+height+'.png';
  await page.screenshot({path:resolve(out,filename),fullPage:true});
  screens.push({viewport:name,width,height,filename,realImages:true,
   approvedEightWayArt:false});
 }
 await page.setViewportSize({width:1440,height:900});
 const tested=[];
 for(const [heading,action] of [['S','idle'],['S','walk'],['S','fire'],
  ['E','dash'],['N','hit'],['NW','ultimate'],['NE','finish']]){
  await page.locator('button[data-heading="'+heading+'"]').click();
  await page.locator('button[data-action="'+action+'"]').click();
  await page.waitForTimeout(90);
  if(await page.locator('body').getAttribute('data-heading')!==heading||
     await page.locator('body').getAttribute('data-action')!==action)
   throw Error('Native image did not switch to original '+heading+'/'+action);
  const filename='AIRA-SILVER-REAL-'+heading+'-'+action+'.png';
  await page.locator('#battle').screenshot({path:resolve(out,filename)});
  tested.push({heading,action,filename});
 }
 await page.locator('#male').click();
 if(await page.locator('body').getAttribute('data-character')!=='M01')
  throw Error('Male candidate review unavailable');
 if(!(await page.locator('button[data-action="fire"]').isDisabled()))
  throw Error('Single neutral male candidate falsely has full action sprites');
 await page.screenshot({path:resolve(out,'OMEGA-M01-REAL-review.png'),fullPage:true});
 await page.locator('#female').click();
 await page.locator('button[data-heading="W"]').click();
 await page.keyboard.press('ArrowRight');
 if(await page.locator('body').getAttribute('data-heading')!=='E')
  throw Error('Keyboard turn not working');
 result={pass:errors.length===0,originalArtFiles:9,characters:2,
  viewportScreenshots:screens.length,actionStates:tested.length,
  originalSourceArt:true,notSynthetic:true,
  screenshotType:'original GitHub image interactive review cockpit',
  nativeWatchOrGuardGameplayTest:false,realAndroidDeviceTested:false,
  allEightDirectionsApproved:false,independentActionFramesApproved:false,
  productionDeployAllowed:false,screens,tested,errors};
 if(errors.length)process.exitCode=1;
 console.log(result.pass?'QA_PASS':'QA_FAIL','Nine ORIGINAL source-art motion lab',JSON.stringify({
  pass:result.pass,viewports:screens.length,actions:tested.length,male:true,
  originalSources:true,approved:false,errors}));
}catch(e){result={pass:false,error:String(e),screens,errors};process.exitCode=1;
 console.error('QA_EXCEPTION','Nine original AIRA/M01 source motion lab',String(e));
}finally{
 await writeFile(resolve(out,'silver-REAL-motion-lab-report.json'),JSON.stringify(result,null,2));
 await page.close();await browser.close();
}
