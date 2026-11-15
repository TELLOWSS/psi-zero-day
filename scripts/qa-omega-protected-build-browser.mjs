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
  assert.match(await ready.locator('.omega-silver-review-bar strong').innerText(),/1–6구역 연결 전장 검수/);
  const arena=ready.locator('.omega-protocol-arena');
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   if(el?.dataset.omegaWorldWave!=='1'||el.dataset.omegaFieldPhase!=='combat')return false;
   const {draws}=JSON.parse(el.dataset.omegaInfectedEvidence??'{}');
   return draws&&Object.keys(draws).length===4&&Object.values(draws).every(n=>n>0);
  },null,{timeout:12000});
  const canvas=arena.locator('canvas');
  await canvas.screenshot({path:`artifacts/omega-protected/${width}x${height}-first-battle.png`});
  await page.goto(base+'?omegaLab=1&omegaView=lift');
  await ready.waitFor({timeout:45000});
  assert.equal(await arena.getAttribute('data-omega-world-wave'),'3');
  await page.keyboard.down('ArrowRight');
  try{
   await page.waitForFunction(()=>Number(document.querySelector('.omega-protocol-arena')?.dataset.omegaPlayerX)>=1160,
    null,{timeout:8000});
  }finally{await page.keyboard.up('ArrowRight');}
  await page.keyboard.press('e');
  await page.waitForFunction(()=>{
   const a=document.querySelector('.omega-protocol-arena');
   if(a?.dataset.omegaWorldWave!=='4'||a.dataset.omegaTransitPhase!=='none')return false;
   const {draws}=JSON.parse(a.dataset.omegaInfectedEvidence??'{}');
   return draws&&Object.keys(draws).length===4&&Object.values(draws).every(n=>n>0);
  },null,{timeout:16000});
  await canvas.screenshot({path:`artifacts/omega-protected/${width}x${height}-upper-deck.png`});
  assert.deepEqual(errors,[]);
  console.log('QA_PASS PROTECTED_BUILD',width,height);
  await page.close();
 }
}finally{await browser.close();}
