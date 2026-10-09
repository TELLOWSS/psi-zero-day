import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PREVIEW_URL;
if(!url)throw Error('Stage25 route QA requires the Vite dev preview URL');
const out=path.resolve('artifacts/stage25-real-route');
fs.mkdirSync(out,{recursive:true});
const report=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',error=>errors.push(String(error)));
  try{
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.addInitScript(()=>{
    localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(['stage_01','stage_25']));
    localStorage.setItem('psi.survivors.last_played_stage','stage_25');
   });
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
   const heading=await page.locator('.survivors-ready-launch strong').textContent();
   if(!heading?.includes('STAGE 25'))throw Error('Expected actual ST25 briefing, received '+heading);
   await page.evaluate(async()=>{
    const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
    const original=SurvivorsEngine.prototype.update;
    SurvivorsEngine.prototype.update=function(dt,input){window.stage25Engine=this;return original.call(this,dt,input);};
   });
   const start=page.locator('.survivors-ready-launch .survivors-btn-primary');
   await page.waitForFunction(()=>document.querySelector('.survivors-ready-launch .survivors-btn-primary')?.disabled===false,null,{timeout:20000});
   await start.click();
   await page.waitForFunction(()=>window.stage25Engine?.state?.phase==='playing',null,{timeout:15000});
   await page.evaluate(async()=>{
    const s=window.stage25Engine.state;
    const {operationTiming}=await import('/src/engine/survivors-operation.ts');
    s.player.invincibleTime=1000;
    // Move to the real boss reveal threshold, not the whole stage deadline:
    // late signature events and expired mission clocks are unrelated to this QA.
    s.gameTime=operationTiming(s.maxTime).bossAt;
    for(const key in s.activePerks)s.activePerks[key]=0;
   });
   try {
    await page.waitForFunction(()=>window.stage25Engine?.state?.bossEncounter?.phase==='combat',null,{timeout:15000});
   } catch(error) {
    const state=await page.evaluate(()=>{
      const s=window.stage25Engine?.state;
      return s?{phase:s.phase,gameTime:s.gameTime,bossSpawned:s.stageBossSpawned,
        encounter:s.bossEncounter,stageId:s.stageId,boss:s.hazards.find(h=>h.isStageBoss)?.bossGameplay,
        signature:s.signatureEvent?.phase,activeHazards:s.hazards.length}:null;
    });
    throw Error('ST25 boss never reached combat: '+JSON.stringify(state)+'; '+String(error));
   }
   await page.waitForFunction(()=>{
    const b=window.stage25Engine?.state?.hazards.find(h=>h.isStageBoss);
    return !!b?.bossGameplay?.staleRoute;
   },null,{timeout:10000});
   const before=await page.evaluate(async()=>{
    const s=window.stage25Engine.state,b=s.hazards.find(h=>h.isStageBoss);
    const {terrainHit}=await import('/src/engine/survivors-terrain.ts');
    let from={x:s.player.x,y:s.player.y};
    const checks=b.bossGameplay.staleRoute.points.map(pt=>{
      const clear=!terrainHit(s.terrain,from,pt,19);from=pt;return clear;
    });
    return {phase:b.bossGameplay.combatPhase,verified:b.bossGameplay.staleRoute.verified,checks,points:b.bossGameplay.staleRoute.points,health:b.hp};
   });
   await page.screenshot({path:path.join(out,`${width}x${height}-old-mark.png`)});
   // First demonstrate a real, avoidable obsolete-route misread and recovery.
   const hasOldLane=await page.evaluate(()=>{
    const b=window.stage25Engine.state.hazards.find(h=>h.isStageBoss);
    return b.bossGameplay.staleRoute.oldMarkEnabled;
   });
   if(!hasOldLane)throw Error('ST25 standard map has no reachable obsolete-lane warning');
   await page.evaluate(()=>{
    const s=window.stage25Engine.state,b=s.hazards.find(h=>h.isStageBoss),p=b.bossGameplay.staleRoute.points[0];
    s.player.x=p.x;s.player.y=p.y;s.player.invincibleTime=1000;
   });
   await page.waitForFunction(()=>{
    const b=window.stage25Engine?.state.hazards.find(h=>h.isStageBoss);
    return b?.bossGameplay?.staleRoute?.verified===1;
   },null,{timeout:7000});
   await page.evaluate(()=>{
    const s=window.stage25Engine.state,b=s.hazards.find(h=>h.isStageBoss),p=b.bossGameplay.staleRoute.oldMark;
    s.player.x=p.x;s.player.y=p.y;s.player.invincibleTime=1000;
   });
   await page.waitForFunction(()=>{
    const b=window.stage25Engine?.state.hazards.find(h=>h.isStageBoss),r=b?.bossGameplay?.staleRoute;
    return r?.misreads===1&&r.verified===0&&r.warningRemaining>0;
   },null,{timeout:7000});
   const misread=await page.evaluate(()=>{
    const s=window.stage25Engine.state,b=s.hazards.find(h=>h.isStageBoss),r=b.bossGameplay.staleRoute;
    return {misreads:r.misreads,verified:r.verified,warning:r.warningRemaining,hp:s.player.hp};
   });
   await page.screenshot({path:path.join(out,`${width}x${height}-obstructed.png`)});
   await page.evaluate(()=>{
    const s=window.stage25Engine.state,b=s.hazards.find(h=>h.isStageBoss),pt=b.bossGameplay.staleRoute.points[0];
    s.player.x=pt.x;s.player.y=pt.y;s.player.invincibleTime=1000;
   });
   await page.waitForFunction(()=>{
    const b=window.stage25Engine?.state.hazards.find(h=>h.isStageBoss),r=b?.bossGameplay?.staleRoute;
    return r?.verified===1&&r?.warningRemaining===0&&r?.misreads===1;
   },null,{timeout:7000});
   const progress=[{verified:1,phase:'pattern'}];
   for(let i=1;i<3;i++){
    await page.evaluate(i=>{
     const s=window.stage25Engine.state,b=s.hazards.find(h=>h.isStageBoss),pt=b.bossGameplay.staleRoute.points[i];
     s.player.x=pt.x;s.player.y=pt.y;s.player.invincibleTime=1000;
    },i);
    await page.waitForFunction(i=>{
     const b=window.stage25Engine.state.hazards.find(h=>h.isStageBoss);
     return b?.bossGameplay?.staleRoute?.verified===i+1;
    },i,{timeout:10000});
    const v=await page.evaluate(()=>{
     const b=window.stage25Engine.state.hazards.find(h=>h.isStageBoss);
     return {verified:b.bossGameplay.staleRoute.verified,phase:b.bossGameplay.combatPhase,window:b.bossGameplay.burstRemaining};
    });
    progress.push(v);
    if(i===1)await page.screenshot({path:path.join(out,`${width}x${height}-two-of-three.png`)});
   }
   await page.screenshot({path:path.join(out,`${width}x${height}-burst.png`)});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   const pass=before.phase==='pattern'&&before.verified===0&&before.checks.every(Boolean)
    &&misread.misreads===1&&misread.verified===0&&misread.warning>0
    &&progress.length===3&&progress[0].verified===1&&progress[1].verified===2
    &&progress[0].phase==='pattern'&&progress[1].phase==='pattern'
    &&progress[2].verified===3&&progress[2].phase==='burst'&&progress[2].window>0
    &&!overflow&&!errors.length;
   report.push({width,height,before,misread,progress,overflow,errors,pass,scope:'Real ST25 engine and UI after QA-only time jump and character reposition; not natural gameplay nor Android FPS'});
  }finally{await page.close();}
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));if(report.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}
