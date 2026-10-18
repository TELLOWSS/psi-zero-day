import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const root='artifacts/signal-watch-stage01';fs.mkdirSync(root,{recursive:true});
const copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8'));
let browser;
const rows=[];
try {
 for(const [width,height] of (process.env.PSI_CROWD?[[390,844],[844,390]]:[[1440,900],[390,844],[844,390],[1024,768]]))for(const reduced of (process.env.PSI_CROWD?[false]:[false,true])) {
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote','--single-process']});
  const page=await browser.newPage({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
   performance.setResourceTimingBufferSize(10000);let seed=17;Math.random=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
   localStorage.setItem('psi.survivors.last_played_stage','stage_01');
  });
  await page.goto(process.env.PSI_PREVIEW_URL??'http://127.0.0.1:5173/',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.getByRole('button',{name:copy.briefBrowse,exact:true}).click();
  await page.getByRole('button',{name:copy.close,exact:true}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(dt,input){window.visualEngine=this;return update.call(this,dt,input);};
  });
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.waitForFunction(()=>window.visualEngine?.state.phase==='playing');
  await page.waitForFunction(()=>document.querySelector('.survivors-canvas')?.dataset.contactArt==='true');
  await page.evaluate(()=>{
   const e=window.visualEngine;e.state.player.invincibleTime=0;e.state.player.x=700;e.state.player.y=450;
   e.state.gameTime=8;e.state.playerMotionTime=8;e.state.hazards=[];e.state.projectiles=[];e.state.drops=[];e.setPaused(true);
  });
  await page.addStyleTag({content:'.survivors-modal-backdrop{visibility:hidden!important}'});
  await page.waitForTimeout(500);
  const snapshot=await page.evaluate(()=>{
   const e=window.visualEngine,c=document.querySelector('.survivors-canvas');
   return {stage:e.state.stageId,phase:e.state.phase,x:e.state.player.x,y:e.state.player.y,time:e.state.gameTime,shadow:c.dataset.heroCastShadow??null,contactArt:c.dataset.contactArt,stretch:Number(c.dataset.contactLegStretch),overflow:document.documentElement.scrollWidth>innerWidth+1,groundLoaded:performance.getEntriesByType('resource').some(r=>r.name.includes('stage-01-ground-v3.webp'))};
  });
  if(errors.length||snapshot.stage!=='stage_01'||snapshot.phase!=='paused'||snapshot.overflow||snapshot.stretch>1.080001)throw Error(JSON.stringify({width,height,snapshot,errors}));
  if(!process.env.PSI_BASELINE&&(!snapshot.groundLoaded||snapshot.shadow!=='authored-pose'))throw Error('Production candidate missing: '+JSON.stringify(snapshot));
  if(process.env.PSI_CROWD){
   await page.evaluate(()=>{
    const e=window.visualEngine;e.setPaused(false);e.state.player.invincibleTime=999;e.state.nextLevelExp=1e9;
    for(let i=0;i<65;i++)e.spawnHazard(['RUNAWAY_CART','GAS_LEAK','FALLING_DEBRIS'][i%3],10000);
    for(const id of ['radio_boost','extinguisher','floodlight','safety_drone','grouting_gun','emp_generator'])e.state.activePerks[id]=5;
    window.crowdPeak=0;const sample=()=>{window.crowdPeak=Math.max(window.crowdPeak,e.state.projectiles.length);if(e.state.phase==='playing')requestAnimationFrame(sample);};requestAnimationFrame(sample);
   });
   await page.keyboard.down('ArrowRight');await page.waitForTimeout(1000);await page.keyboard.up('ArrowRight');await page.waitForTimeout(4000);
   const crowd=await page.evaluate(()=>{const e=window.visualEngine;return {phase:e.state.phase,hazards:e.state.hazards.length,peakProjectiles:window.crowdPeak,playerX:e.state.player.x,canvas:document.querySelector('.survivors-canvas').width};});
   if(crowd.phase!=='playing'||crowd.hazards<60||crowd.peakProjectiles<1||crowd.playerX===700||errors.length)throw Error(JSON.stringify({crowd,errors}));
   snapshot.crowd=crowd;
  }
  await page.screenshot({path:`${root}/${process.env.PSI_CROWD?'crowd':process.env.PSI_BASELINE?'before':'after'}-${width}x${height}${reduced?'-reduced':''}.png`});
  rows.push({width,height,reduced,...snapshot,errors});await browser.close();browser=undefined;
 }
 fs.writeFileSync(`${root}/${process.env.PSI_CROWD?'crowd':process.env.PSI_BASELINE?'before':'after'}-report.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
}finally{if(browser)await browser.close();}
