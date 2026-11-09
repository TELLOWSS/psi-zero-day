#!/usr/bin/env node
/** SOURCE-BROWSER test of the actual committed three-illustration AIRA study.
 * This is not a fake in-game screenshot, and it does not authorize the final
 * 160 independent production sprite frames / 320 masks.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('qa-omega-protocol-captures');
await mkdir(root,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const page=await browser.newPage({viewport:{width:820,height:390},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
let report={pass:false};
try{
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',
  {waitUntil:'domcontentloaded',timeout:45000});
 const result=await page.evaluate(async()=>{
  const {OMEGA_AIRA_E_FIRE_STUDY,OmegaAiraV2FireFrames,
   omegaAiraFireKeyframeAt}=await import('/src/ui/omega-aira-v2-fire-frames.ts');
  const source=new Image();source.src=OMEGA_AIRA_E_FIRE_STUDY.path;
  await source.decode();
  if(source.naturalWidth!==720||source.naturalHeight!==240)
   throw new Error('Committed atlas image dimensions are invalid');
  const renderer=new OmegaAiraV2FireFrames();
  renderer.prepare();
  const deadline=performance.now()+12000;
  while(!renderer.ready&&performance.now()<deadline){
   await new Promise(resolve=>setTimeout(resolve,60));
  }
  if(!renderer.ready)throw new Error('Game renderer did not accept decoded SVG/WebP art');
  const sheet=document.createElement('canvas');
  sheet.width=3*250;sheet.height=2*250;
  const ctx=sheet.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw new Error('No 2D context');
  ctx.fillStyle='#0a1423';ctx.fillRect(0,0,sheet.width,sheet.height);
  const proof=[];
  const base={facingX:1,facingY:0,moving:false,shooting:true,
   dashing:false,hurt:false,finished:false,ultimate:false,time:3.1};
  for(const [index,age] of [0,.075,.14].entries()){
   const pose=document.createElement('canvas');pose.width=240;pose.height=240;
   const g=pose.getContext('2d',{willReadFrequently:true});
   if(!g)throw new Error('No frame proof context');
   g.save();g.translate(120,238);
   const drawn=renderer.draw(g,'E',{...base,actionAge:age},205);
   g.restore();
   if(!drawn)throw new Error('Live renderer refused frame '+index);
   const pixels=g.getImageData(0,0,240,240).data;
   let ink=0,hash=2166136261,alphaXor=0;
   for(let k=0;k<pixels.length;k+=4){
    if(pixels[k+3]>32)ink++;
    for(let c=0;c<4;c++)hash=Math.imul(hash^pixels[k+c],16777619)>>>0;
    alphaXor^=pixels[k+3];
   }
   const x=index*250;
   ctx.fillStyle='#20374c';ctx.fillRect(x+4,4,242,240);
   ctx.drawImage(pose,x+5,6);
   ctx.fillStyle='#d7eaf3';ctx.font='bold 14px sans-serif';
   ctx.fillText(['01 AIM','02 SHOT','03 RECOVER'][index],x+22,268);
   // Lower row is the ACTUAL unmodified source WebP cropped by frame.
   ctx.drawImage(source,index*240,0,240,240,x+5,278,200,200);
   proof.push({frame:index,age,selectedIndex:omegaAiraFireKeyframeAt(age),
    ink,hash:hash.toString(16),alphaXor});
  }
  const distinct=new Set(proof.map(p=>p.hash)).size===3;
  const nonempty=proof.every(p=>p.ink>1100&&p.ink<240*240*.72);
  const framesCorrect=proof.every(p=>p.selectedIndex===p.frame);
  // Don't silently show one frame in all directions.
  const noMirror=!renderer.draw(ctx,'W',{...base,actionAge:.07},140);
  const noFalseShot=!renderer.draw(ctx,'E',{...base,shooting:false,actionAge:.07},140);
  return {png:sheet.toDataURL('image/png'),report:{
   pass:distinct&&nonempty&&framesCorrect&&noMirror&&noFalseShot,
   actualSource:true,realGameFrameSelector:true,illustratedKeyframes:3,
   approved160FrameSet:false,allEightFireHeadingsApproved:false,
   sourcePath:OMEGA_AIRA_E_FIRE_STUDY.path,
   distinct,nonempty,framesCorrect,noMirror,noFalseShot,proof,
  }};
 });
 await writeFile(resolve(root,'aira-v2-e-fire-actual-source-3frames.png'),
  Buffer.from(result.png.split(',')[1],'base64'));
 report={...result.report,errors};
 if(!report.pass||errors.length)process.exitCode=1;
 console.log(report.pass&&!errors.length?'QA_PASS':'QA_FAIL',
  'AIRA V2 original E fire atlas',JSON.stringify(report));
}catch(e){
 report={pass:false,error:String(e),errors};process.exitCode=1;
 console.error('QA_EXCEPTION','AIRA V2 E firing source',String(e));
}finally{
 await writeFile(resolve(root,'aira-v2-e-fire-actual-source-report.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
