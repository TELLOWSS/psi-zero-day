const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
const a=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_BIN});
 try{
  const c=await b.newContext({viewport:{width:844,height:390}}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto((process.env.PSI_QA_BASE_URL||'http://127.0.0.1:4174')+'/signal-breaker-dev/index.html',{waitUntil:'domcontentloaded'});
  await p.waitForSelector('#operationLobby:not([hidden])',{timeout:45000});
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();
  await p.waitForSelector('#operationLobby:not([hidden])');await c.setOffline(true);await p.reload();
  await p.waitForSelector('#operationLobby:not([hidden])',{timeout:45000});
  const ids=['player','kang_taesik','yoon_sungho','lee_jaehoon','lim_junho','safety_monitor'];
  for(const id of ids){
   await p.locator('#lobbyCareers').click();await p.locator('[data-character="'+id+'"]').click();
   await p.locator('#applyRecommendedTalent').click();
   a.equal(await p.evaluate(()=>SignalBreakerTalentTech.manager.characterId),id);
   a.equal(await p.locator('.career-card img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)),true);
   await p.locator('#closeTalentTech').click();await p.locator('#heroStartBtn').click();await p.locator('#overlayPrimary').click();
   await p.waitForFunction(id=>SignalBreakerQA.actor()?.characterId===id&&SignalBreakerQA.actor()?.ready,id);
   await p.locator('#portraitMenuBtn').click();await p.locator('#overlayInner .breaker-lobby-return').click();
   await p.waitForSelector('#operationLobby:not([hidden])');console.log('PASS offline actor '+id);
  }
  a.deepEqual(errors,[]);const result={actors:ids,checks:['offline reload','all six actor portrait and authored animation dependencies','offline character selection','recommendation saved offline','each selected actor ready in actual combat'],errors};
  fs.writeFileSync('artifacts/careers-offline.json',JSON.stringify(result,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
