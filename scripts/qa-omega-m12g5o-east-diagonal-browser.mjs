#!/usr/bin/env node
/**
 * M12-G5o real Canvas: silver source preview East action & 8-direction
 * diagonal 4-frame interim fallback. All activity comes from native Watch
 * movement, firing and dash, not fabricating action flags.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const dir=resolve('qa-omega-protocol-captures');await mkdir(dir,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const output=[];let failures=0;
async function recordFrames(page,ms=1200){
 return page.evaluate(duration=>new Promise(resolve=>{
  const seen=new Set(),requestedSeen=new Set(),nativeAges=[],states=[],begin=performance.now();
  function poll(){
   const canvas=document.querySelector('.omega-protocol-arena canvas');
   const arena=document.querySelector('.omega-protocol-arena');
   const d=canvas?.dataset;
   const requested=d?.omegaSceneArtRequestedFrame||'';
   const displayed=d?.omegaSceneArtFrame||'';
   if(requested===displayed&&requested)seen.add(requested);
   if(requested)requestedSeen.add(requested);
   if(d?.omegaSceneArtNativeAction==='fire'&&nativeAges.length<40)
    nativeAges.push({requested,displayed,age:d.omegaSceneArtActionAge});
   if(states.length<28&&d)states.push({
    head:d.omegaSceneArtHeading,requested,displayed,
    derived:d.omegaSceneArtDiagonalFallback,native:d.omegaSceneArtNativeAction,
    x:Number(arena?.dataset.omegaPlayerX),
    y:Number(arena?.dataset.omegaPlayerY),
   });
   if(performance.now()-begin>=duration){resolve({seen:[...seen],requested:[...requestedSeen],nativeAges,states});return}
   requestAnimationFrame(poll);
  }requestAnimationFrame(poll);
 }),ms);
}
async function scene(page,url){
 await page.goto('http://127.0.0.1:4173/'+url,{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('main[data-omega-protocol-internal="true"]').waitFor({timeout:30000});
 await page.waitForFunction(()=>Boolean(
  document.querySelector('.omega-protocol-arena canvas')?.dataset.omegaSceneArtFrame),
  null,{timeout:18000,polling:100});
}
for(const [name,width,height,mobile] of [
 ['desktop',1440,900,false],['tablet',1024,768,true],
 ['portrait',390,844,true],['landscape',844,390,true],
]){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,
  ...(mobile?{hasTouch:true,isMobile:true}:{})});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 try{
  await scene(page,'?omegaLab=1&omegaSceneArt=1');
  const original=await page.evaluate(()=>{
   const d=document.querySelector('.omega-protocol-arena canvas')?.dataset;
   return {source:d?.omegaSceneArtFrame,requested:d?.omegaSceneArtRequestedFrame};
  });
  const diag=[];
  for(const [a,b,side] of [
   ['ArrowRight','ArrowUp','E'],['ArrowRight','ArrowDown','E'],
   ['ArrowLeft','ArrowUp','W'],['ArrowLeft','ArrowDown','W']
  ]){
   const before=await page.locator('.omega-protocol-arena').evaluate(node=>({
    x:Number(node.getAttribute('data-omega-player-x')),
    y:Number(node.getAttribute('data-omega-player-y')),
   }));
   await page.keyboard.down(a);await page.keyboard.down(b);
   const sampled=await recordFrames(page,1200);
   await page.keyboard.up(a);await page.keyboard.up(b);
   const after=await page.locator('.omega-protocol-arena').evaluate(node=>({
    x:Number(node.getAttribute('data-omega-player-x')),
    y:Number(node.getAttribute('data-omega-player-y')),
   }));
   const variants=sampled.seen.filter(s=>new RegExp('^walk-'+side+'-[0-3]$').test(s));
   const movement=Math.hypot(after.x-before.x,after.y-before.y);
   if(new Set(variants).size<2||movement<.5)
    throw Error('Diagonal moving source did not animate while world position changed: '+
     JSON.stringify({a,b,movement,variants,states:sampled.states.slice(-4)}));
   diag.push({a,b,side,sourceFrames:[...new Set(variants)],movement});
  }
  await page.screenshot({path:dir+'/m12g5o-diagonal-'+name+'.png',animations:'disabled'});
  // Second REAL native Watch fixture: it supplies no fake art flags. All
  // E action pixels are triggered by the engine's real session signals.
  await scene(page,'?omegaLab=1&omegaSceneArt=1&omegaQaState=combatGun');
  await page.evaluate(async()=>{window.__g5oScene=(await import('/src/ui/omega-scene-art-preview.ts'));});
  await page.waitForFunction(()=>window.__g5oScene?.omegaScenePreloadStatus().readyEast===12,
    null,{timeout:15000,polling:100});
  const arena=page.locator('.omega-protocol-arena');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(170);
  await page.keyboard.press('Shift');
  const combat=await recordFrames(page,2600);
  await page.keyboard.up('ArrowRight');
  const requested=combat.seen.filter(x=>/^(fire|dash)-E-[0-3]$/.test(x));
  const actionSet=[...new Set(requested)];
  const observed={fire:actionSet.filter(x=>x.startsWith('fire-E-')),
   dash:actionSet.filter(x=>x.startsWith('dash-E-'))};
  const requestedEast=combat.requested.filter(x=>/^(fire|dash)-E-[0-3]$/.test(x));
  const nativeHits=Number(await arena.getAttribute('data-omega-qa-gun-hits')||0);
  if(observed.dash.length<1||observed.fire.length<1||nativeHits<1)
   throw Error('Actual Watch E DASH and FIRE frames must render: '+
    JSON.stringify({observed,requestedEast,nativeAges:combat.nativeAges,nativeHits,samples:combat.states.slice(-6)}));
  // Source WebP decode is independently verified, not merely file naming.
  const decoded=await page.evaluate(async()=>{
   const names=['fire','dash','hit'].flatMap(kind=>Array.from({length:4},(_,i)=>
    '/assets/omega/scene-art-preview/'+kind+'-E-'+i+'.webp'));
   return Promise.all(names.map(src=>new Promise((resolve,reject)=>{
    const im=new Image();im.onload=()=>resolve({src,width:im.naturalWidth,height:im.naturalHeight});
    im.onerror=()=>reject(new Error('Real E action source not decoded: '+src));im.src=src;
   })));
  });
  if(decoded.length!==12||decoded.some(x=>x.width!==640||x.height!==512))
   throw Error('12 original SHA candidate image dimensions not decoded');
  await page.screenshot({path:dir+'/m12g5o-east-combat-'+name+'.png',
   fullPage:false,animations:'disabled'});
  const view=await page.evaluate(()=>({documentWidth:document.documentElement.scrollWidth,
    viewport:window.innerWidth}));
  if(view.documentWidth>view.viewport+3||errors.length)
   throw Error('Overflow or console JS errors '+JSON.stringify({view,errors}));
  const row={name,pass:true,original,diag,observed,requestedEast,nativeAges:combat.nativeAges,nativeHits,
   decodedCount:decoded.length,layout:view,errors,artApproved:false};
  output.push(row);console.log('QA_PASS M12_G5O',name,JSON.stringify(row));
 }catch(e){
  failures++;output.push({name,pass:false,error:String(e),errors});
  console.error('QA_FAIL M12_G5O',name,String(e));
  try{await page.screenshot({path:dir+'/m12g5o-FAIL-'+name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(dir+'/m12g5o-native-east-diagonal-report.json',
 JSON.stringify({failures,output,sourceArtApproved:false,diagonalPaintedFramesApproved:0,
  commercialReleaseAllowed:false,mainMerged:false,productionDeployed:false},null,2));
if(failures)process.exitCode=1;
