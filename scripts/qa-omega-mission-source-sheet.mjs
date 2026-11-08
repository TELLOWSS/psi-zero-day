#!/usr/bin/env node
/**
 * Evidence from the ACTUAL TypeScript source in Vite/Chromium, not an AI
 * illustration or static mockup of the game.
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
const page=await browser.newPage({viewport:{width:1220,height:680},deviceScaleFactor:1});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
let report;
try{
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',
  {waitUntil:'domcontentloaded',timeout:45000});
 const result=await page.evaluate(async()=>{
  const {omegaFieldPlan,omegaFieldInitialProgress}=await import('/src/domain/omega-protocol-field.ts');
  const {drawOmegaMissionDevice,drawOmegaExtractionUnit}=
   await import('/src/ui/omega-protocol-mission-visuals.ts');
  const plans=Array.from({length:15},(_,i)=>omegaFieldPlan(20261108,i+1));
  const byKind=kind=>plans.find(p=>p.event.kind===kind);
  const power=byKind('power_lockout'),evac=byKind('worker_evacuation'),
        brace=byKind('structure_stabilization');
  if(!power||!evac||!brace)throw new Error('Missing distinct mission types');
  const cases=[
   {label:'POWER / LOCKED',plan:power,step:0,done:0,phase:'combat'},
   {label:'POWER / ACTIVE',plan:power,step:0,done:0,phase:'objective'},
   {label:'POWER / COMPLETED',plan:power,step:0,done:1,phase:'objective'},
   {label:'EVAC / ACTIVE',plan:evac,step:0,done:0,phase:'objective'},
   {label:'BRACE / ACTIVE',plan:brace,step:0,done:0,phase:'objective'},
   {label:'EXIT / LOCKED',plan:power,exit:true,unlocked:false},
   {label:'EXIT / OPEN',plan:power,exit:true,unlocked:true},
  ];
  const width=1180,height=560,columns=4,cellW=295,cellH=280;
  const sheet=document.createElement('canvas');
  sheet.width=width;sheet.height=height;
  const ctx=sheet.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw new Error('No 2D source QA context');
  ctx.fillStyle='#071020';ctx.fillRect(0,0,width,height);
  const fingerprints=[];
  for(const [i,entry] of cases.entries()){
   const c=document.createElement('canvas');c.width=270;c.height=220;
   const g=c.getContext('2d',{willReadFrequently:true});
   if(!g)throw new Error('No mission stage QA context');
   g.fillStyle='#142b3e';g.fillRect(0,0,270,220);
   g.save();g.translate(135,187);g.scale(2,2);
   if(entry.exit)drawOmegaExtractionUnit(g,entry.plan.exit,entry.unlocked,2.1);
   else{
    const progress={...omegaFieldInitialProgress(),phase:entry.phase,
     completedSteps:entry.done};
    const step=entry.plan.event.steps[entry.step];
    g.translate(-step.target.x,-step.target.y);
    drawOmegaMissionDevice(g,entry.plan,progress,entry.step,2.1);
   }
   g.restore();
   const bytes=g.getImageData(0,0,270,220).data;
   let ink=0,hash=2166136261;
   for(let n=0;n<bytes.length;n+=4){
    if(bytes[n]>70||bytes[n+1]>85||bytes[n+2]>105)ink++;
    for(let j=0;j<4;j++)hash=Math.imul(hash^bytes[n+j],16777619)>>>0;
   }
   fingerprints.push({label:entry.label,ink,hash:hash.toString(16).padStart(8,'0')});
   const x=(i%columns)*cellW,y=Math.floor(i/columns)*cellH;
   ctx.fillStyle='#16273b';ctx.fillRect(x+4,y+4,cellW-8,cellH-8);
   ctx.drawImage(c,x+12,y+12);
   ctx.strokeStyle='#577a99';ctx.lineWidth=1.5;
   ctx.strokeRect(x+5,y+5,cellW-10,cellH-10);
   ctx.fillStyle='#cce7f7';ctx.font='bold 14px sans-serif';
   ctx.fillText(entry.label,x+16,y+250);
  }
  const unique=new Set(fingerprints.map(f=>f.hash)).size===cases.length;
  const ink=fingerprints.every(f=>f.ink>500);
  return {png:sheet.toDataURL('image/png'),report:{
   pass:unique&&ink,independentCases:cases.length,unique,ink,
   actualSource:true,approvedAiraFrames:false,
   note:'Real Vite Canvas source-rendered control objects; not a gameplay screenshot.',
   fingerprints,
  }};
 });
 await writeFile(resolve(root,'omega-mission-devices-source-1180x560.png'),
  Buffer.from(result.png.split(',')[1],'base64'));
 report={...result.report,errors};
 if(!report.pass||errors.length)process.exitCode=1;
 console.log(report.pass&&!errors.length?'QA_PASS':'QA_FAIL',
   'OMEGA mission source art',JSON.stringify(report));
}catch(e){
 report={pass:false,error:String(e),errors};process.exitCode=1;
 console.error('QA_EXCEPTION',String(e));
}finally{
 await writeFile(resolve(root,'omega-mission-devices-source-report.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
