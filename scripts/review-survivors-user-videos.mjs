import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const sharp=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'sharp'));
const names=['KakaoTalk_20261006_154726491','KakaoTalk_20261006_154722046','KakaoTalk_20261006_113632815'];
const out=path.resolve('artifacts/user-video-review-1547');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 for(const name of names){
  const page=await browser.newPage({viewport:{width:640,height:360}});
  await page.goto(pathToFileURL(`C:/Users/user/Downloads/${name}.mp4`).href);
  await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
  const meta=await page.evaluate(()=>{const v=document.querySelector('video');v.pause();document.body.style.margin='0';v.style.cssText='width:640px;height:360px;object-fit:contain;background:#000';v.controls=false;return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};});
  const portrait=meta.height>meta.width,w=portrait?360:640,h=portrait?780:360,tw=portrait?240:480,th=portrait?520:270;
  await page.setViewportSize({width:w,height:h});await page.evaluate(({w,h})=>{document.querySelector('video').style.cssText=`width:${w}px;height:${h}px;object-fit:contain;background:#000`;},{w,h});
  const times=Array.from({length:12},(_,i)=>Math.min(meta.duration-.1,i*meta.duration/12));
  const tiles=[];
  for(let i=0;i<times.length;i++){
   await page.evaluate(t=>new Promise(resolve=>{const v=document.querySelector('video');if(Math.abs(v.currentTime-t)<.001){resolve();return;}v.addEventListener('seeked',()=>resolve(),{once:true});v.currentTime=t;}),times[i]);
   const file=path.join(out,`${name}-${i}.png`);await page.locator('video').screenshot({path:file});
   tiles.push({input:await sharp(file).resize(tw,th).toBuffer(),left:i%3*tw,top:Math.floor(i/3)*th});
  }
  await sharp({create:{width:tw*3,height:th*4,channels:3,background:'#000'}}).composite(tiles).png().toFile(path.join(out,`${name}-overview.png`));
  if(name!=='KakaoTalk_20261006_154722046'){
   const start=portrait?17:16,sequence=[];
   for(let i=0;i<10;i++){
    await page.evaluate(t=>new Promise(resolve=>{const v=document.querySelector('video');v.addEventListener('seeked',resolve,{once:true});v.currentTime=t;}),start+i*.1);
    const file=path.join(out,`${name}-motion-${i}.png`);await page.locator('video').screenshot({path:file});
    sequence.push({input:await sharp(file).resize(tw,th).toBuffer(),left:i%5*tw,top:Math.floor(i/5)*th});
   }
   await sharp({create:{width:tw*5,height:th*2,channels:3,background:'#000'}}).composite(sequence).png().toFile(path.join(out,`${name}-motion.png`));
  }
  const report={name,...meta,times};fs.writeFileSync(path.join(out,`${name}.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await page.close();
 }
}finally{await browser.close();}
