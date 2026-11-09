#!/usr/bin/env node
/**
 * Chromium QA of original AIRA V2 five-key E cinematic studies.
 * Renders through the SAME AIRA V2 candidate renderer used in gameplay,
 * with valid Watch-derived ultimate/victory sample clocks. Source art QA,
 * NOT a claimed live boss-combat screenshot or complete commercial art pack.
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
const page=await browser.newPage({viewport:{width:1320,height:670},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
let report={pass:false};
try{
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',
  {waitUntil:'domcontentloaded',timeout:45000});
 const result=await page.evaluate(async()=>{
  const {OMEGA_AIRA_E_SPECIAL_ART,omegaAiraSpecialFrameAt}=
   await import('/src/ui/omega-aira-v2-special-frames.ts');
  const {OmegaAiraV2CandidateImages,drawOmegaAiraV2Candidate}=
   await import('/src/ui/omega-aira-v2-candidate.ts');
  const {omegaResolveArtAction}=
   await import('/src/ui/omega-protocol-art-motion.ts');
  const cache=new OmegaAiraV2CandidateImages();cache.prepare();
  const deadline=performance.now()+16000;
  while((!cache.image('E')||!cache.specialFrames.ready('ultimate')||
   !cache.specialFrames.ready('finish'))&&performance.now()<deadline)
   await new Promise(r=>setTimeout(r,100));
  if(!cache.image('E')||!cache.specialFrames.ready('ultimate')||
   !cache.specialFrames.ready('finish'))
   throw new Error('AIRA V2 real game special atlas failed to decode');
  const rows=[
   {action:'ultimate',age:.15},{action:'ultimate',age:.8},
   {action:'ultimate',age:1.55},{action:'finish',age:.15},
   {action:'finish',age:.8},
  ];
  const width=3*430,height=2*340,sheet=document.createElement('canvas');
  sheet.width=width;sheet.height=height;
  const out=sheet.getContext('2d');
  if(!out)throw new Error('Source contact sheet context unavailable');
  out.fillStyle='#101c2e';out.fillRect(0,0,width,height);
  const fingerprints=[];
  for(const [index,entry] of rows.entries()){
   const source=OMEGA_AIRA_E_SPECIAL_ART[entry.action];
   const img=new Image();img.src=source.path;await img.decode();
   if(img.naturalWidth!==source.atlasWidth||img.naturalHeight!==source.atlasHeight)
    throw new Error('Original source SVG dimensions invalid '+entry.action);
   const motion=omegaResolveArtAction({
    gameTime:5,runPhase:entry.action==='finish'?'victory':'battle',
    enginePhase:'playing',
    directorShoutTimer:entry.action==='ultimate'?2-entry.age:0,
    isDashing:false,dashRemaining:0,hurtRemaining:0,fireUntil:0,
    terminalElapsed:entry.action==='finish'?entry.age:0,
   });
   if(motion.action!==entry.action)
    throw new Error('Watch native action disagreement '+entry.action);
   const canvas=document.createElement('canvas');canvas.width=420;canvas.height=300;
   const g=canvas.getContext('2d',{willReadFrequently:true});
   if(!g)throw new Error('No 2D frame');
   g.save();g.translate(210,275);
   const ok=drawOmegaAiraV2Candidate(g,{
    facingX:1,facingY:0,moving:false,shooting:motion.shooting,
    dashing:motion.dashing,hurt:motion.hurt,ultimate:motion.ultimate,
    finished:motion.finished,time:5,actionAge:motion.actionAge,
   },cache);
   g.restore();
   if(!ok)throw new Error('AIRA V2 source renderer declined frame');
   const arr=g.getImageData(0,0,420,300).data;
   let hash=2166136261,ink=0;
   for(let q=0;q<arr.length;q+=4){
    if(arr[q+3]>40)ink++;
    for(let c=0;c<4;c++)hash=Math.imul(hash^arr[q+c],16777619)>>>0;
   }
   const x=(index%3)*430,y=Math.floor(index/3)*340;
   out.fillStyle='#20334c';out.fillRect(x+4,y+4,422,332);
   out.drawImage(canvas,x+5,y+7);
   out.fillStyle='#e3f2ff';out.font='bold 14px system-ui';
   out.fillText('E / '+entry.action.toUpperCase()+' / '+
    String(omegaAiraSpecialFrameAt(entry.action,entry.age)+1).padStart(2,'0'),
    x+13,y+322);
   fingerprints.push({action:entry.action,age:entry.age,
    index:omegaAiraSpecialFrameAt(entry.action,motion.actionAge),
    hash:hash.toString(16).padStart(8,'0'),ink});
  }
  const distinctUltimate=new Set(fingerprints.filter(f=>f.action==='ultimate')
   .map(f=>f.hash)).size===3;
  const distinctFinish=new Set(fingerprints.filter(f=>f.action==='finish')
   .map(f=>f.hash)).size===2;
  const visible=fingerprints.every(f=>f.ink>1000&&f.ink<55000);
  const frameIndices=fingerprints.every((f,i)=>f.index===(i<3?i:i-3));
  const sample={facingX:-1,facingY:0,time:5,moving:false,shooting:false,
   dashing:false,ultimate:true,finished:false,actionAge:.8};
  const notMirrored=!cache.specialFrames.draw(out,'W',sample,190);
  const noPremature=!cache.specialFrames.draw(out,'E',
   {...sample,ultimate:false},190);
  const noFakeFinish=!cache.specialFrames.draw(out,'E',
   {...sample,ultimate:false,finished:false,actionAge:.8},190);
  return {png:sheet.toDataURL('image/png'),report:{
   pass:distinctUltimate&&distinctFinish&&visible&&frameIndices&&
    notMirrored&&noPremature&&noFakeFinish,
   actualGameCandidateSource:true,watchActionSelector:true,
   actualBossBattleScreenshot:false,approved160Frames:false,
   originalIllustratedActionFrames:5,
   distinctUltimate,distinctFinish,visible,frameIndices,
   notMirrored,noPremature,noFakeFinish,fingerprints,
  }};
 });
 await writeFile(resolve(root,'aira-v2-e-special-real-source-5poses.png'),
  Buffer.from(result.png.split(',')[1],'base64'));
 report={...result.report,errors};
 if(!report.pass||errors.length)process.exitCode=1;
 console.log(report.pass&&!errors.length?'QA_PASS':'QA_FAIL',
  'AIRA original E five-key special cinematic',JSON.stringify(report));
}catch(error){report={pass:false,error:String(error),errors};
 process.exitCode=1;console.error('QA_EXCEPTION','E special source',String(error));
}finally{
 await writeFile(resolve(root,'aira-v2-e-special-real-source-report.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
