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
   await page.locator('#fireBtn').click();const shots0=await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired);
   await page.keyboard.down('KeyD');await page.waitForTimeout(600);await page.keyboard.up('KeyD');
   a.ok(await page.evaluate(n=>SignalBreakerQA.snapshot().shotsFired>n,shots0),'auto fire survives movement in twin mode');
   await page.locator('#netBtn').click();await page.waitForTimeout(250);a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().weapon),'net','manual equipment choice survives automatic fire');
   await page.evaluate(()=>SignalBreakerQA.controlMode('flow'));const ab=await page.locator('#aimPad').boundingBox();
   await page.mouse.move(ab.x+ab.width*.2,ab.y+ab.height*.2);await page.mouse.down();
   const aimedShots=await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired);await page.keyboard.down('KeyD');await page.waitForTimeout(650);
   a.ok(await page.evaluate(n=>SignalBreakerQA.snapshot().shotsFired>n,aimedShots),'manual aim retains automatic fire');
   a.ok(await page.evaluate(()=>{const g=SignalBreakerQA.engine(),d=g.launchGeometry().direction;return d.x<0&&Number(document.getElementById('arena').dataset.breakerFacing)===(Math.round(Math.atan2(d.y,d.x)/(Math.PI/4))+8)%8;}),'body faces left shot while moving right');
   await page.screenshot({path:path.join(out,`operation-strafe-${width}.png`)});await page.keyboard.up('KeyD');await page.mouse.up();
   await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.wave=4;g.beginNextWave();});
   await page.waitForFunction(()=>SignalBreakerQA.view().equipment.ready);a.ok(await page.evaluate(()=>SignalBreakerQA.engine().boss.stage===1));
   await page.locator('#fireBtn').click();await page.evaluate(()=>SignalBreakerQA.engine().pause());
   await page.screenshot({path:path.join(out,`operation-boss-${width}.png`)});
   a.ok((await page.title()).includes('NEW-PSI : ZERO DAY'));await page.evaluate(()=>SignalBreakerQA.continuous(false));
   await page.waitForFunction(()=>SignalBreakerQA.view().materials.ready);
   a.ok((await page.evaluate(()=>SignalBreakerQA.view().materials.source)).endsWith('core-materials-v2.webp'));
   // Presentation fixtures cover every material and state without claiming player balance.
   await page.evaluate(()=>{const g=SignalBreakerQA.engine(),c=SignalBreakerQA.view().camera;g.cores=[];for(const [i,kind] of ['metal','dust','power','load'].entries())g.addCore({x:c.x+innerWidth*(.17+i*.22)/c.scale,y:c.y+innerHeight*.45/c.scale,tier:2,kind,vx:0,vy:0,stable:i===3});g.cores[1].mistExposure=.375;g.fields=[{kind:'mist',x:g.cores[1].x,y:g.cores[1].y,radius:95,until:g.time+1}];});
   await page.waitForTimeout(80);
   a.equal(await page.evaluate(()=>{const c=SignalBreakerQA.view().camera;return SignalBreakerQA.engine().cores.every(q=>(q.x-q.r-c.x)*c.scale>=0&&(q.x+q.r-c.x)*c.scale<=innerWidth&&(q.y-q.r-c.y)*c.scale>=0&&(q.y+q.r-c.y)*c.scale<=innerHeight);}),true,'all material fixture silhouettes inside camera');
   await page.screenshot({path:path.join(out,`materials-${width}.png`)});
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
    for(const id of ['fireBtn','pulseBtn','netBtn']){const buttonBox=await page.locator('#'+id).boundingBox();a.ok(buttonBox&&buttonBox.x>=0&&buttonBox.y>=0&&buttonBox.x+buttonBox.width<=width+1&&buttonBox.y+buttonBox.height<=height+1,'landscape control remains reachable: '+id);for(const object of scene)a.ok(buttonBox.x+buttonBox.width<=object.x||buttonBox.x>=object.x+object.width||buttonBox.y+buttonBox.height<=object.y||buttonBox.y>=object.y+object.height,'control does not cover support or deployed barrier: '+id);}
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
   await page.locator('#fireBtn').click();
   await page.waitForFunction(()=>SignalBreakerQA.view().assistance?.blocked);
   await page.locator('#chainGuide').waitFor({state:'visible'});
   a.ok((await page.locator('#chainGuide').textContent()).includes('막힌 사선'));
   a.equal(await page.locator('#fireAction').textContent(),'사선 대기');
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
   await page.evaluate(()=>{const g=SignalBreakerQA.engine(),cam=SignalBreakerQA.view().camera;g.cores=[];g.pendingCores=[];for(const [i,kind] of ['metal','dust','power','load'].entries()){g.addCore({x:cam.x+(innerWidth*(.2+i*.2))/cam.scale,y:cam.y+innerHeight*.38/cam.scale,tier:0,kind,vx:40,vy:0});g.pulse(g.cores.at(-1),{vx:700,vy:-100,bounces:0});}g.runPoints=40;g.pickupCount=5;});
   await page.waitForFunction(()=>SignalBreakerQA.view().hazards.ready);
   a.equal(await page.evaluate(()=>SignalBreakerQA.engine().cores.every(c=>c.released)),true,'all four payloads released without bubbles');
   const boost=page.locator('#boostBtn'),bb=await boost.boundingBox();a.ok(bb&&bb.width>=44&&bb.height>=44&&bb.x>=0&&bb.y>=0&&bb.x+bb.width<=width&&bb.y+bb.height<=height,'boost touch target fits');
   await boost.click();a.equal(await page.evaluate(()=>SignalBreakerQA.engine().runPoints),0);a.ok(await page.evaluate(()=>SignalBreakerQA.snapshot().boostRemaining)>0,'ordinary boost button spends points');
   await page.waitForFunction(()=>{const a=document.getElementById('boostBtn').getBoundingClientRect(),b=document.getElementById('toast').getBoundingClientRect();return a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom;});
   await page.waitForTimeout(500);await page.evaluate(()=>SignalBreakerQA.engine().pause());
   a.equal(await page.evaluate(()=>{const c=SignalBreakerQA.view().camera;return SignalBreakerQA.engine().cores.filter(q=>q.released).length===4&&SignalBreakerQA.engine().cores.every(q=>(q.x-q.r*1.675-c.x)*c.scale>=0&&(q.x+q.r*1.675-c.x)*c.scale<=innerWidth&&(q.y-q.r*1.675-c.y)*c.scale>=0&&(q.y+q.r*1.675-c.y)*c.scale<=innerHeight);}),true,'four payload art silhouettes fit actual camera');
   await page.screenshot({path:path.join(out,`released-hazards-${width}.png`)});
   await page.evaluate(()=>{SignalBreakerQA.selectStage('CH-05',true);SignalBreakerQA.controlMode('twin');const g=SignalBreakerQA.engine();g.cores=[];g.pendingCores=[];});
   // State fixtures inspect production equipment at the actual game scale; no completion claim.
   await page.evaluate(()=>{SignalBreakerQA.controlMode('twin');const g=SignalBreakerQA.engine();g.pause();g.player.x=785;g.boss={phase:'sealed',exposure:0,x:785,y:220,nodes:[{x:730,y:150,hit:true},{x:840,y:150,hit:false},{x:785,y:325,hit:false}]};});
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
   await page.waitForFunction(()=>SignalBreakerQA.snapshot().stage==='CH-01'&&SignalBreakerQA.snapshot().state==='won');a.equal(await page.locator('#overlay').isVisible(),true,'stage result waits for explicit choice');await page.waitForTimeout(350);a.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().stage),'CH-01');await page.keyboard.up('KeyD');await page.locator('#overlayPrimary').click();await page.waitForFunction(()=>SignalBreakerQA.snapshot().stage==='CH-02'&&SignalBreakerQA.snapshot().state==='playing');await page.keyboard.down('KeyD');
   const continued=await page.evaluate(()=>SignalBreakerQA.engine().player.x);await page.waitForTimeout(180);a.ok(await page.evaluate(x=>SignalBreakerQA.engine().player.x>x,continued),'held movement survives chapter handoff');await page.keyboard.up('KeyD');
   await page.screenshot({path:path.join(out,`continuous-story-${width}.png`)});
   a.deepEqual(errors,[]);results.push({width,height,status:'PASS',checks:'five authored operation previews, optional resume, typed pickup collection and watch support, continuous wave, auto tuning, radio, direct checkpoint resume, player-confirmed stage choice, five stage bosses, automatic fire under movement and aim override, firing-direction body pose, released four-kind payload art, point boost via touch button, v2 materials, dedicated sealed/exposed equipment and relay states, movement, projectile, source recurrence, observation, control, verification, checkpoint recovery, blocked guide and waiting state, manual fire, movement clears lane'});
   console.log(`PASS ${width}x${height}: causal flow and recovery`);await context.close();
  }
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
