#!/usr/bin/env node
/** Real SIGNAL WATCH core: eight original silver AIRA source sprites must
 * reach the actual player Canvas draw, not just OMEGA wrapper or fake QA.
 * Never approves NW geometry, 160 animation frames, Android, or Production.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const out=resolve('qa-omega-protocol-captures');await mkdir(out,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[],screens=[];
page.on('pageerror',e=>errors.push(String(e)));
let report={pass:false};
const entry='http://127.0.0.1:4173/?omegaSilverPreview=repo';
try{
 await page.goto(entry,{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('.rg-home[data-omega-silver-preview="ready"]').waitFor({timeout:26000});
 const modes=await page.locator('.rg-mission-grid .rg-card').count();
 if(modes!==2)throw Error('Expected exactly SIGNAL GUARD and SIGNAL WATCH');
 await page.locator('.rg-card.is-watch').click();
 const watch=page.locator('.survivors-container');
 await watch.waitFor({timeout:30000});
 await page.locator('.survivors-container[data-omega-silver-native-watch="ready"]')
  .waitFor({timeout:30000});
 // Do not assert that a loaded image means an actual player draw. Enter a
 // real Watch battle and require the marker set only in the Canvas branch.
 const launch=page.locator('.survivors-ready-launch .survivors-btn-primary');
 await launch.waitFor({timeout:20000});
 await page.waitForFunction(()=>{
  const button=document.querySelector('.survivors-ready-launch .survivors-btn-primary');
  return button instanceof HTMLButtonElement&&!button.disabled;
 },undefined,{timeout:30000});
 await launch.click();
 await page.waitForFunction(()=>{
  const scene=document.querySelector('.survivors-canvas');
  const root=document.querySelector('.survivors-container');
  return scene instanceof HTMLCanvasElement&&
   scene.dataset.omegaSilverWatchPainted==='true'&&
   root?.getAttribute('data-omega-silver-native-watch')==='ready';
 },undefined,{timeout:30000});
 // A single successful render is insufficient: send real keyboard commands
 // through the native Watch controller and require each painted 8-way source.
 // This tests idle source selection during authentic engine motion, NOT
 // independently painted walk/fire/dash/hit animations.
 const directions=[
  ['E',['ArrowRight']],
  ['SE',['ArrowRight','ArrowDown']],
  ['S',['ArrowDown']],
  ['SW',['ArrowLeft','ArrowDown']],
  ['W',['ArrowLeft']],
  ['NW',['ArrowLeft','ArrowUp']],
  ['N',['ArrowUp']],
  ['NE',['ArrowRight','ArrowUp']],
 ];
 const directionSamples=[];
 for(const [heading,keys] of directions){
  try{
   for(const key of keys)await page.keyboard.down(key);
   await page.waitForFunction(expected=>{
    const canvas=document.querySelector('.survivors-canvas');
    return canvas instanceof HTMLCanvasElement&&
     canvas.dataset.omegaSilverWatchPainted==='true'&&
     canvas.dataset.omegaSilverWatchHeading===expected&&
     canvas.dataset.omegaSilverWatchAction==='walk'&&
     canvas.dataset.omegaSilverWatchActionArt==='neutral-original-only';
   },heading,{timeout:5000});
   const actual=await page.locator('.survivors-canvas')
    .getAttribute('data-omega-silver-watch-heading');
   directionSamples.push({heading,actual,realWatchKeyboardMovement:true});
  }finally{
   for(const key of keys)await page.keyboard.up(key);
  }
 }
 if(directionSamples.length!==8)throw Error('Not all 8 real Watch sprite headings passed');
 await page.waitForFunction(()=>{
  const canvas=document.querySelector('.survivors-canvas');
  return canvas instanceof HTMLCanvasElement&&
   canvas.dataset.omegaSilverWatchAction==='idle'&&
   canvas.dataset.omegaSilverWatchActionArt==='neutral-original-only';
 },undefined,{timeout:5000});
 const idleCueVerified=true;
 const sizes=[['desktop',1440,900],['phone-portrait',390,844],['phone-landscape',844,390]];
 for(const [name,width,height] of sizes){
  await page.setViewportSize({width,height});
  await page.waitForTimeout(200);
  const data=await page.evaluate(()=>({
   painted:document.querySelector('.survivors-canvas')?.getAttribute('data-omega-silver-watch-painted'),
   preview:document.querySelector('.survivors-container')?.getAttribute('data-omega-silver-native-watch'),
   overflow:document.documentElement.scrollWidth>innerWidth+12,
  }));
  if(data.painted!=='true'||data.preview!=='ready'||data.overflow)
   throw Error('Actual native SIGNAL WATCH AIRA actor did not survive viewport '+name+' '+JSON.stringify(data));
  const filename='AIRA-SILVER-REAL-NATIVE-WATCH-'+name+'.png';
  await page.screenshot({path:resolve(out,filename),fullPage:true});
  screens.push({name,width,height,filename});
 }
 report={pass:errors.length===0,originalArtwork:true,
  realSignalWatchPlayerCanvas:true,all8SourceViewsVerifiedByLoader:true,
  originalNeutralPosesOnly:true,independentActionAnimationApproved:false,
  liveProductionChanged:false,actualAndroidHardwareTested:false,
  screenshotsAreSynthetic:false,viewportChecks:screens.length,screens,
  realKeyboardEightHeadingChecks:directionSamples.length,
  realNativeWalkAndIdleCueVerified:idleCueVerified,
  originalActionFramesImplemented:false,directionSamples,errors};
 if(errors.length)process.exitCode=1;
 console.log(report.pass?'QA_PASS':'QA_FAIL','REAL native Watch silver AIRA verified source draw',JSON.stringify({
  painted:true,directions:directionSamples.length,viewports:screens.length,production:false,errors}));
}catch(e){report={pass:false,error:String(e),errors,screens};process.exitCode=1;
 console.error('QA_EXCEPTION','Real native Watch original silver art',String(e));
}finally{
 await writeFile(resolve(out,'silver-REAL-native-Watch-source-qa.json'),JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
