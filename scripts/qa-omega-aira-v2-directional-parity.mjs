#!/usr/bin/env node
/**
 * Real Chromium source-rendered art-parity evidence, NOT a game screenshot
 * or commercial 8x20 sprite approval. Every rendered pose uses the same
 * drawOmegaAiraV2Candidate invoked by the actual OMEGA battlefield, plus
 * native-equivalent Watch action fields. Separate original WebPs per heading;
 * E's illustrated pose atlases remain E ONLY.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const outDir=resolve('qa-omega-protocol-captures');
await mkdir(outDir,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const page=await browser.newPage({viewport:{width:1340,height:940},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
let report={pass:false};
try{
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',
  {waitUntil:'domcontentloaded',timeout:45000});
 const result=await page.evaluate(async()=>{
  const {
   OmegaAiraV2CandidateImages,drawOmegaAiraV2Candidate,
   OMEGA_AIRA_V2_HEADINGS,
  }=await import('/src/ui/omega-aira-v2-candidate.ts');
  const {omegaAiraV2ArtParity}=
   await import('/src/ui/omega-aira-v2-directional-parity.ts');
  const cache=new OmegaAiraV2CandidateImages();cache.prepare();
  const deadline=performance.now()+14000;
  while(!cache.hasAllDirections()&&performance.now()<deadline)
   await new Promise(done=>setTimeout(done,60));
  if(!cache.hasAllDirections())throw new Error('One or more original AIRA angle images absent');
  const states={
   fire:[.025,.085],dash:[.03,.11],hit:[.024,.085],
   ultimate:[.2,.96],finish:[.12,.72],
  };
  const direction={
   E:[1,0],SE:[1,1],S:[0,1],SW:[-1,1],
   W:[-1,0],NW:[-1,-1],N:[0,-1],NE:[1,-1],
  };
  const cw=254,ch=220;
  const sheet=document.createElement('canvas');
  sheet.width=cw*8;sheet.height=ch*5;
  const output=sheet.getContext('2d');
  if(!output)throw new Error('Canvas2D unavailable');
  output.fillStyle='#0a1425';output.fillRect(0,0,sheet.width,sheet.height);
  const sourceFingerprints=[];
  for(const h of OMEGA_AIRA_V2_HEADINGS){
   const img=cache.image(h);
   if(!img)throw new Error('Missing direction image '+h);
   const canvas=document.createElement('canvas');
   canvas.width=192;canvas.height=336;
   const g=canvas.getContext('2d',{willReadFrequently:true});
   if(!g)throw new Error('Canvas2D unavailable for source');
   g.drawImage(img,0,0,192,336);
   let count=0,hash=2166136261,minY=336,maxY=-1;
   const pixels=g.getImageData(0,0,192,336).data;
   for(let i=0;i<pixels.length;i+=4){
    if(pixels[i+3]>80){
     count++;const y=Math.floor(i/4/192);
     minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    }
    for(let j=0;j<4;j++)hash=Math.imul(hash^pixels[i+j],16777619)>>>0;
   }
   sourceFingerprints.push({heading:h,hash:hash.toString(16),ink:count,
    yTop:minY,yBottom:maxY});
  }
  const frames=[];
  const render=(h,action,age)=>{
   const canvas=document.createElement('canvas');
   canvas.width=244;canvas.height=190;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw new Error('No frame Canvas2D');
   const [facingX,facingY]=direction[h];
   ctx.save();ctx.translate(122,177);ctx.scale(.60,.60);
   const view={
    facingX,facingY,moving:false,time:4,actionAge:age,
    shooting:action==='fire',dashing:action==='dash',
    hurt:action==='hit',ultimate:action==='ultimate',
    finished:action==='finish',
    // A native fire cue may aim independently from character facing.
    weaponFacingX:facingX,weaponFacingY:facingY,
   };
   const ok=drawOmegaAiraV2Candidate(ctx,view,cache);
   ctx.restore();
   if(!ok)throw new Error('Actor source rendering missing '+h+'/'+action);
   const pix=ctx.getImageData(0,0,canvas.width,canvas.height).data;
   let ink=0,hash=2166136261;
   for(let i=0;i<pix.length;i+=4){
    if(pix[i+3]>80)ink++;
    for(let c=0;c<4;c++)hash=Math.imul(hash^pix[i+c],16777619)>>>0;
   }
   return {canvas,ink,hash:hash.toString(16)};
  };
  for(const [row,action] of Object.keys(states).entries()){
   for(const [col,heading] of OMEGA_AIRA_V2_HEADINGS.entries()){
    const times=states[action];
    const a=render(heading,action,times[0]);
    const b=render(heading,action,times[1]);
    const x=col*cw,y=row*ch;
    output.fillStyle='#203147';output.fillRect(x+4,y+4,cw-8,ch-8);
    output.drawImage(b.canvas,x+5,y+8);
    output.strokeStyle='#647c94';output.lineWidth=1;
    output.strokeRect(x+4,y+4,cw-8,ch-8);
    output.fillStyle='#e4f2ff';output.font='bold 13px system-ui';
    output.fillText(heading+' / '+action.toUpperCase(),x+13,y+206);
    frames.push({heading,action,earlyHash:a.hash,lateHash:b.hash,
     phaseChanges:a.hash!==b.hash,ink:Math.min(a.ink,b.ink),
     sourceType:heading==='E'?'E_ONLY_PAINTED_STUDY':'8_WAY_CUTOUT_BRIDGE'});
   }
  }
  const heightMin=Math.min(...sourceFingerprints.map(f=>f.yBottom-f.yTop));
  const heightMax=Math.max(...sourceFingerprints.map(f=>f.yBottom-f.yTop));
  const silhouetteRatio=heightMax/Math.max(1,heightMin);
  const source8Unique=new Set(sourceFingerprints.map(x=>x.hash)).size===8;
  const sourceFootAligned=sourceFingerprints.every(f=>f.yBottom>=300&&f.yBottom<=335);
  const sourceHeightParity=silhouetteRatio<=1.27;
  const all40Changed=frames.length===40&&frames.every(f=>f.phaseChanges);
  const all40Visible=frames.every(f=>f.ink>500);
  const audit=omegaAiraV2ArtParity();
  // Successful technical motion checks NEVER rewrite the official art
  // coverage: 14 independent E poses / 146 missing, masks all missing.
  const truthfulCount=audit.independentlyPaintedFrames===14&&
   audit.missingActionFrames===146&&!audit.fullProductionApproved;
  const pass=source8Unique&&sourceFootAligned&&sourceHeightParity&&
   all40Changed&&all40Visible&&truthfulCount;
  return {
   png:sheet.toDataURL('image/png'),
   report:{
    pass,source8Unique,sourceFootAligned,sourceHeightParity,
    sourceSilhouetteHeightRatio:silhouetteRatio,
    all40Changed,all40Visible,
    eightOriginalNeutralViews:true,
    independentIllustratedActionFrames:14,
    independentlyPaintedFramesMissing:146,
    approved320OcclusionMasks:0,
    commercialArtApproved:false,
    actuallyRenderedGameSource:true,
    realGameplayScreenshot:false,
    temporaryCutoutRigUsed:true,
    sourceFingerprints,frames,
   },
  };
 });
 await writeFile(resolve(outDir,'aira-v2-8direction-5action-source-parity.png'),
  Buffer.from(result.png.split(',')[1],'base64'));
 report={...result.report,errors};
 if(!report.pass||errors.length)process.exitCode=1;
 console.log(report.pass&&!errors.length?'QA_PASS':'QA_FAIL',
  'AIRA V2 8dir 5-action source parity',JSON.stringify({
   pass:report.pass,source8Unique:report.source8Unique,
   sourceFootAligned:report.sourceFootAligned,
   sourceHeightParity:report.sourceHeightParity,
   all40Changed:report.all40Changed,all40Visible:report.all40Visible,
   sourceSilhouetteHeightRatio:report.sourceSilhouetteHeightRatio,
   errors,
   failedFrames:report.frames.filter(f=>!f.phaseChanges||f.ink<=500),
  }));
}catch(e){
 report={pass:false,error:String(e),errors};process.exitCode=1;
 console.error('QA_EXCEPTION','AIRA V2 8dir parity',String(e));
}finally{
 await writeFile(resolve(outDir,'aira-v2-8direction-5action-source-parity.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
