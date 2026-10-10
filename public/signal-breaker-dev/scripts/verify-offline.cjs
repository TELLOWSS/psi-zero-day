const {createRequire}=require('node:module'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const req=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json')):require;
const {chromium}=req('playwright');
(async()=>{
 const output=process.env.SIGNAL_BREAKER_QA_OUTPUT||'artifacts/breaker-offline';fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.SIGNAL_BREAKER_CHROME||undefined});
 try {
  const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5200/');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller);
  await page.locator('#overlayPrimary').click();await page.waitForFunction(()=>SignalBreakerQA.actor()?.ready);
  await page.locator('#pauseBtn').click();await page.locator('.preparation-details>summary').click();
  await page.locator('#actorSelect').selectOption('kang_taesik');await page.waitForFunction(()=>SignalBreakerQA.actor()?.ready&&SignalBreakerQA.actor()?.characterId==='kang_taesik');
  // Wait for all completed image requests to have durable cache entries, not a timer.
  await page.waitForFunction(async()=>{
   const cache=await caches.open('psi-signal-breaker-webpreview-v0.6.2');
   const images=performance.getEntriesByType('resource').filter(e=>/\.(webp|png)(?:\?|$)/.test(e.name)).map(e=>e.name);
   return images.length>0&&(await Promise.all(images.map(url=>cache.match(url)))).every(Boolean);
  });
  const cached=await page.evaluate(async()=>{
   const images=performance.getEntriesByType('resource').filter(e=>/\.(webp|png)(?:\?|$)/.test(e.name)).map(e=>e.name);
   return images;
  });
  assert.ok(cached.some(url=>url.includes('kang')));
  await context.setOffline(true);await page.reload();await page.locator('#overlayPrimary').click();
  await page.waitForFunction(()=>SignalBreakerQA.actor()?.ready&&SignalBreakerQA.actor()?.characterId==='kang_taesik');
  await page.keyboard.press('Space');await page.waitForFunction(()=>SignalBreakerQA.snapshot().shotsFired>0);
  assert.equal(await page.locator('#stageList button').count(),5);assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(output,'offline-selected-actor.png')});
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({pass:true,transport:'secure loopback HTTP',actor:'kang_taesik',cachedImages:cached,errors,limitations:'Only online-loaded images verified; audio range streaming and production HTTPS not covered.'},null,2));
  console.log('PASS offline shell, selected character, equipment, chapter and firing');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
