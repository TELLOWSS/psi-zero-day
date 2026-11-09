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
  kind:el.getAttribute('data-omega-transit-kind'),
  dockRole:el.getAttribute('data-omega-act-dock-role'),
  dockId:el.getAttribute('data-omega-act-dock-id'),
  dockX:Number(el.getAttribute('data-omega-act-dock-x')??'0'),
  dockY:Number(el.getAttribute('data-omega-act-dock-y')??'0'),
  transitLinkId:el.getAttribute('data-omega-transit-link-id'),
  departureX:Number(el.getAttribute('data-omega-transit-depart-x')??'0'),
  arrivalX:Number(el.getAttribute('data-omega-transit-arrive-x')??'0'),
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
  const safeRoom=page.locator('[data-omega-reward-context="in-world-safe-room"]');
  await safeRoom.waitFor({state:'visible',timeout:2000});
  const supplyPanel=await page.locator('.omega-protocol-safe-room .omega-protocol-rewards').boundingBox();
  const fullArena=await arena.boundingBox();
  if(!supplyPanel||!fullArena||
     supplyPanel.width>=fullArena.width*.98||
     supplyPanel.height>=fullArena.height*.98)
   throw Error('Run-only supply still blots out almost the entire actual world viewport '+
    JSON.stringify({supplyPanel,fullArena}));
  const destinationText=await safeRoom.innerText();
  if(!destinationText.includes('다음 목적지')||!destinationText.includes('전술 보급 지점'))
   throw Error('Safe-room supply lacks destination / player context');
  await page.screenshot({path:output+'/m04d-field-supply-'+s.name+'.png',
   fullPage:false,animations:'disabled'});
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
  // M04-B: ACT 01 -> ACT 02 is NOT a generic shutter. There is one
  // scaffold lift at the real wave-3 exit and a matching lift landing on
  // wave-4 entry in the game scene. Cross via actual movement + E/touch.
  const actDepart=await read();
  if(actDepart.dockRole!=='departure'||actDepart.dockId!=='OMEGA-LINK-03-04'||
     actDepart.dockX!==1210)
   throw Error('ACT-1 lift was not painted at actual 3rd-world exit '+JSON.stringify(actDepart));
  const thirdWalk=await travelToGate();
  if(thirdWalk.finalX-thirdWalk.initialX<75)
   throw Error('Actual key/touch movement to first ACT boundary failed '+JSON.stringify(thirdWalk));
  await pressE();
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   return el?.getAttribute('data-omega-world-wave')==='3'&&
    el?.getAttribute('data-omega-transit-to')==='4'&&
    el?.getAttribute('data-omega-transit-phase')==='depart'&&
    el?.getAttribute('data-omega-transit-kind')==='scaffold_lift'&&
    el?.getAttribute('data-omega-transit-link-id')==='OMEGA-LINK-03-04';
  },undefined,{timeout:4000});
  const liftDepart=await read();
  if(liftDepart.departureX!==actDepart.dockX||liftDepart.arrivalX!==150)
   throw Error('The actual lift anchors are not paired '+JSON.stringify(liftDepart));
  const shaft=page.locator('.omega-protocol-lift-cross-section');
  await shaft.waitFor({state:'visible',timeout:2000});
  await page.waitForFunction(()=>Number(document.querySelector('.omega-protocol-arena')
   ?.getAttribute('data-omega-transit-opacity'))>.18,
   undefined,{timeout:3000});
  await page.screenshot({path:output+'/m04b-3to4-18m-lift-'+s.name+'.png',
   animations:'disabled',fullPage:false});
  await page.waitForFunction(()=>{
   const el=document.querySelector('.omega-protocol-arena');
   return el?.getAttribute('data-omega-world-wave')==='4'&&
    el?.getAttribute('data-omega-transit-phase')==='arrive'&&
    el?.getAttribute('data-omega-act-dock-role')==='arrival'&&
    el?.getAttribute('data-omega-act-dock-id')==='OMEGA-LINK-03-04';
  },undefined,{timeout:7000});
  const actArrive=await read();
  if(actArrive.dockX!==150||actArrive.dockY!==450||
     actArrive.x!==actArrive.dockX||actArrive.y!==actArrive.dockY||
     actArrive.kind!=='scaffold_lift')
   throw Error('Sector-2 landing does not coincide with native player entry '+JSON.stringify(actArrive));
  await page.waitForFunction(()=>document.querySelector('.omega-protocol-arena')
   ?.getAttribute('data-omega-transit-phase')==='none',
   undefined,{timeout:6000});
  const fourthWorld=await read();
  if(fourthWorld.wave!==4||fourthWorld.phase!=='battle'||
     fourthWorld.field!=='exit')
   throw Error('Failed to arrive inside the actual fourth industrial zone '+JSON.stringify(fourthWorld));
  if(errors.length)throw Error(errors.join('; '));
  await page.screenshot({path:output+'/m04-third-map-'+s.name+'.png',
   animations:'disabled',fullPage:false});
  reports.push({pass:true,name:s.name,width:s.width,height:s.height,
   provenance,firstWalk,arrived2,secondWalk,reward,finale,thirdWalk,liftDepart,actArrive,fourthWorld,
   actualInput:s.touch?'Chrome touchStart/touchEnd':'keydown/keyup',
   worldTransitions:3,
   normalMissionSkipAllowed:false,
   approvedSeamless15Map:false,realPhone:false});
  console.log('QA_PASS M04',s.name,JSON.stringify({
   physicalWalks:[firstWalk.finalX-firstWalk.initialX,secondWalk.finalX-secondWalk.initialX,thirdWalk.finalX-thirdWalk.initialX],
   worldSequence:[1,arrived2.wave,finale.wave,actArrive.wave],
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
