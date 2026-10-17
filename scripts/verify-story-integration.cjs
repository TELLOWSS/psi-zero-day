const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),{chromium}=require('playwright');
const base=process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4178',out=process.env.PSI_QA_OUTPUT||'artifacts/story-integration-local';fs.mkdirSync(out,{recursive:true});
const captured=new Set(['e01_02_meet_kang','e01_04_junho_signal','e01_08b_inspection_find','e01_08e_responsibility_clash','e01_09_evening']);
(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];try{
 for(const[width,height]of[[320,568],[390,844],[568,320],[844,390],[1440,900]]){
  const c=await b.newContext({viewport:{width,height},serviceWorkers:'block',reducedMotion:width===568?'reduce':'no-preference'}),p=await c.newPage(),errors=[],failed=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push({status:r.status(),url:r.url()});});
  await p.addInitScript(()=>{window.__storyMedia=new Set();const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.__storyMedia.add(this);return play.apply(this,args);};});
  await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('.is-story-entry').click();await p.locator('.episode-cold-open-cta').waitFor({timeout:20000});
  if(width===390){await p.waitForTimeout(6500);a.equal(await p.locator('.episode-cold-open-cta').count(),1,'cold open must wait for its reader');}
  await p.locator('.episode-cold-open-cta').click({noWaitAfter:true});await p.locator('.story-reader-open').click();const dialog=p.locator('.story-reader-dialog');await dialog.waitFor();a(await dialog.evaluate(e=>e.open));
  await p.waitForTimeout(180);a(await p.evaluate(()=>[...window.__storyMedia].every(el=>el.paused)),'settings pause all native scene/voice audio');
  const font=dialog.locator('input[type=range]').first();await font.focus();await font.press('End');await dialog.locator('.primary-button').click();await p.waitForFunction(()=>!document.querySelector('.story-reader-dialog')?.open);
  a.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('psi.story.reader.v1')).fontScale),1.35);a(await p.locator('.story-reader-open').evaluate(e=>e===document.activeElement));
  const seen=new Set(),screens=new Set();let resumed=false,completed=false,last='',stagnant=0;
  for(let step=0;step<360;step++){
   const state=await p.evaluate(()=>{const s=document.querySelector('.episode-immersive-scene');return {event:s?.getAttribute('data-event'),node:s?.getAttribute('data-node'),complete:!!document.querySelector('.game-frame.phase-complete'),overflow:document.documentElement.scrollWidth>innerWidth+1};});
   if(state.complete){completed=true;break;}if(state.event)seen.add(state.event);a(!state.overflow,`${width} overflow ${state.event}`);
   const paragraph=p.locator('.dialogue-text').first();if(await paragraph.count()){const box=await paragraph.boundingBox();if(box&&box.width>0)a(box.width>=(height<width?180:Math.min(240,width*.6)),'narrative column too narrow '+state.event+':'+box.width);}
   if(captured.has(state.event)&&!screens.has(state.event)&&(width===390||width===1440)){await p.screenshot({path:path.join(out,`${width}-${state.event}.png`)});screens.add(state.event);}
   if(!resumed&&state.event==='e01_02_meet_kang'&&width===390){
    const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('psi-zero-day.episode01.save.v1')).payload.event_runtime.active_instance.current_node_id);
    await p.locator('.gameplay-home-button').click();await p.locator('.is-story-entry').waitFor();await p.reload({waitUntil:'domcontentloaded'});await p.locator('.is-story-entry').click();await p.locator('.game-frame').waitFor({timeout:20000});
    a.equal(await p.locator('.episode-immersive-scene').getAttribute('data-node'),saved);resumed=true;
   }
   const key=state.event+':'+state.node;stagnant=key===last?stagnant+1:0;last=key;a(stagnant<30,'stalled '+key);
   const action=await p.evaluate(()=>{const selectors=['.story-skip-voice','.episode-cold-open-cta','.strategy-observe-card button:not(:disabled)','.strategy-outcome-card > .strategy-execute-button:not(:disabled)','.strategy-action-confirm .strategy-execute-button:not(:disabled)','.strategy-action-list button:not(:disabled)','.strategy-map-worker.has-actions, .strategy-risk-signal.has-actions, .strategy-zone-target.has-actions, .strategy-rail button.has-actions','.choice-panel button:not(:disabled)','.continue-button:not(:disabled)'];for(const selector of selectors){const el=document.querySelector(selector);if(el instanceof HTMLElement){el.click();return selector;}}return '';});
   await p.waitForTimeout(action?125:200);
  }
  a(completed,`${width} full playthrough incomplete`);a.equal(seen.size,26);a.deepEqual(errors,[]);a.deepEqual(failed,[]);
  await p.screenshot({path:path.join(out,`${width}-complete.png`)});const summary={width,height,events:seen.size,manualColdOpen:width===390,readerSettings:true,pausedAudio:true,resumed,completed,errors,failed};rows.push(summary);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,rows},null,2));console.log(width,'PASS 26-event full UI playthrough');await c.close();
 }
}finally{await Promise.race([b.close(),new Promise(r=>setTimeout(r,3000))]);}})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
