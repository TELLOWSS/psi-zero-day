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
 ['objective',844,390,'objective'],
 ['exit',844,390,'exit'],
 ['reward',844,390,'reward'],
 ['boss',844,390,'boss'],
 ['final-boss',844,390,'finalBoss'],
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
  // Actual browser input must move the real Watch-engine player, not only
  // paint a HUD screenshot. Only the landscape source QA uses this probe.
  let walkTest=null,stickTest=null;
  if(name==='landscape'){
   const arena=page.locator('.omega-protocol-arena');
   const startX=Number(await arena.getAttribute('data-omega-player-x'));
   await page.keyboard.down('ArrowRight');
   await page.waitForTimeout(430);
   await page.keyboard.up('ArrowRight');
   await page.waitForTimeout(180);
   const endX=Number(await arena.getAttribute('data-omega-player-x'));
   walkTest={startX,endX,pass:Number.isFinite(startX)&&Number.isFinite(endX)&&endX>startX+3};
   // True Playwright pointer drag (not a direct state mutation): diagonal
   // input must move both axes, and release must return the thumb to center.
   const stick=page.locator('.omega-protocol-stick');
   const box=await stick.boundingBox();
   if(!box){stickTest={pass:false,reason:'stick not visible'};}
   else{
    const beforeX=Number(await arena.getAttribute('data-omega-player-x'));
    const beforeY=Number(await arena.getAttribute('data-omega-player-y'));
    const cx=box.x+box.width/2,cy=box.y+box.height/2;
    await page.mouse.move(cx,cy);
    await page.mouse.down();
    await page.mouse.move(cx+34,cy+30,{steps:7});
    await page.waitForTimeout(480);
    await page.mouse.up();
    await page.waitForTimeout(170);
    const afterX=Number(await arena.getAttribute('data-omega-player-x'));
    const afterY=Number(await arena.getAttribute('data-omega-player-y'));
    const thumb=await page.locator('.omega-protocol-stick-thumb').evaluate(
     el=>el.style.transform,
    );
    stickTest={beforeX,beforeY,afterX,afterY,thumb,
     pass:afterX>beforeX+3&&afterY>beforeY+3&&
      thumb==='translate3d(0,0,0)'};
   }
  }
  const metrics=await page.evaluate(()=>{
   const rect=s=>{const el=document.querySelector(s);if(!el)return null;const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom,right:r.right};};
   const controls=['.omega-protocol-pad','.omega-protocol-action-pad','.omega-protocol-bottom-toolbar','.omega-protocol-stats','.omega-protocol-mission'];
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
    bossBanner:document.querySelector('.omega-protocol-boss-alert')?.textContent?.trim()||null,
    bossMeter:document.querySelector('.omega-protocol-boss-hp')?.getAttribute('aria-valuenow')||null,
    missionTitle:document.querySelector('.omega-protocol-mission strong')?.textContent?.trim()||null,
    missionInstructions:document.querySelector('.omega-protocol-mission span')?.textContent?.trim()||null,
   };
  });
  const scrollV=metrics.docHeight>height+2;
  const scrollH=metrics.docWidth>width+2;
  const outside=Object.values(metrics.boxes).some(r=>!r||r.x<0||r.y<0||r.right>width+2||r.bottom>height+2);
  const correctModal=name==='reward' ? metrics.modalTitle==='전술 강화 선택'
   : name==='boss' ? metrics.threatCount!=='00'&&Boolean(metrics.bossBanner?.includes('BOSS 01'))&&metrics.bossMeter!==null
   : name==='final-boss' ? metrics.threatCount!=='00'&&Boolean(metrics.bossBanner?.includes('FINAL BOSS'))&&metrics.bossMeter!==null
   : name==='objective' ? (metrics.missionTitle||'').includes('조작')
   : name==='exit' ? metrics.missionTitle==='다음 구역 출구 개방'
   : metrics.missionTitle!==null;
  const stretchedCanvas=!metrics.canvas||!metrics.canvasIntrinsic.w||!metrics.canvasIntrinsic.h||
   Math.abs(metrics.canvas.w/metrics.canvas.h-metrics.canvasIntrinsic.w/metrics.canvasIntrinsic.h)>.06;
  const undersizedTouchTarget=width<=844&&metrics.touchTargets.some(b=>b.w<40||b.h<40);
  await page.screenshot({path:root+'/'+name+'-'+width+'x'+height+'.png',animations:'disabled',fullPage:false});
  const record={name,width,height,...metrics,horizontalOverflow:scrollH,verticalOverflow:scrollV,controlOutOfViewport:outside,
    correctModal,stretchedCanvas,undersizedTouchTarget,walkTest,stickTest,errors,actualRepoBrowser:true,originalAiraArtApproved:false};
  report.push(record);
  if(scrollH||scrollV||outside||stretchedCanvas||undersizedTouchTarget||!correctModal||walkTest?.pass===false||stickTest?.pass===false||errors.length){failures++;console.error('QA_FAIL',name,JSON.stringify(record));}
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
