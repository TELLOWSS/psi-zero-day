#!/usr/bin/env node
/**
 * M04 live Vite/Chromium proof: TWO consecutive genuine physical gate walks
 * and actual E/touch interactions. The DEV-only fixture pre-resolves combat
 * and objectives, but NEVER changes the player's position after mounting;
 * no UI script directly calls the engine, teleports actors, or fakes a gate.
 * Stage/weapon/save/progression contract remains the real OMEGA engine.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const output=resolve('qa-omega-protocol-captures');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const scenarios=[
 {name:'PC-keyboard',width:1440,height:900,touch:false},
 {name:'mobile-touch',width:390,height:844,touch:true},
];
const reports=[];let failures=0;
for(const s of scenarios){
 const context=await browser.newContext({
  viewport:{width:s.width,height:s.height},deviceScaleFactor:1,
  ...(s.touch?{isMobile:true,hasTouch:true}:{}),
 });
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push('pageerror:'+String(error)));
 page.on('console',msg=>{if(msg.type()==='error')errors.push('console:'+msg.text());});
 const arena=page.locator('.omega-protocol-arena');
 const read=async()=>arena.evaluate(el=>({
  wave:Number(el.getAttribute('data-omega-world-wave')??'0'),
  phase:el.getAttribute('data-omega-phase'),
  field:el.getAttribute('data-omega-field-phase'),
  transit:el.getAttribute('data-omega-transit-phase'),
  target:Number(el.getAttribute('data-omega-transit-to')??'0'),
  x:Number(el.getAttribute('data-omega-player-x')??'0'),
  y:Number(el.getAttribute('data-omega-player-y')??'0'),
 }));
 const pressE=async()=>{
  if(s.touch)await page.locator('.omega-protocol-interact').tap();
  else await page.keyboard.press('e');
 };
 const holdRight=async(ms,direction='right')=>{
  if(s.touch){
   // Ordinary OMEGA mobile starts in genuine ANALOG-STICK mode.
   // Its four cardinal buttons are intentionally display:none. Holding
   // invisible arrow buttons would prove nothing about real touch control.
   const pad=page.locator('.omega-protocol-pad');
   const mode=await pad.getAttribute('data-omega-pad-mode');
   const btn=mode==='analog'
    ?page.locator('.omega-protocol-stick')
    :pad.locator('button').nth(direction==='right'?3:1);
   const box=await btn.boundingBox();
   if(!box)throw Error('Actual visible '+mode+' touch navigation control missing');
   const cdp=await context.newCDPSession(page);
   const center={x:Math.round(box.x+box.width/2),y:Math.round(box.y+box.height/2)};
   const offset=direction==='right'?45:-45;
   const target=mode==='analog'?{x:center.x+offset,y:center.y}:center;
   await cdp.send('Input.dispatchTouchEvent',{
    type:'touchStart',touchPoints:[{...center,id:7}],
   });
   if(mode==='analog'){
    await sleep(50);
    await cdp.send('Input.dispatchTouchEvent',{
     type:'touchMove',touchPoints:[{...target,id:7}],
    });
   }
   await sleep(ms);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await cdp.detach();
  }else{
   const key=direction==='right'?'ArrowRight':'ArrowLeft';
   await page.keyboard.down(key);await sleep(ms);await page.keyboard.up(key);
  }
  await sleep(130); // let React's read-only 130ms HUD sample reflect native XY
 };
 const travelToGate=async()=>{
  const initial=await read();
  let moved=0,previous=initial.x;
  // The actual authored OMEGA field exits at world x=1210. The DEV fixture
  // starts 190 units to its left, OUTSIDE its 100-unit interaction radius.
  // Stop once REAL key/touch movement places the hero inside that radius.
  for(let tries=0;tries<18;tries++){
   const now=await read();
   if(Math.abs(now.x-1210)<=65)return {initialX:initial.x,finalX:now.x,moved,tries};
   await holdRight(220,now.x>1210?'left':'right');
   const after=await read();
   moved+=Math.abs(after.x-previous);previous=after.x;
  }
  throw Error('Actual player touch/key did not reach gate '+JSON.stringify(await read()));
 };
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaQaState=gateTravel',
   {waitUntil:'domcontentloaded',timeout:45000});
  await arena.waitFor({timeout:25000});
  const provenance=await page.locator('main[data-omega-protocol-internal="true"]')
   .getAttribute('data-omega-gate-walk-qa');
  if(provenance!=='precleared-dev-only')throw Error('No explicit PRE-CLEARED DEV QA contract');
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   return el?.getAttribute('data-omega-world-wave')==='1'&&
    el?.getAttribute('data-omega-field-phase')==='exit';
  },undefined,{timeout:10000});
  const start=await read();
  if(Math.abs(start.x-1210)<100)throw Error('Gate test began already inside interaction radius');
  // Negative gate: the real command may not skip world distance.
  await pressE();
  if((await read()).transit!=='none')throw Error('Remote gate falsely opened');
  const firstWalk=await travelToGate();
  if(firstWalk.finalX-firstWalk.initialX<75)throw Error('No physical key/touch displacement');
  await pressE();
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   return el?.getAttribute('data-omega-transit-phase')==='depart'&&
    el?.getAttribute('data-omega-world-wave')==='1'&&
    el?.getAttribute('data-omega-transit-to')==='2';
  },undefined,{timeout:3500});
  await page.screenshot({path:output+'/m04-first-gate-'+s.name+'.png',
   animations:'disabled',fullPage:false});
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   return el?.getAttribute('data-omega-transit-phase')==='arrive'&&
    el?.getAttribute('data-omega-world-wave')==='2';
  },undefined,{timeout:7000});
  const arrived2=await read();
  await page.waitForFunction(()=>document.querySelector('.omega-protocol-arena')
   ?.getAttribute('data-omega-transit-phase')==='none',
   undefined,{timeout:5000});
  const secondStart=await read();
  if(secondStart.field!=='exit'||secondStart.wave!==2||
     Math.abs(secondStart.x-1210)<100)
   throw Error('Second map/real entry is not accessible '+JSON.stringify(secondStart));
  const secondWalk=await travelToGate();
  if(secondWalk.finalX-secondWalk.initialX<75)throw Error('Second physical gate not traversed');
  await pressE();
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   return el?.getAttribute('data-omega-transit-phase')==='depart'&&
    el?.getAttribute('data-omega-world-wave')==='2'&&
    el?.getAttribute('data-omega-transit-to')==='3';
  },undefined,{timeout:3500});
  // Existing run-only card choice is made in the safe airlock AFTER the
  // actual world exit; not a stage-selection screen or automatic clear.
  await page.locator('.omega-protocol-reward-cards button')
   .first().waitFor({state:'visible',timeout:8000});
  const reward=await read();
  if(reward.phase!=='reward'||reward.wave!==2)
   throw Error('Safe-room reward did not retain prior sector for choice');
  await page.locator('.omega-protocol-reward-cards button').first().click();
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   return el?.getAttribute('data-omega-world-wave')==='3'&&
    el?.getAttribute('data-omega-transit-phase')==='arrive';
  },undefined,{timeout:5500});
  await page.waitForFunction(()=>document.querySelector('.omega-protocol-arena')
   ?.getAttribute('data-omega-transit-phase')==='none',
   undefined,{timeout:5500});
  const finale=await read();
  if(finale.wave!==3||finale.phase!=='battle'||finale.field!=='exit')
   throw Error('Linked 3-zone world not reached with actual controls');
  if(errors.length)throw Error(errors.join('; '));
  await page.screenshot({path:output+'/m04-third-map-'+s.name+'.png',
   animations:'disabled',fullPage:false});
  reports.push({pass:true,name:s.name,width:s.width,height:s.height,
   provenance,firstWalk,arrived2,secondWalk,reward,finale,
   actualInput:s.touch?'Chrome touchStart/touchEnd':'keydown/keyup',
   worldTransitions:2,
   normalMissionSkipAllowed:false,
   approvedSeamless15Map:false,realPhone:false});
  console.log('QA_PASS M04',s.name,JSON.stringify({
   physicalWalks:[firstWalk.finalX-firstWalk.initialX,secondWalk.finalX-secondWalk.initialX],
   worldSequence:[1,arrived2.wave,finale.wave],
   safeRoomReward:reward.phase,
  }));
 }catch(error){
  failures++;
  let data=null;try{data=await read();}catch{/* page missing */}
  reports.push({pass:false,name:s.name,error:String(error),data,errors});
  console.error('QA_FAIL M04',s.name,String(error),JSON.stringify({data,errors}));
  try{await page.screenshot({path:output+'/m04-FAILED-'+s.name+'.png',
   fullPage:false,animations:'disabled'});}catch{/* browser closed */}
 }
 await context.close();
}
await browser.close();
await writeFile(output+'/m04-field-gate-report.json',
 JSON.stringify({pass:failures===0,reports,
  scope:'DEV pre-completed combat/objectives; real gate distance, input and world transfer only',
  notYet:'fully seamless 15-node world and real Android hardware'},null,2));
if(failures)process.exitCode=1;
