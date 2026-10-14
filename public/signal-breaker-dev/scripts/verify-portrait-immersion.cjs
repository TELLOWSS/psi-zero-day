const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4173';
const out=path.resolve(process.env.PSI_QA_OUTPUT||'artifacts/portrait-immersion');fs.mkdirSync(out,{recursive:true});
const overlaps=(x,y)=>x&&y&&Math.min(x.x+x.width,y.x+y.width)-Math.max(x.x,y.x)>1&&Math.min(x.y+x.height,y.y+y.height)-Math.max(x.y,y.y)>1;
const frames=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),rows=[];
 try{
  for(const [name,width,height] of [['small',320,568],['portrait',390,844],['tall',412,915],['tablet',768,1024],['landscape',844,390],['pc',1440,900]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));await page.goto(base+'/signal-breaker-dev/index.html?entry=prepare');
   await page.waitForFunction(()=>SignalBreakerQA.actor()?.ready);await page.locator('#overlayPrimary').click();await frames(page);
   const immersive=height>width,arena=await page.locator('#arena').boundingBox();
   a.equal(await page.locator('#portraitMenuBtn').isVisible(),immersive);
   if(!immersive){a.ok(await page.locator('#smartBtn').isVisible());a.ok(await page.locator('#exitBtn').isVisible());await page.screenshot({path:path.join(out,name+'-unchanged.png')});rows.push({name,width,height,arena,checks:['portrait-only controls hidden','existing landscape/PC controls visible'],errors});await context.close();continue;}
   for(const id of ['exitBtn','viewBtn','itemStatus','veteranStatus','signalObjective','toast','chainGuide'])a.equal(await page.locator('#'+id).isVisible(),false,id+' must not cover battle');
   const controls=[];
   for(const id of ['joystick','aimPad','fireBtn','pulseBtn','netBtn','shieldBtn','magnetBtn']){
    const box=await page.locator('#'+id).boundingBox();a.ok(box&&box.width>=44&&box.height>=44,id+' touch target');
    a.ok(box.x>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,id+' viewport');a.equal(overlaps(arena,box),false,id+' outside arena');controls.push({id,...box});
   }
   for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)a.equal(overlaps(controls[i],controls[j]),false,controls[i].id+' overlaps '+controls[j].id);
   a.ok((await page.locator('#joystick').boundingBox()).width>=104);
   const client=await context.newCDPSession(page),pad=controls.find(row=>row.id==='joystick'),origin={x:pad.x+pad.width/2,y:pad.y+pad.height/2};
   await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...origin,id:1}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:origin.x+38,y:origin.y-12,id:1}]});a.ok(await page.evaluate(()=>SignalBreakerQA.view().movement.value)>0);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});a.equal(await page.evaluate(()=>SignalBreakerQA.view().movement.value),0);
   const both=[{x:arena.x+arena.width*.23,y:arena.y+arena.height*.72,id:2},{x:arena.x+arena.width*.78,y:arena.y+arena.height*.5,id:3}];
   await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:both});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...both[0],x:both[0].x+38},both[1]]});a.ok(await page.evaluate(()=>SignalBreakerQA.view().movement.floating.active));await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.locator('#netBtn').click();await page.locator('#portraitMenuBtn').click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'paused');
   const time=await page.evaluate(()=>SignalBreakerQA.engine().time);await page.waitForTimeout(160);a.equal(await page.evaluate(()=>SignalBreakerQA.engine().time),time,'menu freezes combat');
   a.equal(await page.locator('#portraitAction-smartBtn').getAttribute('aria-pressed'),'false');await page.locator('#portraitAction-smartBtn').click();a.equal(await page.locator('#portraitAction-smartBtn').getAttribute('aria-pressed'),'true');
   await page.locator('#portraitAction-autoFireBtn').click();a.equal(await page.locator('#portraitAction-autoFireBtn').getAttribute('aria-pressed'),'false');await page.locator('#portraitAction-autoFireBtn').click();
   await page.locator('#portraitAction-guideBtn').click();a.ok(await page.locator('#guideDialog').evaluate(el=>el.open));await page.locator('#closeGuide').click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'paused');
   await page.locator('#portraitAction-stageSelectBtn').click();a.ok(await page.locator('#stageSelectDialog').evaluate(el=>el.open));await page.locator('#closeStageSelect').click();
   await page.locator('#portraitAction-view').click();a.ok(await page.locator('#viewBtn').isVisible());await page.locator('#viewBtn').click();a.ok(await page.locator('#overlayInner[data-state=paused]').isVisible());
   await page.locator('#portraitAction-immersion').click();a.equal(await page.evaluate(()=>document.body.classList.contains('portrait-immersive')),false);await page.locator('#overlayPrimary').click();const classicArena=await page.locator('#arena').boundingBox();a.ok(arena.height>classicArena.height+80,'more usable arena height');
   await page.reload();await page.waitForSelector('#overlayPrimary');a.equal(await page.evaluate(()=>document.body.classList.contains('portrait-immersive')),false,'preference restored');await page.locator('#overlayPrimary').click();await page.locator('#pauseBtn').click();await page.locator('#portraitAction-immersion').click();await page.locator('#overlayPrimary').click();await frames(page);
   await page.screenshot({path:path.join(out,name+'-field.png')});
   // Isolated presentation fixture using the engine's authored boss factory. Not a campaign win or difficulty measurement.
   await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.boss=g.operationBoss();g.boss.warningUntil=g.time+10;g.runPoints=60;});await frames(page);await page.waitForFunction(()=>document.body.dataset.activeBoss==='true'&&document.querySelector('#portraitBattleNotice').textContent.includes('⚠'));
   const bossArena=await page.locator('#arena').boundingBox(),bossBar=await page.locator('#bossEncounter').boundingBox(),notice=await page.locator('#portraitBattleNotice').boundingBox();a.equal(overlaps(bossArena,bossBar),false,'boss status outside arena');a.equal(overlaps(bossArena,notice),false,'warning outside arena');
   a.ok(await page.locator('#portraitBoostBtn').isVisible());await page.locator('#portraitBoostBtn').click();a.equal(await page.evaluate(()=>SignalBreakerQA.engine().runPoints),20,'real boost cost');
   await page.screenshot({path:path.join(out,name+'-boss-warning.png')});
   await page.locator('#portraitMenuBtn').click();await page.locator('#overlayInner .breaker-lobby-return').click();await page.waitForSelector('#operationLobby:not([hidden])');await page.locator('#resumeRun').click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'playing');
   await page.setViewportSize({width:height,height:width});await frames(page);a.equal(await page.locator('#portraitMenuBtn').isVisible(),false);a.ok(await page.locator('#exitBtn').isVisible());await page.setViewportSize({width,height});await frames(page);a.ok(await page.locator('#portraitMenuBtn').isVisible());a.equal(await page.evaluate(()=>SignalBreakerQA.view().movement.value),0);
   a.deepEqual(errors,[]);rows.push({name,width,height,arena,classicArena,bossArena,bossBar,controls,checks:['expanded field','no control overlap','104px movement','trusted two-finger input','menu freezes time','smart/auto reachable','guide/stage/map return','preference persists','edge danger warning','boost costs 40P','home/resume','orientation restore'],errors});await context.close();console.log('PASS portrait immersion '+name);
  }
  fs.writeFileSync(path.join(out,'portrait-immersion.json'),JSON.stringify({base,method:'Actual UI and trusted touch at six viewports. Authored boss/points fixture tests presentation and boost controls only; does not prove human difficulty, FPS or a campaign victory.',rows},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
