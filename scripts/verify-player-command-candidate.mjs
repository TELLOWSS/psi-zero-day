import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/player-command-candidate');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),results=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390],[568,320]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196/review/player-command-v1.html');await page.waitForFunction(()=>window.attackReview);
  await page.evaluate(()=>window.attackReview.stop());
  const pixels=()=>page.evaluate(()=>{const c=document.querySelector('#stage'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261,top=c.height,bottom=-1;for(let i=0;i<a.length;i++){hash=Math.imul(hash^a[i],16777619)>>>0;if(i%4===3&&a[i]>32){const y=Math.floor(i/4/c.width);top=Math.min(top,y);bottom=Math.max(bottom,y);}}return {hash,top,bottom,height:bottom-top+1};});
  await page.locator('#size').selectOption('game');const frames=[];
  for(let i=1;i<=4;i++){await page.getByRole('button',{name:`프레임 ${i}`,exact:true}).click();frames.push(await pixels());}
  const paused=await pixels();await page.waitForTimeout(200);const still=await pixels();
  await page.getByLabel('원본 겹침',{exact:true}).check();const overlay=await pixels();await page.getByLabel('원본 겹침',{exact:true}).uncheck();
  await page.getByRole('button',{name:'재생',exact:true}).click();await page.waitForTimeout(200);const moving=await pixels();
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(50);const reduced=await pixels();await page.waitForTimeout(200);const quiet=await pixels();
  await page.locator('#size').selectOption('large');await page.screenshot({path:path.join(out,`${width}x${height}.png`),fullPage:true});
  const meta=await page.evaluate(()=>({frames:window.attackReview.frames,overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelector('#stage').getBoundingClientRect().toJSON()}));
  const canvasFits=width<=height||height>500||meta.canvas.top>=0&&meta.canvas.bottom<=height;
  const pass=canvasFits&&!errors.length&&!meta.overflow&&new Set(frames.map(f=>f.hash)).size===4&&frames.every(f=>f.height>=72&&f.height<=76)&&Math.max(...frames.map(f=>f.bottom))-Math.min(...frames.map(f=>f.bottom))<=1&&paused.hash===still.hash&&overlay.hash!==still.hash&&moving.hash!==still.hash&&reduced.hash===quiet.hash;
  results.push({width,height,frames,meta,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
