#!/usr/bin/env node
/** Real-source browser kinetic animation proof, not approved 160 PNG sprite art.
 * All displayed pixels originate from the same drawOmegaProtocolActor that
 * runs inside the live OMEGA React/Canvas battle.
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
const page=await browser.newPage({viewport:{width:1220,height:1220},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
let report;
try{
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',
  {waitUntil:'domcontentloaded',timeout:45000});
 const data=await page.evaluate(async()=>{
  const {drawOmegaProtocolActor,omegaFieldHeading}=
   await import('/src/ui/omega-protocol-actor-render.ts');
  const {omegaAiraKineticPose}=
   await import('/src/ui/omega-protocol-aira-kinetics.ts');
  const dirs=[['E',1,0],['SE',1,1],['S',0,1],['SW',-1,1],
   ['W',-1,0],['NW',-1,-1],['N',0,-1],['NE',1,-1]];
  const acts=['walk','fire','dash','hit','ultimate','finish'];
  const frameA={walk:1.17,fire:.02,dash:.03,hit:.03,ultimate:.2,finish:.1};
  const frameB={walk:1.26,fire:.085,dash:.12,hit:.1,ultimate:.95,finish:.75};
  const base=(action,seconds,x,y)=>({
   facingX:x,facingY:y,
   moving:action==='walk',time:action==='walk'?seconds:1.2,
   dashing:action==='dash',shooting:action==='fire',
   hurt:action==='hit',ultimate:action==='ultimate',
   finished:action==='finish',
   actionAge:action==='walk'?0:seconds,
  });
  const sheet=document.createElement('canvas');
  const W=1440,H=1190,CW=180,CH=194;
  sheet.width=W;sheet.height=H;
  const bg=sheet.getContext('2d');
  if(!bg)throw new Error('No Canvas2D in source QA');
  bg.fillStyle='#081323';bg.fillRect(0,0,W,H);
  const proof=[];
  const fingerprint=(ctx)=>{
   const pixels=ctx.getImageData(0,0,170,170).data;
   let hash=2166136261,ink=0;
   for(let i=0;i<pixels.length;i+=4){
    if(pixels[i+3]>32)ink++;
    for(let k=0;k<4;k++)hash=Math.imul(hash^pixels[i+k],16777619)>>>0;
   }
   return {hash:hash.toString(16).padStart(8,'0'),ink};
  };
  const paint=(view)=>{
   const c=document.createElement('canvas');c.width=170;c.height=170;
   const g=c.getContext('2d',{willReadFrequently:true});
   if(!g)throw new Error('No isolated Canvas2D');
   g.translate(85,150);g.scale(1.3,1.3);
   drawOmegaProtocolActor(g,view);
   return {canvas:c,metrics:fingerprint(g)};
  };
  for(const [ri,action] of acts.entries()){
   for(const [di,dir] of dirs.entries()){
    const [heading,x,y]=dir;
    if(omegaFieldHeading(x,y)!==heading)throw new Error('Wrong directional mapping');
    const a=paint(base(action,frameA[action],x,y));
    const b=paint(base(action,frameB[action],x,y));
    const frameKey=omegaAiraKineticPose(heading,action,
     action==='walk'?(frameB.walk*2%1)*.59:frameB[action]);
    const xx=di*CW,yy=ri*CH;
    bg.fillStyle='#17283c';bg.fillRect(xx+3,yy+3,CW-6,CH-6);
    bg.drawImage(b.canvas,xx+5,yy+6);
    bg.strokeStyle='#5d7396';bg.lineWidth=1;
    bg.strokeRect(xx+3,yy+3,CW-6,CH-6);
    bg.fillStyle='#ceeafa';bg.font='bold 11px sans-serif';
    bg.fillText(heading+' / '+action.toUpperCase(),xx+10,yy+181);
    proof.push({heading,action,frameIndex:frameKey.index,
     ink:b.metrics.ink,hash:b.metrics.hash,
     previousHash:a.metrics.hash,frameChanged:a.metrics.hash!==b.metrics.hash});
   }
  }
  const perDirection=dirs.every(([heading])=>{
   const rows=proof.filter(v=>v.heading===heading);
   return rows.length===6&&new Set(rows.map(v=>v.hash)).size===6;
  });
  const perAction=acts.every(action=>{
   const cols=proof.filter(v=>v.action===action);
   return cols.length===8&&new Set(cols.map(v=>v.hash)).size===8;
  });
  const frameChanged=proof.every(p=>p.frameChanged);
  const visible=proof.every(p=>p.ink>600);
  return {
   png:sheet.toDataURL('image/png'),
   report:{
    pass:perDirection&&perAction&&frameChanged&&visible,
    source:'actual OMEGA actor renderer + kinetic key module in Chromium',
    category:'TECHNICAL_ANIMATION_PROOF_NOT_FINAL_SPRITES',
    actorArtApproved:false,independentHandPaintedFrames:0,
    directions:dirs.length,actions:acts.length,samples:proof.length,
    perDirection,perAction,frameChanged,visible,proof,
   },
  };
 });
 await writeFile(resolve(root,'omega-aira-native-action-48poses.png'),
  Buffer.from(data.png.split(',')[1],'base64'));
 report={...data.report,errors};
 if(!report.pass||errors.length)process.exitCode=1;
 console.log(report.pass&&!errors.length?'QA_PASS':'QA_FAIL',
  'AIRA native kinetic body keyframes',JSON.stringify({
   pass:report.pass,directions:report.directions,actions:report.actions,
   perDirection:report.perDirection,perAction:report.perAction,
   frameChanged:report.frameChanged,visible:report.visible,
   failures:report.proof.filter(v=>!v.frameChanged||v.ink<=600),
  }));
}catch(e){
 report={pass:false,error:String(e),errors};process.exitCode=1;
 console.error('QA_EXCEPTION',String(e));
}finally{
 await writeFile(resolve(root,'omega-aira-native-action-48poses-report.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
