/* Browser → pure engine → HUD → checkpoint recovery. Completion uses explicit fixtures. */
const {createRequire}=require('node:module'),{spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const {chromium}=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT
 ?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json'))('playwright')
 :require('playwright');
const root=path.resolve(__dirname,'../../..'),out=process.env.SIGNAL_BREAKER_QA_OUTPUT||path.join(root,'causal-qa');
const url='http://127.0.0.1:5211/signal-breaker-dev/index.html';
const clear=()=>{const g=SignalBreakerQA.engine();g.shots=[];for(const c of [...g.cores]){c.stable=true;g.capture(c,true);}};
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=spawn('python3',['-m','http.server','5211','--bind','127.0.0.1','--directory',path.join(root,'public')],{stdio:'ignore'});
 let browser;const results=[];
 try{
  for(let i=0;i<50;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({args:['--no-sandbox','--disable-dev-shm-usage']});
  for(const [width,height] of [[390,844],[844,390],[768,1024],[1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true});
   await context.addInitScript(()=>{if(!localStorage.getItem('psi.signal-breaker.offline.v1'))localStorage.setItem('psi.signal-breaker.offline.v1',JSON.stringify({sound:false,settings:{controlMode:'twin',assistVersion:1,autoFire:false}}));});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(20000);
   await page.goto(url);await page.waitForFunction(()=>window.SignalBreakerQA?.snapshot().state==='playing');
   a.ok((await page.title()).includes('NEW-PSI : ZERO DAY'));
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().source.observed),false);
   a.equal(await page.evaluate(()=>SignalBreakerQA.view().supportActor?.ready),true);
   const button=page.locator('#sourceBtn');await button.waitFor({state:'visible'});
   const box=await button.boundingBox();a.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,'source command inside viewport');
   a.ok(box.width>=40&&box.height>=40,'touch target');
   const before=await page.evaluate(()=>SignalBreakerQA.engine().player.x);
   await page.keyboard.down('KeyD');await page.waitForTimeout(180);await page.keyboard.up('KeyD');
   a.ok(await page.evaluate(x=>SignalBreakerQA.engine().player.x>x,before),'actual movement');
   const shots=await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired);
   await page.keyboard.press('Space');a.ok(await page.evaluate(n=>SignalBreakerQA.snapshot().shotsFired>n,shots),'actual projectile launch');
   await page.locator('#pauseBtn').click();const frozen=await page.evaluate(()=>SignalBreakerQA.snapshot());
   await page.waitForTimeout(150);a.deepEqual(await page.evaluate(()=>SignalBreakerQA.snapshot()),frozen);
   await page.locator('#overlayPrimary').click();
   // Clear fixture intentionally verifies transitions, not a player's skill or balance.
   await page.evaluate(clear);await page.evaluate(()=>{const g=SignalBreakerQA.engine();for(let i=0;i<1000;i++)g.update(1/120);});
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().wave),1);
   a.ok(await page.evaluate(()=>SignalBreakerQA.engine().cores.some(c=>c.echo)),'uncorrected source recurs');
   await button.click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().source.observed),true);
   const marker=await page.evaluate(()=>{const s=SignalBreakerQA.snapshot().source,c=SignalBreakerQA.view().camera;return {x:(s.x-c.x)*c.scale,y:(s.y-c.y)*c.scale};});
   a.ok(marker.x>=19&&marker.x<=width-19&&marker.y>=32&&marker.y<=height-32,'source marker and label visible inside camera');
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().source.controlled),false);
   await page.screenshot({path:path.join(out,`observed-${width}.png`)});
   await button.click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().source.requested),true);
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().source.controlled),false);
   await page.waitForFunction(()=>document.getElementById('sourceBtn').disabled);
   await page.waitForFunction(()=>SignalBreakerQA.view().supportDrawn);
   const supportStart=await page.evaluate(()=>SignalBreakerQA.snapshot().support.x);
   await page.waitForFunction(x=>SignalBreakerQA.snapshot().support.x>x,supportStart);
   await page.screenshot({path:path.join(out,`executing-${width}.png`)});
   await page.locator('#pauseBtn').click();const executionFrozen=await page.evaluate(()=>SignalBreakerQA.snapshot());
   await page.waitForTimeout(180);a.deepEqual(await page.evaluate(()=>SignalBreakerQA.snapshot()),executionFrozen);
   await page.locator('#overlayPrimary').click();
   await page.waitForFunction(()=>SignalBreakerQA.snapshot().source.controlled);
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().source.verified),false);
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().support.barrierProgress),1);
   await page.screenshot({path:path.join(out,`controlled-${width}.png`)});
   await page.evaluate(clear);await page.waitForFunction(()=>SignalBreakerQA.snapshot().state==='intermission');
   await page.locator('[data-tuning]').first().waitFor({state:'visible'});
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().source.verified),true);
   a.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'no horizontal overflow');
   const record=page.locator('[data-psi-record=verified]');await record.waitFor({state:'visible'});
   a.ok((await record.textContent()).includes('Proactive Safety Intelligence'));
   const recordBox=await record.boundingBox();a.ok(recordBox&&recordBox.y>=0&&recordBox.y+recordBox.height<=height,'verified PSI record fits viewport');
   await page.screenshot({path:path.join(out,`verified-${width}.png`)});
   const seed=await page.evaluate(()=>SignalBreakerQA.snapshot().seed);await page.reload();
   await page.locator('#resumeRun').click();await record.waitFor({state:'visible'});await page.locator('[data-tuning]').first().click();
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().wave),2);
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().seed),seed);
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().source),null);
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().support.phase),'holding');
   await page.waitForFunction(()=>document.getElementById('sourceBtn').hidden);
   await page.evaluate(clear);await page.waitForFunction(()=>SignalBreakerQA.snapshot().state==='intermission');
   a.equal(await record.count(),0,'later wave has no first-wave verification claim');
   await page.reload();await page.locator('#resumeRun').click();await page.locator('[data-tuning]').first().waitFor({state:'visible'});
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().source),null);a.equal(await record.count(),0);
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().support.barrierProgress),1);
   await page.waitForFunction(()=>SignalBreakerQA.view().supportDrawn);
   await page.locator('[data-tuning]').first().click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().wave),3);
   a.deepEqual(errors,[]);results.push({width,height,status:'PASS',checks:'movement, projectile, source recurrence, observation, control, verification, checkpoint recovery'});
   console.log(`PASS ${width}x${height}: causal flow and recovery`);await context.close();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
