import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/boss-combat-slice-b');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const rows=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;
   window.qaTrace=[];
   SurvivorsEngine.prototype.update=function(...args){window.qaEngine=this;const result=update.apply(this,args);const p=this.state.hazards.find(h=>h.isStageBoss)?.bossGameplay?.combatPhase||this.state.bossEncounter?.phase;if(p&&window.qaTrace.at(-1)!==p)window.qaTrace.push(p);return result;};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.1);
  // Accelerate only the spawn clock and disable automatic weapons for deterministic contacts.
  await page.evaluate(()=>{const s=window.qaEngine.state;s.gameTime=61;for(const key in s.activePerks)s.activePerks[key]=0;s.projectiles=[];});
  await page.waitForFunction(()=>window.qaEngine.state.bossEncounter?.phase==='arrival');
  await page.waitForFunction(()=>window.qaEngine.state.bossEncounter?.phase==='combat');
  await page.waitForFunction(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss)?.motion?.phase==='warning');
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(650);await page.keyboard.up('ArrowDown');
  await page.waitForFunction(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss)?.bossGameplay?.combatPhase==='weak_point');
  const hp=await page.evaluate(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss).hp);
  const shot=async damage=>page.evaluate(damage=>{const s=window.qaEngine.state,h=s.hazards.find(h=>h.isStageBoss);s.projectiles.push({id:'qa-'+performance.now(),kind:'radio',x:h.x,y:h.y,vx:0,vy:0,radius:10,damage,duration:1,pierce:1});},damage);
  await shot(1);await page.waitForFunction(()=>window.qaEngine.state.hazards.find(h=>h.isStageBoss)?.bossGameplay?.combatPhase==='burst');
  await page.waitForFunction(()=>document.querySelector('.survivors-focus-status')?.textContent.includes('BURST')||document.querySelector('.survivors-boss-readout')?.textContent.includes('BURST'));
  const burst=await page.evaluate(()=>{const s=window.qaEngine.state,h=s.hazards.find(h=>h.isStageBoss);return {hp:h.hp,remaining:h.bossGameplay.burstRemaining,text:document.querySelector('.survivors-focus-status')?.textContent||document.querySelector('.survivors-boss-readout')?.textContent};});
  await page.screenshot({path:path.join(out,`${width}x${height}-burst.png`)});
  await shot(1e8);await page.waitForFunction(()=>window.qaEngine.state.bossEncounter?.phase==='secured');
  await page.waitForFunction(()=>window.qaEngine.state.phase==='victory');
  const result=await page.evaluate(()=>({trace:window.qaTrace,phase:window.qaEngine.state.phase,overflow:document.documentElement.scrollWidth>innerWidth}));
  rows.push({width,height,...result,burst,errors,pass:burst.hp===hp&&burst.remaining>0&&burst.text?.includes('BURST')&&['pattern','weak_point','burst','secured'].every(p=>result.trace.includes(p))&&!result.overflow&&!errors.length});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
