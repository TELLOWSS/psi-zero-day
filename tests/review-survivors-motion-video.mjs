import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const folder='artifacts/graphics-upgrade/candidate-video',motion=JSON.parse(fs.readFileSync('artifacts/graphics-upgrade/candidate-render-all.json','utf8')),ids=motion.map(row=>row.id);
const files=fs.readdirSync(folder).filter(f=>f.endsWith('.webm')).sort((a,b)=>fs.statSync(path.join(folder,a)).mtimeMs-fs.statSync(path.join(folder,b)).mtimeMs).slice(-6);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),reports=[];
try{for(let index=0;index<ids.length;index++){
 const page=await browser.newPage({viewport:{width:1440,height:1040}}),file=files[index],id=ids[index];
 await page.route('**/graphics-review-video.webm',route=>{
  const binary=fs.readFileSync(path.join(folder,file)),range=route.request().headers().range?.match(/bytes=(\d+)-(\d*)/);
  if(!range)return route.fulfill({contentType:'video/webm',headers:{'accept-ranges':'bytes'},body:binary});
  const start=Number(range[1]),end=range[2]?Number(range[2]):binary.length-1;
  return route.fulfill({status:206,contentType:'video/webm',headers:{'accept-ranges':'bytes','content-range':`bytes ${start}-${end}/${binary.length}`},body:binary.subarray(start,end+1)});
 });
 await page.goto(process.env.PSI_PREVIEW_URL??'http://127.0.0.1:5204/');
 const review=await page.evaluate(async ({id,start})=>{
  document.body.innerHTML='';document.body.style.cssText='margin:0;background:#24342e;color:white;font:20px sans-serif';const title=document.createElement('p');title.textContent=id+' · 실제 녹화의 후방 세 방향 · 시간 순서';document.body.append(title);
  const video=document.createElement('video');video.muted=true;video.style.cssText='position:absolute;left:-1500px;width:1440px;height:950px';document.body.append(video);video.src='/graphics-review-video.webm';await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=reject;});
  const samples=[];for(const delta of [.7,.95,1.2,1.45,1.7,1.95]){const time=start+delta;video.currentTime=time;await new Promise(resolve=>video.onseeked=resolve);await video.play();await new Promise(resolve=>video.requestVideoFrameCallback(resolve));video.pause();const canvas=document.createElement('canvas');canvas.width=480;canvas.height=460;canvas.style.verticalAlign='top';document.body.append(canvas);const ctx=canvas.getContext('2d');ctx.drawImage(video,900/1440*video.videoWidth,34/950*video.videoHeight,538/1440*video.videoWidth,580/950*video.videoHeight,0,0,480,450);ctx.fillStyle='white';ctx.font='14px sans-serif';ctx.fillText(time.toFixed(2)+'초',12,458);samples.push(time);}return {duration:video.duration,videoWidth:video.videoWidth,videoHeight:video.videoHeight,samples};
 },{id,start:motion[index].motionStartPageMs/1000});
 await page.screenshot({path:'artifacts/graphics-upgrade/video-contact-sheet-'+id+'.png',fullPage:true});reports.push({id,video:path.join(folder,file),...review});await page.close();
}fs.writeFileSync('artifacts/graphics-upgrade/recorded-motion-review.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));}finally{await browser.close();}
