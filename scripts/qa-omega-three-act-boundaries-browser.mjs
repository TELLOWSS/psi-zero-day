#!/usr/bin/env node
/**
 * M04-C actual native OMEGA React/Canvas browser acceptance:
 * - DEV-only preroll advances through earlier waves BEFORE UI mounts.
 * - At 6→7 / 9→10 / 12→13 the player MUST walk from outside interaction
 *   range using real physical keyboard/touch, E/touch activates native gate.
 * - Real matching world-space departure/arrival + 3 DIFFERENT portal scenes.
 * - No engine dispatch or mid-test teleport, HP editing or synthetic clear.
 * - Does not certify all 15 combat/mission steps or Android hardware.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const out=resolve('qa-omega-protocol-captures');
await mkdir(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const worlds=[
 {from:6,to:7,kind:'crane_elevator',meters:24,layer:'.omega-protocol-crane-cross-section'},
 {from:9,to:10,kind:'service_tunnel',meters:-12,layer:'.omega-protocol-tunnel-cross-section'},
 {from:12,to:13,kind:'control_airlock',meters:6,layer:'.omega-protocol-airlock-cross-section'},
];
const screens=[
 {name:'PC-keyboard',width:1440,height:900,mobile:false},
 {name:'mobile-touch',width:390,height:844,mobile:true},
];
const tests=[];let failed=0;
for(const target of worlds)for(const screen of screens){
 const context=await browser.newContext({
  viewport:{width:screen.width,height:screen.height},deviceScaleFactor:1,
  ...(screen.mobile?{isMobile:true,hasTouch:true}:{}),
 });
 const page=await context.newPage(), errors=[];
 const arena=page.locator('.omega-protocol-arena');
 page.on('pageerror',error=>errors.push('page:'+String(error)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text());});
 const read=()=>arena.evaluate(a=>({
  wave:Number(a.getAttribute('data-omega-world-wave')),
  x:Number(a.getAttribute('data-omega-player-x')),
  y:Number(a.getAttribute('data-omega-player-y')),
  field:a.getAttribute('data-omega-field-phase'),
  phase:a.getAttribute('data-omega-phase'),
  transit:a.getAttribute('data-omega-transit-phase'),
  to:Number(a.getAttribute('data-omega-transit-to')),
  transitKind:a.getAttribute('data-omega-transit-kind'),
  transitId:a.getAttribute('data-omega-transit-link-id'),
  dockId:a.getAttribute('data-omega-act-dock-id'),
  dockRole:a.getAttribute('data-omega-act-dock-role'),
  dockKind:a.getAttribute('data-omega-act-dock-kind'),
  dockMeters:Number(a.getAttribute('data-omega-act-dock-height')),
  dockX:Number(a.getAttribute('data-omega-act-dock-x')),
  dockY:Number(a.getAttribute('data-omega-act-dock-y')),
  fromX:Number(a.getAttribute('data-omega-transit-depart-x')),
  toX:Number(a.getAttribute('data-omega-transit-arrive-x')),
  opacity:Number(a.getAttribute('data-omega-transit-opacity')),
 }));
 const pressE=async()=>{
  if(screen.mobile)await page.locator('.omega-protocol-interact').tap();
  else await page.keyboard.press('e');
 };
 const moveRight=async ms=>{
  if(screen.mobile){
   const pad=page.locator('.omega-protocol-pad');
   const mode=await pad.getAttribute('data-omega-pad-mode');
   const control=mode==='analog'?page.locator('.omega-protocol-stick')
    :pad.locator('button').nth(3);
   const box=await control.boundingBox();
   if(!box)throw Error('Actual visible mobile steering control missing');
   const center={x:Math.round(box.x+box.width/2),y:Math.round(box.y+box.height/2)};
   const cdp=await context.newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',
    touchPoints:[{...center,id:11}]});
   if(mode==='analog'){
    await sleep(35);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',
     touchPoints:[{x:center.x+45,y:center.y,id:11}]});
   }
   await sleep(ms);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await cdp.detach();
  }else{
   await page.keyboard.down('ArrowRight');
   await sleep(ms);
   await page.keyboard.up('ArrowRight');
  }
  await sleep(135);
 };
 const scenario=target.from+'to'+target.to+'-'+screen.name;
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaQaState=actBoundary'+target.from,
   {waitUntil:'domcontentloaded',timeout:45000});
  await arena.waitFor({timeout:25000});
  const source=await page.locator('main[data-omega-protocol-internal="true"]')
   .getAttribute('data-omega-gate-walk-qa');
  if(source!=='precleared-dev-only')throw Error('Only DEV pre-cleared mission fixture allowed');
  const before=await read();
  const id='OMEGA-LINK-'+String(target.from).padStart(2,'0')+'-'+
   String(target.to).padStart(2,'0');
  if(before.wave!==target.from||before.field!=='exit'||before.phase!=='battle'||
     before.dockKind!==target.kind||before.dockRole!=='departure'||
     before.dockMeters!==target.meters||before.dockX!==1210||before.dockId!==id||
     Math.abs(before.x-1210)<100)
   throw Error('Native starting dock or real out-of-range spawn missing '+JSON.stringify(before));
  await pressE();
  if((await read()).transit!=='none')throw Error('ACT gate opened while hero was far outside range');
  let moved=0,previous=before.x,entered=false;
  for(let attempt=0;attempt<19;attempt++){
   const current=await read();
   if(Math.abs(current.x-1210)<=65){entered=true;break;}
   await moveRight(220);
   const after=await read();
   moved+=Math.abs(after.x-previous);previous=after.x;
  }
  if(!entered||moved<75)throw Error('Real movement to ACT gate failed '+JSON.stringify({moved,state:await read()}));
  await pressE();
  await page.waitForFunction(({from,to,kind,id})=>{
   const a=document.querySelector('.omega-protocol-arena');
   return a?.getAttribute('data-omega-transit-phase')==='depart'&&
    a.getAttribute('data-omega-world-wave')===String(from)&&
    a.getAttribute('data-omega-transit-to')===String(to)&&
    a.getAttribute('data-omega-transit-kind')===kind&&
    a.getAttribute('data-omega-transit-link-id')===id;
  },{from:target.from,to:target.to,kind:target.kind,id},{timeout:5000});
  const departing=await read();
  if(departing.fromX!==before.dockX||departing.toX!==150)
   throw Error('Transit from/to world dock mismatch '+JSON.stringify(departing));
  await page.locator(target.layer).waitFor({state:'visible',timeout:2600});
  await page.waitForFunction(()=>Number(document.querySelector('.omega-protocol-arena')
   ?.getAttribute('data-omega-transit-opacity'))>.18,
   undefined,{timeout:4000});
  await page.screenshot({path:out+'/m04c-'+scenario+'-depart.png',
   fullPage:false,animations:'disabled'});
  // 6 and 12 are even: actual game safe-room offers must be chosen before
  // arrival. 9 is odd: direct next world after real gate closure.
  let rewardChosen=false;
  if(target.from%2===0){
   await page.locator('.omega-protocol-reward-cards button')
    .first().waitFor({state:'visible',timeout:9000});
   await page.locator('.omega-protocol-reward-cards button').first().click();
   rewardChosen=true;
  }
  await page.waitForFunction(({to,id,kind})=>{
   const a=document.querySelector('.omega-protocol-arena');
   return a?.getAttribute('data-omega-world-wave')===String(to)&&
    a.getAttribute('data-omega-transit-phase')==='arrive'&&
    a.getAttribute('data-omega-act-dock-role')==='arrival'&&
    a.getAttribute('data-omega-act-dock-id')===id&&
    a.getAttribute('data-omega-act-dock-kind')===kind;
  },{to:target.to,id,kind:target.kind},{timeout:8500});
  const arriving=await read();
  if(arriving.x!==150||arriving.y!==450||
     arriving.dockX!==150||arriving.dockY!==450||
     arriving.transitId!==id||arriving.dockMeters!==target.meters)
   throw Error('Actual arrival and world dock coordinates diverged '+JSON.stringify(arriving));
  await page.screenshot({path:out+'/m04c-'+scenario+'-arrive.png',
   fullPage:false,animations:'disabled'});
  await page.waitForFunction(()=>document.querySelector('.omega-protocol-arena')
   ?.getAttribute('data-omega-transit-phase')==='none',
   undefined,{timeout:6000});
  const settled=await read();
  if(settled.wave!==target.to||settled.phase!=='battle'||settled.field!=='exit')
   throw Error('Linked new sector is not real battle+field '+JSON.stringify(settled));
  if(errors.length)throw Error('Actual React/Canvas errors '+errors.join('; '));
  tests.push({pass:true,scenario,target,screen,source,moved,rewardChosen,
   departing,arriving,settled,
   nativeWorld:true,realInput:true,androidHardware:false,seamless15World:false});
  console.log('QA_PASS M04C',scenario,JSON.stringify({
   movement:moved,kind:target.kind,from:before.wave,to:settled.wave,
   dock:arriving.dockId,arrival:[arriving.x,arriving.y],rewardChosen,
  }));
 }catch(error){
  failed++;let current=null;
  try{current=await read();}catch{/* UI may be unavailable */}
  tests.push({pass:false,scenario,error:String(error),current,errors});
  console.error('QA_FAIL M04C',scenario,String(error),JSON.stringify({current,errors}));
  try{await page.screenshot({path:out+'/m04c-'+scenario+'-FAILED.png',
   fullPage:false,animations:'disabled'});}catch{/* browser may be closed */}
 }
 await context.close();
}
await browser.close();
await writeFile(out+'/m04c-three-act-boundaries-report.json',JSON.stringify({
 valid:failed===0,tests,prerequisite:'earlier waves artificially pre-completed only in DEV initial fixture',
 evidence:'actual game React/Canvas keyboard/touch ACT gate and native Watch player spawn',
 notProven:'no-skip 15-sector expedition, fully seamless world, Android hardware, final background',
},null,2));
if(failed)process.exitCode=1;
