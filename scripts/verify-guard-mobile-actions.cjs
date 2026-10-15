const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve('docs/qa/guard-mobile-layout-20261016');fs.mkdirSync(out,{recursive:true});
const url=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/';
async function fixture(page,index,support,transition=false){
 await page.goto(url,{waitUntil:'networkidle'});
 await page.evaluate(async({index,support,transition})=>{
  const engine=await import('/src/engine/defense.ts'),campaign=await import('/src/content/guard-campaign.ts'),save=await import('/src/app/defense-save.ts'),version=await import('/src/app/guard-save-version.ts');
  const c=campaign.guardContents[index];let run=engine.createDefenseRun(c,support,'mobile-action-'+support,{ultimateUnlocked:true});
  run=engine.applyDefenseCommand(run,c,{type:'Build',towerId:'PULSE',padId:'P1'});
  run=engine.applyDefenseCommand(run,c,{type:'StartWave'});
  run={...run,paused:true,supportCooldownRemaining:0,...(transition?{status:'INTERMISSION',waveId:5,completedWaves:4,enemies:[],pendingAttacks:[]}: {})};
  const records=campaign.guardContents.map((c,i)=>({scenarioId:c.scenario.id,finishedRuns:1,clears:1,bestStars:3,bestScore:8000,bestShield:20,bestCompletedWaves:c.waves.length,lastResultRunId:'qa-'+i,updatedAt:'2026-10-16T00:00:00.000Z'}));
  localStorage.setItem('psi-zero-day.guard.save.v2',save.encodeDefenseSave({...save.emptyDefenseSaveDocument(),records,activeRun:run},version.guardPersistenceContent,1));
  localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');
 },{index,support,transition});
 await page.reload({waitUntil:'networkidle'});await page.locator('.is-defense-entry').click();
 await page.getByRole('button',{name:'중단한 작전 이어하기',exact:true}).click();
 await page.locator('[data-defense-screen="combat"]').waitFor();
}
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),results=[];
 try{for(const [name,width,height] of [['portrait',390,844],['small-landscape',568,320]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await fixture(page,5,'COORDINATOR',true);
  const shell=page.locator('[data-defense-screen="combat"]');
  assert(await page.locator('.zb-start-wave').isDisabled());
  await page.locator('.guard-mobile-intel-toggle').click();
  await page.locator('.guard-mobile-info-panel [data-guard-transition]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v2')).payload.activeRun.mapPhase==='SHIFTED');
  await page.screenshot({path:path.join(out,name+'-corridor-switch.png')});
  await page.locator('.guard-mobile-info-panel header button').click();
  assert(await page.locator('.zb-start-wave').isEnabled());
  await fixture(page,4,'COMMANDER');
  const initial=await shell.getAttribute('data-resource');
  await page.locator('.guard-mobile-resume').click();
  await page.locator('.guard-spatial-pick').click();
  const controls=page.locator('.zb-command .guard-spatial-controls');
  await controls.locator('select').selectOption('P2');await controls.locator('[data-guard-relocate]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v2')).payload.activeRun.towers[0].padId==='P2');
  assert.equal(await shell.getAttribute('data-resource'),initial);
  await page.screenshot({path:path.join(out,name+'-commander.png')});
  await fixture(page,4,'SIGNALER');
  await page.locator('.guard-mobile-resume').click();await page.locator('.guard-spatial-pick').click();
  await page.locator('.zb-command [data-guard-guidance]').click();
  await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v2')).payload.activeRun.guidance);
  assert.equal(await shell.getAttribute('data-battle-paused'),'false');
  await page.locator('.zb-hud-button').click();
  const before=await shell.getAttribute('data-resource'),tick=await shell.getAttribute('data-tick');
  await page.reload({waitUntil:'networkidle'});await page.locator('.is-defense-entry').click();
  await page.getByRole('button',{name:'중단한 작전 이어하기',exact:true}).click();
  assert.equal(await shell.getAttribute('data-resource'),before);assert.equal(await shell.getAttribute('data-tick'),tick);
  assert.deepEqual(errors,[]);
  results.push({name,transition:true,commander:true,signaler:true,reloadPreserved:true,errors});
  fs.writeFileSync(path.join(out,'special-actions.json'),JSON.stringify(results,null,2));console.log(name,'special actions PASS');
  await context.close();
 }}catch(e){console.error(e);throw e;}finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,3000))]);}
})().then(()=>process.exit(0)).catch(()=>process.exit(1));
