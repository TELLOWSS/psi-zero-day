const {createRequire}=require('node:module'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const req=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json')):require;
const {chromium}=req('playwright');
(async()=>{
 const output=process.env.SIGNAL_BREAKER_QA_OUTPUT||'artifacts/chapter-matrix';fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.SIGNAL_BREAKER_CHROME||undefined});const page=await browser.newPage({viewport:{width:1366,height:768}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+':'+r.status())});
 await page.goto('http://127.0.0.1:5200/');assert.equal(await page.locator('#stageList button').count(),5);assert.equal(await page.locator('#stageList button:disabled').count(),4);
 await page.locator('#overlayPrimary').click();await page.waitForFunction(()=>SignalBreakerQA.actor()?.ready);await page.locator('#pauseBtn').click();await page.locator('.preparation-details>summary').click();
 const frozen=await page.evaluate(()=>SignalBreakerQA.engine().time);await page.getByLabel('그래픽 품질',{exact:true}).selectOption('low');
 await page.getByLabel('배경음',{exact:true}).fill('0.1');await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>SignalBreakerQA.engine().time),frozen);
 await page.screenshot({path:path.join(output,'settings-and-actual-wear.png')});
 await page.locator('#prepareLab').click();assert.equal(await page.locator('#stageList button:disabled').count(),0);
 const characters=await page.locator('#actorSelect option').evaluateAll(items=>items.map(o=>o.value)),matrix=[];
 for(const characterId of characters){await page.locator('#actorSelect').selectOption(characterId);
  for(const weapon of ['pulse','net','magnet','mist','anchor','scan']){
   // Always operate through actual preparation controls, not direct equipment mutations.
   const companion=weapon==='net'?'pulse':'net';const current=await page.evaluate(()=>SignalBreakerQA.snapshot().loadout);
   if(current[1]===weapon)await page.locator('#slot2Select').selectOption('scan');
   await page.locator('#slot1Select').selectOption(weapon);await page.locator('#slot2Select').selectOption(companion);await page.locator('#pulseBtn').click();
   await page.locator('#overlayPrimary').click();await page.waitForFunction(id=>SignalBreakerQA.actor()?.ready&&SignalBreakerQA.actor()?.characterId===id,characterId);
   const box=await page.locator('#arena').boundingBox();await page.mouse.move(box.x+box.width*.55,box.y+box.height*.25);await page.waitForTimeout(70);
   const before=await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired);await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired),before+1);
   const proof=await page.evaluate(()=>({visual:JSON.parse(document.querySelector('#arena').dataset.breakerMuzzle),physical:SignalBreakerQA.engine().launchGeometry().muzzle,selected:SignalBreakerQA.snapshot().weapon}));
   assert.equal(proof.selected,weapon);assert.ok(Math.hypot(proof.visual.x-proof.physical.x,proof.visual.y-proof.physical.y)<1e-6);matrix.push({characterId,weapon});
   if(characterId==='player'&&weapon==='scan')await page.screenshot({path:path.join(output,'scanner-gameplay.png')});
   await page.locator('#pauseBtn').click();const t=await page.evaluate(()=>SignalBreakerQA.engine().time);await page.waitForTimeout(40);assert.equal(await page.evaluate(()=>SignalBreakerQA.engine().time),t);
   await page.locator('#prepareLab').click();
  }
 }
 // A victory fixture checks the persistence boundary only, not playable clear paths.
 await page.locator('#overlayPrimary').click();const saved=await page.evaluate(()=>localStorage.getItem('psi.signal-breaker.offline.v1'));await page.evaluate(()=>SignalBreakerQA.engine().finish(true));await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>localStorage.getItem('psi.signal-breaker.offline.v1')),saved,'LAB cannot write rewards or records');
 await page.locator('#overlayPrimary').click();await page.locator('#prepareChapter').click();await page.locator('#overlayPrimary').click();await page.evaluate(()=>SignalBreakerQA.engine().finish(true));await page.waitForTimeout(100);
 const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1')));assert.ok(first.credits>0);assert.ok(first.records['CH-01'].won);
 await page.getByRole('button',{name:'같은 작전 재도전',exact:true}).click();await page.locator('#overlayPrimary').click();await page.evaluate(()=>SignalBreakerQA.engine().finish(true));await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1')).credits),first.credits);
 await page.screenshot({path:path.join(output,'separate-rewards.png')});await page.reload();assert.equal(await page.locator('#stageList button:disabled').count(),3);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'matrix.json'),JSON.stringify({matrix,errors,checks:['settings freeze','six actors/six weapons','muzzle parity','LAB reward exclusion','first-clear credit once','reload unlock preservation']},null,2));
 console.log('PASS 36 actor/weapon combinations, settings, reward boundaries and persistence');await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
