import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/safe-supply');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const reports=[];
try {
 for(const [width,height] of [[1440,900],[390,844]]) {
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5203',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.getByRole('button',{name:'설정',exact:true}).click();
  await page.getByText('눈이 편한 화면 · 세부 조절',{exact:true}).click();
  await page.getByRole('slider',{name:/화면 흔들림/}).fill('0.3');
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(dt,input){window.supplyEngine=this;return update.call(this,dt,input);};
  });
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.waitForFunction(()=>window.supplyEngine?.state.gameTime>.2);
  for(const wave of [1,2]) {
   await page.evaluate(wave=>{const s=window.supplyEngine.state;s.gameTime=wave===1?45:110;},wave);
   await page.getByRole('dialog',{name:'현장 정비 보급소'}).waitFor();
   const before=await page.evaluate(()=>{const s=window.supplyEngine.state;return {phase:s.phase,time:s.gameTime,hp:s.player.hp,hazards:JSON.stringify(s.hazards)};});
   await page.keyboard.press('Escape');await page.keyboard.press('p');
   await page.waitForTimeout(1200);
   const after=await page.evaluate(()=>{const s=window.supplyEngine.state;return {phase:s.phase,time:s.gameTime,hp:s.player.hp,hazards:JSON.stringify(s.hazards)};});
   if(before.phase!=='paused'||JSON.stringify(before)!==JSON.stringify(after))throw Error('Supply did not freeze combat');
   await page.screenshot({path:path.join(out,`${width}-wave${wave}.png`)});
   await page.getByRole('button',{name:/정비 완료 · 순찰 재개/}).click();
   await page.waitForFunction(t=>window.supplyEngine.state.phase==='playing'&&window.supplyEngine.state.gameTime>t,before.time);
  }
  await page.keyboard.press('p');
  await page.getByText('설정 · 커스터마이징',{exact:true}).click();
  await page.getByText('눈이 편한 화면 · 세부 조절',{exact:true}).click();
  const slider=page.getByRole('slider',{name:/화면 흔들림/});
  if(await slider.inputValue()!=='0.3')throw Error('Preflight customization not shared');
  await slider.fill('0.6');
  await page.getByRole('slider',{name:/타격 섬광/}).fill('0.2');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.feel_v1')));
  if(saved.shake!==.6||saved.flash!==.2)throw Error('In-game settings not persisted');
  await page.screenshot({path:path.join(out,`${width}-settings.png`)});
  if(errors.length)throw Error(errors.join('\n'));
  reports.push({width,height,waves:2,pausedCombat:true,explicitResume:true,settingsShared:true,saved,errors});
  await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
}finally{await browser.close();}
