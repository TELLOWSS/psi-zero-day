/* Terminal fixtures check presentation boundaries, not combat balance or real-site safety. */
const {createRequire}=require('node:module'),{spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const {chromium}=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json'))('playwright'):require('playwright');
const out=process.env.SIGNAL_BREAKER_QA_OUTPUT||'/tmp/psi-campaign-ending-qa',root=path.resolve(__dirname,'../../..');
const terminal=()=>{const g=SignalBreakerQA.engine();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];for(const n of g.circuit)n.hit=true;const b=g.boss;if(b.identity==='conveyor')b.segment=b.maxSegments;if(b.identity==='extraction')b.filterStage=b.maxFilterStages;for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1});for(let i=0;i<b.maxHp;i++)g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1});g.update(1/120);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=spawn('python3',['-m','http.server','5214','--bind','127.0.0.1','--directory',path.join(root,'public')],{stdio:'ignore'});const url='http://127.0.0.1:5214/signal-breaker-dev/index.html';let browser;const results=[];
 try{
  for(let i=0;i<50;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({...(process.env.SIGNAL_BREAKER_CHROMIUM_PATH?{executablePath:process.env.SIGNAL_BREAKER_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const [width,height] of [[390,844],[844,390],[768,1024],[1920,1080]])for(const number of [2,3,4,5]){
   const id='CH-0'+number,context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:number===3?'reduce':'no-preference'});
   await context.addInitScript(n=>{const records={};for(let i=1;i<n;i++)records['CH-0'+i]={won:true};if(!localStorage.getItem('psi.signal-breaker.offline.v1'))localStorage.setItem('psi.signal-breaker.offline.v1',JSON.stringify({credits:0,records,sound:false,settings:{autoFire:false,assistVersion:1}}));},number);
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
   await page.clock.install();await page.goto(url);await page.locator('#operationLobby').waitFor({state:'visible'});await page.locator('[data-lobby-stage="'+id+'"]').click();await page.locator('#startOperation').click();
   // A browser clock runs the same animation frames without wall-clock idle time.
   await page.evaluate(terminal);await page.clock.runFor(100);
   await page.locator('#stageEnding').waitFor({state:'visible'});await page.waitForFunction(()=>document.getElementById('stageEnding').dataset.image==='ready');
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1'))),credits=saved.credits,r=saved.records[id].endingMemory.record;
   a.equal(r.stageId,id);a.equal(r.evidence.sourceAssessment,'unmeasured');a.equal(r.evidence.observed,undefined);a.equal(r.evidence.residualSignals,0);a.equal(r.externalSync,false);a.equal(saved.records[id].endingMemory.seen,false);
   const frozen=await page.evaluate(()=>SignalBreakerQA.snapshot());
   if(number===5){const seen=[];for(const recall of [1,2,3,4]){await page.clock.runFor(recall===1?1800:1500);a.equal(await page.locator('#stageEnding').getAttribute('data-shot'),'recall'+recall);seen.push(await page.locator('.ending-art').getAttribute('src'));}a.equal(new Set(seen).size,4);await page.clock.runFor(12000);}else await page.clock.runFor(12000);
   a.deepEqual(await page.evaluate(()=>SignalBreakerQA.snapshot()),frozen);await page.locator('#endingPause').click();const elapsed=await page.evaluate(()=>SignalBreakerQA.ending().elapsed);await page.clock.runFor(1000);a.equal(await page.evaluate(()=>SignalBreakerQA.ending().elapsed),elapsed);
   a.equal(await page.locator('#endingEvidence li').count(),3);a.ok(!(await page.locator('#endingEvidence').innerText()).includes('발생원'));
   a.equal(await page.locator('.ending-art').getAttribute('src'),'art/ending-ch0'+number+'-restored-v1.webp');await page.waitForFunction(()=>document.getElementById('stageEnding').dataset.image==='ready');
   const bounds=await page.evaluate(()=>['endingSkip','endingPause','endingEvidence','endingTitle'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));for(const r of bounds)a.ok(r.left>=0&&r.right<=width+1&&r.top>=0&&r.bottom<=height+1,r.id+' fits '+id);
   await page.screenshot({path:path.join(out,'campaign-'+id+'-'+width+'.png')});await page.locator('#endingSkip').click();await page.locator('#overlayPrimary').waitFor({state:'visible'});
   const copy=await page.locator('.ending-memory-card').innerText();a.ok(copy.includes(number===5?'오늘도 무사히':'CH-0'+(number+1)));a.ok(!copy.includes('CH-02 이동 반입'));
   await page.locator('#replayEnding').click();if(number===5&&width===1920)await page.clock.runFor(22000);else{await page.clock.runFor(100);await page.keyboard.press('Escape');}await page.locator('#overlayPrimary').waitFor({state:'visible'});a.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1')).credits),credits);
   if(number===5){await page.locator('#overlayPrimary').click();await page.locator('#operationLobby').waitFor({state:'visible'});a.equal(await page.locator('[data-lobby-stage="CH-06"]').count(),0);}else{await page.clock.fastForward(30000);a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().stage),id);await page.locator('#overlayPrimary').click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().stage),'CH-0'+(number+1));a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'ready');}
   await page.reload();await page.locator('#operationLobby').waitFor({state:'visible'});await page.locator('[data-lobby-stage="'+id+'"]').click();await page.locator('#viewEndingArchive').click();await page.locator('#stageEnding').waitFor({state:'visible'});await page.keyboard.press('Escape');await page.locator('#operationLobby').waitFor({state:'visible'});a.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.signal-breaker.offline.v1')).credits),credits);
   a.deepEqual(errors,[]);results.push({stage:id,width,height,credits,errors});await context.close();
  }
  fs.writeFileSync(path.join(out,'campaign-summary.json'),JSON.stringify({results,clock:'Playwright frame clock',terminalFixtures:true},null,2));console.log('PASS CH02–05: 16 stage/viewports, terminal evidence, four-world montage, pause, replay, archive/reload, rewards and manual campaign end');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
