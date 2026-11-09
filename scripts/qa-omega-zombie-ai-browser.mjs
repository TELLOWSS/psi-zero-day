#!/usr/bin/env node
/**
 * M03 evidence: two real Vite/Chromium viewports, four native Watch hazards
 * with OMEGA-only AI, actual chases/telegraphs/charges/hit timings.
 * No per-frame player/hazard teleport, fabricated hit events or CSS mockups.
 * Only DEV-limited omegaQaState=zombieAI configures deterministic openers.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
const out=resolve('qa-omega-protocol-captures');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],
});
const read=(page)=>page.locator('.omega-protocol-arena').evaluate(el=>{
 let zombies=[];
 try{zombies=JSON.parse(el.getAttribute('data-omega-zombie-telemetry')??'[]');}
 catch{/* fail explicit assertions */}
 return {
  time:Number(el.getAttribute('data-omega-zombie-clock')??'0'),
  hp:Number(el.getAttribute('data-omega-zombie-player-hp')??'0'),
  zombies,
 };
});
let failures=0;
const results=[];
for(const [label,width,height] of [['desktop',1440,900],['mobile-portrait',390,844]]){
 const context=await browser.newContext({
  viewport:{width,height},deviceScaleFactor:1,
  ...(width<500?{isMobile:true,hasTouch:true}:{}),
 });
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push('JS '+String(e)));
 page.on('console',e=>{if(e.type()==='error')errors.push('Console '+e.text());});
 try{
  await page.goto('http://127.0.0.1:4173/?omegaLab=1&omegaQaState=zombieAI',{
   waitUntil:'domcontentloaded',timeout:45000,
  });
  await page.locator('main[data-omega-protocol-internal="true"]')
   .waitFor({timeout:25000});
  const source=await page.locator('main[data-omega-protocol-internal="true"]')
   .getAttribute('data-omega-zombie-ai-qa');
  if(source!=='native-watch-engine')throw Error('No actual OMEGA AI runtime provenance');
  await page.waitForFunction(()=>{
   const a=document.querySelector('.omega-protocol-arena');
   const z=JSON.parse(a?.getAttribute('data-omega-zombie-telemetry')??'[]');
   return z.length===4&&Number(a?.getAttribute('data-omega-zombie-clock'))>.25;
  },undefined,{timeout:10000});
  const opening=await read(page);
  const kinds=opening.zombies.map(z=>z.kind);
  if(new Set(kinds).size!==4||
     !['drifter','sprinter','armored','stalker'].every(k=>kinds.includes(k)))
   throw Error('Four INDEPENDENT infected AI kinds not mounted '+JSON.stringify(opening));
  await page.screenshot({path:out+'/m03-four-zombies-opening-'+label+'.png',
   fullPage:false,animations:'disabled'});
  // Observe genuine native simulation progression and all four telegraphs
  // (attack count is incremented only when the warning expires).
  await page.waitForFunction(()=>{
   const a=document.querySelector('.omega-protocol-arena');
   if(!a)return false;
   const z=JSON.parse(a.getAttribute('data-omega-zombie-telemetry')??'[]');
   return z.length===4&&z.every(e=>e.warnings>=1&&e.attacks>=1&&e.hits>=1&&e.damageDone>0)&&
    Number(a.getAttribute('data-omega-zombie-player-hp'))<800;
  },undefined,{timeout:25000});
  const finale=await read(page);
  if(finale.hp>=800||finale.hp<=0)throw Error('Native warned attack damage absent/defeat '+JSON.stringify(finale));
  if(finale.zombies.some(z=>z.hp!==25000))
   throw Error('Stopped observing zombie HP (unexpected combat result)');
  for(const initial of opening.zombies){
   const current=finale.zombies.find(z=>z.id===initial.id);
   if(!current)throw Error('Zombie engine identity was replaced');
   if(!(current.warnings>=1&&current.attacks>=1&&current.hits>=1&&current.damageDone>0))
    throw Error('Zombie never dealt genuinely warned native player HP damage '+JSON.stringify(current));
   const moved=Math.hypot(current.x-initial.x,current.y-initial.y);
   if(moved<6)throw Error('Zombie did not physically move '+JSON.stringify({initial,current}));
  }
  if(errors.length)throw Error('Actual mounted React/Canvas JS errors '+errors.join('; '));
  await page.screenshot({path:out+'/m03-four-zombies-attack-'+label+'.png',
   fullPage:false,animations:'disabled'});
  const record={label,width,height,opening,finale,
   actualNativeWatchHazards:true,readOnlyGameTelemetry:true,
   realPlayerHpDamage:true,approvedZombieSprites:false,androidHardware:false};
  results.push({pass:true,...record});
  console.log('QA_PASS M03',label,JSON.stringify({
   kinds:finale.zombies.map(z=>({kind:z.kind,warnings:z.warnings,
    attacks:z.attacks,hits:z.hits,damageDone:z.damageDone,
    displacement:Math.round(Math.hypot(z.x-opening.zombies.find(a=>a.id===z.id).x,
     z.y-opening.zombies.find(a=>a.id===z.id).y))})),
   originalHp:opening.hp,remainingHp:finale.hp,
  }));
 }catch(error){
  failures++;
  let data=null;try{data=await read(page);}catch{/* page not loaded */}
  results.push({pass:false,label,error:String(error),data,errors});
  console.error('QA_FAIL M03',label,String(error),JSON.stringify({data,errors}));
  try{await page.screenshot({path:out+'/m03-FAILED-'+label+'.png',
   fullPage:false,animations:'disabled'});}catch{/* page closed */}
 }
 await context.close();
}
await browser.close();
await writeFile(out+'/m03-zombie-ai-report.json',JSON.stringify({
 status:failures===0?'PASS':'FAIL',results,
 source:'actual OMEGA game, Vite DEV, native WATCH HP, 4 unique special-edition AI',
},null,2));
if(failures)process.exitCode=1;
