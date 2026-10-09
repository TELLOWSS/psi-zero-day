import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const stage12=process.env.PSI_STAGE12_QA==='1';
const moving=stage12&&process.env.PSI_MOVING_QA==='1';
const clearRoute=moving&&process.env.PSI_CLEAR_ROUTE_QA==='1';
const shieldGear=clearRoute&&process.env.PSI_SHIELD_GEAR_QA==='1';
const testSha=createHash('sha256').update(fs.readFileSync(new URL(import.meta.url))).digest('hex');
const output=shieldGear?'artifacts/stage12-growth-shield-natural':clearRoute?'artifacts/stage12-growth-natural':moving?'artifacts/stage12-moving-natural':stage12?'artifacts/stage12-handoff-natural':'artifacts/character-reflection-natural';fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],samples=[];
 page.on('pageerror',error=>errors.push(String(error)));
 if(stage12)await page.addInitScript(()=>{if(localStorage.getItem('psi.survivors.stage_stars')===null)localStorage.setItem('psi.survivors.stage_stars',JSON.stringify(Object.fromEntries(Array.from({length:11},(_,i)=>['stage_'+String(i+1).padStart(2,'0'),[true,true,true]]))));});
 if(shieldGear)await page.addInitScript(()=>{if(localStorage.getItem('psi.survivors.store_wallet')===null)localStorage.setItem('psi.survivors.store_wallet',JSON.stringify({credits:1260,inventory:{owned:['shock_mantle'],equipped:['shock_mantle'],durability:{shock_mantle:100}}}));});
 const probeOwners=new Set();
 await page.route('**/assets/*.js',async route=>{
  const response=await route.fetch(),body=await response.text();
  const marker=/update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
  const count=[...body.matchAll(marker)].length;
  if(!count){await route.fulfill({response,body});return;}
  probeOwners.add(route.request().url());
  if(count!==1||probeOwners.size!==1)throw Error('Read-only engine probe ownership ambiguous');
  await route.fulfill({response,body:body.replace(marker,match=>`${match}window.characterNaturalEngine=this;`)});
 });
 await page.goto(process.env.PSI_PREVIEW_URL);await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 if(stage12){await page.locator('.survivors-preflight-tabs button').nth(1).click();await page.locator('#survivors-chapter-1').click();await page.locator('.survivors-stage-card').filter({has:page.locator('.survivors-stage-badge strong',{hasText:/^STAGE 12$/})}).click();}
 await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
 await page.waitForFunction(()=>window.characterNaturalEngine?.state.phase==='playing');
 const observationLimit=stage12?480000:150000;
 const started=Date.now(),held=new Set();let terminal=null,lastProgress=0,lastShout=-10;
 const release=async()=>{for(const key of held)await page.keyboard.up(key);held.clear();};
 while(Date.now()-started<observationLimit){
  const sample=await page.evaluate(clearRoute=>{
   const s=window.characterNaturalEngine.state,p=s.player;
   const rubble=clearRoute&&s.terrainRecord.rubbleCleared===0?s.terrain.filter(o=>o.kind==='rubble'&&o.hp>0).map(o=>({x:o.x+o.width/2,y:o.y+o.height/2})).reduce((best,d)=>!best||Math.hypot(d.x-p.x,d.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?d:best,null):null;
   const target=s.extractionPhase&&s.extractionPhase.status!=='secured'?s.extractionPhase:rubble??s.drops.filter(d=>d.isHeal||d.exp>0).reduce((best,d)=>!best||Math.hypot(d.x-p.x,d.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?d:best,null);
   let x=target?target.x-p.x:Math.cos(s.gameTime*.3),y=target?target.y-p.y:Math.sin(s.gameTime*.3);
   if(s.extractionPhase&&Math.hypot(x,y)<40){x=0;y=0;}
   const length=Math.hypot(x,y)||1;x/=length;y/=length;
   if(!s.extractionPhase)for(const h of s.hazards.filter(h=>h.hp>0&&h.type!=='UNHELMETED')){const dx=p.x-h.x,dy=p.y-h.y,d=Math.hypot(dx,dy)||1;if(d<170){x+=dx/d*(170-d)/30;y+=dy/d*(170-d)/30;}}
   if(p.x<90)x+=3;if(p.x>1310)x-=3;if(p.y<90)y+=3;if(p.y>810)y-=3;
   return {phase:s.phase,time:s.gameTime,characterId:s.characterId,stageId:s.stageId,record:structuredClone(s.terrainRecord),zones:s.operationControlledZones.length,move:{x,y},hp:p.hp,stageBossNeutralized:s.stageBossNeutralized,extraction:s.extractionPhase?structuredClone(s.extractionPhase):null};
  },clearRoute);
  samples.push(sample);
  if(stage12&&Date.now()-lastProgress>30000){lastProgress=Date.now();console.log(JSON.stringify({progress:sample.phase,gameTime:sample.time}));}
  if(['victory','defeat'].includes(sample.phase)){terminal=sample;break;}
  if(sample.phase!=='playing')await release();
  if(moving&&sample.phase==='playing'){
   if(clearRoute&&await page.locator('.survivors-terrain-cleanup:not(:disabled)').count())await page.locator('.survivors-terrain-cleanup:not(:disabled)').click();
   const desired=new Set();if(Math.abs(sample.move.x)>.2)desired.add(sample.move.x>0?'ArrowRight':'ArrowLeft');if(Math.abs(sample.move.y)>.2)desired.add(sample.move.y>0?'ArrowDown':'ArrowUp');
   for(const key of [...held])if(!desired.has(key)){await page.keyboard.up(key);held.delete(key);}
   for(const key of desired)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
   if(sample.time-lastShout>6){await page.keyboard.press('Space');lastShout=sample.time;}
  }
  if(sample.phase==='levelup')await page.locator('.survivors-perk-card').first().click();
  const incident=page.locator('.survivors-accountability-event');
  if(await incident.count()){
   for(const button of await incident.locator('.accountability-facts button').all())await button.click();
   await incident.locator('[data-accountability-confirm]').click();
   for(const check of await incident.locator('.accountability-handoff input').all())await check.check();
   await incident.locator('button.survivors-btn-primary').click();
  }
  if(await page.locator('.shop-continue-btn').count())await page.locator('.shop-continue-btn').click();
  await page.waitForTimeout(200);
 }
 await release();
 if(!terminal){await page.screenshot({path:`${output}/timeout.png`});fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:stage12?'SEEDED_STAGE_UNLOCK_UI_BOT_NO_ENGINE_STATE_INJECTION':'FRESH_STORAGE_UI_BOT',testSha,moving,status:'observation-timeout',observationLimit,samples,errors,pass:false},null,2));throw Error('Natural completion not observed within observation limit');}
 await page.waitForTimeout(600);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.operation-handoff.v1')||'[]'));
 const eligible=terminal.phase==='victory'&&terminal.record.rubbleCleared>0;
 if(clearRoute&&eligible){const result=page.locator('.survivors-result-handoff');await result.locator('summary').click();await result.getByRole('button',{name:'인계 대화',exact:true}).click();await result.getByRole('button',{name:'경계부터 함께 확인해요',exact:true}).click();}
 await page.reload();await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 const details=page.locator('.survivors-operation-brief').first().locator('details').last();
 await details.locator('summary').click();await details.scrollIntoViewIfNeeded();
 const text=await details.textContent();await page.screenshot({path:`${output}/restored.png`});
 const record=saved.find(row=>row.characterId===terminal.characterId&&row.stageId===terminal.stageId);
 const sceneCount=await page.locator('.survivors-handoff-scene').count();
 const dialogueUnwritten=await page.evaluate(()=>localStorage.getItem('psi.survivors.handoff-dialogue.v1')===null);
 let directionSelected=false;
 if(clearRoute&&eligible){const direction=page.locator('.survivors-narrative-direction');await direction.getByRole('button',{name:'관심사 선택',exact:true}).click();await direction.locator('select').selectOption('control');await direction.getByRole('button',{name:'관심사 저장',exact:true}).click();directionSelected=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.narrative-direction.v1')||'null')?.direction==='control');await page.screenshot({path:`${output}/interest.png`});}
 const stageBoundary=!stage12||(terminal.stageId==='stage_12'&&sceneCount===(eligible?1:0)&&(clearRoute?eligible&&directionSelected&&!dialogueUnwritten:dialogueUnwritten));
 const pass=stageBoundary&&record?.outcome===terminal.phase&&record.rubbleCleared===terminal.record.rubbleCleared&&record.cartStops===terminal.record.cartStops&&record.zones===terminal.zones&&text.includes('이 작전에서 남긴 일')&&(terminal.phase!=='defeat'||text.includes('대응을 중단한 기록'))&&!errors.length;
 fs.writeFileSync(`${output}/report.json`,JSON.stringify({scope:shieldGear?'SEEDED_STAGE_UNLOCK_AND_OWNED_SHIELD_UI_BOT_NO_ENGINE_STATE_INJECTION_NOT_FRESH_PURCHASE_OR_PHYSICAL_DEVICE':stage12?'SEEDED_STAGE_UNLOCK_UI_BOT_NO_ENGINE_STATE_INJECTION_NOT_NATURAL_UNLOCK_OR_PHYSICAL_DEVICE':'FRESH_STORAGE_UI_BOT_NO_ENGINE_STATE_INJECTION_NOT_HUMAN_OR_PHYSICAL_DEVICE',testSha,moving,clearRoute,shieldGear,terminal,saved,text,samples,sceneCount,dialogueUnwritten,directionSelected,stageBoundary,errors,pass},null,2));
 console.log(JSON.stringify({terminal,record,pass,errors}));if(!pass)process.exitCode=1;
}finally{await browser.close();}
