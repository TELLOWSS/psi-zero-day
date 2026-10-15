const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const evidence=JSON.parse(fs.readFileSync('docs/qa/guard-campaign-20261015/campaign-browser.json','utf8'))[0].saved.guard;
const out=path.resolve(process.env.PSI_QA_OUTPUT||'docs/qa/guard-campaign-20261015');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),results=[];
try{for(const [name,width,height] of [['pc',1440,900],['portrait',390,844],['landscape',844,390],['small-portrait',320,568],['small-landscape',568,320]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:name==='pc'?'no-preference':'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({save})=>{window.guardAudioNodes=[];const NativeAudio=window.Audio;window.Audio=class extends NativeAudio{constructor(...args){super(...args);window.guardAudioNodes.push(this);}};if(!localStorage.getItem('guard-qa-seeded')){localStorage.setItem('psi-zero-day.guard.save.v1',JSON.stringify(save));localStorage.setItem('psi-zero-day.defense.save.v1','legacy-preservation-sentinel');localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');localStorage.setItem('guard-qa-seeded','1');}},{save:evidence});
 await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/',{waitUntil:'networkidle'});await page.locator('.is-defense-entry').click();
 await page.locator('[data-guard-stage="guard-gd-03-v1"] button').click();await page.locator('.zb-support-card img').evaluateAll(async xs=>Promise.all(xs.map(x=>x.decode())));
 const crew=await page.locator('.zb-support-card').evaluateAll(xs=>xs.map(e=>({id:e.dataset.support,images:[...e.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),width:i.naturalWidth,loaded:i.dataset.loaded}))})));
 if(crew.length!==4||crew.some(c=>c.images.some(i=>!i.width)))throw Error(name+' crew image decode failed');
 await page.screenshot({path:path.join(out,`${name}-four-crew.png`)});await page.locator('[data-support="ENGINEER"]').click();
 const advice=page.locator('.zb-tactics-strip button');await advice.click();await page.locator('.zb-tower-shop button[data-recommended="true"]').click();
 const lab=page.locator('.guard-lab');await lab.locator('summary').click();
 const trials=[];for(const fixture of ['NORMAL','SWARM','ARMORED','VEILED','MIXED']){await lab.locator(`[data-lab-fixture="${fixture}"]`).click();trials.push({fixture,results:await lab.locator('[data-lab-comparison]').allTextContents()});}
 await lab.locator('[data-lab-fixture="ARMORED"]').click();
 await lab.locator('.guard-lab-comparison').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${name}-branch-comparison.png`)});
 await page.waitForTimeout(800);
 const readRun=()=>page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v1')).payload));
 const before=await readRun();
 const previews=[];for(const level of ['L3A','L3B']){await lab.getByRole('button',{name:level,exact:true}).click();await lab.getByRole('button',{name:'선택 단계 시연',exact:true}).click();
 if(name==='pc'){await page.waitForTimeout(6300);await lab.getByRole('button',{name:'시연 정지',exact:true}).click();}
 const damage=await lab.locator('output').innerText();previews.push({level,damage,static:await lab.locator('svg[data-lab-level]').getAttribute('data-lab-static')});
 }
 if(before!==await readRun())throw Error('Lab changed real save');
 await page.screenshot({path:path.join(out,`${name}-branch-lab.png`)});await lab.locator('summary').click();
 const close=page.getByRole('button',{name:'현장으로 돌아가기',exact:true});if(await close.count())await close.click();
 await page.locator('.zb-start-wave').click();await page.waitForTimeout(400);await page.locator('.zb-exit').click();await page.locator('[data-defense-screen="guard-home"]').waitFor();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v1')));
 await page.waitForTimeout(100);
 const activeAudio=await page.evaluate(()=>window.guardAudioNodes.filter(audio=>!audio.paused).map(audio=>({src:audio.src,phase:audio.dataset.phase,time:audio.currentTime})));
 const audioPausedOnReturn=!activeAudio.length;if(!audioPausedOnReturn)throw Error('Return left audio playing '+JSON.stringify(activeAudio));
 if(!saved.payload.activeRun.paused)throw Error('Operations return did not pause');
 await page.reload({waitUntil:'networkidle'});await page.locator('.is-defense-entry').click();await page.getByRole('button',{name:'중단한 작전 이어하기',exact:true}).click();
 await page.locator('[data-defense-screen="combat"]').waitFor();
 const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v1')));
 if(after.payload.activeRun.tick!==saved.payload.activeRun.tick||after.payload.activeRun.resource!==saved.payload.activeRun.resource)throw Error('Reload changed checkpoint');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),legacy=await page.evaluate(()=>localStorage.getItem('psi-zero-day.defense.save.v1'));
 if(overflow||legacy!=='legacy-preservation-sentinel'||errors.length)throw Error(name+' layout/save/runtime failure');
 results.push({name,width,height,crew,trials,previews,checkpointTick:saved.payload.activeRun.tick,resource:saved.payload.activeRun.resource,overflow,legacyPreserved:true,audioPausedOnReturn,errors});fs.writeFileSync(path.join(out,'features-browser.json'),JSON.stringify(results,null,2));console.log(name,'PASS');await context.close();
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
