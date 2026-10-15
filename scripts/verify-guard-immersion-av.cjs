const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const out='docs/qa/guard-cinematic-20261016';fs.mkdirSync(out,{recursive:true});const seed=JSON.parse(fs.readFileSync('docs/qa/guard-p2-20261015/campaign-browser.json'))[0].saved.guard;
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),rows=[];
try{for(const [family,width,height]of [['PULSE',1440,900],['BURST',1440,900],['CONTROL',1440,900],['SENSOR',1440,900],['PULSE',390,844],['BURST',568,320]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(save=>{localStorage.setItem('psi-zero-day.guard.save.v2',JSON.stringify(save));localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');window.guardAudio=[];window.addEventListener('psi:defense-combat-sound',e=>window.guardAudio.push(e.detail));},seed);
 await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4191/',{waitUntil:'networkidle'});await page.locator('.is-defense-entry').click();await page.locator('[data-guard-stage="guard-gd-04-v1"] button').click();await page.locator('[data-support="COORDINATOR"]').click();
 await page.locator('.zb-pad-hit').first().click();await page.locator('.zb-tower-shop button').filter({has:page.locator('img[src*="'+family.toLowerCase()+'-l1"]')}).click();
 const back=page.getByRole('button',{name:'현장으로 돌아가기',exact:true});if(await back.count())await back.click();
 for(let n=0;n<60;n++){if(await page.evaluate(()=>window.guardAudio.filter(s=>s.phase==='decoded').length===27))break;await new Promise(r=>setTimeout(r,50));}
 if(await page.evaluate(()=>window.guardAudio.filter(s=>s.phase==='decoded').length)!==27)throw Error('Supplied sample decode failed');
 await page.clock.install();await page.clock.pauseAt(Date.now()+100);await page.locator('.zb-start-wave').click();
 let found=false,maxGroups=0;for(let n=0;n<160;n++){await page.clock.runFor(50);const count=await page.locator('[data-combat-shot]').count();maxGroups=Math.max(maxGroups,count);if(await page.locator('[data-combat-family="'+family+'"] [data-combat-damage]').count()){found=true;break;}}
 if(!found)throw Error('No actual '+family+' contact');
 const actual=await page.locator('[data-combat-family="'+family+'"] [data-combat-damage]').first().getAttribute('data-combat-damage');
 await page.screenshot({path:path.join(out,family.toLowerCase()+'-'+width+'-active-contact.png')});
 let atlasSeen=false,maxResolve=0;
 if(family==='PULSE'||family==='BURST'){
  for(let n=0;n<320;n++){await page.clock.runFor(50);const count=await page.locator('[data-cinematic-resolve]').count();maxResolve=Math.max(maxResolve,count);if(count){atlasSeen=true;break;}}
  if(!atlasSeen||maxResolve>4)throw Error('Bounded real-resolution atlas did not play');
  await page.screenshot({path:path.join(out,family.toLowerCase()+'-'+width+'-signal-resolve.png')});
 }
 const atlasWidth=await page.evaluate(async()=>{const image=new Image();image.src='/assets/defense/cinematic-v1/signal-resolve-atlas.webp';await image.decode();return image.naturalWidth;});
 if(atlasWidth!==1280)throw Error('Atlas decode failed');
 const board=await page.locator('.zb-board-wrap').evaluate(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,fraction:r.width*r.height/(innerWidth*innerHeight)};});
 await page.locator('.zb-hud-button').click();if(await page.locator('[data-combat-shot]').count())throw Error('Paused effects remained');
 const audio=await page.evaluate(()=>window.guardAudio),samples=audio.filter(s=>s.phase==='sample');
 if(!samples.some(s=>s.id===family+'_FIRE_AUDIO')||!samples.some(s=>s.id===family+'_IMPACT_AUDIO')||samples.some(s=>s.voices>8)||maxGroups>24||errors.length)throw Error('Actual contact/audio budget failed');
 await page.locator('.zb-defense-settings').click();const mute=page.locator('.zb-defense-settings-panel [data-audio-muted]');await mute.click();if(await mute.getAttribute('data-audio-muted')!=='true')throw Error('Mute failed');
 rows.push({family,width,height,actualDamage:Number(actual),decoded:27,atlasSeen,maxResolve,atlasWidth,samples:samples.length,maxVoices:Math.max(...samples.map(s=>s.voices)),maxGroups,pausedEffectsCleared:true,muted:true,board,errors});console.log(family,width,'AV PASS');await context.close();
}fs.writeFileSync(out+'/combat-av.json',JSON.stringify(rows,null,2));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
