const {createRequire}=require('node:module'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const req=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json')):require;
const {chromium}=req('playwright');
(async()=>{
 const target=process.env.SIGNAL_BREAKER_HUB_URL||'http://127.0.0.1:5201/',out=process.env.SIGNAL_BREAKER_QA_OUTPUT||'artifacts/hub-entry';fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.SIGNAL_BREAKER_CHROME||undefined});
 try{
  for(const [width,height] of [[1366,768],[390,844]]){
   const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(target);await page.locator('.commercial-mode-navigation').waitFor();
   assert.equal(await page.locator('.commercial-mode-navigation').getByRole('link',{name:/시그널 브레이커/}).getAttribute('href'),'/signal-breaker-dev/index.html');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   await page.screenshot({path:path.join(out,'hub-'+width+'.png'),fullPage:true});
   await page.locator('.commercial-mode-navigation').getByRole('link',{name:/시그널 브레이커/}).click();await page.waitForFunction(()=>!!window.SignalBreakerQA);await page.locator('#overlayPrimary').click();await page.waitForFunction(()=>window.SignalBreakerQA?.actor()?.ready);
   const before=await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired);await page.locator('#fireBtn').click();assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired),before+1);
   await page.getByRole('link',{name:'← 메인화면'}).click();await page.locator('.commercial-mode-navigation').waitFor();assert.deepEqual(errors,[]);await page.close();
  }
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({target,viewports:2,entry:true,fire:true,return:true,errors:[]},null,2));console.log('PASS main menu → breaker → fire → main return, desktop/mobile');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
