const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const out=process.env.PSI_QA_OUTPUT||'docs/qa/guard-projectile-20261016';fs.mkdirSync(out,{recursive:true});
const seed=JSON.parse(fs.readFileSync('docs/qa/guard-p2-20261015/campaign-browser.json'))[0].saved.guard;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),rows=[];
 try{for(const [family,width,height] of [['PULSE',1440,900],['BURST',1440,900],['CONTROL',1440,900],['SENSOR',1440,900],['PULSE',390,844],['BURST',568,320]]){
  if(process.env.PSI_QA_FAMILY&&family!==process.env.PSI_QA_FAMILY)continue;
  console.log(family,width,'START');
  const reducedMotion=process.env.PSI_QA_MOTION||'no-preference';
  const context=await browser.newContext({viewport:{width,height},reducedMotion}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(save=>{localStorage.setItem('psi-zero-day.guard.save.v2',JSON.stringify(save));localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');},seed);
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/',{waitUntil:'networkidle'});
  await page.locator('.is-defense-entry').click();await page.locator('[data-guard-stage="guard-gd-04-v1"] button').click();await page.locator('[data-support="COORDINATOR"]').click();
  await page.locator('.zb-pad-hit').first().click();await page.locator('.zb-tower-shop button').filter({has:page.locator('img[src*="'+family.toLowerCase()+'-l1"]')}).click();
  if(width<1000)await page.locator('.guard-mobile-selectionbar button').first().click();
  else await page.locator('.zb-selection-heading button').click();
  await page.evaluate(async()=>{const i=new Image();i.src='/assets/defense/projectile-v2/guard-weapon-fx-atlas.png';await i.decode();if(i.naturalWidth!==1254)throw Error('Material atlas decode');});
  await page.clock.install();await page.clock.pauseAt(Date.now()+100);await page.locator('.zb-start-wave').click();
  let found=false;
  for(let n=0;n<360;n++){await page.clock.runFor(50);if(await page.locator('[data-weapon-flight]').evaluateAll(xs=>xs.some(e=>Number(e.parentElement.querySelector('[data-combat-impact]')?.getAttribute('transform')?.match(/translate\(([-.\d]+)/)?.[1])>80))){found=true;break;}}
  assert(found,'No actual projectile '+family);
  const shot=page.locator('[data-combat-family="'+family+'"]:has([data-weapon-flight])').last();
  const contract=await shot.evaluate(e=>({phase:e.dataset.combatPhase,flightMs:Number(e.querySelector('[data-flight-ms]').dataset.flightMs),path:e.querySelector('[data-flight-path]').dataset.flightPath,contacts:e.querySelectorAll('[data-weapon-contact]').length,oldPrimitives:e.querySelectorAll('.zb-shot-core,.zb-shot-projectile,.zb-contact-core').length,flightVisible:getComputedStyle(e.querySelector('[data-weapon-flight]')).display!=='none'}));
  assert.equal(contract.oldPrimitives,0);assert(contract.contacts>0);assert.equal(contract.path.includes('Q'),family==='BURST');
  assert.equal(contract.flightVisible,reducedMotion!=='reduce');
  // Freeze real CSS/SVG presentation halfway through the first engine-generated shot.
  await shot.evaluate(e=>{const root=e.closest('svg'),motion=e.querySelector('animateMotion');root.pauseAnimations();motion.beginElement();root.setCurrentTime(root.getCurrentTime()+Number(e.querySelector('[data-flight-ms]').dataset.flightMs)/2000);for(const a of e.getAnimations({subtree:true})){a.pause();a.currentTime=Number(e.querySelector('[data-flight-ms]').dataset.flightMs)/2;}});
  await page.screenshot({path:path.join(out,family.toLowerCase()+'-'+width+'-flight.png'),timeout:15000});
  await shot.evaluate(e=>{for(const a of e.getAnimations({subtree:true}))a.currentTime=Number(e.querySelector('[data-flight-ms]').dataset.flightMs)+70;});
  await page.screenshot({path:path.join(out,family.toLowerCase()+'-'+width+'-contact.png'),timeout:15000});
  await page.locator('.zb-hud-button').click();assert.equal(await page.locator('[data-combat-shot]').count(),0);
  assert.deepEqual(errors,[]);rows.push({family,width,height,reducedMotion,...contract,pausedEffectsCleared:true,errors});console.log(family,width,'PASS');
  fs.writeFileSync(out+'/browser.json',JSON.stringify(rows,null,2));await context.close();
 }}finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,3000))]);}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
