/* Browser → pure engine → HUD → checkpoint recovery. Completion uses explicit fixtures. */
const {createRequire}=require('node:module'),{spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const {chromium}=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT
 ?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json'))('playwright')
 :require('playwright');
const root=path.resolve(__dirname,'../../..'),out=process.env.SIGNAL_BREAKER_QA_OUTPUT||path.join(root,'causal-qa');
const url='http://127.0.0.1:5211/signal-breaker-dev/index.html';
// Explicit regression fixture bypasses payload combat; ordinary simulations never use it.
const clear=()=>{const g=SignalBreakerQA.engine();g.shots=[];const burst=g.burstMode;g.burstMode=false;for(const c of g.pendingCores)g.addCore(c);g.pendingCores=[];for(const c of [...g.cores]){c.stable=true;g.capture(c,true);}g.burstMode=burst;};
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
   await page.goto(url);await page.locator('#operationLobby').waitFor({state:'visible'});a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().state),'ready','entry stays in operation menu');a.equal(await page.locator('#resumeRun').isVisible(),false,'fresh visitor has no resume-first screen');const sources=new Set();for(let chapter=1;chapter<=5;chapter++){await page.locator('[data-lobby-stage=CH-0'+chapter+']').click();sources.add(await page.locator('#operationImage').getAttribute('src'));a.equal(await page.locator('#startOperation').isDisabled(),chapter>1,'preview does not bypass unlock');a.ok((await page.locator('#operationSignature').textContent()).length>8);}a.equal(sources.size,5);await page.screenshot({path:path.join(out,`operation-final-${width}.png`)});await page.locator('[data-lobby-stage=CH-01]').click();await page.screenshot({path:path.join(out,`operation-entry-${width}.png`)});const startBox=await page.locator('#startOperation').boundingBox();a.ok(startBox&&startBox.y>=0&&startBox.y+startBox.height<=height+1,'start CTA fits viewport');a.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.locator('#startOperation').click();await page.waitForFunction(()=>window.SignalBreakerQA?.snapshot().state==='playing');
   // Fresh operation: actual controls preserve automatic fire across movement and aim overrides.
   a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().operation),true);
   await page.locator('#pulseBtn').click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().pulseStyle),'spread');
   await page.locator('#pulseBtn').click();a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().pulseStyle),'precision');
   await page.locator('#autoFireBtn').click();a.equal(await page.locator('#autoFireBtn').getAttribute('aria-pressed'),'true');const shots0=await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired);
   await page.keyboard.down('KeyD');await page.waitForFunction(n=>SignalBreakerQA.snapshot().shotsFired>n,shots0);await page.keyboard.up('KeyD');
   a.ok(await page.evaluate(n=>SignalBreakerQA.snapshot().shotsFired>n,shots0),'auto fire survives movement in twin mode');
   await page.locator('#netBtn').click();await page.waitForTimeout(250);a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().weapon),'net','manual equipment choice survives automatic fire');
   await page.evaluate(()=>SignalBreakerQA.controlMode('flow'));const ab=await page.locator('#aimPad').boundingBox();
   await page.mouse.move(ab.x+ab.width*.2,ab.y+ab.height*.2);await page.mouse.down();
   const aimedShots=await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired);await page.keyboard.down('KeyD');await page.waitForFunction(n=>SignalBreakerQA.snapshot().shotsFired>n,aimedShots);
   a.ok(await page.evaluate(n=>SignalBreakerQA.snapshot().shotsFired>n,aimedShots),'manual aim retains automatic fire');
   await page.waitForFunction(()=>{const g=SignalBreakerQA.engine(),live=g.launchGeometry().direction,shot=g.route.at(-1),facing=Number(document.getElementById('arena').dataset.breakerFacing),quantize=d=>(Math.round(Math.atan2(d.y,d.x)/(Math.PI/4))+8)%8;return live.x<0&&[live,shot&&g.time-shot.time<=.15?{x:shot.dx,y:shot.dy}:null].filter(Boolean).some(d=>facing===quantize(d));},null,{timeout:5000});
   await page.screenshot({path:path.join(out,`operation-strafe-${width}.png`)});await page.keyboard.up('KeyD');await page.mouse.up();
   await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.wave=4;g.beginNextWave();});
   await page.waitForFunction(()=>SignalBreakerQA.view().equipment.ready);a.ok(await page.evaluate(()=>SignalBreakerQA.engine().boss.stage===1));
    await page.evaluate(()=>{const g=SignalBreakerQA.engine(),b=g.boss;g.time=b.nextDischargeAt-1.34;g.step(1/120);});
    a.ok(await page.evaluate(()=>{const b=SignalBreakerQA.engine().boss;return b.identity==='delivery'&&b.warningUntil>SignalBreakerQA.engine().time;}),'CH01 dedicated boss shows warned discharge lane');
    await page.locator('#bossEncounter').waitFor({state:'visible',timeout:7000});a.equal(await page.locator('#bossEncounter').isVisible(),true,'boss HP and phase bar appears during actual boss wave');
    a.ok((await page.locator('#bossEncounterName').textContent()).includes('반입'),'distinct boss label in compact HUD');
    const cockpit=await page.evaluate(()=>{const v=id=>{const r=document.getElementById(id).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};return {head:v('bossEncounter'),fire:v('fireBtn'),move:v('joystick'),aim:v('aimPad'),viewport:{width:innerWidth,height:innerHeight}};});
    a.ok(cockpit.head.top>=0&&cockpit.head.bottom<=cockpit.viewport.height,'boss status remains inside mobile viewport');
    a.ok(cockpit.fire.left>=0&&cockpit.fire.right<=cockpit.viewport.width&&cockpit.fire.bottom<=cockpit.viewport.height,'FIRE stays operable within viewport');
    await page.screenshot({path:path.join(out,`combat-hud-boss-${width}.png`)});
    await page.screenshot({path:path.join(out,`operation-boss-warning-${width}.png`)});
    await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.boss.warningUntil=0;g.boss.nextDischargeAt=g.time+60;});
   await page.locator('#autoFireBtn').click();a.equal(await page.locator('#autoFireBtn').getAttribute('aria-pressed'),'false','explicit AUTO toggle stops it before manual shot QA');
   // Orientation visual QA at both sides: the authored actor faces the shot, not the joystick.
   for(const side of [-1,1]){
    await page.evaluate(d=>{const g=SignalBreakerQA.engine();g.setAimDirection(d,-.9);},side);
    await page.waitForFunction(d=>{const g=SignalBreakerQA.engine(),a=Math.atan2(g.launchGeometry().direction.y,g.launchGeometry().direction.x);return Number(document.getElementById('arena').dataset.breakerFacing)===(Math.round(a/(Math.PI/4))+8)%8&&Math.sign(g.launchGeometry().direction.x)===d;},side);
    await page.screenshot({path:path.join(out,`operator-muzzle-${side===-1?'left':'right'}-${width}.png`)});
   }
   await page.evaluate(()=>SignalBreakerQA.engine().pause());
   await page.screenshot({path:path.join(out,`operation-boss-${width}.png`)});
   // CH02-specific presentation contract: live belt-warning lane and interactive mitigation.
   await page.evaluate(()=>{SignalBreakerQA.selectStage('CH-02',true);const g=SignalBreakerQA.engine();g.wave=4;g.beginNextWave();g.time=g.boss.nextSurgeAt-1.55;g.step(1/120);});
   await page.waitForFunction(()=>SignalBreakerQA.engine().boss?.identity==='conveyor'&&SignalBreakerQA.engine().boss.warningUntil>SignalBreakerQA.engine().time);
   await page.waitForFunction(()=>document.getElementById('bossState').textContent.includes('과부하'));
   await page.screenshot({path:path.join(out,`operation-conveyor-warning-${width}.png`)});
   await page.locator('#conveyorBtn').click();
   await page.waitForFunction(()=>SignalBreakerQA.engine().boss.intercepts===1);
   a.equal(await page.evaluate(()=>SignalBreakerQA.engine().conveyorDirection),0,'CH02 belt stop blocks surge without an automatic action');
   await page.screenshot({path:path.join(out,`operation-conveyor-intercept-${width}.png`)});
   // A boss must survive its first power-core break: record armour-transition and next-wave readout.
   await page.evaluate(()=>{const g=SignalBreakerQA.engine(),b=g.boss;for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1,bounces:0});for(let i=0;i<b.maxHp;i++)g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});});
   a.ok(await page.evaluate(()=>{const b=SignalBreakerQA.engine().boss;return b.identity==='conveyor'&&b.segment===2&&b.phase==='rebuilding';}),'CH02 armour stage 1 break cannot finish combat');
   await page.screenshot({path:path.join(out,`operation-conveyor-armour-break-${width}.png`)});
   await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.time=g.boss.transitionUntil+1/120;g.step(1/120);});
   a.ok(await page.evaluate(()=>{const b=SignalBreakerQA.engine().boss;return b.segment===2&&b.phase==='sealed'&&b.nodes.every(n=>!n.hit);}));
   await page.screenshot({path:path.join(out,`operation-conveyor-armour-two-${width}.png`)});
   // CH03 distinct cyclone boss: warning, player-applied mist on extractor intake and cleared pressure.
   await page.evaluate(()=>{SignalBreakerQA.selectStage('CH-03',true);const g=SignalBreakerQA.engine();g.wave=4;g.beginNextWave();g.time=g.boss.nextPressureAt-1.48;g.step(1/120);});
   await page.waitForFunction(()=>SignalBreakerQA.engine().boss?.identity==='extraction'&&SignalBreakerQA.engine().boss.warningUntil>SignalBreakerQA.engine().time);
   await page.waitForFunction(()=>document.getElementById('bossState').textContent.includes('분진 압력'));
   if(height>width){await page.waitForFunction(()=>{const g=SignalBreakerQA.engine(),v=SignalBreakerQA.view(),cam=v.camera,playerX=(g.player.x-cam.x)*cam.scale,bossX=(g.boss.x-cam.x)*cam.scale;return playerX>=12&&playerX<=innerWidth-10&&bossX>=28&&bossX<=innerWidth-25;});}
   await page.screenshot({path:path.join(out,`operation-extraction-warning-${width}.png`)});
   if(height>width)await page.screenshot({path:path.join(out,`operation-extraction-boss-framing-${width}.png`)});
   await page.evaluate(()=>{const g=SignalBreakerQA.engine(),b=g.boss;g.shotBoss({kind:'mist',x:b.x,y:b.y,r:13,life:1,bounces:0});});
   await page.waitForFunction(()=>SignalBreakerQA.engine().boss.pressureVents===1);
   await page.screenshot({path:path.join(out,`operation-extraction-mist-${width}.png`)});
   await page.evaluate(()=>{const g=SignalBreakerQA.engine(),b=g.boss;for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1,bounces:0});for(let i=0;i<b.maxHp;i++)g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});});
   a.ok(await page.evaluate(()=>{const b=SignalBreakerQA.engine().boss;return b.identity==='extraction'&&b.phase==='purging'&&b.filterStage===2;}),'CH03 first filter cannot be completed as final victory');
   await page.waitForFunction(()=>document.getElementById('bossEncounterPhase').textContent.includes('필터 2/4'));
   await page.screenshot({path:path.join(out,`operation-extraction-filter-purge-${width}.png`)});
   await page.evaluate(()=>{const g=SignalBreakerQA.engine(),b=g.boss;window.__beforeFilterFlush=b.purgeUntil;g.shotBoss({kind:'mist',x:b.x,y:b.y,r:13,life:1,bounces:0});});
   a.ok(await page.evaluate(()=>{const b=SignalBreakerQA.engine().boss;return b.purgeMistBonus===true&&b.purgeUntil<window.__beforeFilterFlush;}),'player-applied mist advances purging filter service');
   await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.time=g.boss.purgeUntil+1/120;g.step(1/120);});
   a.ok(await page.evaluate(()=>{const b=SignalBreakerQA.engine().boss;return b.filterStage===2&&b.phase==='sealed'&&b.nodes.every(n=>!n.hit);}));
   await page.screenshot({path:path.join(out,`operation-extraction-filter-rearmed-${width}.png`)});
   // CH04 tension relay: make warned snap visible, then deliberately lock the rail with the anchor apparatus.
   await page.evaluate(()=>{SignalBreakerQA.selectStage('CH-04',true);const g=SignalBreakerQA.engine();g.wave=4;g.beginNextWave();g.time=g.boss.nextSnapAt-1.3;g.step(1/120);});
   await page.waitForFunction(()=>SignalBreakerQA.engine().boss?.identity==='tension'&&SignalBreakerQA.engine().boss.warningUntil>SignalBreakerQA.engine().time);
   await page.waitForFunction(()=>document.getElementById('bossState').textContent.includes('장력 파열'));
   await page.screenshot({path:path.join(out,`operation-tension-warning-${width}.png`)});
   await page.evaluate(()=>{const g=SignalBreakerQA.engine(),r=g.rail[0],s={x:r.x,y:r.y-135,vx:0,vy:2200,kind:'anchor',r:9,life:1,bounces:0,trail:[]};g.cores=[];for(let n=0;n<16&&s.life>0;n++)g.advanceShot(s,1/120);});
   a.ok(await page.evaluate(()=>{const g=SignalBreakerQA.engine();return g.tensionLockUntil>g.time&&g.boss.secured>0;}),'CH04 rail anchor cancels predicted cable snap');
   await page.screenshot({path:path.join(out,`operation-tension-anchor-${width}.png`)});
   // Final boss QA: three-zone electrical warning, explicit scan response, phase 2.
   await page.evaluate(()=>{SignalBreakerQA.selectStage('CH-05',true);const g=SignalBreakerQA.engine();g.wave=4;g.beginNextWave();g.time=g.boss.nextArcAt-1.36;g.step(1/120);});
   await page.waitForFunction(()=>SignalBreakerQA.engine().boss?.identity==='grid'&&SignalBreakerQA.engine().boss.warningUntil>SignalBreakerQA.engine().time);
   await page.waitForFunction(()=>document.getElementById('bossState').textContent.includes('전력 불균형'));
   await page.screenshot({path:path.join(out,`operation-grid-warning-${width}.png`)});
   await page.evaluate(()=>{const g=SignalBreakerQA.engine(),b=g.boss;g.deployField('scan',b.x,b.y);});
   a.ok(await page.evaluate(()=>{const b=SignalBreakerQA.engine().boss;return b.isolations===1&&!b.warningUntil&&b.scannedUntil>SignalBreakerQA.engine().time;}),'manual CH05 scanner interrupts live warning');
   await page.screenshot({path:path.join(out,`operation-grid-isolated-${width}.png`)});
   await page.evaluate(()=>{const g=SignalBreakerQA.engine(),b=g.boss;for(const n of b.nodes)g.shotBoss({kind:'pulse',x:n.x,y:n.y,r:8,life:1,bounces:0});b.hp=4;g.shotBoss({kind:'pulse',x:b.x,y:b.y,r:8,life:1,bounces:0});});
   a.ok(await page.evaluate(()=>SignalBreakerQA.engine().boss.combatTier===2),'CH05 final boss escalates at three HP');
   await page.screenshot({path:path.join(out,`operation-grid-phase-two-${width}.png`)});
   // Restore CH01 for causal source regression: CH02-05 do not have the CH01 source.
   await page.evaluate(()=>SignalBreakerQA.selectStage('CH-01',true));
   a.ok((await page.title()).includes('NEW-PSI : ZERO DAY'));await page.evaluate(()=>SignalBreakerQA.continuous(false));
   await page.waitForFunction(()=>SignalBreakerQA.view().materials.ready);
   a.ok((await page.evaluate(()=>SignalBreakerQA.view().materials.source)).endsWith('core-materials-v2.webp'));
   // Presentation fixtures cover every material and state without claiming player balance.
   await page.evaluate(()=>{const g=SignalBreakerQA.engine();if(g.state==='playing')g.pause();const c=SignalBreakerQA.view().camera;g.cores=[];for(const [i,kind] of ['metal','dust','power','load'].entries())g.addCore({x:c.x+innerWidth*(.17+i*.22)/c.scale,y:c.y+innerHeight*.45/c.scale,tier:2,kind,vx:0,vy:0,stable:i===3});g.cores[1].mistExposure=.375;g.fields=[{kind:'mist',x:g.cores[1].x,y:g.cores[1].y,radius:95,until:g.time+1}];});
   await page.waitForTimeout(80);
   a.equal(await page.evaluate(()=>{const c=SignalBreakerQA.view().camera;return SignalBreakerQA.engine().cores.every(q=>(q.x-q.r-c.x)*c.scale>=0&&(q.x+q.r-c.x)*c.scale<=innerWidth&&(q.y-q.r-c.y)*c.scale>=0&&(q.y+q.r-c.y)*c.scale<=innerHeight);}),true,'all material fixture silhouettes inside camera');
   await page.screenshot({path:path.join(out,`materials-${width}.png`)});
   // Reproduce CH02 FLOW 2/5 released-metal clutter independently of the actual final boss.
   await page.evaluate(()=>{SignalBreakerQA.selectStage('CH-02',true);const g=SignalBreakerQA.engine();g.wave=1;g.beginNextWave();g.cores=[];g.pendingCores=[];g.addCore({x:540,y:300,tier:2,kind:'metal',vx:0,vy:0});g.cores[0].released=true;g.cores[0].releaseAt=g.time-1;g.pause();});
   await page.waitForFunction(()=>SignalBreakerQA.view().hazards.ready&&SignalBreakerQA.view().hazards.footprints.length===1);
   a.ok(await page.evaluate(()=>{const view=SignalBreakerQA.view(),p=view.hazards.footprints[0];return SignalBreakerQA.engine().wave===2&&!SignalBreakerQA.engine().boss&&p.kind==='metal'&&p.visual>=p.r*2&&p.pixels<=Math.max(110,p.r*2*view.camera.scale)+1;}),'CH02 flow-2 metal hazard stays inside physical collision and screen pixel budget');
   await page.screenshot({path:path.join(out,`operation-ch02-flow02-metal-budget-${width}.png`)});
   await page.evaluate(()=>{SignalBreakerQA.engine().cores=[];});
   await page.waitForTimeout(90);await page.screenshot({path:path.join(out,`operation-ch02-flow02-background-only-${width}.png`)});
   await page.evaluate(()=>SignalBreakerQA.selectStage('CH-01',true));
   await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.reset();g.start();});
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
   if(width>height&&height<=500){
    const scene=await page.evaluate(()=>{const p=SignalBreakerQA.snapshot().support,c=SignalBreakerQA.view().camera,b=document.getElementById('arena').getBoundingClientRect();const box=(x,y,w,h)=>({x:(x-c.x)*c.scale+b.x,y:(y-c.y)*c.scale+b.y,width:w*c.scale,height:h*c.scale});return [box(p.x-25,p.y-96,50,96),box(p.barrierX-65,p.barrierY-25,130,50)];});
    for(const id of ['fireBtn','autoFireBtn','pulseBtn','netBtn']){const buttonBox=await page.locator('#'+id).boundingBox();a.ok(buttonBox&&buttonBox.x>=0&&buttonBox.y>=0&&buttonBox.x+buttonBox.width<=width+1&&buttonBox.y+buttonBox.height<=height+1,'landscape control remains reachable: '+id);for(const object of scene)a.ok(buttonBox.x+buttonBox.width<=object.x||buttonBox.x>=object.x+object.width||buttonBox.y+buttonBox.height<=object.y||buttonBox.y>=object.y+object.height,'control does not cover support or deployed barrier: '+id);}
   }
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
   // Explicit blocked-lane fixture checks automatic suppression and ordinary manual/movement input.
   await page.evaluate(()=>{SignalBreakerQA.controlMode('flow');SignalBreakerQA.selectStage('CH-05',true);const g=SignalBreakerQA.engine();g.operation=false;g.cores=[];g.pendingCores=[];g.boss={phase:'sealed',exposure:0,x:785,y:199,nodes:[{x:686,y:154,hit:true},{x:882,y:162,hit:false},{x:787,y:296,hit:false}]};});
   await page.locator('#autoFireBtn').click();
   await page.waitForFunction(()=>SignalBreakerQA.view().assistance?.blocked);
   await page.locator('#chainGuide').waitFor({state:'visible'});
   a.ok((await page.locator('#chainGuide').textContent()).includes('막힌 사선'));
   a.equal(await page.locator('#fireAction').textContent(),'발사','manual FIRE stays available while automatic targeting is blocked');a.equal(await page.locator('#autoFireBtn').getAttribute('aria-pressed'),'true');
   const hintBox=await page.locator('#chainGuide').boundingBox();a.ok(hintBox&&hintBox.x>=0&&hintBox.y>=0&&hintBox.x+hintBox.width<=width+1&&hintBox.y+hintBox.height<=height+1,'blocked guide fits viewport');
   await page.waitForFunction(()=>{const b=SignalBreakerQA.view().bossLabel,toast=document.getElementById('toast'),guides=[document.getElementById('chainGuide'),toast.classList.contains('visible')?toast:null].filter(Boolean).map(el=>el.getBoundingClientRect()).filter(r=>r.width);return b&&guides.every(r=>b.right<=r.left||b.left>=r.right||b.bottom<=r.top||b.top>=r.bottom);});
   const blockedShots=await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired);
   await page.waitForTimeout(350);a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired),blockedShots);
   await page.screenshot({path:path.join(out,`blocked-lane-${width}.png`)});
   await page.keyboard.press('Space');a.ok(await page.evaluate(n=>SignalBreakerQA.snapshot().shotsFired>n,blockedShots),'manual shot remains available');
   await page.keyboard.down('KeyD');await page.waitForTimeout(2100);await page.keyboard.up('KeyD');
   await page.waitForFunction(()=>SignalBreakerQA.view().assistance?.blocked===false);
   a.ok(await page.evaluate(()=>SignalBreakerQA.engine().player.x>290),'player changes blocked lane by actual movement');
   await page.evaluate(()=>{SignalBreakerQA.selectStage('CH-01',true);SignalBreakerQA.controlMode('twin');});await page.waitForTimeout(80);
   await page.evaluate(()=>{const g=SignalBreakerQA.engine(),cam=SignalBreakerQA.view().camera;g.operation=false;g.cores=[];g.pendingCores=[];for(const [i,kind] of ['metal','dust','power','load'].entries()){g.addCore({x:cam.x+(innerWidth*(.2+i*.2))/cam.scale,y:cam.y+innerHeight*.38/cam.scale,tier:0,kind,vx:40,vy:0});g.pulse(g.cores.at(-1),{vx:700,vy:-100,bounces:0});}g.runPoints=40;g.pickupCount=5;});
   await page.waitForFunction(()=>SignalBreakerQA.view().hazards.ready);
   a.equal(await page.evaluate(()=>SignalBreakerQA.engine().cores.every(c=>c.released)),true,'all four payloads released without bubbles');
   const boost=page.locator('#boostBtn'),bb=await boost.boundingBox();a.ok(bb&&bb.width>=44&&bb.height>=44&&bb.x>=0&&bb.y>=0&&bb.x+bb.width<=width&&bb.y+bb.height<=height,'boost touch target fits');
   await boost.click();a.equal(await page.evaluate(()=>SignalBreakerQA.engine().runPoints),0);a.ok(await page.evaluate(()=>SignalBreakerQA.snapshot().boostRemaining)>0,'ordinary boost button spends points');await page.evaluate(()=>SignalBreakerQA.engine().pause());
   await page.waitForFunction(()=>{const a=document.getElementById('boostBtn').getBoundingClientRect(),b=document.getElementById('toast').getBoundingClientRect();return a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom;});
   await page.waitForTimeout(100);
   a.equal(await page.evaluate(()=>{const c=SignalBreakerQA.view().camera;return SignalBreakerQA.engine().cores.filter(q=>q.released).length===4&&SignalBreakerQA.engine().cores.every(q=>(q.x-q.r*1.675-c.x)*c.scale>=0&&(q.x+q.r*1.675-c.x)*c.scale<=innerWidth&&(q.y-q.r*1.675-c.y)*c.scale>=0&&(q.y+q.r*1.675-c.y)*c.scale<=innerHeight);}),true,'four payload art silhouettes fit actual camera');
   await page.screenshot({path:path.join(out,`released-hazards-${width}.png`)});
   await page.evaluate(()=>{SignalBreakerQA.selectStage('CH-05',true);SignalBreakerQA.controlMode('twin');const g=SignalBreakerQA.engine();g.cores=[];g.pendingCores=[];});
   // State fixtures inspect production equipment at the actual game scale; no completion claim.
   await page.evaluate(()=>{SignalBreakerQA.controlMode('twin');const g=SignalBreakerQA.engine();g.operation=false;g.pause();g.player.x=785;g.boss={phase:'sealed',exposure:0,x:785,y:220,nodes:[{x:730,y:150,hit:true},{x:840,y:150,hit:false},{x:785,y:325,hit:false}]};});
   await page.waitForFunction(()=>SignalBreakerQA.view().equipment.ready);
   a.ok((await page.evaluate(()=>SignalBreakerQA.view().equipment.source)).endsWith('boss-equipment-v1.webp'));
   await page.waitForTimeout(100);await page.screenshot({path:path.join(out,`equipment-sealed-${width}.png`)});
   await page.evaluate(()=>{const b=SignalBreakerQA.engine().boss;b.phase='exposed';b.exposure=2;});
   await page.waitForTimeout(250);await page.waitForFunction(()=>{const b=SignalBreakerQA.view().bossLabel,toast=document.getElementById('toast');if(!toast.classList.contains('visible'))return true;const r=toast.getBoundingClientRect();return b&&(b.right<=r.left||b.left>=r.right||b.bottom<=r.top||b.top>=r.bottom);});await page.screenshot({path:path.join(out,`equipment-exposed-${width}.png`)});
   a.equal(await page.evaluate(()=>SignalBreakerQA.engine().boss.phase),'exposed');
   if(width>height&&height<=500)a.ok(await page.evaluate(()=>{const v=SignalBreakerQA.view(),b=SignalBreakerQA.engine().boss;return v.bossLabel.left>(b.x-v.camera.x)*v.camera.scale;}),'short landscape status is beside the body');
   // Explicit boundary fixtures test continuous UI transitions; endurance uses ordinary inputs.
   await page.evaluate(()=>{SignalBreakerQA.selectStage('CH-01',true);SignalBreakerQA.continuous(true);SignalBreakerQA.controlMode('twin');});
   await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.pickups=['power','charge','watch'].map((type,i)=>({id:++g.id,type,x:g.player.x+(i-1)*70,y:g.player.y-190,age:0}));});await page.waitForTimeout(50);await page.screenshot({path:path.join(out,`typed-loot-${width}.png`)});await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.pickups=['power','power','power','watch','watch','watch','charge'].map(type=>({id:++g.id,type,x:g.player.x,y:g.player.y-25,age:.3}));});await page.waitForFunction(()=>SignalBreakerQA.snapshot().signalWatch===3&&SignalBreakerQA.snapshot().burstRank===2);a.equal(await page.evaluate(()=>SignalBreakerQA.engine().burstCombo()),'recovery');await page.locator('#itemStatus').waitFor({state:'visible'});await page.waitForFunction(()=>document.getElementById('itemStatus').textContent.includes('3 / 3'));a.ok((await page.locator('#itemStatus').textContent()).includes('3 / 3'));
   await page.keyboard.down('KeyD');
   await page.evaluate(clear);await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.source.controlled=true;g.source.verified=true;g.update(1/120);});
   await page.waitForFunction(()=>SignalBreakerQA.snapshot().wave===2&&SignalBreakerQA.snapshot().state==='playing');
   a.equal(await page.locator('#tuningDock').isVisible(),false,'no blocking wave upgrade');a.equal(await page.locator('#overlay').isVisible(),false,'no continuous overlay');
   await page.locator('#radioLine').waitFor({state:'visible'});const radio=await page.locator('#radioLine').boundingBox();a.ok(radio&&radio.x>=0&&radio.y>=0&&radio.x+radio.width<=width+1&&radio.y+radio.height<=height+1,'radio fits actual viewport');
   const moving=await page.evaluate(()=>SignalBreakerQA.engine().player.x);await page.waitForTimeout(180);a.ok(await page.evaluate(x=>SignalBreakerQA.engine().player.x>x,moving),'held movement survives wave boundary');
   await page.keyboard.up('KeyD');await page.reload();await page.locator('#resumeRun').click();
   await page.waitForFunction(()=>SignalBreakerQA.snapshot().wave===2&&SignalBreakerQA.snapshot().state==='playing');a.equal(await page.locator('#tuningDock').isVisible(),false,'continuous checkpoint resumes directly');
   await page.keyboard.down('KeyD');
   for(let wave=2;wave<=5;wave++){await page.evaluate(clear);if(wave===5)await page.evaluate(()=>{const g=SignalBreakerQA.engine(),b=g.boss;if(b){for(const n of b.nodes)if(!n.hit)g.shotBoss({x:n.x,y:n.y,r:8,life:1,kind:'pulse'});for(let i=0;i<b.maxHp;i++)if(b.phase==='exposed')g.shotBoss({x:b.x,y:b.y,r:8,life:1,kind:'pulse'});}});await page.evaluate(()=>SignalBreakerQA.engine().update(1/120));if(wave<5)await page.waitForFunction(w=>SignalBreakerQA.snapshot().wave===w+1,wave);}
   await page.waitForFunction(()=>SignalBreakerQA.snapshot().stage==='CH-01'&&SignalBreakerQA.snapshot().state==='won');await page.locator('#overlay').waitFor({state:'visible'});a.equal(await page.locator('#overlay').isVisible(),true,'stage result waits for explicit choice');a.equal(await page.locator('#resultOperationSelect').isVisible(),true,'operation map reachable from results');a.equal(await page.locator('#resultLoadout').isVisible(),true,'equipment preparation reachable from results');a.equal(await page.locator('.result-award').isVisible(),true,'victory screen foregrounds earned outcome');await page.screenshot({path:path.join(out,`combat-result-${width}.png`)});await page.waitForTimeout(350);a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().stage),'CH-01');await page.keyboard.up('KeyD');await page.locator('#overlayPrimary').click();await page.waitForFunction(()=>SignalBreakerQA.snapshot().stage==='CH-02'&&SignalBreakerQA.snapshot().state==='ready');a.equal(await page.locator('#slot1Select').count(),1,'next stage supports loadout preparation');await page.locator('#overlayPrimary').click();await page.waitForFunction(()=>SignalBreakerQA.snapshot().stage==='CH-02'&&SignalBreakerQA.snapshot().state==='playing');await page.keyboard.down('KeyD');
   const continued=await page.evaluate(()=>SignalBreakerQA.engine().player.x);await page.waitForTimeout(180);a.ok(await page.evaluate(x=>SignalBreakerQA.engine().player.x>x,continued),'held movement survives chapter handoff');await page.keyboard.up('KeyD');
   await page.screenshot({path:path.join(out,`continuous-story-${width}.png`)});
   a.deepEqual(errors,[]);results.push({width,height,status:'PASS',checks:'five authored operation previews, optional resume, typed pickup collection and watch support, continuous wave, auto tuning, radio, direct checkpoint resume, player-confirmed stage choice, five stage bosses, automatic fire under movement and aim override, firing-direction body pose, released four-kind payload art, point boost via touch button, v2 materials, dedicated sealed/exposed equipment and relay states, movement, projectile, source recurrence, observation, control, verification, checkpoint recovery, blocked guide and waiting state, manual fire, movement clears lane'});
   console.log(`PASS ${width}x${height}: causal flow and recovery`);await context.close();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
