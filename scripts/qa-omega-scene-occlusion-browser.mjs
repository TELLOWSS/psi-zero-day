import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const base=process.env.OMEGA_QA_ORIGIN||'http://127.0.0.1:4173';
const output=resolve(process.env.OMEGA_OCCLUSION_QA_DIR||'qa-omega-occlusion');await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 const originalClear=CanvasRenderingContext2D.prototype.clearRect,originalImage=CanvasRenderingContext2D.prototype.drawImage,originalArc=CanvasRenderingContext2D.prototype.arc;
 let frame=[];window.__omegaDepthFrames=[];
 const live=ctx=>!!ctx.canvas.closest?.('.omega-protocol-arena');
 CanvasRenderingContext2D.prototype.clearRect=function(...args){
  if(live(this)){if(frame.some(x=>x==='office')&&frame.some(x=>x==='bullet')){window.__omegaDepthFrames.push(frame);if(window.__omegaDepthFrames.length>200)window.__omegaDepthFrames.shift();}frame=[];}
  return originalClear.apply(this,args);
 };
 CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
  if(live(this)&&image instanceof HTMLImageElement&&image.src.includes('site-office-v3.webp')){frame.push('office');window.__omegaOfficeDrawn=true;}
  return originalImage.call(this,image,...args);
 };
 CanvasRenderingContext2D.prototype.arc=function(...args){
  if(live(this)&&this.fillStyle==='#7df3fa')frame.push('bullet');
  return originalArc.apply(this,args);
 };
});
await page.goto(`${base}/?omegaLab=1&omegaSceneArt=1&omegaQaState=combatGun`);
await page.getByText('감염체 원화 16장 로드됨').waitFor({timeout:30000});
await page.waitForFunction(()=>window.__omegaOfficeDrawn===true,null,{timeout:30000});
const arena=page.locator('.omega-protocol-arena');
async function move(key,attr,test){
 await page.keyboard.down(key);
 try{await page.waitForFunction(([attribute,limit,less])=>{const v=Number(document.querySelector('.omega-protocol-arena')?.getAttribute(attribute));return less?v<=limit:v>=limit;},[attr,test.limit,test.less],{timeout:14000,polling:'raf'});}
 finally{await page.keyboard.up(key);}
}
const coord=async()=>({x:Number(await arena.getAttribute('data-omega-player-x')),y:Number(await arena.getAttribute('data-omega-player-y'))});
async function sample(label){
 await page.evaluate(()=>{window.__omegaDepthFrames=[];});await page.keyboard.down('j');await page.waitForTimeout(1350);await page.keyboard.up('j');await page.waitForTimeout(100);
 const frames=await page.evaluate(()=>window.__omegaDepthFrames);
 await page.screenshot({path:`${output}/${label}.png`});
 return {position:await coord(),frames:frames.length,before:frames.filter(a=>a.indexOf('bullet')<a.indexOf('office')).length,after:frames.filter(a=>a.indexOf('bullet')>a.indexOf('office')).length};
}
let report;
try{
 await move('ArrowUp','data-omega-player-y',{limit:164,less:true});
 await move('ArrowRight','data-omega-player-x',{limit:320,less:false});
 const behind=await sample('behind');
 await move('ArrowLeft','data-omega-player-x',{limit:45,less:true});
 await move('ArrowDown','data-omega-player-y',{limit:365,less:false});
 await move('ArrowRight','data-omega-player-x',{limit:320,less:false});
 const front=await sample('front');
 const pass=behind.position.y<185&&front.position.y>325&&behind.frames>0&&behind.before===behind.frames&&front.frames>0&&front.after===front.frames&&!errors.length;
 report={behind,front,errors,pass};if(!pass)process.exitCode=1;
}catch(e){report={error:String(e),position:await coord(),errors,pass:false};process.exitCode=1;}
await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();
