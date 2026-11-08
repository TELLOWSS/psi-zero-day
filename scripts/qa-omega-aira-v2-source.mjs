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
const failures=[];
const results={source:'real Vite + Chromium, AIRA V2 user-selected source art',
 finalAnimatedSpritePack:false,directions:[],home:[]};
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>failures.push('JS '+e.message));
 await page.goto('http://127.0.0.1:4173/?omegaLab=1',
  {waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('main[data-omega-protocol-internal="true"]').waitFor();
 await page.waitForFunction(()=>document.querySelector('main[data-omega-protocol-internal="true"]')
  ?.getAttribute('data-omega-aira-v2-ready')==='true',{timeout:15000});
 await page.screenshot({path:resolve(root,'aira-v2-live-combat-1440x900.png'),fullPage:false});
 const frames=await page.evaluate(async()=>{
  const keys=['E','SE','S','SW','W','NW','N','NE'];
  const images=[];
  for(const key of keys){
   const img=new Image(),url='/assets/omega/aira-v2/'+key.toLowerCase()+'-idle.webp';
   img.src=url;await img.decode();
   if(img.naturalWidth<64||img.naturalHeight<110)
    throw new Error('Bad directional image '+key);
   images.push({key,url,img});
  }
  const sheet=document.createElement('canvas');sheet.width=8*145;sheet.height=280;
  const ctx=sheet.getContext('2d');
  if(!ctx)throw new Error('Missing Canvas2D');
  ctx.fillStyle='#162639';ctx.fillRect(0,0,sheet.width,sheet.height);
  const hashes=[];
  for(const [i,{key,url,img}] of images.entries()){
   const isolated=document.createElement('canvas');
   isolated.width=192;isolated.height=336;
   const g=isolated.getContext('2d',{willReadFrequently:true});
   g.drawImage(img,0,0,192,336);
   const pixels=g.getImageData(0,0,192,336).data;
   let pixelsWithAlpha=0,hash=2166136261;
   for(let k=0;k<pixels.length;k+=4){
    if(pixels[k+3]>64)pixelsWithAlpha++;
    for(let c=0;c<4;c++)hash=Math.imul(hash^pixels[k+c],16777619)>>>0;
   }
   if(pixels[3]>20||pixels[191*4+3]>20||pixelsWithAlpha<1400)
    throw new Error('Incomplete transparent actor '+key);
   hashes.push({key,url,width:img.naturalWidth,height:img.naturalHeight,
    ink:pixelsWithAlpha,hash:hash.toString(16)});
   const x=i*145;
   ctx.fillStyle='#233c52';ctx.fillRect(x+4,8,136,243);
   ctx.drawImage(img,x+9,12,126,220);
   ctx.fillStyle='#d5e5f4';ctx.font='bold 13px system-ui';
   ctx.fillText(key,x+60,263);
  }
  if(new Set(hashes.map(x=>x.hash)).size!==8)
   throw new Error('Mirrored or duplicated direction images');
  return {png:sheet.toDataURL('image/png'),hashes};
 });
 results.directions=frames.hashes;
 await writeFile(resolve(root,'aira-v2-real-8-direction-candidate.png'),
  Buffer.from(frames.png.split(',')[1],'base64'));
 // Check the real in-game AIRA badge rather than an isolated Photoshop panel.
 const portrait=await page.locator('.omega-protocol-hero-identity img').evaluate(el=>({
  url:new URL(el.currentSrc).pathname,loaded:el.complete&&el.naturalWidth>=100,
 }));
 if(!portrait.loaded||!portrait.url.includes('/aira-v2/portrait.webp'))
  failures.push('OMEGA real header did not load AIRA V2 portrait');
 results.gamePortrait=portrait;
 await page.close();

 // The 2026-11 main hero retains live DOM actions, no baked UI screenshot.
 for(const [label,w,h] of [['desktop',1440,900],['portrait',390,844]]){
  const home=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
  home.on('pageerror',e=>failures.push(label+' '+e.message));
  await home.goto('http://127.0.0.1:4173/',
   {waitUntil:'domcontentloaded',timeout:45000});
  const image=home.locator('.rg-veteran-character.rg-aira-v2');
  await image.waitFor({timeout:20000});
  await image.evaluate(img=>img.decode());
  const meta=await image.evaluate(el=>({
   url:new URL(el.currentSrc).pathname,loaded:el.complete&&el.naturalWidth>=400,
   width:el.naturalWidth,height:el.naturalHeight,
  }));
  const nativeButtons=await home.locator('.rg-hero-buttons button').count();
  const valid=meta.loaded&&meta.url.includes('/aira-v2/hero-splash.webp')&&nativeButtons>=2;
  if(!valid)failures.push(label+' home AIRA V2 image or live DOM buttons not available');
  results.home.push({label,width:w,height:h,...meta,nativeButtons,pass:valid});
  await home.screenshot({path:resolve(root,'aira-v2-main-'+label+'.png'),fullPage:false});
  await home.close();
 }
}catch(e){failures.push(String(e));}
finally{
 results.pass=failures.length===0;results.failures=failures;
 await writeFile(resolve(root,'aira-v2-media-qa.json'),JSON.stringify(results,null,2));
 await browser.close();
 console.log(results.pass?'QA_PASS':'QA_FAIL',
  'AIRA V2 actual source and home',JSON.stringify({
   pass:results.pass,poses:results.directions.length,home:results.home.map(x=>({label:x.label,pass:x.pass})),failures,
  }));
 if(!results.pass)process.exitCode=1;
}
