import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const duration=Number(process.env.GRAPHICS_SOAK_SECONDS??600);
const copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.text().startsWith('GRAPHICS_SOAK'))console.log(m.text());});
try{
 await page.addInitScript(()=>performance.setResourceTimingBufferSize(10000));
 await page.goto(process.env.GRAPHICS_SOAK_URL??'http://127.0.0.1:5204/',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
 await page.getByRole('button',{name:copy.briefBrowse,exact:true}).click();
 await page.getByRole('button',{name:copy.close,exact:true}).click();
 await page.evaluate(async()=>{
  const url=performance.getEntriesByType('resource').find(e=>e.name.includes('patrol-survivors-engine.ts')).name;
  const {SurvivorsEngine}=await import(url),update=SurvivorsEngine.prototype.update;
  // QA combat fixture: holds pressure and survivability, never saved or shipped.
  SurvivorsEngine.prototype.update=function(dt,input){
   window.soakEngine=this;this.state.phase='playing';this.state.player.invincibleTime=999;
   this.state.player.hp=this.state.player.maxHp;this.state.currentExp=0;this.state.nextLevelExp=1000000000;
   this.state.gameTime=Math.min(25,this.state.gameTime);this.skipBossIntro();
   for(const perk of ['radio_boost','extinguisher','floodlight','safety_drone','grouting_gun','emp_generator'])this.state.activePerks[perk]=5;
   this.state.maxTime=100000;
   if(this.state.hazards.length<65)this.spawnHazard(['RUNAWAY_CART','GAS_LEAK','FALLING_DEBRIS'][this.state.hazards.length%3],10000);
   return update.call(this,dt,input);
  };
 });
 await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
 await page.waitForFunction(()=>window.soakEngine);
 await page.evaluate(()=>{
  window.soakFrames=[];window.soakSamples=[];window.soakStart=performance.now();let last=performance.now(),minute=0;
  const sample=now=>{const dt=now-last;last=now;if(dt<1000)window.soakFrames.push(dt);
   const elapsed=now-window.soakStart;if(elapsed>(minute+1)*60000){minute++;
    const frames=window.soakFrames.slice().sort((a,b)=>a-b),e=window.soakEngine;
   const row={minute,p95:frames[Math.floor(frames.length*.95)],max:frames.at(-1),heap:performance.memory?.usedJSHeapSize??null,hazards:e.state.hazards.length,projectiles:e.state.projectiles.length,phase:e.state.phase,simulationClock:e.state.playerMotionTime??e.state.gameTime,quality:document.querySelector('.survivors-container').dataset.quality};
    window.soakSamples.push(row);window.soakFrames=[];console.log('GRAPHICS_SOAK '+JSON.stringify(row));
   }requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
 await page.waitForTimeout(duration*1000);
 const report=await page.evaluate(()=>({kind:'desktop-Chrome mobile-viewport QA combat fixture',durationSeconds:(performance.now()-window.soakStart)/1000,viewport:{width:innerWidth,height:innerHeight},samples:window.soakSamples,physicalPhone:false,temperatureMeasured:false}));
 if(!Number.isFinite(report.durationSeconds)||!report.samples?.length)throw Error('Soak telemetry lost; reload or stalled sampling invalidates measurement');
 if(report.samples.some(s=>s.phase!=='playing')||report.samples.at(-1).simulationClock<duration*.7)throw Error('Simulation paused during soak; combat performance unverified');
 report.errors=errors;fs.mkdirSync('artifacts/graphics-upgrade',{recursive:true});fs.writeFileSync('artifacts/graphics-upgrade/soak.json',JSON.stringify(report,null,2));
 await page.screenshot({path:'artifacts/graphics-upgrade/soak-final.png'});if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(report));
}finally{await browser.close();}
