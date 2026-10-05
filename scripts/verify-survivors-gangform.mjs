import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/gangform-stage14');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const rows=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
   localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(['stage_01','stage_14']));
   localStorage.setItem('psi.survivors.accountability.v1',JSON.stringify([{caseId:'route-final',action:'confirm'}]));
  });
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.locator('.survivors-preflight-tabs button').nth(1).click();await page.locator('#survivors-chapter-1').click();
  await page.locator('.survivors-stage-card:not(:disabled)').filter({hasText:'STAGE 14'}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;
   window.qaTrace=[];
   SurvivorsEngine.prototype.update=function(...args){window.qaEngine=this;const result=update.apply(this,args),h=this.state.hazards.find(h=>h.isStageBoss);const beat=h?.bossGameplay?.gangform?.step;if(beat&&window.qaTrace.at(-1)!==beat)window.qaTrace.push(beat);return result;};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.1);
  // Disable automatic fire only for deterministic projectile-contact assertions.
  await page.evaluate(()=>{const s=window.qaEngine.state;s.gameTime=61;s.player.invincibleTime=100;for(const key in s.activePerks)s.activePerks[key]=0;s.projectiles=[];});
  try{await page.waitForFunction(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss)?.bossGameplay?.gangform?.step==='pendulum');}
  catch(error){console.log(await page.evaluate(()=>({stage:window.qaEngine.state.stage.id,phase:window.qaEngine.state.phase,time:window.qaEngine.state.gameTime,encounter:window.qaEngine.state.bossEncounter,boss:window.qaEngine.state.hazards.find(h=>h.isStageBoss)})));throw error;}
  const x=await page.evaluate(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss).x);
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(650);await page.keyboard.up('ArrowDown');
  const moved=await page.evaluate(x=>Math.abs(window.qaEngine.state.hazards.find(h=>h.isStageBoss).x-x)>5,x);
  await page.waitForFunction(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss)?.bossGameplay?.gangform?.step==='debris_warning');
  await page.screenshot({path:path.join(out,`${width}x${height}-debris.png`)});
  await page.waitForFunction(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss)?.bossGameplay?.combatPhase==='weak_point');
  const hit=async target=>page.evaluate(target=>{const s=window.qaEngine.state,h=s.hazards.find(h=>h.isStageBoss),z=target==='body'?h:h.bossGameplay.gangform.zones[target];s.projectiles.push({id:'qa-'+performance.now(),kind:'drone_laser',x:z.x,y:z.y,vx:0,vy:0,radius:7,damage:target==='body'?1e8:60,duration:1,pierce:1});},target);
  await hit('body');await page.waitForTimeout(100);
  const bodyLocked=await page.evaluate(()=>{const h=window.qaEngine.state.hazards.find(h=>h.isStageBoss);return h.hp===h.maxHp&&h.bossGameplay.combatPhase==='weak_point';});
  await hit(0);await page.waitForFunction(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss).bossGameplay.gangform.zones[0].hp===0);
  const firstLocked=await page.evaluate(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss).bossGameplay.combatPhase==='weak_point');
  await hit(1);await page.waitForFunction(()=>document.querySelector('.survivors-focus-status')?.textContent.includes('BURST')||document.querySelector('.survivors-boss-readout')?.textContent.includes('BURST'));
  const remaining=await page.evaluate(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss).bossGameplay.burstRemaining);
  await page.screenshot({path:path.join(out,`${width}x${height}-burst.png`)});
  await hit('body');await page.waitForFunction(()=>window.qaEngine.state.phase==='victory');
  const trace=await page.evaluate(()=>window.qaTrace),overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  rows.push({width,height,moved,bodyLocked,firstLocked,remaining,trace,overflow,errors,pass:moved&&bodyLocked&&firstLocked&&remaining>4&&remaining<=4.5&&['pendulum','debris_warning','debris','drop_zone'].every(s=>trace.includes(s))&&!overflow&&!errors.length});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
