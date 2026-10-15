const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(process.env.PSI_QA_OUTPUT||'docs/qa/defense-combat-av-20261015');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});const rows=[];
 try{for(const [family,width,height] of [['PULSE',1440,900],['BURST',1440,900],['CONTROL',1440,900],['SENSOR',1440,900],['PULSE',390,844],['BURST',844,390]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');window.avSounds=[];window.addEventListener('psi:defense-combat-sound',e=>window.avSounds.push(e.detail));});
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/',{waitUntil:'networkidle'});
  await page.locator('.is-defense-entry').click();await page.locator('[data-support="COORDINATOR"]').click();
  await page.locator('.zb-pad-hit').first().click();
  const shop=page.locator('.zb-tower-shop button');const order=['PULSE','BURST','CONTROL','SENSOR'];await shop.nth(order.indexOf(family)).click();
  const close=page.getByRole('button',{name:'현장으로 돌아가기',exact:true});if(await close.count())await close.click();
  // Stop the perpetual CTA breathing animation for a stable real pointer click.
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.clock.install();await page.clock.pauseAt(Date.now()+100);
  await page.locator('.zb-start-wave').click();
  await page.emulateMedia({reducedMotion:'no-preference'});
  for(let load=0;load<100;load++){
   if(await page.evaluate(()=>window.avSounds.filter(s=>s.phase==='decoded').length===3))break;
   await new Promise(resolve=>setTimeout(resolve,50));
  }
  if(await page.evaluate(()=>window.avSounds.filter(s=>s.phase==='decoded').length)!==3)throw Error('Combat sample decode failed');
  let found=false;
  for(let step=0;step<200;step++){
   await page.clock.runFor(50);
   if(await page.locator(`[data-combat-family="${family}"]`).count()){found=true;break;}
  }
  if(!found)throw Error('No real engine shot for '+family);
  const shot=page.locator(`[data-combat-family="${family}"]`).last();
  const hitCount=await shot.locator('[data-combat-impact]').count();
  const damage=await shot.locator('[data-combat-damage]').first().getAttribute('data-combat-damage');
  await page.screenshot({path:path.join(out,`${family.toLowerCase()}-${width}-contact.png`)});
  const scheduledBefore=await page.evaluate(()=>window.avSounds.filter(s=>s.phase==='launch').length);
  // A screenshot can outlast a short contact sample. Seek a fresh attack before testing cancellation.
  for(let step=0;step<120;step++){
   await page.clock.runFor(50);
   if(await page.evaluate(n=>window.avSounds.filter(s=>s.phase==='launch').length>n,scheduledBefore))break;
  }
  await page.locator('.zb-hud-button').click();
  if(await page.locator('[data-combat-shot]').count())throw Error('Effects remain while paused');
  const audio=await page.evaluate(()=>window.avSounds);
  fs.writeFileSync(path.join(out,`${family.toLowerCase()}-${width}-sound.json`),JSON.stringify(audio,null,2));
  if(!audio.some(s=>s.phase==='launch'&&s.family===family)||!audio.some(s=>s.phase==='impact'&&s.family===family)||audio.some(s=>s.voices>8)||!audio.some(s=>s.phase==='stopped'&&s.voices===0))throw Error('Audio launch/contact/stop contract failed');
  await page.locator('.zb-defense-settings').click();
  const sound=page.locator('.zb-defense-settings-panel [data-audio-muted]');
  await sound.click();
  if(await sound.getAttribute('data-audio-muted')!=='true')throw Error('Mute preference failed');
  await sound.click();
  if(await sound.getAttribute('data-audio-muted')!=='false')throw Error('Unmute preference failed');
  await page.locator('.zb-defense-settings-panel').getByRole('button',{name:'현장으로 돌아가기',exact:true}).click();
  await page.emulateMedia({reducedMotion:'reduce'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  const row={family,width,height,hitCount,damage:Number(damage),audio,errors,overflow};rows.push(row);
  fs.writeFileSync(path.join(out,'combat-av-browser.json'),JSON.stringify(rows,null,2));
  if(errors.length||overflow||!hitCount||Number(damage)<=0)throw Error('Presentation validation failed');
  await context.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
