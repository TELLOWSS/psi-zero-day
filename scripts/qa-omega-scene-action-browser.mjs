import {chromium} from 'playwright-core';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const output=resolve(process.env.OMEGA_SCENE_ACTION_QA_DIR||'qa-omega-scene-action');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});
const rows=[];
{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/infected/infected-anchors.json',async route=>{
   await new Promise(resolve=>setTimeout(resolve,1800));await route.continue();
  });
  await page.goto(`${process.env.OMEGA_QA_ORIGIN||'http://127.0.0.1:4173'}/?omegaLab=1&omegaSceneArt=1`,{waitUntil:'domcontentloaded'});
  await page.getByText('전장과 캐릭터를 준비하고 있습니다').waitFor({timeout:30000});
  const arena=page.locator('.omega-protocol-arena');
  const before=Number(await arena.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.keyboard.up('ArrowRight');
  const during=Number(await arena.getAttribute('data-omega-player-x'));
  await page.getByText('감염체 원화 16장 로드됨').waitFor({timeout:30000});
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(550);await page.keyboard.up('ArrowRight');
  const after=Number(await arena.getAttribute('data-omega-player-x'));
  rows.push({name:'loading-gate',before,during,after,errors});
  if(before!==during||after<=during+2||errors.length)process.exitCode=1;
 }catch(error){rows.push({name:'loading-gate',error:String(error),errors});process.exitCode=1;}
 await page.close();
}
{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.route('**/infected/infected-anchors.json',route=>route.fulfill({status:503,body:'unavailable'}));
  await page.goto(`${process.env.OMEGA_QA_ORIGIN||'http://127.0.0.1:4173'}/?omegaLab=1&omegaSceneArt=1`,{waitUntil:'domcontentloaded'});
  await page.getByText('원화를 불러오지 못했습니다').waitFor({timeout:30000});
  const arena=page.locator('.omega-protocol-arena'),before=Number(await arena.getAttribute('data-omega-player-x'));
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);await page.keyboard.up('ArrowRight');
  const after=Number(await arena.getAttribute('data-omega-player-x'));
  const retryVisible=await page.getByRole('button',{name:'다시 시도'}).isVisible();
  rows.push({name:'loading-failure',before,after,retryVisible,errors});
  if(before!==after||!retryVisible||errors.length)process.exitCode=1;
 }catch(error){rows.push({name:'loading-failure',error:String(error),errors});process.exitCode=1;}
 await page.close();
}
for(const [name,key,heading] of [['front','ArrowDown','S'],['back','ArrowUp','N']]){
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('/scene-art-preview/')&&r.status()!==200)failed.push(r.url());});
 try{
  // The native combatGun fixture has a non-damaging opponent: real hit
  // events cannot legitimately pre-empt the short dash being measured.
  await page.goto(`${process.env.OMEGA_QA_ORIGIN||'http://127.0.0.1:4173'}/?omegaLab=1&omegaSceneArt=1&omegaQaState=combatGun`);
  await page.getByText('감염체 원화 16장 로드됨').waitFor({timeout:30000});
  await page.keyboard.down(key);await page.waitForTimeout(800);await page.keyboard.up(key);
  await page.waitForTimeout(500);
  // Arm the in-page observer BEFORE sending the short native dash input.
  // Starting an unawaited evaluate raced the keypress on busy CI runners.
  await page.evaluate(()=>{
   const seen=[],end=performance.now()+1000;
   window.__omegaActionSamples=seen;window.__omegaActionSamplingDone=false;
   function sample(){
    const frame=document.querySelector('.omega-protocol-arena canvas')?.getAttribute('data-omega-scene-art-frame');
    if(frame&&!seen.includes(frame))seen.push(frame);
    if(performance.now()<end)requestAnimationFrame(sample);else window.__omegaActionSamplingDone=true;
   }
   requestAnimationFrame(sample);
  });
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>window.__omegaActionSamplingDone===true,null,{timeout:5000});
  const frames=await page.evaluate(()=>window.__omegaActionSamples);
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
