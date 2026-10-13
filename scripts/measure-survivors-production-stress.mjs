import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_STRESS_URL??'http://127.0.0.1:5197';
const duration=Number(process.env.PSI_STRESS_SECONDS??60);
const label=process.env.PSI_STRESS_LABEL??'baseline';
const out=path.resolve(`artifacts/production-stress/${label}`);fs.mkdirSync(out,{recursive:true});
const percentile=(a,p)=>a.length?[...a].sort((x,y)=>x-y)[Math.min(a.length-1,Math.floor(a.length*p))]:null;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const reports=[];
 for(const [width,height,throttle] of [[390,844,4],[844,390,1]]){
  if(process.env.PSI_STRESS_CASE&&process.env.PSI_STRESS_CASE!==`${width}x${height}-${throttle}x`)continue;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>failed.push(r.url()));
  await page.route('**/assets/PatrolSurvivorsGame-*.js',async route=>{
   const response=await route.fetch(),body=await response.text();
   const pattern=/update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
   if([...body.matchAll(pattern)].length!==1)throw new Error('Production capture requires exactly one engine update');
   await route.fulfill({response,body:body.replace(pattern,m=>`${m}window.stressEngine=this;`)});
  });
  await page.goto(url);await page.getByRole('button',{name:/야간 긴급 순찰/}).click();await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  await page.waitForFunction(()=>window.stressEngine?.state.gameTime>.2);
  const client=await context.newCDPSession(page);await client.send('Emulation.setCPUThrottlingRate',{rate:throttle});
  const measure=async(name,seconds)=>{
   await client.send('Profiler.enable');await client.send('Profiler.start');
   const raw=await page.evaluate(seconds=>new Promise(resolve=>{
    const start=performance.now(),intervals=[],longTasks=[],phases={},max={hazards:0,projectiles:0},heaps=[];let last=start,lastHeap=start,travel=0,movingFrames=0,previous={x:window.stressEngine.state.player.x,y:window.stressEngine.state.player.y};
    const record=entries=>{for(const e of entries){const s=window.stressEngine.state;longTasks.push({elapsed:e.startTime-start,duration:e.duration,phase:s.phase,bossPhase:s.bossEncounter?.phase??null,hazards:s.hazards.length,projectiles:s.projectiles.length,gameTime:s.gameTime});}};
    const observer=new PerformanceObserver(list=>record(list.getEntries()));observer.observe({type:'longtask',buffered:false});
    const tick=now=>{
     const s=window.stressEngine.state;phases[s.phase]=(phases[s.phase]??0)+1;
     if(s.phase==='playing')intervals.push(now-last);
     last=now;max.hazards=Math.max(max.hazards,s.hazards.length);max.projectiles=Math.max(max.projectiles,s.projectiles.length);
     const distance=Math.hypot(s.player.x-previous.x,s.player.y-previous.y);travel+=distance;if(distance>.015)movingFrames++;previous={x:s.player.x,y:s.player.y};
     if(now-lastHeap>=5000){heaps.push({elapsed:now-start,bytes:performance.memory?.usedJSHeapSize??null});lastHeap=now;}
     if(now-start<seconds*1000){requestAnimationFrame(tick);return;}
     record(observer.takeRecords());observer.disconnect();resolve({intervals,longTasks,phases,max,travel,movingFrames,heaps,elapsed:now-start,gameTime:s.gameTime,overflow:document.documentElement.scrollWidth>innerWidth,heap:performance.memory?.usedJSHeapSize??null});
    };requestAnimationFrame(tick);
   }),seconds);
   const {profile}=await client.send('Profiler.stop');fs.writeFileSync(path.join(out,`${width}x${height}-${throttle}x-${name}.cpuprofile`),JSON.stringify(profile));
   const hits=new Map();for(const id of profile.samples??[])hits.set(id,(hits.get(id)??0)+1);
   const hotspots=profile.nodes.map(n=>({name:n.callFrame.functionName,url:n.callFrame.url,line:n.callFrame.lineNumber+1,samples:hits.get(n.id)??0})).sort((a,b)=>b.samples-a.samples).slice(0,16);
   const {intervals,longTasks,...detail}=raw;
   return {name,...detail,frames:intervals.length,median:percentile(intervals,.5),p95:percentile(intervals,.95),longTasks:longTasks.length,maxLongTask:Math.max(0,...longTasks.map(e=>e.duration)),longTaskEvents:longTasks,hotspots};
  };
  const early=await measure('early-natural',10);
  await page.evaluate(voice=>{
   const s=window.stressEngine.state;
   // Controlled worst-case fixture. This is not an earned build or balance approval.
   s.phase='playing';s.player.hp=s.player.maxHp-20;s.player.invincibleTime=1e6;s.player.regenRate=1.4;s.nextLevelExp=1e9;
   s.premiumGear.equipped=['broadcast_crown','sync_gauntlet','extraction_pack','recovery_cell','rescue_wing','barrier_forge'];
   s.premiumGear.effects.regen=1.4;s.premiumGear.effects.shield=15;s.premiumGear.shield=15;
   for(const id of ['satellite_broadcast','cryo_blizzard','tesla_dome','emf_barricade','hunter_swarm'])s.activePerks[id]=1;
   if(voice){s.premiumGear.equipped[0]='voice_lens';s.activePerks.satellite_broadcast=0;s.activePerks.cryo_blizzard=0;s.activePerks.radio_boost=5;s.activePerks.extinguisher=0;}
   s.stageBossSpawned=true;s.hazards=[];s.interactiveHazards=[];
   for(let i=0;i<48;i++){const a=i*Math.PI*2/48;s.hazards.push({id:`stress-${i}`,type:i%3===0?'GAS_LEAK':i%3===1?'RUNAWAY_CART':'FALLING_DEBRIS',x:s.player.x+Math.cos(a)*180,y:s.player.y+Math.sin(a)*180,hp:1e9,maxHp:1e9,damage:0,radius:20,speed:0,expValue:0});}
  },process.env.PSI_STRESS_VOICE==='1');
  await page.keyboard.down('d');await page.waitForTimeout(1200);await page.keyboard.up('d');
  await page.evaluate(()=>{
   const keys=['w','d','s','a'];let index=0;
   const event=(type,key)=>window.dispatchEvent(new KeyboardEvent(type,{key,code:`Key${key.toUpperCase()}`,bubbles:true}));
   event('keydown',keys[index]);window.stressWalk=setInterval(()=>{event('keyup',keys[index]);index=(index+1)%4;event('keydown',keys[index]);},700);
  });
  const heavy=await measure('six-gear-evolved',duration);
  await page.evaluate(()=>{clearInterval(window.stressWalk);for(const key of ['w','d','s','a'])window.dispatchEvent(new KeyboardEvent('keyup',{key,code:`Key${key.toUpperCase()}`,bubbles:true}));});
  await page.evaluate(()=>{const s=window.stressEngine.state;s.hazards=[];s.stageBossSpawned=false;s.gameTime=61;});
  await page.waitForFunction(()=>window.stressEngine.state.bossEncounter?.phase==='combat');
  const boss=await measure('boss',8);
  await page.evaluate(()=>{window.stressEngine.state.ultimateCharge=100;window.stressEngine.triggerDirectorShout();});
  const ultimate=await measure('ultimate',5);
  await page.evaluate(()=>window.stressEngine.setPaused(true));
  const pausedTime=await page.evaluate(()=>window.stressEngine.state.gameTime);await page.waitForTimeout(600);
  const pauseHeld=await page.evaluate(t=>window.stressEngine.state.gameTime===t,pausedTime);
  await page.setViewportSize({width:height,height:width});await page.waitForTimeout(500);
  await page.evaluate(()=>window.stressEngine.setPaused(false));await page.waitForTimeout(700);
  await page.screenshot({path:path.join(out,`${width}x${height}-${throttle}x-rotated.png`)});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const row={width,height,throttle,dpr:2,kind:'production-build-controlled-stress-not-physical-S26',early,heavy,boss,ultimate,pauseHeld,overflow,errors,failed};
  row.measured=heavy.frames>120&&!errors.length&&!failed.length&&!overflow&&pauseHeld;row.target30fps=row.measured&&heavy.p95<=34;
  reports.push(row);console.log(JSON.stringify(row));await context.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));if(reports.some(r=>!r.measured))process.exitCode=1;
}finally{await browser.close();}
