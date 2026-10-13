const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4173';
const out=path.resolve(process.env.PSI_QA_OUTPUT||'../../artifacts/audit-20261013');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN,headless:true}:{channel:'chrome',headless:true});const report=[];
 try{for(const [name,width,height] of [['phone',390,844],['small',360,640],['landscape',844,390],['short',667,375],['pc',1440,900],['tablet',768,1024],['fullhd',1920,1080],['4k',3840,2160]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:width<1000,hasTouch:width<1000,serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/signal-breaker-dev/index.html?entry=prepare');await page.waitForFunction(()=>window.SignalBreakerQA);await page.waitForTimeout(300);
  await page.locator('#overlayPrimary').click();await page.waitForTimeout(300);
  const layout=await page.evaluate(()=>{const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom}};const buttons=['stageSelectBtn','guideBtn','sandboxToggleBtn','talentBtn','pauseBtn','fireBtn','autoFireBtn','pulseBtn','netBtn','joystick','aimPad','leftBtn','rightBtn','shieldBtn','magnetBtn'];return {overflow:document.documentElement.scrollWidth>innerWidth+1,canvas:rect('arena'),pixels:document.getElementById('arena').width*document.getElementById('arena').height,controls:buttons.map(id=>{const r=rect(id),el=document.getElementById(id),top=document.elementFromPoint(r.x+r.w/2,r.y+r.h/2);return {id,...r,reachable:top===el||el.contains(top)}}).filter(r=>r.w&&r.h)}});
  assert.equal(layout.overflow,false,name+' horizontal overflow');assert.ok(layout.pixels<=3010000,name+' canvas pixel budget');
  for(const control of layout.controls)assert.equal(control.reachable,true,name+' unreachable '+control.id);
  if(height>width)assert.ok(layout.canvas.bottom<=height-220,name+' portrait combat must clear the control dock');
  await page.screenshot({path:path.join(out,'play-'+name+'.png')});
  await page.locator('#guideBtn').click();const before=await page.evaluate(()=>SignalBreakerQA.engine().time);await page.waitForTimeout(200);await page.keyboard.press('q');assert.equal(await page.evaluate(()=>SignalBreakerQA.engine().time),before,'dialog freezes combat');
  await page.locator('#completeGuideBtn').click();const points=await page.evaluate(()=>SignalBreakerTalentTech.manager.points);await page.locator('#guideBtn').click();assert.equal(await page.locator('#completeGuideBtn').isDisabled(),true);await page.locator('#closeGuide').click();assert.equal(await page.evaluate(()=>SignalBreakerTalentTech.manager.points),points);
  await page.locator('#stageSelectBtn').click();await page.locator('#freeUnlockToggle').click();await page.locator('#stageTabEp2').click();await page.locator('.stage-card-enter-btn').nth(4).click();assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'ready');assert.equal(await page.locator('#overlayPrimary').isVisible(),true);
  await page.locator('#sandboxToggleBtn').click();const permanent=await page.evaluate(()=>localStorage.getItem('psi.signal-breaker.talent-tech.v1'));await page.locator('#addTalentPointsBtn').click();await page.locator('#maxWeaponsBtn').click();assert.equal(await page.evaluate(()=>localStorage.getItem('psi.signal-breaker.talent-tech.v1')),permanent,'training upgrades cannot change permanent growth');await page.locator('#spawnBoss5').click();assert.equal(await page.evaluate(()=>SignalBreakerQA.engine().boss.identity),'grid');
  await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'boss-'+name+'.png')});
  if(name==='phone'){await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.screenshot({path:path.join(out,'rotation.png')});}
  assert.deepEqual(errors,[],name+' browser exceptions');report.push({name,width,height,errors,...layout});await context.close();
 }
 fs.writeFileSync(path.join(out,'device-verification.json'),JSON.stringify({base,report},null,2));console.log('PASS 8 viewports: hit testing, portrait dock, rotation, canvas budget, dialog pause, reward persistence, Episode 02 preparation and isolated boss training');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
