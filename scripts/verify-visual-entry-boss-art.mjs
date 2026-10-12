/** Actual browser integration; boss state fixtures inspect presentation, not gameplay balance. */
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/..','package.json'));
const {chromium}=require('playwright'),root=process.cwd(),out=process.env.PSI_VISUAL_QA_OUTPUT||'/tmp/psi-visual-entry-v2';
const port=process.env.PSI_VISUAL_QA_PORT||'5317',url=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:'+port,server=process.env.PSI_PREVIEW_URL?null:spawn(process.execPath,['node_modules/vite/bin/vite.js',...(process.env.PSI_VISUAL_BUILD==='preview'?['preview']:[]),'--host','127.0.0.1','--port',port,'--strictPort'],{cwd:root,stdio:'ignore'});
let browser;const results=[];
try{
 fs.mkdirSync(out,{recursive:true});for(let i=0;i<70;i++){try{if(server&&server.exitCode!==null)throw new Error('QA server did not own its requested port');if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const [width,height] of JSON.parse(process.env.PSI_VISUAL_VIEWPORTS||'[[1920,1080],[844,390],[768,1024],[390,844]]')){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',width,e.message);});page.on('crash',()=>console.log('PAGE CRASH',width));page.setDefaultTimeout(30000);
  await page.goto(url);await page.locator('.commercial-title-home').waitFor();
  const card=page.locator('.is-survivors-entry');await card.scrollIntoViewIfNeeded();await card.locator('img').evaluate(i=>i.decode());
  assert.equal(await card.locator('img').getAttribute('src'),'/signal-watch-loading/signal-watch-landscape-v2.webp');
  await page.screenshot({path:path.join(out,`home-${width}.jpg`)});
  const intro=await page.locator('.commercial-title-features img').evaluateAll(images=>images.map(i=>new URL(i.getAttribute('src'),location.href).pathname));
  assert.ok(intro.includes('/assets/survivors/stage-01-ground-v2.webp'));assert.ok(intro.includes('/signal-breaker-dev/art/ending-ch01-restored-v1.webp'));
  assert.ok(!intro.some(uri=>/suspended_load|access_barrier/.test(uri)));
  await page.locator('.commercial-title-features').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`archive-${width}.jpg`)});
  assert.match(await page.locator('.chapter-record-home').innerText(),/스토리 모드|준비중/);
  // Delay the lazy game boundary so the responsive loading view can be inspected reliably.
  await page.route('**/*PatrolSurvivorsGame*',async route=>{await new Promise(r=>setTimeout(r,1800));await route.continue();});
  await card.click();await page.locator('.signal-watch-loading').waitFor();
  const loading=await page.locator('.signal-watch-loading-art').evaluate(i=>({width:i.clientWidth,height:i.clientHeight,src:i.getAttribute('src'),ratio:i.naturalWidth/i.naturalHeight}));
  assert.ok(loading.width>=width-1&&loading.height>=height-1);assert.ok(loading.ratio>1.7);
  await page.screenshot({path:path.join(out,`watch-loading-${width}.jpg`)});
  await page.locator('.survivors-ready-dialog').waitFor();
  assert.equal(await page.locator('.survivors-stage-preview:visible').count(),0,'no second full map poster after loading');
  const launch=page.getByRole('button',{name:'시그널 워치 시작',exact:true});await page.waitForFunction(()=>{const b=Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='시그널 워치 시작');return b&&!b.disabled;});assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(out,`watch-ready-${width}.jpg`)});
  await page.getByRole('button',{name:'작전 구역',exact:true}).click();assert.equal(await page.locator('.survivors-stage-preview:visible').count(),1);
  await page.getByRole('button',{name:'작전 준비',exact:true}).click();await launch.click();await page.locator('.survivors-ready-dialog').waitFor({state:'hidden'});await page.screenshot({path:path.join(out,`watch-play-${width}.jpg`)});
  assert.deepEqual(errors,[]);results.push({kind:'watch',width,height,loading,intro,errors});await context.close();
  const bc=await browser.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'}),bp=await bc.newPage(),be=[];bp.on('pageerror',e=>be.push(e.message));
  await bc.addInitScript(()=>localStorage.setItem('psi.signal-breaker.offline.v1',JSON.stringify({sound:false,settings:{autoFire:false,assistVersion:1}})));
  await bp.goto(url+'/signal-breaker-dev/index.html');await bp.locator('#operationLobby').waitFor({state:'visible'});await bp.locator('#startOperation').click();
  for(const [index,identity]of ['delivery','conveyor','extraction','tension','grid'].entries()){
   const id='CH-0'+(index+1);await bp.evaluate(id=>{SignalBreakerQA.selectStage(id,true);const g=SignalBreakerQA.engine();g.boss=g.operationBoss();g.cores=[];g.pendingCores=[];g.source=null;g.state='paused';g.time=3;},id);
   await bp.waitForFunction(identity=>SignalBreakerQA.view().bossArt?.identity===identity,identity);
   const sealed=await bp.evaluate(()=>({view:SignalBreakerQA.view(),boss:SignalBreakerQA.engine().boss,state:SignalBreakerQA.snapshot().state}));
   assert.equal(sealed.view.bossArt.source,`art/boss-${identity}-final-v2.webp`);assert.equal(sealed.boss.nodes.length,3);
   const statusBox=await bp.locator('#itemStatus').boundingBox();if(statusBox)assert.ok(statusBox.x>=0&&statusBox.x+statusBox.width<=width+1,'item status remains inside viewport');
   const boost=await bp.locator('.burst-boost').boundingBox();if(boost)assert.ok(boost.height>=44,'preserve boost touch target');
   if(width>height&&height<=600){const v=sealed.view.camera;assert.ok((sealed.boss.y-120-v.y)*v.scale>=49.9,'body clears top HUD');const panels=await bp.locator('#bossEncounter,#chainGuide,#toast,#radioLine').evaluateAll(elements=>elements.filter(el=>el.getBoundingClientRect().width&&getComputedStyle(el).display!=='none').map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));for(const n of sealed.boss.nodes){const px=(n.x-v.x)*v.scale,py=(n.y-v.y)*v.scale,r=31*v.scale;assert.ok(py-r>=49.9,'relay not clipped');for(const panel of panels)assert.ok(px+r<panel.x||px-r>panel.x+panel.width||py+r<panel.y||py-r>panel.y+panel.height,'message/status panel does not occlude relay');}}
   await bp.screenshot({path:path.join(out,`${id}-${width}-sealed.jpg`)});
   // Use real engine hits, not a manually overwritten exposure flag.
   await bp.evaluate(()=>{const g=SignalBreakerQA.engine();for(const n of g.boss.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1});});
   assert.equal(await bp.evaluate(()=>SignalBreakerQA.engine().boss.phase),'exposed');await bp.waitForTimeout(50);
   await bp.screenshot({path:path.join(out,`${id}-${width}-exposed.jpg`)});results.push({kind:'boss',id,width,height,identity,view:sealed.view});
  }
  assert.deepEqual(be,[]);await bc.close();await browser.close();browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 }
 // Resume the same persisted stage as the game; preparation must not preload stage 01 blindly.
 const rc=await browser.newContext({serviceWorkers:'block'}),rp=await rc.newPage(),requests=[];
 await rc.addInitScript(()=>{localStorage.setItem('psi.survivors.last_played_stage','stage_02');localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(['stage_01','stage_02']));});
 rp.on('request',r=>requests.push(new URL(r.url()).pathname));await rp.goto(url);await rp.locator('.is-survivors-entry').click();await rp.locator('.survivors-ready-dialog').waitFor();
 assert.match(await rp.locator('.survivors-ready-launch strong').innerText(),/STAGE 02/);
 await rp.getByRole('button',{name:'작전 구역',exact:true}).click();const resumedMap=await rp.locator('.survivors-stage-preview').getAttribute('src');assert.ok(requests.includes(resumedMap));results.push({kind:'watch-resume',stage:'stage_02',map:resumedMap});await rc.close();
 await browser.close();browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const wc=await browser.newContext({serviceWorkers:'block'}),wp=await wc.newPage();wp.on('pageerror',e=>console.log('RETRY PAGE ERROR',e.message));wp.on('crash',()=>console.log('RETRY PAGE CRASH'));wp.on('console',m=>{if(m.type()==='error')console.log('RETRY CONSOLE',m.text().slice(0,220));});
 wp.on('requestfailed',r=>console.log('RETRY REQUEST FAILED',r.url(),r.failure()?.errorText));await wp.route('**/signal-watch-landscape-v2.webp',r=>r.abort());await wp.goto(url);await wp.locator('.is-survivors-entry').click();await wp.locator('.signal-watch-loading-retry').waitFor();
 await wp.unroute('**/signal-watch-landscape-v2.webp');await wp.locator('.signal-watch-loading-retry').click();try{await wp.locator('.survivors-ready-dialog').waitFor();}catch(e){console.log('RETRY DOM',await wp.locator('body').innerText());await wp.screenshot({path:path.join(out,'watch-retry-failed.jpg')});throw e;}results.push({kind:'watch-retry',pass:true});await wc.close();
 await browser.close();browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/tmp/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const cc=await browser.newContext({serviceWorkers:'block'}),cp=await cc.newPage();await cp.goto(url);await cp.route('**/*PatrolSurvivorsGame*',async r=>{await new Promise(resolve=>setTimeout(resolve,2200));await r.continue();});
 await cp.locator('.is-survivors-entry').click();await cp.locator('.signal-watch-loading-exit').click();await cp.locator('.commercial-title-home').waitFor();await cp.waitForTimeout(2500);assert.equal(await cp.locator('.survivors-ready-dialog').count(),0);results.push({kind:'watch-cancel',pass:true});await cc.close();
 // Mandatory boss asset failure presents retry, then recovers; no game entry with absent final art.
 const retryContext=await browser.newContext({serviceWorkers:'block'}),retry=await retryContext.newPage();
 await retry.route('**/boss-grid-final-v2.webp',route=>route.abort());await retry.goto(url+'/signal-breaker-dev/index.html');await retry.locator('#loadingRetry').waitFor({state:'visible'});
 await retry.unroute('**/boss-grid-final-v2.webp');await retry.locator('#loadingRetry').click();await retry.locator('#operationLobby').waitFor({state:'visible'});results.push({kind:'breaker-retry',pass:true});await retryContext.close();
 // Durable cache entries, then actual offline reload.
 const oc=await browser.newContext(),op=await oc.newPage();await op.goto(url+'/signal-breaker-dev/index.html');await op.evaluate(()=>navigator.serviceWorker.ready);await op.reload();await op.waitForFunction(()=>navigator.serviceWorker.controller);
 await op.waitForFunction(async()=>{const names=await caches.keys(),cache=await caches.open(names.find(n=>n.includes('v0.44.0-veteran-evolution'))||'missing');return (await Promise.all(['delivery','conveyor','extraction','tension','grid'].map(k=>cache.match(new URL('art/boss-'+k+'-final-v2.webp',location.href).href)))).every(Boolean);});
 await oc.setOffline(true);await op.reload();await op.locator('#operationLobby').waitFor({state:'visible'});await op.locator('#startOperation').click();await op.evaluate(()=>{const g=SignalBreakerQA.engine();g.boss=g.operationBoss();g.state='paused';});await op.waitForFunction(()=>SignalBreakerQA.view().bossArt?.ready);results.push({kind:'breaker-offline',pass:true});await oc.close();
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log('PASS',results.filter(r=>r.kind==='watch').length,'Watch entry/play viewports,',results.filter(r=>r.kind==='boss').length,'boss encounters, resume/retry/cancel and offline reload');
}finally{if(browser)await browser.close();server?.kill();}
