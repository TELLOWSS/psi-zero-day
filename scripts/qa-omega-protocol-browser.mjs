#!/usr/bin/env node
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const root=resolve('qa-omega-protocol-captures');
await mkdir(root,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const targets=[
 ['desktop',1440,900,''],
 ['portrait',390,844,''],
 ['landscape',844,390,''],
 ['reward',844,390,'reward'],
 ['boss',844,390,'boss'],
];
const report=[];
let failures=0;
for(const [name,width,height,checkpoint] of targets){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',error=>errors.push('JS '+String(error)));
 page.on('console',message=>{if(message.type()==='error')errors.push('CONSOLE '+message.text())});
 const query='?omegaLab=1'+(checkpoint?'&omegaQaState='+checkpoint:'');
 try{
  await page.goto('http://127.0.0.1:4173/'+query,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('main[data-omega-protocol-internal="true"]').waitFor({timeout:25000});
  await page.waitForTimeout(550);
  const metrics=await page.evaluate(()=>{
   const rect=s=>{const el=document.querySelector(s);if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right};};
   const controls=['.omega-protocol-pad','.omega-protocol-action-pad','.omega-protocol-bottom-toolbar','.omega-protocol-stats'];
   const boxes=Object.fromEntries(controls.map(s=>[s,rect(s)]));
   return {
    docHeight:document.documentElement.scrollHeight,docWidth:document.documentElement.scrollWidth,
    viewportHeight:window.innerHeight,viewportWidth:window.innerWidth,
    arena:rect('.omega-protocol-arena'),
    overlay:rect('.omega-protocol-overlay'),
    canvas:rect('canvas'),
    canvasIntrinsic:{w:document.querySelector('canvas')?.width,h:document.querySelector('canvas')?.height},
    touchTargets:[...document.querySelectorAll('.omega-protocol-pad button,.omega-protocol-action-pad button')]
     .map(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height}}),
    boxes,
    title:document.querySelector('h1')?.textContent?.trim(),
    modalTitle:document.querySelector('.omega-protocol-rewards h2')?.textContent?.trim()||null,
    threatCount:document.querySelector('.omega-protocol-threat strong')?.textContent?.trim(),
   };
  });
  const scrollV=metrics.docHeight>height+2;
  const scrollH=metrics.docWidth>width+2;
  const outside=Object.values(metrics.boxes).some(r=>!r||r.x<0||r.y<0||r.right>width+2||r.bottom>height+2);
  const correctModal=name==='reward' ? metrics.modalTitle==='전술 강화 선택' : name==='boss' ? metrics.threatCount!=='00' : true;
  const stretchedCanvas=!metrics.canvas||!metrics.canvasIntrinsic.w||!metrics.canvasIntrinsic.h||
   Math.abs(metrics.canvas.w/metrics.canvas.h-metrics.canvasIntrinsic.w/metrics.canvasIntrinsic.h)>.06;
  const undersizedTouchTarget=width<=844&&metrics.touchTargets.some(b=>b.w<40||b.h<40);
  await page.screenshot({path:root+'/'+name+'-'+width+'x'+height+'.png',animations:'disabled',fullPage:false});
  const record={name,width,height,...metrics,horizontalOverflow:scrollH,verticalOverflow:scrollV,controlOutOfViewport:outside,
    correctModal,stretchedCanvas,undersizedTouchTarget,errors,actualRepoBrowser:true,originalAiraArtApproved:false};
  report.push(record);
  if(scrollH||scrollV||outside||stretchedCanvas||undersizedTouchTarget||!correctModal||errors.length){failures++;console.error('QA_FAIL',name,JSON.stringify(record));}
  else console.log('QA_PASS',name,width+'x'+height);
 }catch(error){
  failures++;report.push({name,error:String(error)});
  console.error('QA_EXCEPTION',name,String(error));
 }
 await page.close();
}
await writeFile(root+'/qa-report.json',JSON.stringify({source:'GitHub checked-out branch, Vite dev server, real React/Canvas/Watch engine',results:report},null,2));
await browser.close();
if(failures)process.exitCode=1;
