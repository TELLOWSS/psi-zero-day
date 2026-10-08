import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const input=process.argv[2],output='artifacts/mobile-video-review';if(!input)throw Error('Pass local video path');fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--allow-file-access-from-files']});
try{
 const page=await browser.newPage();await page.goto(`file:///${input.replaceAll('\\','/')}`);await page.waitForFunction(()=>document.querySelector('video')?.readyState>=1);
 const metadata=await page.evaluate(()=>{const v=document.querySelector('video');v.pause();return {duration:v.duration,width:v.videoWidth,height:v.videoHeight};});
 const times=process.env.REVIEW_TIMES?process.env.REVIEW_TIMES.split(',').map(Number):[0,18,36,54,72,90,108,126,144,162,180,202],frames=[];
 for(const time of times){
  const png=await page.evaluate(async time=>{const v=document.querySelector('video');v.pause();await new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=Math.max(.01,time);});const c=document.createElement('canvas');c.width=270;c.height=610;const ctx=c.getContext('2d');ctx.drawImage(v,0,25,270,585);ctx.fillStyle='#ffffff';ctx.font='18px sans-serif';ctx.fillText(`${time}s`,8,20);return c.toDataURL('image/png').split(',')[1];},time);
  fs.writeFileSync(`${output}/${time}s.png`,Buffer.from(png,'base64'));frames.push(png);
 }
 const sheet=await page.evaluate(async frames=>{const c=document.createElement('canvas');c.width=1080;c.height=Math.ceil(frames.length/4)*610;const ctx=c.getContext('2d');for(let i=0;i<frames.length;i++){const image=new Image();image.src=`data:image/png;base64,${frames[i]}`;await image.decode();ctx.drawImage(image,i%4*270,Math.floor(i/4)*610);}return c.toDataURL('image/png').split(',')[1];},frames);
 fs.writeFileSync(`${output}/contact.png`,Buffer.from(sheet,'base64'));fs.writeFileSync(`${output}/metadata.json`,JSON.stringify({input,...metadata,times},null,2));console.log(JSON.stringify(metadata));
}finally{await browser.close();}
