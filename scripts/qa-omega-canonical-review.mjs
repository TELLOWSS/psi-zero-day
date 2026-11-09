#!/usr/bin/env node
/**
 * Source-browser audit for the REAL static AIRA silver art REVIEW interface.
 * Uses one clearly artificial WebP fixture to test local-file import without
 * claiming a finished 8-way turntable or replacing user-approved live art.
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
const page=await browser.newPage({viewport:{width:1366,height:900},deviceScaleFactor:1});
const pageErrors=[];
page.on('pageerror',error=>pageErrors.push(String(error)));
let report;
try{
 await page.goto('http://127.0.0.1:4173/omega-canonical-art-review/index.html',
  {waitUntil:'domcontentloaded',timeout:45000});
 const initial=await page.evaluate(()=>({
  title:document.title,heading:document.querySelector('h1')?.textContent,
  modeButtons:document.querySelectorAll('#slots button').length,
  mainModes:[...document.querySelectorAll('.games span')].map(x=>x.textContent?.trim()),
  notice:document.querySelector('.notice')?.textContent?.trim(),
  src:document.querySelector('#art')?.getAttribute('src'),
 }));
 if(initial.modeButtons!==9||
  initial.mainModes.join('|')!=='SIGNAL GUARD · 시그널 가드|SIGNAL WATCH · 시그널 워치'||
  !initial.notice.includes('실제 게임')||!initial.src.endsWith('/aira-v2/e.webp'))
  throw new Error('Canonical review screen broke the two-main-game contract');
 await page.locator('#slots button').filter({hasText:'NW'}).click();
 const backLabel=await page.locator('#detail').innerText();
 if(!backLabel.includes('재제작'))throw new Error('NW redraw requirement not disclosed');
 await page.locator('#slots button').filter({hasText:'M01'}).click();
 const maleSrc=await page.locator('#art').getAttribute('src');
 if(!maleSrc.endsWith('/male/m01.webp'))throw new Error('Male candidate lookup failed');
 await page.screenshot({path:resolve(out,'canonical-art-review-unimported-desktop.png'),fullPage:true});
 // Synthetic file to test the exact same HTML canvas + local browser input.
 // It is intentionally just a rectangle and NEVER labeled actual AIRA art.
 const injected=await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');
  canvas.width=384;canvas.height=512;
  const c=canvas.getContext('2d');
  if(!c)throw new Error('Canvas2D unavailable');
  c.fillStyle='#6b37aa';c.fillRect(96,80,192,370);
  const blob=await new Promise((resolve,reject)=>
   canvas.toBlob(b=>b?resolve(b):reject(new Error('No synthetic WebP')),'image/webp',.86));
  const file=new File([blob],'e-silver-review.webp',{type:'image/webp'});
  const dt=new DataTransfer();dt.items.add(file);
  const input=document.querySelector('#folder');
  if(!input)throw new Error('No file picker');
  input.files=dt.files;
  input.dispatchEvent(new Event('change',{bubbles:true}));
  return {name:file.name,size:blob.size};
 });
 await page.locator('#slots button').filter({hasText:'E'}).first().click();
 await page.waitForFunction(()=>!document.querySelector('#art')?.hidden,{timeout:10000});
 const loaded=await page.evaluate(()=>({
  width:document.querySelector('#art')?.naturalWidth,
  height:document.querySelector('#art')?.naturalHeight,
  status:document.querySelector('#status')?.textContent,
  src:document.querySelector('#art')?.getAttribute('src')?.slice(0,5),
  approved:document.querySelector('.checklist')?.textContent?.includes('미승인'),
 }));
 if(loaded.width!==384||loaded.height!==512||!loaded.status.includes('표시 완료')||
  loaded.src!=='blob:'||!loaded.approved)
  throw new Error('Synthetic local-file selection or approval gate failed');
 await page.screenshot({path:resolve(out,'canonical-art-review-synthetic-fixture-not-art.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:resolve(out,'canonical-art-review-mobile-390.png'),fullPage:true});
 await page.keyboard.press('ArrowRight');
 const next=await page.locator('#heading').innerText();
 if(!next.includes('우하'))throw new Error('Keyboard angle navigation broke');
 report={pass:pageErrors.length===0,
  initial,backLabel,maleSrc,syntheticFixture:injected,loaded,next,pageErrors,
  onlyReview:true,productionActivated:false,original8DirectionsApproved:false};
 if(!report.pass)process.exitCode=1;
 console.log(report.pass?'QA_PASS':'QA_FAIL',
  'canonical silver AIRA/male review UI, local synthetic fixture only',
  JSON.stringify({pass:report.pass,localWebP:loaded,keyboardNext:next,pageErrors}));
}catch(error){
 report={pass:false,error:String(error),pageErrors};process.exitCode=1;
 console.error('QA_EXCEPTION','canonical art review browser',String(error));
}finally{
 await writeFile(resolve(out,'canonical-art-review-browser-report.json'),
  JSON.stringify(report,null,2));
 await page.close();await browser.close();
}
