import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out='qa/field-tactics-20261004';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const rows=[];
try {
 for(const viewport of [{width:390,height:844},{width:844,height:390},{width:1440,height:900}])for(const input of ['keyboard','buttons']) {
  const page=await browser.newPage({viewport,hasTouch:true});const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Survivors render error'))errors.push(m.text());});
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.getByRole('button',{name:/야간 긴급 순찰/}).click();await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  const actions=page.locator('.survivors-tactical-actions'),supply=actions.getByRole('button',{name:/보급 호출/}),line=actions.getByRole('button',{name:/통제선 설치/});
  if(input==='keyboard'){await page.keyboard.press('q');await page.keyboard.press('e');}else{await supply.click();await line.click();}
  await page.waitForTimeout(1700);
  const cooldown=await supply.isDisabled()&&await line.isDisabled();
  const bounds=await actions.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});
  const noEarlyExit=await actions.getByRole('button',{name:/인계 요청/}).count()===0;
  await page.screenshot({path:`${out}/${viewport.width}x${viewport.height}-${input}.png`});
  await page.keyboard.press('p');const paused=await page.getByRole('button',{name:'순찰 재개',exact:true}).isVisible();
  const instructions=await page.getByText(/Q: 보급 호출/).isVisible();await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
  rows.push({viewport,input,cooldown,bounds,noEarlyExit,paused,instructions,errors,pass:cooldown&&bounds&&noEarlyExit&&paused&&instructions&&!errors.length});await page.close();
 }
 // Production engine in browser, prepared objective fixture, not naturally earned clear.
 const page=await browser.newPage();await page.goto('http://127.0.0.1:4173');
 const engine=await page.evaluate(async()=>{
  const {SurvivorsEngine,createInitialSurvivorsState}=await import('/src/engine/patrol-survivors-engine.ts');const s=createInitialSurvivorsState(),e=new SurvivorsEngine(s,42);e.start();s.gameTime=100;s.stageBossSpawned=true;s.stageBossNeutralized=true;s.hazardsNeutralized=100;
  for(const h of s.interactiveHazards)if(h.type==='explosive_barrel')h.state='destroyed';
  e.update(1/60,{moveX:0,moveY:0});const choice=s.phase==='playing',accepted=e.requestHandoff();for(let i=0;i<250;i++)e.update(1/60,{moveX:0,moveY:0});
  return {scope:'PREPARED_OBJECTIVE_FIXTURE_PRODUCTION_ENGINE_NOT_HUMAN_CLEAR',choice,accepted,phase:s.phase,pass:choice&&accepted&&s.phase==='victory'};
 });await page.close();
 const report={scope:'CHROMIUM_REAL_EARLY_GAMEPLAY_INPUTS_AND_PREPARED_HANDOFF_FIXTURE_NOT_ANDROID_FPS',rows,engine,pass:rows.every(r=>r.pass)&&engine.pass};fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
