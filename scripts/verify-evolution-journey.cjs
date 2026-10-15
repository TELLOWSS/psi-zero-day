const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4173',out=path.resolve(process.env.PSI_QA_OUTPUT||'docs/qa/evolution-clarity-20261015/campaign');fs.mkdirSync(out,{recursive:true});
async function ordinaryInputs(page){return page.evaluate(()=>{
 const g=SignalBreakerQA.engine(),DT=1/120;
 for(let i=0;i<240&&g.state==='playing';i++){
  if(g.source&&g.time>2&&!g.source.observed)g.observeSource();if(g.source&&g.time>3&&!g.source.requested)g.controlSource('isolate');
  if(g.veteran){if(g.boss?.identity==='conveyor'&&g.conveyorDirection!==0)g.cycleConveyor();const warning=g.boss?.warningUntil>g.time,support=warning&&g.boss.identity==='grid'?'scan':warning&&g.boss.identity==='tension'?'anchor':warning&&g.episode===3&&g.boss.identity==='extraction'?'mist':g.evolution.recipe?SignalBreakerEvolution.RECIPES[g.evolution.recipe].support:null;if(support)for(let k=0;k<8&&g.loadout[1]!==support;k++)g.cycleSupport();g.selectWeapon(warning&&support?support:'pulse');}
  let target=g.pickups?.[0]?.x??(560+Math.sin(g.time*.35)*300);if(g.boss?.warningUntil>g.time){const b=g.boss;if(b.identity==='delivery')target=b.dischargeX>560?250:870;if(b.identity==='grid')target=b.band===0?850:250;if(b.identity==='tension')target=g.player.x<650?b.snapLeft-80:b.snapRight+80;}
  const diver=g.episode===3&&g.cores.find(c=>c.diveAt&&g.time<c.diveEnd&&!c.stable&&!c.released);if(diver)target=diver.diveX>560?200:900;const danger=g.cores.find(c=>Math.hypot(c.x-g.player.x,c.y-g.player.y)<110),direction=danger?(danger.x>=g.player.x?-1:1):Math.abs(target-g.player.x)>15?Math.sign(target-g.player.x):0;
  g.move(g.player.x<80?1:g.player.x>1040?-1:direction,DT,false,true);if(i%14===0)g.assistAim(!g.veteran);g.fire();if((!g.veteran||g.episode===3)&&g.runPoints>=40)g.activateBoost();g.update(DT);
 }
 return {state:g.state,time:g.time,stage:g.config.id,life:g.player.life,evolution:{...g.evolution},parts:g.pickupCount};
});}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),rows=[];
try{for(const [name,width,height] of [['portrait',360,640],['landscape',844,390],['pc',1440,900]]){
 const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/signal-breaker-dev/index.html');await page.waitForSelector('#operationLobby:not([hidden])',{timeout:45000});
 assert.match(await page.locator('#journeyCount').textContent(),/0 \/ 15/);await page.locator('#lobbyGuide').click();await page.locator('#completeGuideBtn').click();assert.equal(await page.evaluate(()=>SignalBreakerTalentTech.manager.points),8);
 await page.locator('#heroStartBtn').click();assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'ready');assert.equal(await page.locator('#prepareGrowth').count(),1);await page.screenshot({path:path.join(out,name+'-prepare.png')});
 const runs=[];
 for(let stage=0;stage<15;stage++){
  if(stage>0){if((stage===5||stage===10)){await page.locator('#overlayPrimary').click();await page.locator('#continueCampaign').click();}else await page.locator('#overlayPrimary').click();}
  assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'ready');
  if(stage===1){await page.locator('#overlayInner .breaker-lobby-return').click();await page.waitForSelector('#operationLobby:not([hidden])');await page.locator('#resumeRun').click();assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'ready');}
  if(stage>=5&&stage<10){const frame=await page.evaluate(()=>SignalBreakerQA.engine().config.id==='CH-03'?'arc':'laser');await page.locator('#overlayInner [data-evolution="'+frame+'"]').click();}
  await page.locator('#overlayPrimary').click();let attempts=0;
  for(let batch=0;batch<230;batch++){
   const state=await ordinaryInputs(page);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   if(state.state==='intermission'){
    const quick=page.locator('[data-recommended-evolution]');
    if(await quick.count()){
     const before=await page.evaluate(()=>({parts:SignalBreakerQA.engine().pickupCount,wave:SignalBreakerQA.engine().wave}));
     await quick.click();assert.equal(await page.evaluate(()=>SignalBreakerQA.engine().pickupCount),before.parts);
     assert.equal(await page.evaluate(()=>SignalBreakerQA.engine().wave),before.wave+1);
    }else await page.locator('#tuningDock [data-tuning]').first().click();
   }
   if(state.state==='lost'){assert.ok(++attempts<3,'three attempts failed');await page.locator('#overlayPrimary').click();continue;}
   if(state.state==='won'){runs.push({...state,attempts});break;}
  }
  assert.equal(runs.length,stage+1,'operation must end through actual combat');if(stage>=5)assert.ok(runs.at(-1).evolution.recipe,'earned evolution must reach actual combat');await page.waitForFunction(()=>SignalBreakerQA.ending().active);
  assert.equal(await page.locator('#bossLootDialog').evaluate(el=>el.open),false,'loot must not cover cinema');
  await page.waitForFunction(()=>document.getElementById('stageEnding').dataset.image==='ready');if(stage===0)await page.screenshot({path:path.join(out,name+'-ending.png')});
  await page.locator('#endingSkip').click();try{await page.waitForFunction(()=>document.getElementById('bossLootDialog').open,{},{timeout:4000});}catch(error){console.log(JSON.stringify({name,stage,errors,debug:await page.evaluate(()=>({state:SignalBreakerQA.snapshot(),ending:SignalBreakerQA.ending(),dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),claims:SignalBreakerTalentTech.manager.rewardClaims,body:document.body.dataset.session}))},null,2));throw error;}
  assert.equal(await page.evaluate(()=>SignalBreakerQA.ending().active),false);
  if(stage===0){await page.screenshot({path:path.join(out,name+'-loot.png')});await page.locator('#lootOpenTechBtn').click();await page.locator('#tabWeapons').click();await page.locator('#talentTabContent .primary-btn').first().click();await page.locator('[data-socket-weapon="pulse"][data-socket-slot="0"]').first().click();await page.locator('#closeTalentTech').click();}else await page.locator('#lootContinueBtn').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1')));assert.equal(Object.values(saved.records).filter(r=>r.won).length,stage+1);
  assert.equal(await page.locator('#overlayInner').evaluate(el=>el.scrollWidth>el.clientWidth+2),false,'result overflow');
 }
 await page.locator('#overlayPrimary').click();assert.match(await page.locator('#journeyCount').textContent(),/15 \/ 15/);assert.equal(await page.locator('#continueCampaign').isVisible(),false);await page.screenshot({path:path.join(out,name+'-complete.png')});
 await page.reload();await page.waitForSelector('#operationLobby:not([hidden])',{timeout:45000});assert.match(await page.locator('#journeyCount').textContent(),/15 \/ 15/);assert.equal(await page.evaluate(()=>SignalBreakerTalentTech.manager.weaponLevels.pulse),2);
 await page.locator('#viewEndingArchive').click();await page.waitForFunction(()=>SignalBreakerQA.ending().active);await page.locator('#endingSkip').click();assert.equal(await page.locator('#bossLootDialog').evaluate(el=>el.open),false,'archive gives no loot');
 assert.deepEqual(errors,[]);rows.push({name,width,height,runs,checks:['fresh guide +3P','explicit preparation','fifteen ordinary combat wins','cinema before loot','real upgrade and socket','episode handoff','reload persistence','archive no reward','no horizontal overflow'],errors});await context.close();console.log('PASS full journey '+name);
 }fs.writeFileSync(path.join(out,'full-journey.json'),JSON.stringify({method:'Browser flows at three viewports and fifteen operations, combat accelerated with ordinary engine commands and real app event/reward handling; no forced victory or seed/life edits; recommended evolution + tuning chosen via real UI and parts proven unspent. Not human usability or frame-rate evidence.',rows},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
