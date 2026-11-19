#!/usr/bin/env node
/**
 * M12-G5b REAL browser viewport regression for a dangerous 4-child CSS-grid
 * auto-row bug. Uses original eight SHA-verified silver WebPs, NOT invented
 * independent painterly E frames or a synthetic screenshot.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const out=resolve('qa-omega-protocol-captures');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const targets=[
 {name:'portrait',w:390,h:844,mobile:true},
 {name:'landscape',w:844,h:390,mobile:true},
 {name:'tablet',w:1024,h:768,mobile:true},
 {name:'desktop',w:1440,h:900,mobile:false},
];
const rows=[];let failures=0;
for(const t of targets){
 const context=await browser.newContext({
  viewport:{width:t.w,height:t.h},deviceScaleFactor:1,
  ...(t.mobile?{hasTouch:true,isMobile:true}:{}),
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaM12G5b=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  const root=page.locator('main[data-omega-protocol-internal="true"]');
  await root.waitFor({timeout:25000});
  await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:30000});
  const getLayout=()=>page.evaluate(()=>{
   const rect=s=>{
    const e=document.querySelector(s);if(!e)return null;
    const r=e.getBoundingClientRect();
    return {x:r.x,y:r.y,w:r.width,h:r.height,top:r.top,bottom:r.bottom};
   };
   const game=document.querySelector('main[data-omega-protocol-internal="true"]');
   const grid=getComputedStyle(game).gridTemplateRows;
   return {
    viewport:{w:innerWidth,h:innerHeight},
    doc:{w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight},
    grid,gridRows:grid.split(' ').filter(Boolean).length,
    layout:game?.getAttribute('data-omega-review-layout'),
    artGate:game?.getAttribute('data-omega-m12g5b-art'),
    sourceStatus:game?.getAttribute('data-omega-aira-v2-ready'),
    header:rect('.omega-protocol-topbar'),bar:rect('.omega-silver-review-bar'),
    arena:rect('.omega-protocol-arena'),canvas:rect('.omega-protocol-arena canvas'),
    footer:rect('.omega-protocol-bottom-toolbar'),
   };
  });
  const before=await getLayout();
  const field=page.locator('.omega-protocol-arena');
  const x0=Number(await field.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(410);
  const x1=Number(await field.getAttribute('data-omega-player-x'));
  await page.screenshot({path:out+'/m12g5b-painterly-preserved-'+t.name+'-'+t.w+'x'+t.h+'.png',
   animations:'disabled',fullPage:false});
  await page.keyboard.up('ArrowRight');
  const ratio=(before.canvas?.h??0)/t.h;
  const good=before.gridRows===4&&before.layout==='true'&&
   before.artGate==='BLOCKED_NO_PAINTERLY_SOURCES'&&
   before.sourceStatus==='true'&&
   before.header&&before.bar&&before.arena&&before.footer&&
   before.header.bottom<=before.bar.top+2&&
   before.bar.bottom<=before.arena.top+3&&
   before.arena.bottom<=before.footer.top+3&&
   before.doc.w<=t.w+3&&ratio>(t.name==='portrait'?.65:.53)&&
   x1>x0+2&&errors.length===0;
  await page.goto('http://127.0.0.1:4173/?omegaLab=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('main[data-omega-protocol-internal="true"]').waitFor();
  await page.waitForTimeout(200);
  const normal=await getLayout();
  const normalPass=normal.gridRows===3&&normal.layout==='false'&&
   normal.bar===null&&normal.canvas?.h>t.h*.60;
  const pass=Boolean(good&&normalPass);
  const record={name:t.name,w:t.w,h:t.h,pass,ratio,
   xMoved:x1-x0,review:before,normal:{gridRows:normal.gridRows,layout:normal.layout,
    canvasHeight:normal.canvas?.h},normalPass,errors,
   painterlySourceApproved:false,originalAiraOriginalsPreserved:true,
   nativePhysicalAndroidPerformanceMeasured:false};
  rows.push(record);
  if(!pass)throw Error('M12G5b real layout/art gate failed '+JSON.stringify(record));
  console.log('QA_PASS M12_G5B',t.name,JSON.stringify({
   reviewGridRows:before.gridRows,canvasHeight:before.canvas.h,
   arenaRatio:ratio,normalGridRows:normal.gridRows,realMove:x1-x0,
  }));
 }catch(e){
  failures++;
  if(rows.at(-1)?.name!==t.name)rows.push({name:t.name,pass:false,error:String(e),errors});
  else{rows.at(-1).pass=false;rows.at(-1).error=String(e);}
  console.error('QA_FAIL M12_G5B',t.name,String(e));
  try{await page.screenshot({path:out+'/m12g5b-FAIL-'+t.name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(out+'/m12g5b-4screen-painterly-blocked-and-layout-report.json',JSON.stringify({
 failures,rows,finalPainterlyEOriginalFrames:0,approved160Frames:0,
 approved320Masks:0,realAndroidFPS:undefined,productionArtApproved:false,
},null,2));
if(failures)process.exitCode=1;
