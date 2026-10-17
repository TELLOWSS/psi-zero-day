const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const profiles=JSON.parse(fs.readFileSync('content/defense/site-profiles-v1.json','utf8')).profiles,operations=JSON.parse(fs.readFileSync('content/localization/site-operations-ko.json','utf8')).operations;
const base=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4178',out=process.env.PSI_QA_OUTPUT||'artifacts/new-psi-catalog/local';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),rows=[];
try{for(const[width,height]of[[390,844],[844,390],[1440,900]]){
 const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('.commercial-title-action.is-sub-entry').click();await page.locator('.site-profile-screen').waitFor();
 const buttons=page.locator('.site-profile-group button');assert.equal(await buttons.count(),profiles.length);
 const checks=[];
 for(let i=0;i<profiles.length;i++){
  await buttons.nth(i).click();const visual=page.locator('.site-operation-visual'),expected=operations[profiles[i].id];assert.equal(await visual.getAttribute('data-patrol-stage'),expected.stage);await visual.locator('img').evaluate(e=>e.decode());
  assert((await visual.innerText()).includes(expected.name));assert.equal(await visual.locator('button').isDisabled(),expected.stage!=='stage_01');
  assert.equal(await page.locator('.site-profile-screen').innerText().then(t=>t.includes('대표 맵 제작 대기')),false);
  const overflow=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1;}).slice(0,12).map(e=>({class:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),JSON.stringify(overflow));checks.push({profile:profiles[i].id,stage:expected.stage,locked:expected.stage!=='stage_01'});
 }
 await buttons.nth(0).click();await page.locator('.site-operation-visual').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${width}-catalog.png`)});
 await page.locator('.site-operation-visual>button').click();await page.locator('.survivors-ready-launch').waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('psi.survivors.last_played_stage')),'stage_01');assert.equal(await page.evaluate(()=>localStorage.getItem('psi.survivors.requested_site_stage')),null);
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('.commercial-title-action.is-sub-entry').click();await page.locator('.site-process-preview-head>button').click();await page.locator('[data-defense-screen="support-select"]').waitFor();assert.equal(await page.locator('[data-defense-screen]').getAttribute('data-scenario'),'training-site:apt-new-bottom-up-excavation');
 assert.deepEqual(errors,[]);rows.push({width,height,checks,watchEntry:true,defenseEntry:true,errors,pass:true});console.log(width,'PASS');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));await context.close();
}}finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,3000))]);}})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
