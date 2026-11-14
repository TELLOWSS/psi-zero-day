import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const output=resolve(process.env.OMEGA_SCENE_ACTION_QA_DIR||'qa-omega-scene-action');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const rows=[];
for(const [name,key,heading] of [['front','ArrowDown','S'],['back','ArrowUp','N']]){
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('/scene-art-preview/')&&r.status()!==200)failed.push(r.url());});
 try{
  await page.goto(`${process.env.OMEGA_QA_ORIGIN||'http://127.0.0.1:4173'}/?omegaLab=1&omegaSceneArt=1&omegaQaState=zombieAI`);
  await page.getByText('감염체 원화 16장 로드됨').waitFor({timeout:30000});
  await page.keyboard.down(key);await page.waitForTimeout(800);await page.keyboard.up(key);
  await page.waitForTimeout(500);
  const sampling=page.evaluate(()=>new Promise(resolve=>{
   const seen=[],end=performance.now()+1000;
   function sample(){
    const frame=document.querySelector('.omega-protocol-arena canvas')?.getAttribute('data-omega-scene-art-frame');
    if(frame&&!seen.includes(frame))seen.push(frame);
    if(performance.now()<end)requestAnimationFrame(sample);else resolve(seen);
   }
   requestAnimationFrame(sample);
  }));
  await page.keyboard.press('Space');const frames=await sampling;
  await page.screenshot({path:`${output}/${name}.png`});
  const actionFrames=frames.filter(f=>f.startsWith(`dash-${heading}-`));
  rows.push({name,frames,actionFrames,errors,failed});
  if(actionFrames.length<2||errors.length||failed.length)process.exitCode=1;
 }catch(error){rows.push({name,error:String(error),errors,failed});process.exitCode=1;}
 await page.close();
}
await browser.close();
await writeFile(`${output}/report.json`,JSON.stringify({rows,physicalAndroid:false},null,2));
console.log(JSON.stringify(rows));
