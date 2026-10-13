import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/ultimate-cutin');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const rows=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390],[568,320]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(dt,input){window.qaEngine=this;return update.call(this,dt,input);};
   const {ProjectileFeedbackLayer}=await import('/src/ui/survivors-projectile-feedback.ts');const draw=ProjectileFeedbackLayer.prototype.draw;window.qaSource=[];window.qaLayer=null;
   ProjectileFeedbackLayer.prototype.draw=function(...args){window.qaLayer=this;const source=this.effects.find(e=>e.event.kind==='shout_shockwave'&&e.event.phase==='launch');if(source)window.qaSource.push({phase:window.qaEngine?.state.directorCutinPhase,age:source.age,held:this.ultimateObscured});return draw.apply(this,args);};
   const {SpriteMotionTracker}=await import('/src/ui/survivors-sprite-motion.ts');const act=SpriteMotionTracker.prototype.act;window.qaGestures=[];
   SpriteMotionTracker.prototype.act=function(entity,clock,kind){if(kind==='ultimate')window.qaGestures.push({phase:window.qaEngine?.state.directorCutinPhase,clock});return act.call(this,entity,clock,kind);};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.3);
  // Charge fixture only; activation uses the real UI command and engine lifecycle.
  await page.evaluate(()=>window.qaEngine.state.ultimateCharge=window.qaEngine.state.maxUltimateCharge);
  await page.waitForFunction(()=>!document.querySelector('.survivors-ultimate-btn').disabled);
  // The ready button continuously animates; do not wait for a nonexistent stable frame.
  await page.getByRole('button',{name:'현장소장 사자후 궁극기 발동',exact:true}).click({force:true});
  await page.locator('.survivors-director-cutin-layer.phase-cutin').waitFor();await page.screenshot({path:path.join(out,`${width}x${height}-cutin.png`)});
  try { await page.waitForFunction(()=>window.qaEngine.state.directorCutinPhase==='invert'); }
  catch(error){console.log(await page.evaluate(()=>({phase:window.qaEngine.state.phase,cutin:window.qaEngine.state.directorCutinPhase,timer:window.qaEngine.state.directorShoutTimer,time:window.qaEngine.state.gameTime,frames:window.qaSource.slice(-10),dom:document.querySelector('.survivors-director-cutin-layer')?.className})));await page.screenshot({path:path.join(out,`${width}x${height}-failure.png`)});throw error;}
  await page.screenshot({path:path.join(out,`${width}x${height}-reveal.png`)});
  await page.waitForFunction(()=>window.qaEngine.state.directorCutinPhase==='none');
  const report=await page.evaluate(()=>{
   const hidden=window.qaSource.filter(f=>f.phase==='cutin'||f.phase==='shout'),visible=window.qaSource.filter(f=>f.phase==='invert'||f.phase==='recovering');
   const gestures=window.qaGestures;
   return {hiddenFrames:hidden.length,visibleFrames:visible.length,held:hidden.length>0&&hidden.every(f=>f.held&&f.age===0),released:visible.length>0&&visible.every(f=>!f.held)&&visible.some(f=>f.age>.1),gestureOnReveal:gestures.some(g=>g.phase==='invert'),expired:!window.qaLayer.effects.some(e=>e.event.kind==='shout_shockwave'&&e.event.phase==='launch'),phase:window.qaEngine.state.phase,charge:window.qaEngine.state.ultimateCharge,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  const pass=report.held&&report.released&&report.gestureOnReveal&&report.expired&&['playing','levelup'].includes(report.phase)&&!report.overflow&&!errors.length;
  rows.push({width,height,...report,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
