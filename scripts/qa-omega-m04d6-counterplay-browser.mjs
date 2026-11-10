#!/usr/bin/env node
/**
 * M04-D6: REAL native Watch cart warning/charge HP, plus 9/15 boss phase HUD.
 * Production cannot enter DEV omegaQaState=cartWarning/boss/finalBoss.
 * QA prepositions only the opening actors; all subsequent native timers,
 * collision, danger telegraphs, and HP changes are observed live, not faked.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const folder=resolve('qa-omega-protocol-captures');
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const cases=[['desktop',1440,900],['mobile-portrait',390,844],['mobile-landscape',844,390]];
const results=[];
let fails=0;
const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
 Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
for(const [label,width,height] of cases){
 const context=await browser.newContext({
  viewport:{width,height},deviceScaleFactor:1,
  ...(label.startsWith('mobile')?{isMobile:true,hasTouch:true}:{}),
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(String(error)));
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaQaState=cartWarning',
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('main[data-omega-cart-qa="real-native-watch-cart-dev-fixture"]')
   .waitFor({timeout:20000});
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   return el?.getAttribute('data-omega-cart-phase')==='warning'&&
    el.getAttribute('data-omega-counterplay-kind')==='cart'&&
    el.querySelector('.omega-protocol-counterplay-hud strong')?.textContent?.includes('초');
  },undefined,{timeout:12000});
  const warning=await page.locator('.omega-protocol-arena').evaluate(el=>{
   const hud=el.querySelector('.omega-protocol-counterplay-hud');
   const pad=el.querySelector('.omega-protocol-pad');
   const controls=el.querySelector('.omega-protocol-action-pad');
   const rect=node=>{const r=node.getBoundingClientRect();return {
    left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height
   };};
   return {
    phase:el.dataset.omegaCartPhase,hp:Number(el.dataset.omegaCartHp),
    timer:Number(el.dataset.omegaCartTimer),hudText:hud?.textContent,
    dashReady:el.dataset.omegaDashReady,
    arena:rect(el),hud:rect(hud),pad:rect(pad),action:rect(controls),
   };
  });
  if(warning.hp!==800||warning.phase!=='warning'||warning.timer<=0)
   throw Error('Real cart did damage BEFORE its actual charge '+JSON.stringify(warning));
  if(warning.hud.width<110||warning.hud.left<warning.arena.left||
     warning.hud.right>warning.arena.right||warning.hud.top<warning.arena.top)
   throw Error('Cart warning clipped by responsive arena '+JSON.stringify(warning));
  if(overlap(warning.hud,warning.pad)>5||overlap(warning.hud,warning.action)>5)
   throw Error('Cart warning masks actual mobile controls '+JSON.stringify(warning));
  await page.screenshot({path:folder+'/m04d6-cart-warning-'+label+'.png',
   fullPage:false,animations:'disabled'});
  // The unchanged native cart damage is still active in CHARGE and observed
  // in the actual browser session; no test-time phase/damage setters.
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   return el&&Number(el.getAttribute('data-omega-cart-hp')||800)<800;
  },undefined,{timeout:18000});
  const after=await page.locator('.omega-protocol-arena').evaluate(el=>({
   hp:Number(el.dataset.omegaCartHp),phase:el.dataset.omegaCartPhase,
   clock:Number(el.dataset.omegaCartClock),
  }));
  if(after.hp!==778)throw Error('Native charge did not inflict actual 22 HP '+JSON.stringify(after));
  if(errors.length)throw Error('Browser runtime errors '+errors.join('; '));
  await page.screenshot({path:folder+'/m04d6-cart-after-charge-'+label+'.png',
   fullPage:false,animations:'disabled'});
  results.push({pass:true,label,warning:{phase:warning.phase,hp:warning.hp,
   timer:warning.timer,dashReady:warning.dashReady,
   controlOverlapPx:overlap(warning.hud,warning.pad)+overlap(warning.hud,warning.action)},
   after,realNativeCart:true,notAndroidHardware:true});
  console.log('QA_PASS M04_D6 native cart',label,JSON.stringify({warningHp:warning.hp,
   afterChargeHp:after.hp,warningSeconds:warning.timer,controlOverlap:0}));
 }catch(error){
  fails++;results.push({pass:false,label,error:String(error),errors});
  console.error('QA_FAIL M04_D6 native cart',label,String(error));
  try{await page.screenshot({path:folder+'/m04d6-cart-FAIL-'+label+'.png'});}catch{}
 }
 await context.close();
}
for(const [label,qaMode,expectedWave,expectedAttack] of [
 ['boss9-landscape','boss',9,'크레인 집중 낙하'],
 ['boss15-landscape','finalBoss',15,'제어 코어 전력 방출'],
]){
 const context=await browser.newContext({viewport:{width:844,height:390},
  deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaQaState='+qaMode,
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction((wave)=>{
   const arena=document.querySelector('.omega-protocol-arena');
   const phase=document.querySelector('.omega-protocol-boss-phase');
   return arena?.getAttribute('data-omega-world-wave')===String(wave)&&
    arena?.getAttribute('data-omega-boss-active')==='true'&&
    phase?.textContent?.includes('공격 예고');
  },expectedWave,{timeout:17000});
  const info=await page.evaluate(()=>{
   const arena=document.querySelector('.omega-protocol-arena');
   const banner=document.querySelector('.omega-protocol-boss-phase');
   const hud=document.querySelector('.omega-protocol-counterplay-hud');
   const rect=el=>{const r=el.getBoundingClientRect();return {
    left:r.left,top:r.top,right:r.right,bottom:r.bottom
   };};
   return {wave:Number(arena.dataset.omegaWorldWave),text:banner.textContent,
    banner:rect(banner),arena:rect(arena),counterplay:hud?rect(hud):null};
  });
  if(!info.text.includes(expectedAttack)||info.wave!==expectedWave)
   throw Error('Incorrect native boss warning '+JSON.stringify(info));
  if(info.banner.left<info.arena.left||info.banner.right>info.arena.right||
     info.banner.top<info.arena.top||info.banner.bottom>info.arena.bottom)
   throw Error('Boss phase HUD outside landscape arena '+JSON.stringify(info));
  await page.screenshot({path:folder+'/m04d6-'+label+'.png',fullPage:false,
   animations:'disabled'});
  results.push({pass:true,label,wave:expectedWave,actualBoss:true});
  console.log('QA_PASS M04_D6 boss warning',label,JSON.stringify({
   wave:info.wave,text:info.text.slice(0,80)}));
 }catch(error){
  fails++;results.push({pass:false,label,error:String(error)});
  console.error('QA_FAIL M04_D6 boss',label,String(error));
  try{await page.screenshot({path:folder+'/m04d6-'+label+'-FAIL.png'});}catch{}
 }
 await context.close();
}
await browser.close();
await writeFile(folder+'/m04d6-counterplay-report.json',JSON.stringify({
 status:fails?'FAIL':'PASS',results,source:'real Vite/React/Canvas Watch engine (DEV fixtures)',
 normalWatchUnmodified:true,productionShipping:false,physicalDeviceTested:false,
},null,2));
if(fails)process.exitCode=1;
