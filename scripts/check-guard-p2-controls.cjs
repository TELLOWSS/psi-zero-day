const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const out='docs/qa/guard-p2-20261015',seed=JSON.parse(fs.readFileSync(out+'/campaign-browser.json'))[0].saved.guard;
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true}),results=[];
try{for(const [name,width,height]of [['pc',1440,900],['portrait',390,844],['landscape',844,390],['small-portrait',320,568],['small-landscape',568,320]]){
 for(const support of ['COMMANDER','SIGNALER']){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(save=>{localStorage.setItem('psi-zero-day.guard.save.v2',JSON.stringify({...save,payload:{...save.payload,activeRun:null}}));localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');},seed);
  // Seed envelope checksum stays valid because a settled campaign already has activeRun=null.
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4188/',{waitUntil:'networkidle'});
  await page.locator('.is-defense-entry').click();
  await page.locator('[data-guard-stage="guard-gd-0'+(support==='COMMANDER'?4:5)+'-v1"] button').click();
  await page.locator('[data-support="'+support+'"]').click();
  await page.locator('.zb-tactics-strip button').click();await page.locator('.zb-tower-shop button[data-recommended="true"]').click();
  const run=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('psi-zero-day.guard.save.v2')).payload.activeRun);
  await page.waitForTimeout(300);
  const before=await run();
  if(support==='COMMANDER'){
   await page.locator('[data-guard-relocate]').click();await page.waitForTimeout(300);
   const after=await run();if(after.towers[0].padId===before.towers[0].padId||after.resource!==before.resource||after.towers[0].invested!==before.towers[0].invested||after.supportCooldownRemaining!==900)throw Error('Relocation contract failed');
  }else{
   const back=page.getByRole('button',{name:'현장으로 돌아가기',exact:true});if(await back.count())await back.click();
   await page.locator('.zb-start-wave').click();
   await page.locator('.zb-pad-hit').filter({hasText:before.towers[0].padId}).click();
   await page.locator('[data-guard-guidance]').click();await page.waitForTimeout(300);
   const after=await run();if(!after.guidance||after.guidance.padId!==before.towers[0].padId||after.paused||after.supportCooldownRemaining<=0)throw Error('Directional support contract failed');
  }
  await page.screenshot({path:path.join(out,name+'-'+support.toLowerCase()+'.png')});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  const text=await page.locator('main').innerText();if(overflow||errors.length||/defense\\.support\\.|guard\\.support\\./.test(text))throw Error('Layout or localization failure '+name);
  results.push({name,support,overflow,errors});console.log(name,support,'PASS');await context.close();
 }
}fs.writeFileSync(out+'/controls-browser.json',JSON.stringify(results,null,2));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
