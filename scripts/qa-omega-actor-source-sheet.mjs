#!/usr/bin/env node
/**
 * Source-authentic technical AIRA actor contact sheet.
 *
 * This loads src/ui/omega-protocol-actor-render.ts from the running Vite dev
 * server in a real Chromium canvas. It NEVER claims to be a full gameplay
 * capture, final illustration, approved 160-frame art, or playable sprite.
 * Eight directions and action poses are drawn by the SAME renderer as OMEGA.
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
const errors=[];
const page=await browser.newPage({viewport:{width:1050,height:850},deviceScaleFactor:1});
page.on('pageerror',error=>errors.push(String(error)));
let report;
try{
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',{
  waitUntil:'domcontentloaded',timeout:45000,
 });
 const result=await page.evaluate(async()=>{
  // Import the REAL checked-out Vite source. No copied illustration code.
  const {drawOmegaProtocolActor,omegaFieldHeading}=
   await import('/src/ui/omega-protocol-actor-render.ts');
  const directions=[
   ['E',1,0],['SE',1,1],['S',0,1],['SW',-1,1],
   ['W',-1,0],['NW',-1,-1],['N',0,-1],['NE',1,-1],
  ];
  const base={facingX:1,facingY:0,moving:false,time:1.2,
   dashing:false,shooting:false,hurt:false};
  const cellW=230,cellH=250;
  const sheet=document.createElement('canvas');
  sheet.width=920;sheet.height=750;
  const ctx=sheet.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw new Error('Chromium Canvas 2D unavailable');
  ctx.fillStyle='#090f20';ctx.fillRect(0,0,sheet.width,sheet.height);
  const drawCell=(index,label,view)=>{
   const left=(index%4)*cellW,top=Math.floor(index/4)*cellH;
   ctx.fillStyle='#14233b';ctx.fillRect(left+4,top+4,cellW-8,cellH-8);
   ctx.strokeStyle='#46617c';ctx.lineWidth=1.5;
   ctx.strokeRect(left+5,top+5,cellW-10,cellH-10);
   ctx.fillStyle='#b6d4e6';ctx.font='bold 14px sans-serif';
   ctx.fillText(label,left+16,top+28);
   ctx.strokeStyle='#3a5165';ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(left+22,top+202);
   ctx.lineTo(left+cellW-22,top+202);ctx.stroke();
   ctx.save();ctx.translate(left+cellW/2,top+201);
   ctx.scale(1.75,1.75);
   drawOmegaProtocolActor(ctx,view);
   ctx.restore();
   ctx.fillStyle='#6d9eb9';ctx.font='10px sans-serif';
   ctx.fillText('SOURCE: procedural / NOT FINAL ART',left+16,top+231);
  };
  const directionPixels=[];
  const fingerprint=view=>{
   const test=document.createElement('canvas');
   test.width=210;test.height=200;
   const g=test.getContext('2d',{willReadFrequently:true});
   if(!g)throw new Error('Fingerprint canvas missing');
   g.translate(105,175);
   drawOmegaProtocolActor(g,view);
   const rgba=g.getImageData(0,0,210,200).data;
   // Only the first eight fingerprint calls are direction samples.
   // Keep pixels in-browser; never serialize the 1.3MB RGBA arrays.
   if(directionPixels.length<8)directionPixels.push(rgba);
   let count=0,hash=2166136261>>>0;
   for(let i=0;i<rgba.length;i+=4){
    if(rgba[i+3]>32)count++;
    for(let k=0;k<4;k++)hash=Math.imul(hash^rgba[i+k],16777619)>>>0;
   }
   return {count,hash:hash.toString(16).padStart(8,'0')};
  };
  const headings=[];
  for(const [i,item] of directions.entries()){
   const [name,x,y]=item;
   const view={...base,facingX:x,facingY:y};
   drawCell(i,'HEADING '+name,view);
   headings.push({heading:name,actual:omegaFieldHeading(x,y),
    ...fingerprint(view)});
  }
  const actions=[
   ['FIRE E',{...base,shooting:true}],
   ['DASH SW',{...base,facingX:-1,facingY:1,dashing:true}],
   ['HIT N',{...base,facingX:0,facingY:-1,hurt:true}],
   ['W BODY / E AIM',{...base,facingX:-1,facingY:0,
    weaponFacingX:1,weaponFacingY:0,shooting:true}],
  ];
  const actionProof=[];
  for(const [i,item] of actions.entries()){
   const [label,view]=item;
   drawCell(8+i,label,view);
   actionProof.push({label,...fingerprint(view)});
  }
  // A checksum-only uniqueness check is too weak: in the original source
  // the E/S pixels differed by just 5.6% of actor ink despite unique hashes.
  // Compare actual image differences normalized to visible character pixels.
  const comparisons=[];
  for(let i=0;i<8;i++)for(let j=i+1;j<8;j++){
   let changed=0,ink=0;
   const left=directionPixels[i],right=directionPixels[j];
   for(let k=0;k<left.length;k+=4){
    if(left[k+3]>32)ink++;
    const delta=Math.abs(left[k]-right[k])+
      Math.abs(left[k+1]-right[k+1])+
      Math.abs(left[k+2]-right[k+2])+
      Math.abs(left[k+3]-right[k+3]);
    if(delta>60)changed++;
   }
   comparisons.push({pair:headings[i].heading+'-'+headings[j].heading,
    changedOverInk:Math.round(changed/Math.max(1,ink)*10000)/10000});
  }
  const minimumDirectionContrast=Math.min(...comparisons.map(c=>c.changedOverInk));
  const pass=headings.length===8&&minimumDirectionContrast>=.18&&
   headings.every(h=>h.heading===h.actual&&h.count>400)&&
   new Set(headings.map(h=>h.hash)).size===8&&
   actionProof.every(a=>a.count>400)&&
   actionProof[0].hash!==headings[0].hash&&
   actionProof[1].hash!==headings[3].hash&&
   actionProof[2].hash!==headings[6].hash&&
   actionProof[3].hash!==headings[4].hash;
  return {sheet:sheet.toDataURL('image/png'),
   report:{pass,source:'Vite actual OMEGA actor renderer in Chromium',
    evidence:'isolated source-rendered technical contact sheet, NOT full game',
    finalAiraArtApproved:false,renderSize:[920,750],
    headings,actionProof,minimumDirectionContrast,
    closestDirectionPairs:comparisons.sort((a,b)=>a.changedOverInk-b.changedOverInk).slice(0,4)}};
 });
 const bytes=Buffer.from(result.sheet.split(',')[1],'base64');
 await writeFile(resolve(root,'aira-source-8direction-920x750.png'),bytes);
 report={...result.report,errors};
 if(!report.pass||errors.length)process.exitCode=1;
 console.log(report.pass&&!errors.length?'QA_PASS':'QA_FAIL',
  'actual OMEGA actor source contact sheet',JSON.stringify(report));
}catch(error){
 process.exitCode=1;
 report={pass:false,error:String(error),errors};
 console.error('QA_EXCEPTION',String(error));
}finally{
 await writeFile(resolve(root,'aira-source-8direction-report.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
