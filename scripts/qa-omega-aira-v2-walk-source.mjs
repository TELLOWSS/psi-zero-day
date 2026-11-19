#!/usr/bin/env node
/** AIRA V2 true source-rendered gait QA, not approved hand-painted animation.
 * Samples the exact original eight user-approved WebP images through the
 * actual React-game candidate renderer and cutout rig in Chromium.
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
const page=await browser.newPage({viewport:{width:1240,height:1220},deviceScaleFactor:1});
let report={pass:false},errors=[];
page.on('pageerror',e=>errors.push(String(e)));
try{
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',
  {waitUntil:'domcontentloaded',timeout:45000});
 const data=await page.evaluate(async()=>{
  const {OmegaAiraV2CandidateImages,drawOmegaAiraV2Candidate,
   OMEGA_AIRA_V2_HEADINGS,omegaAiraV2Path}=
   await import('/src/ui/omega-aira-v2-candidate.ts');
  const cache=new OmegaAiraV2CandidateImages();
  // The user-approved original assets are local and must decode before
  // screenshot capture; never paint the fallback debug character as AIRA.
  await Promise.all(OMEGA_AIRA_V2_HEADINGS.map(async heading=>{
   const img=new Image();img.src=omegaAiraV2Path(heading);await img.decode();
  }));
  cache.prepare();
  if(!cache.hasAllDirections())throw new Error('AIRA V2 eight sources not decoded');
  const columns=8,rows=6,cw=148,ch=181;
  const sheet=document.createElement('canvas');
  sheet.width=columns*cw;sheet.height=rows*ch;
  const ctx=sheet.getContext('2d');
  if(!ctx)throw new Error('No source QA Canvas2D');
  ctx.fillStyle='#071321';ctx.fillRect(0,0,sheet.width,sheet.height);
  const proof=[];
  for(const [col,heading] of OMEGA_AIRA_V2_HEADINGS.entries()){
   for(let row=0;row<rows;row++){
    const phase=(row+.5)/rows;
    const frame=document.createElement('canvas');
    frame.width=140;frame.height=151;
    const g=frame.getContext('2d',{willReadFrequently:true});
    if(!g)throw new Error('No isolated 2D context');
    g.save();g.translate(70,139);
    const headingXY={
     E:[1,0],SE:[1,1],S:[0,1],SW:[-1,1],
     W:[-1,0],NW:[-1,-1],N:[0,-1],NE:[1,-1],
    };
    const [facingX,facingY]=headingXY[heading];
    const ok=drawOmegaAiraV2Candidate(g,{
     facingX,facingY,moving:true,time:phase,shooting:false,
     dashing:false,hurt:false,finished:false,ultimate:false,
     gait:{active:true,phase,distanceTravelled:phase*38,
      left:{x:0,y:0,planted:true},right:{x:0,y:0,planted:true}},
    },cache);
    g.restore();
    if(!ok)throw new Error('Candidate source art missing '+heading);
    const pixels=g.getImageData(0,0,140,151).data;
    let hash=2166136261,ink=0;
    for(let i=0;i<pixels.length;i+=4){
     if(pixels[i+3]>32)ink++;
     for(let k=0;k<4;k++)hash=Math.imul(hash^pixels[i+k],16777619)>>>0;
    }
    const cellX=col*cw,cellY=row*ch;
    ctx.fillStyle='#1c3044';ctx.fillRect(cellX+3,cellY+3,cw-6,ch-6);
    ctx.drawImage(frame,cellX+4,cellY+5);
    ctx.fillStyle='#d6edfa';ctx.font='bold 11px system-ui';
    ctx.fillText(heading+' / WALK '+String(row+1).padStart(2,'0'),cellX+7,cellY+170);
    proof.push({heading,frame:row+1,hash:hash.toString(16),ink});
   }
  }
  const sixDifferent=OMEGA_AIRA_V2_HEADINGS.every(h=>
   new Set(proof.filter(x=>x.heading===h).map(x=>x.hash)).size===6);
  const ink=proof.every(x=>x.ink>1200);
  return {png:sheet.toDataURL('image/png'),
   report:{pass:sixDifferent&&ink,sixDifferent,ink,
    directions:8,poses:proof.length,allSourcesReady:true,
    originalAnimationFrames:false,interimCutoutRig:true,
    source:'AIRA V2 real Watch candidate renderer in Chromium',proof}};
 });
 await writeFile(resolve(root,'aira-v2-walk-8-way-48frame-source.png'),
  Buffer.from(data.png.split(',')[1],'base64'));
 report={...data.report,errors};
 if(!report.pass||errors.length)process.exitCode=1;
 console.log(report.pass?'QA_PASS':'QA_FAIL',
  'AIRA V2 interim cutout 8x6 walk',JSON.stringify({
   pass:report.pass,sixDifferent:report.sixDifferent,ink:report.ink,
   poses:report.poses,errors,
  }));
}catch(e){report={pass:false,error:String(e),errors};process.exitCode=1;
 console.error('QA_EXCEPTION','AIRA V2 walk',String(e));
}finally{
 await writeFile(resolve(root,'aira-v2-walk-8-way-48frame-source.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
