#!/usr/bin/env node
/**
 * M12-G5c REAL browser acceptance: four-size genuine silver-original game
 * plus session-only SOURCE IMPORT. Browser-generated pixel patterns used
 * ONLY as artificial QA fixtures, NEVER asserted to be painted AIRA art.
 * Genuine four artist-painted high-quality E frames still missing.
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
const screens=[['pc',1440,900,false],['tablet',1024,768,true],
 ['portrait',390,844,true],['landscape',844,390,true]];
let failures=0;const records=[];
for(const [name,w,h,mobile] of screens){
 const context=await browser.newContext({
  viewport:{width:w,height:h},deviceScaleFactor:1,
  ...(mobile?{hasTouch:true,isMobile:true}:{})});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaM12G5c=1',
   {waitUntil:'domcontentloaded',timeout:45000});
  const root=page.locator('main[data-omega-protocol-internal="true"]');
  await root.waitFor({timeout:25000});
  await page.locator('[data-omega-silver-preview="ready"]').waitFor({timeout:30000});
  const rootAttr=async k=>root.getAttribute(k);
  const before=await page.evaluate(()=>{
   const root=document.querySelector('main[data-omega-protocol-internal="true"]');
   const c=document.querySelector('.omega-protocol-arena canvas')?.getBoundingClientRect();
   const notice=document.querySelector('.omega-silver-review-bar')?.getBoundingClientRect();
   return {grid:getComputedStyle(root).gridTemplateRows,
    canvasHeight:c?.height??0,noticeHeight:notice?.height??0,
    horizontalOverflow:document.documentElement.scrollWidth>innerWidth+3};
  });
  const initial={
   source:await rootAttr('data-omega-m12g5c-source-status'),
   preview:await rootAttr('data-omega-m12g5c-preview'),
   art:await rootAttr('data-omega-m12g5c-art'),
   originals:await rootAttr('data-omega-aira-v2-ready'),
  };
  await page.screenshot({path:dir+'/m12g5c-original-silver-'+name+'-'+w+'x'+h+'.png',
   animations:'disabled',fullPage:false});
  // The original WebP is still used. Negative upload MUST fail closed.
  const invalid=await page.evaluate(async()=>{
   const cv=document.createElement('canvas');cv.width=384;cv.height=512;
   const ctx=cv.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(100,15,120,488);
   const s=await new Promise(res=>cv.toBlob(res,'image/webp',.96));
   return {name:'aira-east-walk-0.webp',
    mimeType:'image/webp',
    base64:await new Promise(res=>{
     const reader=new FileReader();reader.onload=()=>res(reader.result.split(',')[1]);
     reader.readAsDataURL(s);
    })};
  });
  await page.locator('#omega-g5c-files').setInputFiles([{
   name:invalid.name,mimeType:invalid.mimeType,
   buffer:Buffer.from(invalid.base64,'base64'),
  }]);
  await page.locator('[data-omega-g5c-feedback="failed"]').waitFor({timeout:15000});
  const negativePass=(await rootAttr('data-omega-m12g5c-preview'))==='off'&&
   (await rootAttr('data-omega-m12g5c-source-status'))==='failed';
  const fixtures=await page.evaluate(async()=>{
   const out=[];
   for(let n=0;n<4;n++){
    const cv=document.createElement('canvas');cv.width=384;cv.height=512;
    const ctx=cv.getContext('2d');
    const x=103+n*23;
    const g=ctx.createLinearGradient(x,20,x+120,510);
    g.addColorStop(0,'#dbe7fa');g.addColorStop(.4,'#604d93');
    g.addColorStop(1,'#182d45');ctx.fillStyle=g;
    ctx.fillRect(x,18,110,492);
    // Deliberately NON-AIRA noise to assert pixel differentiation and
    // QA harness functionality; not new artist-painted character art.
    for(let k=0;k<1500;k++){
     const xx=x+((k*131+n*29)%108);
     const yy=28+((k*47+n*13)%470);
     ctx.fillStyle='rgba('+((k*13)%256)+','+((k*19)%256)+','+
      ((k*37)%256)+',.28)';
     ctx.fillRect(xx,yy,2,3);
    }
    const blob=await new Promise(res=>cv.toBlob(res,'image/webp',.95));
    const base64=await new Promise(res=>{
     const reader=new FileReader();reader.onload=()=>res(reader.result.split(',')[1]);
     reader.readAsDataURL(blob);
    });
    out.push({name:'aira-east-walk-'+n+'.webp',mimeType:'image/webp',base64});
   }
   return out;
  });
  await page.locator('#omega-g5c-files').setInputFiles(fixtures.map(f=>({
   name:f.name,mimeType:f.mimeType,buffer:Buffer.from(f.base64,'base64'),
  })));
  await page.locator('[data-omega-g5c-feedback="ready"]').waitFor({timeout:25000});
  await page.locator('[data-omega-g5c-toggle="true"]').click();
  const enabled=await rootAttr('data-omega-m12g5c-preview');
  const arena=page.locator('.omega-protocol-arena');
  const x0=Number(await arena.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(660);
  const x1=Number(await arena.getAttribute('data-omega-player-x'));
  const evidence=await page.evaluate(async()=>{
   const {omegaG5cReview}=await import('/src/ui/omega-protocol-m12g5c-local-art-review.ts');
   return {ready:omegaG5cReview.ready,active:omegaG5cReview.active,
    draw:omegaG5cReview.evidence(),proof:omegaG5cReview.sessionProof};
  });
  await page.keyboard.up('ArrowRight');
  // Label synthetic captures clearly in evidence; never show as real art.
  await page.screenshot({path:dir+'/m12g5c-SYNTHETIC-QA-NOT-ART-'+name+'-'+w+'x'+h+'.png',
   animations:'disabled',fullPage:false});
  await page.locator('[data-omega-g5c-toggle="true"]').click();
  const reverted=await rootAttr('data-omega-m12g5c-preview');
  await page.screenshot({path:dir+'/m12g5c-reverted-original-'+name+'-'+w+'x'+h+'.png',
   animations:'disabled',fullPage:false});
  const pass=initial.source==='idle'&&initial.preview==='off'&&
   initial.originals==='true'&&
   initial.art==='AWAITING_FOUR_INDEPENDENT_PAINTED_WEBPS'&&
   before.canvasHeight>h*.55&&!before.horizontalOverflow&&
   negativePass&&enabled==='session-only-not-approved'&&reverted==='off'&&
   evidence.ready&&evidence.active&&evidence.draw.draws>1&&
   evidence.draw.frames.length>=2&&
   evidence.proof?.assets?.length===4&&
   evidence.proof?.artworkSignoff===false&&
   evidence.proof?.independentPaintedArtVerified===false&&x1>x0+2&&
   errors.length===0;
  const record={name,w,h,pass,before,initial,negativePass,enabled,reverted,
   nativePlayerMoved:x1-x0,
   sessionProof:evidence.proof,draws:evidence.draw,errors,
   humanArtApproved:false,allFourTestImagesAreSynthetic:true,
   androidPhysicalFPSMeasured:false};
  records.push(record);
  if(!pass)throw Error('M12G5c QA fixture test failure '+JSON.stringify(record));
  console.log('QA_PASS M12_G5C',name,JSON.stringify({
   canvas:before.canvasHeight,nativeMoved:x1-x0,draws:evidence.draw,
   rejectedUnapproved:true,realPainterlyArtDelivered:false}));
 }catch(error){
  failures++;
  if(records.at(-1)?.name!==name)records.push({name,pass:false,error:String(error),errors});
  else{records.at(-1).pass=false;records.at(-1).error=String(error);}
  console.error('QA_FAIL M12_G5C',name,String(error));
  try{await page.screenshot({path:dir+'/m12g5c-FAIL-'+name+'.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(dir+'/m12g5c-session-only-four-source-qa-report.json',JSON.stringify({
 failures,records,originalIndependentlyPaintedEFramesCreated:0,
 approved160Sources:0,approved320Masks:0,productionReleaseApproved:false,
},null,2));
if(failures)process.exitCode=1;
