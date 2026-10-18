/* Real Web Audio boundary check: signal, pause, visibility, mute and replay cleanup.
   This measures audio output; it is not a Director listening approval. */
const {createRequire}=require('node:module'),{spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const {chromium}=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json'))('playwright'):require('playwright');
const root=path.resolve(__dirname,'../../..'),out=process.env.SIGNAL_BREAKER_QA_OUTPUT||'/tmp/psi-ending-sound-qa';
const terminal=()=>{const g=SignalBreakerQA.engine();g.wave=4;g.beginNextWave();g.cores=[];g.pendingCores=[];for(const n of g.circuit)n.hit=true;const b=g.boss;if(b.identity==='tension')b.loadStage=b.maxLoadStages;for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1});for(let i=0;i<b.maxHp;i++)g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1});g.update(1/120);};
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=spawn('python3',['-m','http.server','5215','--bind','127.0.0.1','--directory',path.join(root,'public')],{stdio:'ignore'});let browser;const results=[];
 try{const url='http://127.0.0.1:5215/signal-breaker-dev/index.html';for(let i=0;i<50;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({...(process.env.SIGNAL_BREAKER_CHROMIUM_PATH?{executablePath:process.env.SIGNAL_BREAKER_CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const enabled of [true,false]){
 const context=await browser.newContext({viewport:{width:844,height:390},serviceWorkers:'block',reducedMotion:enabled?'no-preference':'reduce'});
 await context.addInitScript(enabled=>{let implementation;Object.defineProperty(window,'SignalBreakerEndingSound',{get:()=>implementation,set:Class=>{implementation=class extends Class{start(...args){window.endingSoundProbe=this;return super.start(...args);}};}});localStorage.setItem('psi.signal-breaker.offline.v1',JSON.stringify({sound:enabled,records:{'CH-01':{won:true},'CH-02':{won:true},'CH-03':{won:true}},settings:{autoFire:false,assistVersion:1}}));},enabled);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.locator('#operationLobby').waitFor({state:'visible'});await page.locator('[data-lobby-stage="CH-04"]').click();await page.locator('#heroStartBtn').click();await page.locator('#overlayPrimary').click();await page.evaluate(terminal);await page.locator('#stageEnding').waitFor({state:'visible'});
 if(enabled){await page.waitForFunction(()=>endingSoundProbe.c.state==='running'&&SignalBreakerQA.ending().elapsed>2);await page.evaluate(()=>{const s=endingSoundProbe;window.endingAnalyser=s.c.createAnalyser();endingAnalyser.fftSize=2048;s.bus.connect(endingAnalyser);});const rms=()=>{const data=new Float32Array(endingAnalyser.fftSize);endingAnalyser.getFloatTimeDomainData(data);return Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length);};await page.waitForTimeout(300);const active=await page.evaluate(rms);a.ok(active>1e-5,'world audio produces a bounded signal');a.equal(await page.evaluate(()=>endingSoundProbe.sources.size),4);
 await page.locator('#endingPause').click();a.equal(await page.locator('.ending-copy').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');await page.waitForTimeout(400);const paused=await page.evaluate(rms);a.ok(paused<1e-5,'pause silences the entire ending bus');await page.locator('#endingPause').click();await page.waitForTimeout(300);a.ok(await page.evaluate(rms)>1e-5,'resume restores the mix');
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(400);a.ok(await page.evaluate(rms)<1e-5,'hidden tab is silent');await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 results.push({enabled,activeRms:active,pausedRms:paused});
 }else{a.equal(await page.locator('.ending-copy').evaluate(el=>getComputedStyle(el).animationName),'none');a.equal(await page.evaluate(()=>endingSoundProbe.running),false);a.equal(await page.evaluate(()=>endingSoundProbe.sources.size),0);results.push({enabled,sources:0});}
 await page.locator('#endingSkip').click();a.equal(await page.evaluate(()=>endingSoundProbe.sources.size),0);a.equal(await page.evaluate(()=>endingSoundProbe.nodes.length),0);
 for(let i=0;i<3;i++){await page.locator('#replayEnding').click();a.equal(await page.evaluate(()=>endingSoundProbe.sources.size),enabled?4:0);await page.keyboard.press('Escape');a.equal(await page.evaluate(()=>endingSoundProbe.sources.size),0);}
 a.deepEqual(errors,[]);await context.close();
 }
 fs.writeFileSync(path.join(out,'ending-sound-summary.json'),JSON.stringify({results,measurement:'Web Audio analyser; no listening approval'},null,2));console.log('PASS ending sound: real output, pause/resume, hidden tab, mute and repeated source cleanup');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
