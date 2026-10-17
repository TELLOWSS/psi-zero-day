import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/watch-ultimate',process.env.PSI_QA_LABEL??'local');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[320,568],[844,390],[568,320]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<900,isMobile:width<900,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/assets/*.js',async route=>{
   const response=await route.fetch(),body=await response.text(),pattern=/update\([^)]*\)\{(?=if\(this\.state\.phase!==[^;]{0,45}this\.accumulator=0)/g;
   if(!pattern.test(body)){await route.fulfill({response,body});return;}pattern.lastIndex=0;
   assert.equal([...body.matchAll(pattern)].length,1,'read-only engine capture');
   await route.fulfill({response,body:body.replace(pattern,m=>`${m}window.qaEngine=this;`)});
  });
  await page.goto(process.env.PSI_PREVIEW_URL??'http://127.0.0.1:4178',{waitUntil:'domcontentloaded'});
  await page.locator('.is-survivors-entry').click();
  await page.locator('.survivors-ultimate-brief').waitFor();
  assert.match(await page.locator('.survivors-ultimate-brief').innerText(),/궁극기 F/);
  await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
  try{await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.2);}catch(error){console.log(await page.evaluate(()=>({engine:window.qaEngine?{phase:window.qaEngine.state.phase,time:window.qaEngine.state.gameTime}:null,dialogs:[...document.querySelectorAll('[role=dialog]')].map(e=>e.textContent.slice(0,180))})));console.log(errors);await page.screenshot({path:path.join(out,'start-failure.png')});throw error;}
  // Charge fixture, not a claim about natural charge pacing. All commands/lifecycle are real.
  await page.evaluate(()=>window.qaEngine.state.ultimateCharge=window.qaEngine.state.maxUltimateCharge);
  const coach=page.getByRole('dialog',{name:'첫 궁극기가 준비됐습니다'});await coach.waitFor();
  const before=await page.evaluate(()=>({time:window.qaEngine.state.gameTime,hp:window.qaEngine.state.player.hp,charge:window.qaEngine.state.ultimateCharge}));
  await new Promise(r=>setTimeout(r,450));
  const frozen=await page.evaluate(()=>({time:window.qaEngine.state.gameTime,hp:window.qaEngine.state.player.hp,charge:window.qaEngine.state.ultimateCharge}));assert.deepEqual(frozen,before);
  assert.equal(await page.locator('.survivors-pause-menu').count(),0);
  await page.screenshot({path:path.join(out,`${width}x${height}-coach.png`)});
  const buttons=coach.locator('button');assert.equal(await buttons.count(),2);
  for(let i=0;i<2;i++){await buttons.nth(i).scrollIntoViewIfNeeded();const b=await buttons.nth(i).boundingBox();assert.ok(b&&b.x>=0&&b.x+b.width<=width+1&&b.height>=44&&b.y>=0&&b.y+b.height<=height+1,'coach action reachable');}
  await page.keyboard.press('Escape');await coach.waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>localStorage.getItem('psi.survivors.ultimate-lesson.v1')),null);
  assert.equal(await page.evaluate(()=>window.qaEngine.state.ultimateCharge),before.charge);
  await page.keyboard.press('Space');
  assert.equal(await page.evaluate(()=>window.qaEngine.state.ultimateCharge),before.charge,'Space never consumes ultimate');
  const button=page.locator('.survivors-ultimate-btn');await button.waitFor();
  const hud=await button.evaluate(el=>{const r=el.getBoundingClientRect(),label=el.querySelector('strong');return{x:r.x,y:r.y,w:r.width,h:r.height,label:getComputedStyle(label).display,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.ok(hud.x>=0&&hud.x+hud.w<=width+1&&hud.y>=0&&hud.y+hud.h<=height+1&&!hud.overflow);assert.notEqual(hud.label,'none');
  await page.screenshot({path:path.join(out,`${width}x${height}-ready.png`)});
  if(width===1440)await page.keyboard.press('KeyF');else await button.tap();
  await page.waitForFunction(()=>window.qaEngine.state.directorCutinPhase==='cutin');
  assert.equal(await page.evaluate(()=>localStorage.getItem('psi.survivors.ultimate-lesson.v1')),'used');
  assert.equal(await page.evaluate(()=>window.qaEngine.state.ultimateCharge),0);
  await page.waitForFunction(()=>window.qaEngine.state.directorCutinPhase==='none');
  await page.evaluate(()=>window.qaEngine.state.ultimateCharge=window.qaEngine.state.maxUltimateCharge);
  await page.waitForFunction(()=>!document.querySelector('.survivors-ultimate-btn')?.disabled);
  assert.equal(await coach.count(),0,'learned player is not interrupted again');
  assert.equal(await page.evaluate(()=>window.qaEngine.state.phase),'playing');
  if(width===1440){
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('.is-survivors-entry').click();await page.locator('.survivors-ready-launch .survivors-btn-primary').click();await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.2);
   await page.evaluate(()=>window.qaEngine.state.ultimateCharge=window.qaEngine.state.maxUltimateCharge);await page.waitForFunction(()=>!document.querySelector('.survivors-ultimate-btn')?.disabled);assert.equal(await coach.count(),0,'successful-use memory survives reload');
   await page.evaluate(()=>localStorage.removeItem('psi.survivors.ultimate-lesson.v1'));await page.reload({waitUntil:'domcontentloaded'});await page.locator('.is-survivors-entry').click();await page.locator('.survivors-ready-launch .survivors-btn-primary').click();await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.2);
   await page.evaluate(()=>window.qaEngine.state.ultimateCharge=window.qaEngine.state.maxUltimateCharge);await coach.waitFor();await page.getByRole('button',{name:'지금 사자후 발동',exact:true}).click();await page.waitForFunction(()=>window.qaEngine.state.directorCutinPhase==='cutin');assert.equal(await page.evaluate(()=>window.qaEngine.state.ultimateCharge),0);assert.equal(await page.evaluate(()=>localStorage.getItem('psi.survivors.ultimate-lesson.v1')),'used');
  }
  assert.deepEqual(errors,[]);rows.push({width,height,frozen:true,skipPreservesCharge:true,spaceSeparated:true,actualCast:true,learned:true,hud,errors,pass:true});
  await context.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
}finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,3000))]);}
process.exit(0);
