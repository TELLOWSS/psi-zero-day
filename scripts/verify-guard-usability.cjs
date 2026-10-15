const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve('docs/qa/guard-usability-20261016');fs.mkdirSync(out,{recursive:true});
const url=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/';
async function seed(page,clears){
 await page.evaluate(async count=>{
  const save=await import('/src/app/defense-save.ts'),campaign=await import('/src/content/guard-campaign.ts'),version=await import('/src/app/guard-save-version.ts');
  const document=save.emptyDefenseSaveDocument();
  const records=campaign.guardContents.slice(0,count).map((c,i)=>({scenarioId:c.scenario.id,finishedRuns:1,clears:1,bestStars:3,bestScore:8000,bestShield:20,bestCompletedWaves:c.waves.length,lastResultRunId:'qa-clear-'+i,updatedAt:'2026-10-16T00:00:00.000Z'}));
  localStorage.setItem('psi-zero-day.guard.save.v2',save.encodeDefenseSave({...document,records},version.guardPersistenceContent,1));
 },clears);
 await page.reload({waitUntil:'networkidle'});
}
async function assertLayout(page){
 return page.evaluate(()=>{
  const shell=document.querySelector('[data-defense-screen="combat"]'),board=document.querySelector('.zb-board-wrap'),dock=document.querySelector('.zb-command');
  const b=board?.getBoundingClientRect(),d=dock?.getBoundingClientRect();
  const overflow=document.documentElement.scrollWidth>innerWidth+1;
  const alignment=Math.max(0,...[...document.querySelectorAll('.zb-pad-mark')].map((circle,i)=>{
   const button=document.querySelectorAll('.zb-pad-hit')[i];if(!button)return 0;
   const p=new DOMPoint(Number(circle.getAttribute('cx')),Number(circle.getAttribute('cy'))).matrixTransform(circle.getScreenCTM()),r=button.getBoundingClientRect();
   return Math.hypot(p.x-r.x-r.width/2,p.y-r.y-r.height/2);
  }));
  const hudOverflow=[...document.querySelectorAll('.zb-hud .zb-meter')].some(e=>e.scrollWidth>e.clientWidth+1);
  const brief=document.querySelector('.zb-tactics-strip'),recommend=brief?.querySelector('button');
  const briefOverflow=!!recommend&&recommend.getBoundingClientRect().bottom>brief.getBoundingClientRect().bottom+1;
  return {overflow,hudOverflow,briefOverflow,alignment,board:b?{x:b.x,y:b.y,width:b.width,height:b.height}:null,dock:d?{x:d.x,y:d.y,width:d.width,height:d.height}:null,status:shell?.dataset.status};
 });
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.CHROME_BIN?undefined:'msedge',executablePath:process.env.CHROME_BIN,headless:true}),reports=process.env.PSI_QA_PROFILES&&fs.existsSync(path.join(out,'browser.json'))?JSON.parse(fs.readFileSync(path.join(out,'browser.json'),'utf8')).filter(r=>!process.env.PSI_QA_PROFILES.split(',').includes(r.name)):[];
 try{for(const [name,width,height] of [['pc',1440,900],['portrait',390,844],['small-portrait',320,568],['landscape',844,390],['small-landscape',568,320]]){
  if(process.env.PSI_QA_PROFILES&&!process.env.PSI_QA_PROFILES.split(',').includes(name))continue;
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');});
  await page.goto(url,{waitUntil:'networkidle'});await page.locator('.is-defense-entry').waitFor();
  await page.screenshot({path:path.join(out,name+'-hub.png'),fullPage:true});
  const cards=await page.locator('.commercial-title-action.has-mode-art').evaluateAll(xs=>xs.map(e=>({height:e.getBoundingClientRect().height,display:getComputedStyle(e).display,align:getComputedStyle(e.querySelector('.commercial-title-action-copy')).textAlign})));
  await page.locator('.is-defense-entry').click();await page.locator('[data-defense-screen="guard-home"]').waitFor();
  assert.equal(await page.locator('.guard-stage-preview').count(),6);
  assert.equal(await page.locator('.guard-stage-preview .is-secondary').count(),1);
  assert.equal(await page.locator('.guard-stage-preview .is-transition').count(),1);
  await page.screenshot({path:path.join(out,name+'-operations.png'),fullPage:true});
  await page.locator('[data-guard-stage]').first().getByRole('button').first().click();
  await page.locator('[data-defense-screen="support-select"]').waitFor();
  assert.equal(await page.locator('.zb-support-card').count(),6);
  assert.equal(await page.locator('.zb-support-card[aria-disabled="true"]').count(),4);
  // A locked card remains inspectable but cannot launch a run.
  await page.locator('[data-support="ENGINEER"]').dispatchEvent('click');
  assert.equal(await page.locator('[data-defense-screen="combat"]').count(),0);
  await page.locator('.zb-support-card img').evaluateAll(async xs=>Promise.all(xs.map(i=>i.decode())));
  await page.screenshot({path:path.join(out,name+'-crew.png'),fullPage:true});
  await page.locator('[data-support="COORDINATOR"]').click();
  const shell=page.locator('[data-defense-screen="combat"]');
  await shell.waitFor();
  const ready=await assertLayout(page);assert(!ready.overflow);assert(!ready.hudOverflow);assert(ready.alignment<2);assert(ready.board.height>120);
  await page.screenshot({path:path.join(out,name+'-ready.png')});
  await page.locator('.zb-defense-settings').click();
  await page.locator('.guard-settings-speed button').nth(1).click();
  assert.equal(await shell.getAttribute('data-speed'),'2');
  await page.locator('.guard-settings-speed button').first().click();
  await page.locator('.zb-defense-settings-panel>button').nth(1).click();
  const mobile=await shell.getAttribute('data-guard-mobile')==='true';
  await page.locator(mobile?'.guard-mobile-info-panel .zb-tutorial':'.guard-help[open] .zb-tutorial').waitFor({state:'visible'});
  await page.locator('.zb-tutorial button').first().click();
  if(mobile)await page.locator('.guard-mobile-info-panel header button').click();
  else await page.locator('.guard-help summary').click();
  const resource=Number(await shell.getAttribute('data-resource'));
  await page.locator('.zb-pad-hit').first().click();
  await page.locator('.zb-tower-shop button').first().click();
  assert(Number(await shell.getAttribute('data-resource'))<resource);
  await page.screenshot({path:path.join(out,name+'-purchase.png')});
  await page.locator('.guard-undo-build').click();
  assert.equal(Number(await shell.getAttribute('data-resource')),resource);
  assert.equal(await page.locator('.zb-tower').count(),0);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v2')).payload.activeRun.towers.length===0);
  // Buy again, reload, resume and refund the persisted purchase.
  await page.locator('.zb-tower-shop button').first().click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v2')).payload.activeRun.towers.length===1);
  await page.reload({waitUntil:'networkidle'});await page.locator('.is-defense-entry').click();
  await page.screenshot({path:path.join(out,name+'-reload.png')});
  await page.getByRole('button',{name:'중단한 작전 이어하기',exact:true}).click();
  // Resume restores the tactical choice from the save; select its tower to cancel.
  await page.locator('.zb-pad-hit').first().click();await page.locator('.guard-undo-build').click();
  assert.equal(Number(await shell.getAttribute('data-resource')),resource);
  await page.locator('.zb-tower-shop button').first().click();
  await page.locator('.zb-selection-heading>button:last-child').click();
  await page.locator('.zb-start-wave').click();
  await page.waitForFunction(()=>Number(document.querySelector('[data-defense-screen="combat"]').dataset.tick)>5);
  assert.equal(await page.locator('.guard-undo-build').count(),0);
  const combat=await assertLayout(page);assert(!combat.overflow);assert(!combat.hudOverflow);assert(!combat.briefOverflow);assert(combat.alignment<2);assert(combat.board.height>120);
  await page.screenshot({path:path.join(out,name+'-combat.png')});
  // Verify three-clear profiles expose all six cards, with five selectable.
  await seed(page,3);await page.locator('.is-defense-entry').click();
  await page.locator('[data-guard-stage]').nth(3).getByRole('button').first().click();
  assert.equal(await page.locator('.zb-support-card').count(),6);
  assert.equal(await page.locator('.zb-support-card[aria-disabled="true"]').count(),1);
  if(name==='pc'){
   // Inspect all six stage renderers and all fully unlocked crew, without changing real saves.
   const stages=[];
   for(let i=0;i<6;i++){
    await seed(page,6);await page.locator('.is-defense-entry').click();await page.locator('[data-guard-stage]').nth(i).getByRole('button').first().click();
    assert.equal(await page.locator('.zb-support-card[aria-disabled="true"]').count(),0);
    await page.locator('[data-support="COORDINATOR"]').click();
    stages.push({id:await shell.getAttribute('data-map'),route:await shell.getAttribute('data-logical-route'),wave:(await page.locator('.zb-meter').nth(2).innerText()),boardArt:await page.locator('.zb-board-production-art').getAttribute('href')});
   }
   assert.equal(new Set(stages.map(s=>s.route)).size,6);assert.equal(new Set(stages.map(s=>s.boardArt)).size,6);
   fs.writeFileSync(path.join(out,'stage-differences.json'),JSON.stringify(stages,null,2));
  }
  assert.deepEqual(errors,[]);
  reports.push({name,width,height,cards,crew:6,freshSelectable:2,threeClearSelectable:5,undoRefund:resource,reloadUndo:true,replayGuide:true,settingsSpeed:true,ready,combat,errors});
  fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify(reports,null,2));
  console.log(name,'PASS',JSON.stringify({ready:ready.board,combat:combat.board}));
  await context.close();
 }}catch(e){console.error(e);throw e;}finally{await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,3000))]);}
})().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
