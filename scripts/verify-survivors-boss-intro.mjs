import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/boss-intro');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]])for(const replay of [false,true]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  await page.route('**/@vite/client',route=>route.fulfill({status:200,contentType:'text/javascript',body:'const styles=new Map();export const injectQuery=url=>url;export const updateStyle=(id,content)=>{let s=styles.get(id);if(!s){s=document.createElement("style");document.head.appendChild(s);styles.set(id,s);}s.textContent=content;};export const removeStyle=id=>{styles.get(id)?.remove();styles.delete(id);};export const createHotContext=()=>({accept(){},dispose(){},on(){},prune(){},invalidate(){},data:{}});'}));
  await page.route('**/src/engine/patrol-survivors-engine.ts*',async route=>{
   const response=await route.fetch(),body=await response.text();
   if(!body.includes('update(dt, input) {'))throw new Error('Capture unavailable');
   await route.fulfill({response,body:body.replace('update(dt, input) {','update(dt, input) { window.qaEngine=this;')});
  });
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(replay=>{if(replay)localStorage.setItem('psi.survivors.stage_stars',JSON.stringify({stage_01:[true,false,false]}));},replay);
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  await page.waitForFunction(()=>window.qaEngine?.state.phase==='playing');
  await page.evaluate(()=>{window.qaEngine.state.gameTime=61;window.qaEngine.state.hazards=[];window.qaEngine.state.interactiveHazards=[];});
  await page.waitForFunction(()=>window.qaEngine.state.bossEncounter?.phase==='arrival');
  const initial=await page.evaluate(()=>({...window.qaEngine.state.bossEncounter,time:window.qaEngine.state.gameTime}));
  const button=page.getByRole('button',{name:'등장 연출 건너뛰기',exact:true});
  if(replay){await button.waitFor();await button.click();}
  else{if(await button.count())throw new Error('First-play skip exposed');await page.waitForFunction(()=>window.qaEngine.state.bossEncounter.phase==='combat');}
  const result=await page.evaluate(()=>({phase:window.qaEngine.state.bossEncounter.phase,combat:window.qaEngine.state.hazards.find(h=>h.isStageBoss)?.bossGameplay?.combatPhase,credits:window.qaEngine.state.psiCredits,overflow:document.documentElement.scrollWidth>innerWidth}));
  await page.screenshot({path:path.join(out,`${width}x${height}-${replay?'replay':'first'}.png`)});
  const pass=initial.introDuration===2.4&&initial.replay===replay&&result.phase==='combat'&&result.combat==='pattern'&&!result.overflow&&!errors.length;
  reports.push({width,height,replay,initial,result,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
