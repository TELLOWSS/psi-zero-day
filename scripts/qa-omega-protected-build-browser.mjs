import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright-core';

const base='http://127.0.0.1:4173/';
await mkdir('artifacts/omega-protected',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(base+'?omegaLab=1');
  const ready=page.locator('[data-omega-protected-art="ready"][data-omega-silver-preview="ready"]');
  await ready.waitFor({timeout:45000});
  assert.match(await ready.locator('.omega-silver-review-bar strong').innerText(),/1–15구역 연결 전장 검수/);
  const arena=ready.locator('.omega-protocol-arena');
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   if(el?.dataset.omegaWorldWave!=='1'||el.dataset.omegaFieldPhase!=='combat')return false;
   const {draws}=JSON.parse(el.dataset.omegaInfectedEvidence??'{}');
   return draws&&Object.keys(draws).length===4&&Object.values(draws).every(n=>n>0);
  },null,{timeout:12000});
  const canvas=arena.locator('canvas');
  await canvas.screenshot({path:`artifacts/omega-protected/${width}x${height}-first-battle.png`});
  for(const [view,from,to,start,end,kind] of [
   ['lift','3','4',0,180,'scaffold_lift'],
   ['crane','6','7',180,420,'crane_elevator'],
   ['tunnel','9','10',420,300,'service_tunnel'],
   ['airlock','12','13',300,300,'control_airlock'],
  ]){
   await page.goto(base+'?omegaLab=1&omegaView='+view);
   await ready.waitFor({timeout:45000});
   assert.equal(await arena.getAttribute('data-omega-world-wave'),from);
   assert.equal(Number(await arena.getAttribute('data-omega-player-elevation')),start);
   await page.keyboard.down('ArrowRight');
   try{
    await page.waitForFunction(()=>Number(document.querySelector('.omega-protocol-arena')?.dataset.omegaPlayerX)>=1160,
     null,{timeout:8000});
   }finally{await page.keyboard.up('ArrowRight');}
   await page.keyboard.press('e');
   await page.waitForFunction(({start,end,kind})=>{
    const data=document.querySelector('.omega-protocol-arena')?.dataset;
    const height=Number(data?.omegaPlayerElevation);
    if(data?.omegaTransitKind!==kind||data.omegaTransitPhase!=='depart')return false;
    if(start===end)return height===start;
    return height>Math.min(start,end)+10&&height<Math.max(start,end)-10;
   },{start,end,kind},{timeout:8000});
   if(view==='tunnel'){
    await page.keyboard.down('ArrowLeft');
    try{
     await page.waitForFunction(()=>{
      const data=document.querySelector('.omega-protocol-arena')?.dataset;
      const elevation=Number(data?.omegaPlayerElevation);
      return data?.omegaTransitPhase==='depart'&&elevation<375&&elevation>310&&
       Number(data.omegaPlayerX)===1400;
     },null,{timeout:4000});
    }finally{await page.keyboard.up('ArrowLeft');}
   }
   await canvas.screenshot({path:`artifacts/omega-protected/${width}x${height}-${view}-transit.png`});
   if(Number(from)%2===0){
    const reward=page.locator(`[data-omega-reward-next-wave="${to}"]`);
    await reward.waitFor({timeout:8000});
    assert.equal(Number(await arena.getAttribute('data-omega-player-elevation')),end);
    await reward.locator('.omega-protocol-reward-cards button').first().click();
   }
   await page.waitForFunction(({to,end})=>{
    const data=document.querySelector('.omega-protocol-arena')?.dataset;
    if(data?.omegaWorldWave!==to||data.omegaTransitPhase!=='none'||Number(data.omegaPlayerElevation)!==end)return false;
    const {draws}=JSON.parse(data.omegaInfectedEvidence??'{}');
    return draws&&Object.keys(draws).length===4&&Object.values(draws).every(n=>n>0);
   },{to,end},{timeout:16000});
   await canvas.screenshot({path:`artifacts/omega-protected/${width}x${height}-${view}-landing.png`});
  }
  assert.deepEqual(errors,[]);
  console.log('QA_PASS PROTECTED_BUILD',width,height);
  await page.close();
 }
}finally{await browser.close();}
