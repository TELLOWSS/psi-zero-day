const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve('docs/qa/guard-mobile-layout-20261016');fs.mkdirSync(out,{recursive:true});
const url=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/';
const profiles=[['portrait',390,844],['small-portrait',320,568],['medium-portrait',360,740],['large-portrait',430,932],['landscape',844,390],['small-landscape',568,320],['desktop',1440,900]];
const box=locator=>locator.boundingBox();
function same(a,b){for(const key of ['x','y','width','height'])assert(Math.abs(a[key]-b[key])<2,'Field shifted '+key+': '+a[key]+' to '+b[key]);}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});
 const report=[];
 try{for(const [name,width,height] of profiles){
  if(process.env.PSI_QA_PROFILES&&!process.env.PSI_QA_PROFILES.split(',').includes(name))continue;
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen'));
  await page.goto(url,{waitUntil:'networkidle'});await page.locator('.is-defense-entry').click();
  await page.locator('[data-defense-screen="guard-home"]').waitFor();await page.locator('[data-guard-stage]').first().locator('button').click();
  await page.locator('[data-support="COORDINATOR"]').click();
  const shell=page.locator('[data-defense-screen="combat"]'),mobile=name!=='desktop',board=page.locator('.zb-board-wrap');
  await page.waitForTimeout(200);
  assert.equal(await shell.getAttribute('data-guard-mobile'),mobile?'true':null);
  const ready=await box(board),initialResource=Number(await shell.getAttribute('data-resource'));
  const shot=label=>page.screenshot({path:path.join(out,name+'-'+label+'.png')});
  await shot('ready');
  if(mobile){
   const before=await shell.getAttribute('data-resource');
   await page.locator('.guard-mobile-intel-toggle').click();
   await page.locator('.guard-mobile-info-panel').waitFor();
   assert.equal(await shell.getAttribute('data-resource'),before);same(ready,await box(board));
   await page.locator('.guard-mobile-info-panel header button').click();
   await page.locator('.guard-mobile-recommend').click();
  }else await page.locator('.zb-pad-hit').first().click();
  const selected=await box(board);if(mobile)same(ready,selected);
  if(mobile)for(const control of await page.locator('.guard-mobile-selectionbar button').all()){
   const r=await box(control);assert(r.width>=44&&r.height>=44&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,'Selection action is clipped');
  }
  await shot('build');
  if(mobile){
   assert.equal(await page.locator('.guard-pad-rail button').count(),8);
   if(await page.locator('.guard-pad-rail').isVisible()){
    for(const r of await page.locator('.guard-pad-rail button').evaluateAll(xs=>xs.map(x=>({width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height}))))assert(r.width>=44&&r.height>=44);
   }else{
    assert.equal(await page.locator('.guard-pad-select option').count(),8);const picker=await box(page.locator('.guard-pad-select'));assert(picker.width>=44&&picker.height>=44);
   }
  }
  await page.locator('.zb-tower-shop button').first().click();
  await shot('purchase');
  const next=page.locator('.zb-tech-nodes button[data-level="L2"]'),panel=await box(page.locator('.zb-command'));
  const nextBox=await box(next);
  const upgradeVisible=!mobile||(nextBox.y>=panel.y&&nextBox.y+nextBox.height<=panel.y+panel.height+1);
  if(mobile)assert(upgradeVisible,'Next upgrade is below the fold: '+JSON.stringify({nextBox,panel}));
  await page.locator('.guard-undo-build').click();assert.equal(Number(await shell.getAttribute('data-resource')),initialResource);
  await page.locator('.zb-tower-shop button').first().click();
  if(mobile){
   assert.equal(await page.locator('.zb-tech-nodes button').count(),1);
   await page.locator('.guard-tree-toggle').click();assert.equal(await page.locator('.zb-tech-nodes button').count(),6);
   await page.locator('.guard-tree-toggle').click();
  }
  await next.click();await page.locator('.guard-evolution-confirm').click();
  if(mobile)assert.deepEqual(await page.locator('.zb-tech-nodes button').evaluateAll(xs=>xs.map(x=>x.dataset.level)),['L3A','L3B']);
  await shot('upgraded');
  if(mobile)await page.locator('.guard-mobile-selectionbar button').first().click();
  else await page.locator('.zb-selection-heading button').click();
  await page.locator('.zb-start-wave').click();
  await page.waitForFunction(()=>Number(document.querySelector('[data-defense-screen="combat"]').dataset.tick)>5);
  await shot('combat');
  if(mobile){
   same(ready,await box(board));
   await page.locator('.zb-pad-hit').first().click();
   assert.equal(await shell.getAttribute('data-battle-paused'),'true');
   const tick=await shell.getAttribute('data-tick');same(ready,await box(board));
   await page.locator('.guard-mobile-selectionbar .is-primary').click();
   await page.waitForFunction(t=>Number(document.querySelector('[data-defense-screen="combat"]').dataset.tick)>Number(t),tick);
   assert.equal(await shell.getAttribute('data-selection-mode'),'NONE');
   // Resizing an ongoing battle must retain the same map/HTML hit coordinate transform.
   const viewport=width<height?{width:height,height:width}:{width:height,height:width};
   await page.setViewportSize(viewport);await page.waitForTimeout(150);
   await page.setViewportSize({width,height});await page.waitForTimeout(150);
   await page.locator('.zb-defense-settings').click();
   await page.locator('.guard-menu-operations').waitFor();
   await page.locator('.guard-settings-speed button').nth(1).click();assert.equal(await shell.getAttribute('data-speed'),'2');
   await page.locator('.zb-defense-settings-panel>button').first().click();
  }
  const layout=await page.evaluate(()=>{
   const overflow=document.documentElement.scrollWidth>innerWidth+1;
   const alignment=Math.max(0,...[...document.querySelectorAll('.zb-pad-mark')].map((c,i)=>{const hit=document.querySelectorAll('.zb-pad-hit')[i],r=hit.getBoundingClientRect(),p=new DOMPoint(Number(c.getAttribute('cx')),Number(c.getAttribute('cy'))).matrixTransform(c.getScreenCTM());return Math.hypot(p.x-r.x-r.width/2,p.y-r.y-r.height/2);}));
   const critical=[...document.querySelectorAll('.zb-hud-button,.zb-defense-settings,.zb-start-wave,.zb-support-action button,.zb-estop-action button')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height).map(e=>({label:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
   return {overflow,alignment,critical};
  });
  assert(!layout.overflow);assert(layout.alignment<2);
  if(mobile)for(const target of layout.critical)assert(target.width>=44&&target.height>=44,'Small target '+JSON.stringify(target));
  assert.deepEqual(errors,[]);
  report.push({name,width,height,mobile,ready,selected,upgradeVisible,refund:true,layout,errors});
  fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(report,null,2));console.log(name,'PASS',JSON.stringify({ready,selected}));
  await context.close();
 }}catch(e){console.error(e);throw e;}finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,3000))]);}
})().then(()=>process.exit(0)).catch(()=>process.exit(1));
