#!/usr/bin/env node
/**
 * Chromium source check of AIRA V2 E-facing 3-frame illustrated hit art.
 * Uses the SAME drawOmegaAiraV2Candidate as the live React battle. It does
 * not substitute a fake scene for a game screenshot or approve 8x20 art.
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
  const {OMEGA_AIRA_E_HIT_STUDY,OmegaAiraV2HitFrames,
   omegaAiraHitKeyframeAt}=await import('/src/ui/omega-aira-v2-hit-frames.ts');
  const {drawOmegaAiraV2Candidate,OmegaAiraV2CandidateImages}=
   await import('/src/ui/omega-aira-v2-candidate.ts');
  const {omegaResolveArtAction}=await import('/src/ui/omega-protocol-art-motion.ts');
  const image=new Image();image.src=OMEGA_AIRA_E_HIT_STUDY.path;
  await image.decode();
  if(image.naturalWidth!==780||image.naturalHeight!==215)
   throw new Error('E hit source SVG dimensions not decoded');
  const cache=new OmegaAiraV2CandidateImages();cache.prepare();
  const deadline=performance.now()+12000;
  while((!cache.image('E')||!cache.hitFrames.ready)&&performance.now()<deadline)
   await new Promise(r=>setTimeout(r,70));
  if(!cache.image('E')||!cache.hitFrames.ready)
   throw new Error('Live AIRA V2 E hit atlas unavailable');
  const sheet=document.createElement('canvas');
  sheet.width=780;sheet.height=470;
  const out=sheet.getContext('2d',{willReadFrequently:true});
  if(!out)throw new Error('Missing Canvas2D in Chromium');
  out.fillStyle='#101b30';out.fillRect(0,0,sheet.width,sheet.height);
  const proof=[];
  const sample=(age)=>{
   const c=document.createElement('canvas');c.width=252;c.height=222;
   const g=c.getContext('2d',{willReadFrequently:true});
   if(!g)throw new Error('No source pose context');
   const native=omegaResolveArtAction({
    gameTime:5,runPhase:'battle',enginePhase:'playing',
    directorShoutTimer:0,isDashing:false,dashRemaining:0,
    hurtRemaining:2-age,fireUntil:0,
   });
   if(native.action!=='hit')throw new Error('Native hit action rejected '+age);
   g.save();g.translate(126,205);
   const ok=drawOmegaAiraV2Candidate(g,{
    facingX:1,facingY:0,moving:false,shooting:false,
    dashing:false,hurt:native.hurt,ultimate:false,finished:false,
    time:5,actionAge:native.actionAge,
   },cache);
   g.restore();
   if(!ok)throw new Error('Real candidate did not draw source');
   let hash=2166136261,ink=0;
   const pixels=g.getImageData(0,0,c.width,c.height).data;
   for(let i=0;i<pixels.length;i+=4){
    if(pixels[i+3]>40)ink++;
    for(let k=0;k<4;k++)hash=Math.imul(hash^pixels[i+k],16777619)>>>0;
   }
   return {canvas:c,hash:hash.toString(16).padStart(8,'0'),ink,
    resolvedAge:native.actionAge};
  };
  for(const [i,age] of [.015,.08,.133].entries()){
   const p=sample(age),x=i*260;
   out.fillStyle='#21374c';out.fillRect(x+4,4,253,220);
   out.drawImage(p.canvas,x+5,5);
   out.fillStyle='#deefff';out.font='bold 11px sans-serif';
   out.fillText(['E / FLINCH','E / STAGGER','E / KNOCKBACK'][i],x+8,231);
   out.drawImage(image,i*260,0,260,215,x+5,248,250,208);
   proof.push({frame:i,age,nativeAge:p.resolvedAge,
    index:omegaAiraHitKeyframeAt(p.resolvedAge),
    hash:p.hash,ink:p.ink});
  }
  const unique=new Set(proof.map(p=>p.hash)).size===3;
  const frameCorrect=proof.every(p=>p.frame===p.index);
  const material=proof.every(p=>p.ink>600&&p.ink<15000);
  const rawRig=new OmegaAiraV2HitFrames();rawRig.prepare();
  const falseOther=!rawRig.draw(out,'W',{
   facingX:-1,facingY:0,moving:false,time:5,dashing:false,
   shooting:false,hurt:true,actionAge:.08},160);
  const falseNoHit=!rawRig.draw(out,'E',{
   facingX:1,facingY:0,moving:false,time:5,dashing:false,
   shooting:false,hurt:false,actionAge:.08},160);
  const falseExpired=!rawRig.draw(out,'E',{
   facingX:1,facingY:0,moving:false,time:5,dashing:false,
   shooting:false,hurt:true,actionAge:.21},160);
  return {png:sheet.toDataURL('image/png'),report:{
   pass:unique&&frameCorrect&&material&&falseOther&&falseNoHit&&falseExpired,
   threeIndependentIllustratedKeyframes:true,
   actualCandidateRenderer:true,
   nativeActionSelector:true,
   wholeProductionSetApproved:false,
   unique,frameCorrect,material,falseOther,falseNoHit,falseExpired,proof,
  }};
 });
 await writeFile(resolve(root,'aira-v2-e-hit-actual-source-3frames.png'),
  Buffer.from(output.png.split(',')[1],'base64'));
 report={...output.report,errors};
 if(!report.pass||errors.length)process.exitCode=1;
 console.log(report.pass&&!errors.length?'QA_PASS':'QA_FAIL',
  'AIRA E native hit 3-key source',JSON.stringify(report));
}catch(e){
 report={pass:false,error:String(e),errors};process.exitCode=1;
 console.error('QA_EXCEPTION','E original hit source',String(e));
}finally{
 await writeFile(resolve(root,'aira-v2-e-hit-actual-source-report.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
