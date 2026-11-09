#!/usr/bin/env node
/** SOURCE-PROOF 4 ORIGINAL E WALK POSES. Uses actual candidate renderer
 * and the real distance-phase field. NOT a live combat screenshot, NOT six
 * painted E frames, NOT eight-direction commercial action art approval.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const dir=resolve('qa-omega-protocol-captures');
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const page=await browser.newPage({viewport:{width:1050,height:570},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
let report={pass:false};
try{
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',{
  waitUntil:'domcontentloaded',timeout:45000,
 });
 const data=await page.evaluate(async()=>{
  const {OmegaAiraV2CandidateImages,drawOmegaAiraV2Candidate}=
   await import('/src/ui/omega-aira-v2-candidate.ts');
  const {OMEGA_AIRA_E_WALK_STUDY,omegaAiraWalkPaintedFrameAt,
   OmegaAiraV2WalkFrames}=await import('/src/ui/omega-aira-v2-walk-frames.ts');
  const cache=new OmegaAiraV2CandidateImages();cache.prepare();
  const src=new Image();src.src=OMEGA_AIRA_E_WALK_STUDY.path;
  await src.decode();
  if(src.naturalWidth!==960||src.naturalHeight!==232)
   throw new Error('Source atlas incorrect dimensions');
  const deadline=performance.now()+12000;
  while((!cache.image('E')||!cache.walkFrames.ready)&&performance.now()<deadline)
   await new Promise(r=>setTimeout(r,70));
  if(!cache.image('E')||!cache.walkFrames.ready)
   throw new Error('E source walking art failed to decode');
  const dst=document.createElement('canvas');dst.width=4*246;dst.height=2*258;
  const ctx=dst.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw new Error('No Canvas2D');
  ctx.fillStyle='#0d2030';ctx.fillRect(0,0,dst.width,dst.height);
  const fingerprints=[];
  const draw=(phase,active=true)=>{
   const canvas=document.createElement('canvas');canvas.width=238;canvas.height=235;
   const c=canvas.getContext('2d',{willReadFrequently:true});
   if(!c)throw new Error('No Canvas2D cell');
   c.save();c.translate(119,217);
   const ok=drawOmegaAiraV2Candidate(c,{
    facingX:1,facingY:0,time:5.5,moving:active,
    shooting:false,dashing:false,hurt:false,ultimate:false,finished:false,
    gait:{active,phase,distanceTravelled:phase*38,
      left:{x:-9,y:0,planted:true},right:{x:9,y:0,planted:true}},
   },cache);
   c.restore();
   if(!ok)throw new Error('Game renderer did not draw AIRA');
   const pixels=c.getImageData(0,0,canvas.width,canvas.height).data;
   let hash=2166136261,ink=0;
   for(let i=0;i<pixels.length;i+=4){
    if(pixels[i+3]>50)ink++;
    for(let j=0;j<4;j++)hash=Math.imul(hash^pixels[i+j],16777619)>>>0;
   }
   return {canvas,hash:hash.toString(16),ink};
  };
  const phases=[.125,.375,.625,.875];
  for(const [i,phase] of phases.entries()){
   const frame=draw(phase);
   const x=i*246;
   ctx.fillStyle='#213a4c';ctx.fillRect(x+3,3,240,242);
   ctx.drawImage(frame.canvas,x+4,7);
   ctx.fillStyle='#dfedff';ctx.font='bold 11px system-ui';
   ctx.fillText('E / ORIGINAL WALK '+(i+1),x+11,251);
   // Raw artwork below verifies no synthetic walk cutout is smuggled in.
   ctx.drawImage(src,i*240,0,240,232,x+4,266,238,229);
   fingerprints.push({frame:i,phase,selected:omegaAiraWalkPaintedFrameAt(phase),
    hash:frame.hash,ink:frame.ink});
  }
  const unique=new Set(fingerprints.map(p=>p.hash)).size===4;
  const visible=fingerprints.every(p=>p.ink>700&&p.ink<12000);
  const correct=fingerprints.every(p=>p.frame===p.selected);
  const still=draw(.5,false);
  const motion=draw(.5,true);
  const stopFreezes=still.hash!==motion.hash;
  const loader=new OmegaAiraV2WalkFrames();loader.prepare();
  const denyWest=!loader.draw(ctx,'W',{
    facingX:-1,facingY:0,time:5,moving:true,shooting:false,dashing:false,
    gait:{active:true,phase:.5,distanceTravelled:19,
      left:{x:0,y:0,planted:true},right:{x:0,y:0,planted:true}},
   },180);
  return {png:dst.toDataURL('image/png'),report:{
   pass:unique&&visible&&correct&&stopFreezes&&denyWest,
   actualSourceIllustratedKeys:4,originalAllDirectionsWalkComplete:false,
   allPaintedActionFramesAfterAddition:18,
   originalPaintedFramesStillMissing:142,
   userSelectedAiraIdentity:true,
   actualGameCandidateRenderer:true,
   originalSourceBrowserDecoded:true,technicalCutoutThisDirection:false,
   liveGameplayScreenshot:false,unique,visible,correct,stopFreezes,denyWest,
   fingerprints,
  }};
 });
 await writeFile(resolve(dir,'aira-v2-e-walk-4-real-source-keys.png'),
  Buffer.from(data.png.split(',')[1],'base64'));
 report={...data.report,errors};
 if(!report.pass||errors.length)process.exitCode=1;
 console.log(report.pass&&!errors.length?'QA_PASS':'QA_FAIL',
  '4 original E walking keys',JSON.stringify(report));
}catch(e){report={pass:false,error:String(e),errors};process.exitCode=1;
 console.error('QA_EXCEPTION','AIRA E original walk',String(e));
}finally{
 await writeFile(resolve(dir,'aira-v2-e-walk-4-real-source-report.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
