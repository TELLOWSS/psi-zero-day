#!/usr/bin/env node
/**
 * M02 REAL React/Canvas WATCH-engine black-box combat proof.
 *
 * World scenario is initialized ONCE by a DEV-only query; this script never
 * calls the engine, changes HP, injects a projectile, or invokes a method
 * through the browser. It uses only genuine keyboard and mobile pointer
 * controls, and reads telemetry emitted by the mounted game loop.
 *
 * Native gun launches/impacts and native blade HP hits are recorded separately.
 * This does not certify approved artwork, mobile hardware, main or Production.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';

const base='http://127.0.0.1:4173/';
const out=resolve('qa-omega-protocol-captures');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const cases=[
 {mode:'combatGun',label:'real native Watch radio',width:844,height:390,mobile:false},
 {mode:'combatBlade',label:'3-hit real zombie sword via touch',width:390,height:844,mobile:true},
 {mode:'combatRear',label:'opposite facing blocks then permits melee',width:844,height:390,mobile:false},
 {mode:'combatCover',label:'native terrain blocks radio and sword',width:844,height:390,mobile:false},
];
const report=[];
let failed=0;
const sleep=(time)=>new Promise(r=>setTimeout(r,time));
for(const item of cases){
 const context=await browser.newContext({
  viewport:{width:item.width,height:item.height},deviceScaleFactor:1,
  ...(item.mobile?{isMobile:true,hasTouch:true}:{}),
 });
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',err=>errors.push('JS: '+String(err)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push('console: '+msg.text());});
 const arena=page.locator('.omega-protocol-arena');
 const read=async()=>arena.evaluate(el=>({
  mode:el.getAttribute('data-omega-qa-mode'),
  provenance:el.getAttribute('data-omega-qa-provenance'),
  start:Number(el.getAttribute('data-omega-qa-start-hp')),
  hp:Number(el.getAttribute('data-omega-qa-zombie-hp')),
  gunEnabled:el.getAttribute('data-omega-qa-gun-enabled'),
  gunHits:Number(el.getAttribute('data-omega-qa-gun-hits')),
  gunDamage:Number(el.getAttribute('data-omega-qa-gun-damage')),
  cover:el.getAttribute('data-omega-qa-cover-detour')==='true',
  combo:Number(el.getAttribute('data-omega-blade-combo')),
  hits:Number(el.getAttribute('data-omega-blade-hits')),
  gameTime:Number(el.getAttribute('data-omega-qa-game-time')),
  phase:el.getAttribute('data-omega-phase'),
 }));
 try{
  await page.goto(base+'?omegaLab=1&omegaQaState='+item.mode,{
   waitUntil:'domcontentloaded',timeout:45000,
  });
  await arena.waitFor({timeout:25000});
  await page.waitForFunction(()=>{
   const a=document.querySelector('.omega-protocol-arena');
   return Number(a?.getAttribute('data-omega-qa-game-time'))>.15;
  },undefined,{timeout:12000});
  const before=await read();
  if(before.provenance!=='dev-fixture-genuine-engine'||before.mode!==item.mode||
     before.start!==800||before.phase!=='battle')
   throw Error('Native mounted combat scenario provenance invalid '+JSON.stringify(before));
  const states=[{step:'open',...before}];
  if(item.mode==='combatGun'){
   if(before.gunEnabled!=='true')throw Error('Real radio gun not equipped');
   await page.waitForFunction(()=>{
    const a=document.querySelector('.omega-protocol-arena');
    return Number(a?.getAttribute('data-omega-qa-gun-hits'))>=1&&
     Number(a?.getAttribute('data-omega-qa-zombie-hp'))<800;
   },undefined,{timeout:9000});
   const after=await read();states.push({step:'gun-impact',...after});
   if(!(after.gunDamage>0&&after.hp<800&&after.gunHits>0))
    throw Error('Native radio feedback/HP mutation absent '+JSON.stringify(after));
  } else if(item.mode==='combatBlade'){
   if(before.gunEnabled!=='false')throw Error('Blade-only fixture fired gun');
   // Real direction input sets native facing to right; no direct pose mutation.
   await page.keyboard.down('ArrowRight');
   await sleep(120);await page.keyboard.up('ArrowRight');
   await sleep(140);
   for(let combo=1;combo<=3;combo++){
    if(combo>1)await sleep(680); // native .52s cooldown, .9s combo window
    if(item.mobile)await page.locator('.omega-protocol-blade').tap();
    else await page.keyboard.press('f');
    await page.waitForFunction(expected=>{
     const a=document.querySelector('.omega-protocol-arena');
     return Number(a?.getAttribute('data-omega-blade-combo'))===expected&&
      Number(a?.getAttribute('data-omega-blade-hits'))>0;
    },combo,{timeout:5000});
    const after=await read();states.push({step:'blade-'+combo,...after});
    if(after.gunHits!==0||after.hp>=states.at(-2).hp||
       after.combo!==combo||after.hits<1)
     throw Error('Sword HP/combo/auto-fire isolation invalid '+JSON.stringify(states));
   }
  } else if(item.mode==='combatRear'){
   if(before.gunEnabled!=='false')throw Error('Reverse-facing control unexpectedly fired gun');
   // Initial OMEGA direction is screen DOWN; zombie is due RIGHT. First
   // genuine F press must miss, despite enemy being inside sword range.
   await page.keyboard.press('f');
   await page.waitForFunction(()=>document.querySelector('.omega-protocol-arena')
    ?.getAttribute('data-omega-blade-combo')==='1',undefined,{timeout:5000});
   const miss=await read();states.push({step:'facing-away',...miss});
   if(miss.hp!==800||miss.hits!==0)throw Error('Reverse facing struck zombie '+JSON.stringify(miss));
   await page.keyboard.down('ArrowRight');await sleep(120);await page.keyboard.up('ArrowRight');
   await sleep(660);
   await page.keyboard.press('f');
   await page.waitForFunction(()=>Number(document.querySelector('.omega-protocol-arena')
    ?.getAttribute('data-omega-blade-combo'))===2,undefined,{timeout:5000});
   const hit=await read();states.push({step:'facing-corrected',...hit});
   if(hit.hits<1||hit.hp>=800)throw Error('Real facing did not control blade damage '+JSON.stringify(hit));
  } else if(item.mode==='combatCover'){
   if(!before.cover||before.gunEnabled!=='true')
    throw Error('Real obstacle or gun fixture missing '+JSON.stringify(before));
   // The actual Watch auto-gun aims through the obstacle and MUST NOT
   // subtract zombie HP. Native projectile cover rules run continuously.
   await sleep(1600);
   const blockedGun=await read();states.push({step:'gun-vs-cover',...blockedGun});
   if(blockedGun.hp!==800||blockedGun.gunHits>0||blockedGun.gunDamage>0)
    throw Error('Native projectile penetrated solid cover '+JSON.stringify(blockedGun));
   // Same native player facing: zombie is in blade reach/arc but physically
   // hidden by a container/barrier. F must register, without HP change.
   await page.keyboard.press('f');
   await page.waitForFunction(()=>Number(document.querySelector('.omega-protocol-arena')
    ?.getAttribute('data-omega-blade-combo'))===1,undefined,{timeout:5000});
   const blockedBlade=await read();states.push({step:'sword-vs-cover',...blockedBlade});
   if(blockedBlade.hp!==800||blockedBlade.hits!==0)
    throw Error('Sword cut through the real obstacle '+JSON.stringify(blockedBlade));
  }
  await page.screenshot({path:out+'/m02-'+item.mode+'-'+item.width+'x'+item.height+'.png',
   fullPage:false,animations:'disabled'});
  if(errors.length)throw Error('Browser errors: '+errors.join('; '));
  report.push({pass:true,label:item.label,mode:item.mode,states,viewport:item.width+'x'+item.height,
   actualMountedReactGame:true,actualWatchHp:true,realPointerOrKeyInput:true,
   userOwnedArtworkApproved:false,androidHardwareTested:false});
  console.log('QA_PASS M02',item.mode,JSON.stringify(states.at(-1)));
 }catch(error){
  failed++;report.push({pass:false,mode:item.mode,error:String(error),errors});
  console.error('QA_FAIL M02',item.mode,String(error));
 }
 await context.close();
}
await browser.close();
await writeFile(out+'/m02-native-gun-blade-report.json',JSON.stringify({
 valid:failed===0,scenarios:report,
 interpretation:'DEV-only native Watch engine, real mounted React/Canvas; not hardware/approved artwork',
},null,2));
if(failed)process.exitCode=1;
