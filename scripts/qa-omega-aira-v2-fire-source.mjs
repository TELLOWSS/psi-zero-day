#!/usr/bin/env node
/** Source evidence: 8-direction AIRA V2 real candidate renderer before
 * and during genuine-equivalent Watch fire cue. NEVER a fake gameplay shot.
 * Actual game source is loaded by Vite; handpainted 160 still BLOCKED.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const root=resolve('qa-omega-protocol-captures');
await mkdir(root,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const page=await browser.newPage({viewport:{width:1220,height:460},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
let report={pass:false};
try{
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',{waitUntil:'domcontentloaded',timeout:45000});
 const result=await page.evaluate(async()=>{
  const {OmegaAiraV2CandidateImages,drawOmegaAiraV2Candidate,OMEGA_AIRA_V2_HEADINGS}=
   await import('/src/ui/omega-aira-v2-candidate.ts');
  const {omegaResolveArtAction}=await import('/src/ui/omega-protocol-art-motion.ts');
  const images=new OmegaAiraV2CandidateImages();images.prepare();
  const deadline=Date.now()+12000;
  while(!images.hasAllDirections()&&Date.now()<deadline)
   await new Promise(r=>setTimeout(r,100));
  if(!images.hasAllDirections())throw new Error('Source V2 images not ready');
  const W=8*148,H=2*210,sheet=document.createElement('canvas');
  sheet.width=W;sheet.height=H;
  const out=sheet.getContext('2d');
  if(!out)throw new Error('No Canvas2D');
  out.fillStyle='#0c1828';out.fillRect(0,0,W,H);
  const dirs=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
  const fingerprints=[];
  const sample=(view)=>{
   const canvas=document.createElement('canvas');canvas.width=140;canvas.height=176;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw new Error('Missing source context');
   ctx.save();ctx.translate(70,156);
   if(!drawOmegaAiraV2Candidate(ctx,view,images))throw new Error('V2 art missing');
   ctx.restore();
   const pixels=ctx.getImageData(0,0,140,176).data;
   let hash=2166136261,ink=0;
   for(let i=0;i<pixels.length;i+=4){
    if(pixels[i+3]>35)ink++;
    for(let c=0;c<4;c++)hash=Math.imul(hash^pixels[i+c],16777619)>>>0;
   }
   return {canvas,hash:hash.toString(16),ink};
  };
  for(let i=0;i<8;i++){
   const [facingX,facingY]=dirs[i],heading=OMEGA_AIRA_V2_HEADINGS[i];
   const base={facingX,facingY,weaponFacingX:1,weaponFacingY:0,
    moving:false,dashing:false,time:6.04,actionAge:.023};
   const active=omegaResolveArtAction({
    gameTime:6.04,runPhase:'battle',enginePhase:'playing',
    directorShoutTimer:0,isDashing:false,dashRemaining:0,
    hurtRemaining:0,fireUntil:6.09,
   });
   const off=sample({...base,shooting:false});
   const on=sample({...base,...active,shooting:active.shooting});
   const cooldown=sample({...base,...active,shooting:false});
   if(on.hash===off.hash||off.hash!==cooldown.hash)
    throw new Error('Invalid live cue gating for '+heading);
   for(const [row,frame] of [[0,off],[1,on]]){
    const x=i*148,y=row*210;
    out.fillStyle='#253447';out.fillRect(x+2,y+2,144,205);
    out.drawImage(frame.canvas,x+3,y+8);
    out.fillStyle='#d2f5ff';out.font='bold 11px system-ui';
    out.fillText(heading+(row?' NATIVE FIRE':' IDLE'),x+8,y+199);
   }
   fingerprints.push({heading,sourceIdle:off.hash,activeNativeShot:on.hash,
    noCueHash:cooldown.hash,ink:Math.min(off.ink,on.ink)});
  }
  return {png:sheet.toDataURL('image/png'),report:{
   pass:fingerprints.every(f=>f.sourceIdle!==f.activeNativeShot&&
    f.sourceIdle===f.noCueHash&&f.ink>1000),
   eightDistinctNativeHeadings:new Set(fingerprints.map(f=>f.sourceIdle)).size===8,
   source:'real AIRA V2 renderer + live-equivalent Watch firing action selector',
   realBattleScreenshot:false,commercialAnimationApproved:false,
   poses:16,fingerprints,
  }};
 });
 await writeFile(resolve(root,'aira-v2-native-shot-8direction-contact-sheet.png'),
  Buffer.from(result.png.split(',')[1],'base64'));
 report={...result.report,errors};
 if(!report.pass||!report.eightDistinctNativeHeadings||errors.length)process.exitCode=1;
 console.log(process.exitCode?'QA_FAIL':'QA_PASS','AIRA V2 actual renderer shot',JSON.stringify({
  pass:report.pass,distinct:report.eightDistinctNativeHeadings,poses:report.poses,errors}));
}catch(e){report={pass:false,error:String(e),errors};process.exitCode=1;
 console.error('QA_EXCEPTION','AIRA V2 native shot',String(e));
}finally{
 await writeFile(resolve(root,'aira-v2-native-shot-8direction-report.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
