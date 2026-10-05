import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/animation-music');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--autoplay-policy=document-user-activation-required']});
const results=[];
try {
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
   const Original=window.AudioContext;
   const connect=AudioNode.prototype.connect;
   AudioNode.prototype.connect=function(destination,...args){
    const result=connect.call(this,destination,...args);
    if(destination===this.context.destination&&this.context.qaAnalyser)connect.call(this,this.context.qaAnalyser);
    return result;
   };
   window.qaContexts=[];
   window.AudioContext=class extends Original {
    constructor(...args){super(...args);window.qaContexts.push(this);this.qaStarts=0;this.qaAnalyser=this.createAnalyser();
     this.qaRms=()=>{const data=new Float32Array(this.qaAnalyser.fftSize);this.qaAnalyser.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((sum,value)=>sum+value*value,0)/data.length);};
     const create=this.createBufferSource.bind(this);
     this.createBufferSource=()=>{const source=create(),start=source.start.bind(source);source.start=(...args)=>{this.qaStarts++;return start(...args);};return source;};
    }
   };
  });
  await page.goto('http://127.0.0.1:5196');
  await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  // No dedicated music button has been touched.
  await page.waitForFunction(()=>window.qaContexts.some(ctx=>ctx.state==='running'&&ctx.qaStarts>0),null,{timeout:8000}).catch(async error=>{console.log(await page.evaluate(()=>({contexts:window.qaContexts.map(ctx=>({state:ctx.state,starts:ctx.qaStarts})),text:document.body.innerText.slice(0,500)})),errors);throw error;});
  await page.waitForFunction(()=>window.qaContexts.at(-1).qaRms()>.0001);
  const automatic=await page.evaluate(()=>({state:window.qaContexts.at(-1).state,starts:window.qaContexts.at(-1).qaStarts,rms:window.qaContexts.at(-1).qaRms()}));
  await page.screenshot({path:path.join(out,`${width}x${height}-ready.png`)});
  const music=page.getByRole('button',{name:'배경 음악',exact:true});
  await music.click();const off=await music.getAttribute('aria-pressed');
  await page.waitForFunction(()=>window.qaContexts.at(-1).qaRms()<.00001);
  const before=await page.evaluate(()=>window.qaContexts.at(-1).qaStarts);
  await music.click();await page.waitForFunction(before=>window.qaContexts.at(-1).qaStarts>before,before);
  const on=await music.getAttribute('aria-pressed');
  const resetBefore=await page.evaluate(()=>window.qaContexts.at(-1).qaStarts);
  await page.getByRole('button',{name:/^현장 입문 클리어/}).click();
  await page.waitForFunction(before=>window.qaContexts.at(-1).qaStarts>before&&window.qaContexts.at(-1).qaRms()>.0001,resetBefore);
  const animation=await page.evaluate(async()=>{
   const {cinematicLook,drawCinematicFlight,drawCinematicContact}=await import('/src/ui/survivors-cinematic-vfx.ts');
   const image=async src=>{const img=new Image();img.src=src;await img.decode();return img;};
   const atlas=await image('/assets/survivors/cinematic-vfx-v2.webp');
   const canvas=document.createElement('canvas');canvas.width=240;canvas.height=160;
   const ctx=canvas.getContext('2d');
   const render=(kind,time,reduced=false)=>{
    ctx.clearRect(0,0,240,160);ctx.save();ctx.translate(120,80);
    drawCinematicFlight(ctx,{id:'qa',kind,x:0,y:0,vx:100,vy:0,duration:.2,radius:4},cinematicLook(kind,5,['sync_gauntlet']),atlas,reduced,false,time);
    ctx.restore();return Array.from(ctx.getImageData(0,0,240,160).data);
   };
   const changed=(a,b)=>a.reduce((count,value,i)=>count+(value!==b[i]?1:0),0);
   const flights=['radio','satellite_wave','drone_laser','hunter_beam'].map(kind=>({kind,changed:changed(render(kind,.1),render(kind,.22)),reducedChanged:changed(render(kind,.1,true),render(kind,.22,true)),pausedChanged:changed(render(kind,.22),render(kind,.22)),nonblank:render(kind,.1).some(v=>v>0)}));
   const contacts=['hunter_beam','tesla_bolt','cryo_blast','emf_beam'].map(kind=>{
    const frame=age=>{ctx.clearRect(0,0,240,160);ctx.save();ctx.translate(120,80);drawCinematicContact(ctx,{projectileId:'qa',kind,phase:'impact',angle:.3},age,.4,cinematicLook(kind,5),atlas,false,false);ctx.restore();return Array.from(ctx.getImageData(0,0,240,160).data);};
    return {kind,changed:changed(frame(.02),frame(.18)),nonblank:frame(.02).some(v=>v>0)};
   });
   return {flights,contacts};
  });
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  results.push({width,height,automatic,off,on,animation,overflow,errors,pass:automatic.state==='running'&&automatic.starts>0&&off==='false'&&on==='true'&&!overflow&&!errors.length&&animation.flights.every(f=>f.changed>0&&f.reducedChanged===0&&f.pausedChanged===0&&f.nonblank)&&animation.contacts.every(c=>c.changed>0&&c.nonblank)});
  await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'REAL_READY_AUDIO_WITHOUT_MUSIC_BUTTON_AND_CONTROLLED_RASTER_ANIMATION_FRAMES',results},null,2));
 console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
} finally {await browser.close();}
