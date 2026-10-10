const {createRequire}=require('node:module'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const req=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json')):require;
const {chromium}=req('playwright');
(async()=>{
 const out='artifacts/graphics-density';fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.SIGNAL_BREAKER_CHROME||undefined});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5200/');await page.locator('#overlayPrimary').click();await page.waitForFunction(()=>SignalBreakerQA.actor()?.ready);
  const high=await page.locator('#arena').evaluate(c=>({width:c.width,scale:c.dataset.renderScale}));assert.ok(high.width>1100&&high.width<=2200);
  await page.locator('#pauseBtn').click();await page.locator('.preparation-details>summary').click();const time=await page.evaluate(()=>SignalBreakerQA.engine().time);
  await page.getByLabel('그래픽 품질',{exact:true}).selectOption('low');assert.equal(await page.locator('#arena').evaluate(c=>c.width),1100);assert.equal(await page.evaluate(()=>SignalBreakerQA.engine().time),time);
  await page.locator('#actorSelect').selectOption('yoon_sungho');await page.waitForFunction(()=>SignalBreakerQA.actor()?.ready&&SignalBreakerQA.actor()?.characterId==='yoon_sungho');
  assert.equal(await page.locator('.actor-preview').evaluate(c=>c.width),700);
  await page.getByLabel('그래픽 품질',{exact:true}).selectOption('high');await page.locator('#overlayPrimary').click();await page.keyboard.press('Space');
  await page.screenshot({path:path.join(out,'high-density.png')});assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({high,lowWidth:1100,previewWidth:700,errors},null,2));console.log('PASS HiDPI quality bounds, paused preview and firing');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
