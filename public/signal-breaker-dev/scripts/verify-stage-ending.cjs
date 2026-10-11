/* Explicit terminal combat fixtures verify UI/save boundaries; not a gameplay balance test. */
const {createRequire}=require('node:module'),{spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const {chromium}=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json'))('playwright'):require('playwright');
const root=path.resolve(__dirname,'../../..'),out=process.env.SIGNAL_BREAKER_QA_OUTPUT||'/tmp/psi-stage-ending-qa';
const url='http://127.0.0.1:5213/signal-breaker-dev/index.html';
const terminal=()=>{const g=SignalBreakerQA.engine();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];g.source={...g.source,observed:true,controlled:true,verified:true};const b=g.boss;b.gatePhase=b.maxGatePhases;for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1});for(let i=0;i<b.maxHp;i++)g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1});g.update(1/120);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=spawn('python3',['-m','http.server','5213','--bind','127.0.0.1','--directory',path.join(root,'public')],{stdio:'ignore'});let browser;const results=[];
 try{
  for(let i=0;i<50;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({...(process.env.SIGNAL_BREAKER_CHROMIUM_PATH?{executablePath:process.env.SIGNAL_BREAKER_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const [width,height] of [[390,844],[844,390],[768,1024],[1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'});
   await context.addInitScript(()=>{if(!localStorage.getItem('psi.signal-breaker.offline.v1'))localStorage.setItem('psi.signal-breaker.offline.v1',JSON.stringify({sound:false,settings:{controlMode:'twin',assistVersion:1,autoFire:false}}));});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
   await page.goto(url);await page.locator('#operationLobby').waitFor({state:'visible'});await page.locator('#startOperation').click();
   await page.evaluate(terminal);await page.locator('#stageEnding').waitFor({state:'visible'});
   await page.waitForFunction(()=>document.getElementById('stageEnding').dataset.image==='ready');
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'won');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1'))),credits=saved.credits;
   a.equal(saved.records['CH-01'].endingMemory.record.origin,'game');a.equal(saved.records['CH-01'].endingMemory.record.externalSync,false);
   a.equal(saved.records['CH-01'].endingMemory.record.evidence.verified,true);a.equal(saved.records['CH-01'].endingMemory.seen,false);
   await page.waitForFunction(()=>SignalBreakerQA.ending().shot==='memory');await page.locator('#endingPause').click();
   const frozen=await page.evaluate(()=>({game:SignalBreakerQA.snapshot(),ending:SignalBreakerQA.ending()}));
   await page.waitForTimeout(250);a.equal(await page.evaluate(()=>SignalBreakerQA.ending().elapsed),frozen.ending.elapsed);a.deepEqual(await page.evaluate(()=>SignalBreakerQA.snapshot()),frozen.game);
   await page.keyboard.press('Space');a.deepEqual(await page.evaluate(()=>SignalBreakerQA.snapshot()),frozen.game,'cinematic blocks combat keys');
   a.equal(await page.locator('#endingEvidence li').count(),3);
   const bounds=await page.evaluate(()=>['endingSkip','endingPause','endingEvidence','endingTitle'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
   for(const r of bounds)a.ok(r.left>=0&&r.right<=width+1&&r.top>=0&&r.bottom<=height+1,r.id+' stays readable');
   a.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await page.screenshot({path:path.join(out,`ending-memory-${width}.png`)});
   await page.locator('#endingSkip').click();await page.locator('#overlayPrimary').waitFor({state:'visible'});
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().stage),'CH-01');
   await page.locator('#replayEnding').click();await page.locator('#stageEnding').waitFor({state:'visible'});if(width===1920){await page.locator('#overlayPrimary').waitFor({state:'visible'});}else await page.keyboard.press('Escape');
   a.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1')).credits),credits,'replay does not grant rewards');
   await page.locator('#resultOperationSelect').click();await page.reload();await page.locator('#operationLobby').waitFor({state:'visible'});
   a.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1')).credits),credits,'reload preserves one reward');
   await page.locator('#viewEndingArchive').click();await page.locator('#stageEnding').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.locator('#operationLobby').waitFor({state:'visible'});
   await page.locator('#startOperation').click();await page.evaluate(terminal);await page.locator('#overlayPrimary').waitFor({state:'visible'});
   a.equal(await page.locator('#stageEnding').isVisible(),false,'repeat win waits at results');
   a.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1')).credits),credits,'repeat win grants no duplicate first-clear reward');
   await page.waitForTimeout(width===390?30000:250);a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().stage),'CH-01','results never automatically start next stage');
   await page.locator('#overlayPrimary').click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().stage),'CH-02');a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'ready');
   await page.locator('#overlayPrimary').click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'playing');
   a.deepEqual(errors,[]);results.push({width,height,credits,errors});await context.close();
  }
  // Storage failure must retain an explicit retry without replaying the reward calculation.
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'reduce'});
  await context.addInitScript(()=>localStorage.setItem('psi.signal-breaker.offline.v1',JSON.stringify({sound:false,settings:{autoFire:false,assistVersion:1}})));
  const page=await context.newPage();await page.goto(url);await page.locator('#operationLobby').waitFor({state:'visible'});await page.locator('#startOperation').click();
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.failSave&&k==='psi.signal-breaker.offline.v1')throw new Error('test full storage');return original.call(this,k,v);};window.failSave=true;});
  await page.evaluate(terminal);await page.locator('#retryCompletionSave').waitFor({state:'visible'});a.equal(await page.locator('#stageEnding').isVisible(),false);
  await page.evaluate(()=>window.failSave=false);await page.locator('#retryCompletionSave').click();await page.locator('#stageEnding').waitFor({state:'visible'});
  a.equal(await page.locator('#stageEnding').getAttribute('data-motion'),'still');const credits=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1')).credits);
  await page.locator('#endingSkip').click();a.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1')).credits),credits);
  // Failed image cannot strand the player or fabricate evidence.
  await page.route('**/ending-ch01-restored-v1.webp',route=>route.abort());await page.locator('#replayEnding').click();await page.waitForFunction(()=>document.getElementById('stageEnding').dataset.image==='failed');
  await page.locator('#endingSkip').click();await page.locator('#overlayPrimary').waitFor({state:'visible'});await context.close();
  fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({results,storageRetry:true,reducedMotion:true,imageFailure:true},null,2));console.log('PASS CH01 ending, frozen combat, evidence, skip/replay/archive/reload, reward idempotency, 30s manual handoff, four viewports, storage retry, reduced motion and failed image');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
