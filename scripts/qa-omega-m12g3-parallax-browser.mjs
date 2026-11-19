#!/usr/bin/env node
/** M12-G3: real React+Canvas visuals, camera differential + per-frame CPU probe.
 * QA entry is dev-only; no teleport, no HP edits, no simulated Android FPS.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const dir=resolve('qa-omega-protocol-captures');await mkdir(dir,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const sizes=[['desktop',1440,900,false],['tablet',1024,768,true],
 ['portrait',390,844,true],['landscape',844,390,true]];
const results=[];let failures=0;
for(const [name,w,h,mobile] of sizes){
 const context=await browser.newContext({
  viewport:{width:w,height:h},deviceScaleFactor:1,
  ...(mobile?{isMobile:true,hasTouch:true}:{})
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1',
    {waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('main[data-omega-protocol-internal="true"]').waitFor({timeout:25000});
  await page.locator('.omega-protocol-arena canvas').waitFor({state:'visible'});
  await page.waitForTimeout(350);
  const independent=await page.evaluate(async ({w,h})=>{
   const field=await import('/src/domain/omega-protocol-field.ts');
   const cameraModule=await import('/src/ui/omega-protocol-camera.ts');
   const gfx=await import('/src/ui/omega-protocol-m12-parallax.ts');
   const plan=field.omegaFieldPlan(20261108,1),budget=gfx.omegaG3Budget(w,h);
   const base=cameraModule.omegaQuarterViewCamera(plan.entry,w,h,1.55);
   const advanced=cameraModule.omegaQuarterViewCamera({x:1010,y:675},w,h,1.55);
   const paths=['far','mid','near'].map(p=>({
    plane:p,base:gfx.omegaG3ParallaxShift(base,base,p),
    moved:gfx.omegaG3ParallaxShift(advanced,base,p),
   }));
   const distance=paths.map(v=>Math.hypot(v.moved.dx,v.moved.dy));
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)return {pass:false,reason:'Canvas 2d unavailable'};
   function render(c){
    ctx.clearRect(0,0,w,h);
    gfx.drawOmegaG3ParallaxArchitecture(ctx,plan,c,w,h,1.55,budget);
   }
   render(base);
   const sample=ctx.getImageData(0,0,w,Math.floor(h*.28)).data;
   let visible=0;const bins=new Set();
   for(let i=0;i<sample.length;i+=16){
    if(sample[i+3]>20){visible++;bins.add([sample[i]>>4,sample[i+1]>>4,sample[i+2]>>4].join(':'));}
   }
   const a=ctx.getImageData(0,0,w,Math.floor(h*.28)).data;
   render(advanced);
   const b=ctx.getImageData(0,0,w,Math.floor(h*.28)).data;
   let changed=0;for(let i=0;i<a.length;i+=16)
    if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])+Math.abs(a[i+3]-b[i+3])>18)changed++;
   // Software Chromium microbenchmark is an upper-budget smoke test,
   // NOT an Android device measured FPS or latency guarantee.
   const runs=[];for(let i=0;i<15;i++){
    const start=performance.now();render(i%2?base:advanced);
    runs.push(performance.now()-start);
   }
   runs.sort((a,b)=>a-b);const medianMs=runs[7];
   const canvasNative=document.createElement('canvas');
   canvasNative.width=1400;canvasNative.height=900;
   const native=canvasNative.getContext('2d',{willReadFrequently:true});
   const obstacle=plan.obstacles.find(o=>o.id==='scaffold');
   gfx.drawOmegaG3NativeMesh(native,plan,obstacle,budget);
   const nativePixels=native.getImageData(565,585,190,210).data;
   let nativeInk=0;for(let i=3;i<nativePixels.length;i+=16)
    if(nativePixels[i]>4)nativeInk++;
   const pass=distance[0]>0&&distance[0]<distance[1]&&distance[1]<distance[2]&&
    visible>300&&bins.size>=5&&changed>50&&nativeInk>50&&medianMs<120;
   return {pass,budget,distances:distance,changedPixels:changed,
    parallaxInk:visible,parallaxBins:bins.size,nativeInk,medianMs,
    deviceFpsClaim:false,physicalAndroidQA:false};
  },{w,h});
  const arena=page.locator('.omega-protocol-arena');
  const before=Number(await arena.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(470);
  await page.keyboard.up('ArrowRight');await page.waitForTimeout(100);
  const after=Number(await arena.getAttribute('data-omega-player-x'));
  await page.screenshot({path:dir+'/m12g3-live-'+name+'-'+w+'x'+h+'.png',
   fullPage:false,animations:'disabled'});
  const layout=await page.evaluate(()=>({
   width:innerWidth,doc:document.documentElement.scrollWidth,
   canvasHeight:document.querySelector('.omega-protocol-arena canvas')?.getBoundingClientRect().height,
  }));
  const pass=independent.pass&&after>before+2&&layout.doc<=layout.width+3&&
   layout.canvasHeight>140&&errors.length===0;
  const result={name,w,h,pass,independent,moveDistance:after-before,layout,errors};
  results.push(result);
  if(!pass)throw Error(JSON.stringify(result));
  console.log('QA_PASS M12_G3',name,JSON.stringify({changed:independent.changedPixels,
   distances:independent.distances,medianMs:independent.medianMs,move:after-before}));
 }catch(error){
  failures++;
  if(results.at(-1)?.name!==name)results.push({name,w,h,pass:false,error:String(error),errors});
  else{results.at(-1).pass=false;results.at(-1).error=String(error);}
  console.error('QA_FAIL M12_G3',name,String(error));
  try{await page.screenshot({path:dir+'/m12g3-FAIL-'+name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(dir+'/m12g3-parallax-browser-report.json',JSON.stringify({
 failures,results,commercialArtApproved:false,androidHardwareQA:false},null,2));
if(failures)process.exitCode=1;
