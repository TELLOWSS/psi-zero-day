const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(process.env.PSI_QA_OUTPUT||'docs/qa/guard-campaign-20261015');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),reports=[];
 try{for(const [name,width,height] of [['pc',1440,900],['portrait',390,844],['landscape',844,390]]){
  if(process.env.PSI_QA_PROFILES&&!process.env.PSI_QA_PROFILES.split(',').includes(name))continue;
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');window.guardSound=[];window.guardScore=[];window.addEventListener('psi:defense-combat-sound',e=>{if(window.guardSound.length<500)window.guardSound.push(e.detail);});window.addEventListener('psi:guard-score',e=>window.guardScore.push(e.detail));});
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/',{waitUntil:'networkidle'});await page.locator('.is-defense-entry').click();await page.locator('[data-defense-screen="guard-home"]').waitFor();
  await page.screenshot({path:path.join(out,`${name}-operations.png`)});
  if(await page.locator('.guard-stage-grid button:disabled').count()!==2)throw Error('New profile unlock chain invalid');
  const report={name,width,height,stages:[],errors};
  await page.locator('[data-guard-stage="guard-gd-01-v1"] button').click();
  for(let stage=1;stage<=3;stage++){
   await page.locator('[data-defense-screen="support-select"]').waitFor();
   await page.locator('.zb-support-card img').evaluateAll(async images=>{await Promise.all(images.map(image=>image.decode()));});
   const crew=await page.locator('.zb-support-card').evaluateAll(xs=>xs.map(e=>({id:e.dataset.support,text:e.innerText,portrait:e.querySelector('.zb-support-portrait')?.getAttribute('src'),body:e.querySelector('.zb-support-fullbody')?.getAttribute('src')})));
   const support=stage===1?'COORDINATOR':stage===2?'REBAR_LEAD':'ENGINEER';
   if(crew.length!==stage+1)throw Error('Crew unlock count mismatch');
   await page.screenshot({path:path.join(out,`${name}-gd${stage}-crew.png`)});
   await page.locator(`[data-support="${support}"]`).click();await page.locator('.zb-speed button').nth(1).click();
   const style=(process.env.PSI_GUARD_ADVICE_STYLES||'BALANCED,BALANCED,BALANCED').split(',')[stage-1]||'BALANCED';
   await page.locator('.guard-wave-intel summary').click();await page.locator(`[data-planning-style="${style}"]`).click();await page.locator('.guard-wave-intel summary').click();
   if(stage===1){await page.clock.install();await page.clock.pauseAt(Date.now()+100);}
   const row={stage,support,style,crew,purchases:0,seenThreats:[],alignmentError:0,manualHold:false};const seen=new Set();let captured=false;
   for(let step=0;step<600;step++){
    const shell=page.locator('[data-defense-screen="combat"]'),status=await shell.getAttribute('data-status');
    if(status==='WON'||status==='LOST'){row.status=status;row.shield=await shell.getAttribute('data-shield');break;}
    if(status==='READY'||status==='INTERMISSION'){
     if(status==='INTERMISSION'&&!row.manualHold){const before=await shell.getAttribute('data-tick');await page.clock.runFor(11000);if(await shell.getAttribute('data-tick')!==before||await shell.getAttribute('data-status')!=='INTERMISSION')throw Error('Manual preparation auto-advanced');row.manualHold=true;await page.screenshot({path:path.join(out,`${name}-gd${stage}-manual-preparation.png`)});}
     for(let n=0;n<40;n++){
      const advice=page.locator('.zb-tactics-strip button');if(await advice.isDisabled())break;await advice.click();
      const buy=page.locator('.zb-tower-shop button[data-recommended="true"],.zb-tech-nodes button[data-recommended="true"]');if(await buy.count()!==1)throw Error('Missing real recommendation command');await buy.click();const confirm=page.locator('.guard-evolution-confirm');if(await confirm.count()&&await confirm.isEnabled())await confirm.click();row.purchases++;
     }
     const close=page.getByRole('button',{name:'현장으로 돌아가기',exact:true});if(await close.count())await close.click();await page.locator('.zb-start-wave').click();
    }
    const use=page.locator('.zb-support-action button');if(await use.isEnabled())await use.click();
    for(const id of await page.locator('.zb-enemy').evaluateAll(xs=>xs.map(x=>x.getAttribute('data-enemy'))))seen.add(id);
    if(!captured&&Number(await shell.getAttribute('data-wave'))>=3&&await page.locator('.zb-enemy').count()>0){
     row.alignmentError=await page.evaluate(()=>{const circles=[...document.querySelectorAll('.zb-pad-mark')],buttons=[...document.querySelectorAll('.zb-pad-hit')];return Math.max(...circles.map((c,i)=>{const p=new DOMPoint(Number(c.getAttribute('cx')),Number(c.getAttribute('cy'))).matrixTransform(c.getScreenCTM()),r=buttons[i].getBoundingClientRect();return Math.hypot(p.x-r.x-r.width/2,p.y-r.y-r.height/2);}));});
     await page.screenshot({path:path.join(out,`${name}-gd${stage}-combat.png`)});captured=true;
    }
    await page.clock.runFor(1000);
   }
   row.seenThreats=[...seen];row.result=await page.locator('.zb-result').innerText();
   row.actionsVisible=await page.locator('.zb-result-actions button').evaluateAll(buttons=>buttons.every(button=>{const r=button.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));if(!row.actionsVisible)throw Error('Result actions hidden below viewport');
   await page.screenshot({path:path.join(out,`${name}-gd${stage}-result.png`)});await page.locator('.guard-result-review>summary').click();await page.screenshot({path:path.join(out,`${name}-gd${stage}-tactical-report.png`)});await page.locator('.guard-result-review>summary').click();
   await page.clock.runFor(1000);
   row.tactical=await page.evaluate(stage=>JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v1')).payload.records.find(r=>r.scenarioId===`guard-gd-0${stage}-v1`)?.lastTacticalReport,stage);
   if(!row.tactical||row.tactical.stats.waves.length!==stage+5||row.tactical.stats.resolved+row.tactical.stats.waves.reduce((n,w)=>n+w.leaks,0)!==[176,230,339][stage-1])throw Error('Actual report accounting mismatch');
   if(row.status!=='WON'||row.alignmentError>2)throw Error(`${name} stage${stage}: ${row.status}, alignment ${row.alignmentError}`);
   report.stages.push(row);console.log(name,stage,row.status,row.shield,row.purchases);
   if(stage<3)await page.locator('.guard-next').click();
  }
  await page.getByRole('button',{name:'가드 작전실',exact:true}).last().click();await page.locator('[data-defense-screen="guard-home"]').waitFor();
  await page.locator('.guard-last-report>summary').first().click();if(await page.locator('.guard-last-report[open] .guard-tactical-review').count()!==1)throw Error('Saved report did not reopen');
  report.progress=await page.locator('.guard-progress').innerText();report.audio=await page.evaluate(()=>({sounds:window.guardSound,score:window.guardScore}));
  report.saved=await page.evaluate(()=>({guard:JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v1')),legacy:localStorage.getItem('psi-zero-day.defense.save.v1')}));
  report.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);reports.push(report);fs.writeFileSync(path.join(out,'campaign-browser.json'),JSON.stringify(reports,null,2));
  if(errors.length||report.overflow||report.saved.guard.payload.records.filter(r=>r.clears>0).length!==3)throw Error('Campaign persistence/UI validation failed');
  await page.screenshot({path:path.join(out,`${name}-chapter-complete.png`)});await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
