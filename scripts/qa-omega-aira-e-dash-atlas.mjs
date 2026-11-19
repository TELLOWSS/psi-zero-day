#!/usr/bin/env node
/** Actual Chromium source test of the committed AIRA V2 E direction dash.
 * The real game candidate renderer is used, not a recreated animation mock.
 * This independently checks 3 original key poses and refuses to mirror them
 * into seven missing directions. NOT final 8x20 production art approval.
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
const page=await browser.newPage({viewport:{width:900,height:580},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
let report={pass:false};
try{
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',
  {waitUntil:'domcontentloaded',timeout:45000});
 const output=await page.evaluate(async()=>{
  const {OMEGA_AIRA_E_DASH_STUDY,OmegaAiraV2DashFrames,
   omegaAiraDashKeyframeAt}=
    await import('/src/ui/omega-aira-v2-dash-frames.ts');
  const {drawOmegaAiraV2Candidate,OmegaAiraV2CandidateImages}=
    await import('/src/ui/omega-aira-v2-candidate.ts');
  const img=new Image();img.src=OMEGA_AIRA_E_DASH_STUDY.path;
  await img.decode();
  if(img.naturalWidth!==840||img.naturalHeight!==220)
   throw new Error('SVG/WebP original dash dimensions incorrect');
  const cache=new OmegaAiraV2CandidateImages();cache.prepare();
  const readyUntil=performance.now()+12000;
  while((!cache.image('E')||!cache.dashFrames.ready)&&
    performance.now()<readyUntil){
   await new Promise(resolve=>setTimeout(resolve,70));
  }
  if(!cache.image('E')||!cache.dashFrames.ready)
   throw new Error('Actual candidate renderer failed to load dash atlas');
  const result=document.createElement('canvas');
  result.width=3*280;result.height=2*255;
  const ctx=result.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw new Error('No Chromium Canvas2D source output');
  ctx.fillStyle='#0e1c30';ctx.fillRect(0,0,result.width,result.height);
  const proof=[];
  const make=(age)=>{
   const c=document.createElement('canvas');c.width=270;c.height=233;
   const g=c.getContext('2d',{willReadFrequently:true});
   if(!g)throw new Error('No pose source context');
   g.save();g.translate(135,212);
   const drawn=drawOmegaAiraV2Candidate(g,{
    facingX:1,facingY:0,moving:true,shooting:false,
    dashing:true,hurt:false,ultimate:false,finished:false,
    time:4.1,actionAge:age,
   },cache);
   g.restore();
   if(!drawn)throw new Error('AIRA V2 candidate refused dash pose');
   let hash=2166136261,ink=0;
   const pixels=g.getImageData(0,0,270,233).data;
   for(let i=0;i<pixels.length;i+=4){
    if(pixels[i+3]>40)ink++;
    for(let c=0;c<4;c++)hash=Math.imul(hash^pixels[i+c],16777619)>>>0;
   }
   return {canvas:c,hash:hash.toString(16).padStart(8,'0'),ink};
  };
  for(const [index,age] of [0,.095,.175].entries()){
   const pose=make(age);
   const x=index*280;
   ctx.fillStyle='#223a50';ctx.fillRect(x+4,5,272,239);
   ctx.drawImage(pose.canvas,x+5,7);
   ctx.fillStyle='#e0f6ff';ctx.font='bold 13px sans-serif';
   ctx.fillText(['E / START','E / DASH','E / RECOVER'][index],x+10,249);
   // Lower row: raw embedded WebP, not renderer fake or rotated idle pose.
   ctx.drawImage(img,index*280,0,280,220,x+6,278,268,210);
   proof.push({frame:index,age,selectedIndex:omegaAiraDashKeyframeAt(age),
    hash:pose.hash,ink:pose.ink});
  }
  const unique=new Set(proof.map(p=>p.hash)).size===3;
  const material=proof.every(p=>p.ink>850&&p.ink<16000);
  const frameCorrect=proof.every(p=>p.selectedIndex===p.frame);
  const source=new OmegaAiraV2DashFrames();source.prepare();
  const noMirroring=!source.draw(ctx,'W',{facingX:-1,facingY:0,
   dashing:true,shooting:false,time:4.2,actionAge:.1},150);
  const noFakeDash=!source.draw(ctx,'E',{facingX:1,facingY:0,
   dashing:false,shooting:false,time:4.2,actionAge:.1},150);
  const noExpired=!source.draw(ctx,'E',{facingX:1,facingY:0,
   dashing:true,shooting:false,time:4.2,actionAge:.23},150);
  return {
   png:result.toDataURL('image/png'),
   report:{pass:unique&&material&&frameCorrect&&noMirroring&&noFakeDash&&noExpired,
    actualCandidateRenderer:true,sourceDecoded:true,
    threeIndependentPaintedKeyframes:true,full160FrameSetApproved:false,
    unique,material,frameCorrect,noMirroring,noFakeDash,noExpired,proof},
  };
 });
 await writeFile(resolve(root,'aira-v2-e-dash-actual-source-3frames.png'),
  Buffer.from(output.png.split(',')[1],'base64'));
 report={...output.report,errors};
 if(!report.pass||errors.length)process.exitCode=1;
 console.log(report.pass&&!errors.length?'QA_PASS':'QA_FAIL',
  'AIRA V2 original E dash action study',JSON.stringify(report));
}catch(error){report={pass:false,error:String(error),errors};
 process.exitCode=1;console.error('QA_EXCEPTION','AIRA V2 dash',String(error));
}finally{
 await writeFile(resolve(root,'aira-v2-e-dash-actual-source-report.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
