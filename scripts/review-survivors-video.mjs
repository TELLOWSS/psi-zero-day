import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const source=process.env.PSI_REVIEW_VIDEO;if(!source)throw new Error('Set PSI_REVIEW_VIDEO.');
const out=path.resolve('artifacts/video-review');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const page=await browser.newPage({viewport:{width:960,height:720}});
 await page.goto(pathToFileURL(source).href);
 await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
 const metadata=await page.evaluate(()=>{const v=document.querySelector('video');v.pause();v.controls=false;v.style.cssText='width:100vw;height:100vh;object-fit:contain;background:#111';return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};});
 console.log(JSON.stringify(metadata));
 const seconds=process.env.PSI_REVIEW_SECONDS?process.env.PSI_REVIEW_SECONDS.split(',').map(Number):Array.from({length:Math.ceil(metadata.duration/15)},(_,i)=>i*15);
 for(const second of seconds){
  await page.evaluate(async second=>{const v=document.querySelector('video');if(Math.abs(v.currentTime-second)<.01)return;await new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=second;});},second);
  await page.screenshot({path:path.join(out,`${String(second).padStart(4,'0')}s.png`)});
 }
 fs.writeFileSync(path.join(out,'metadata.json'),JSON.stringify({source,...metadata,seconds},null,2));
}finally{await browser.close();}
