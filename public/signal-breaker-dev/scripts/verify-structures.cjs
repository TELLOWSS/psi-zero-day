const {createRequire}=require('node:module'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const req=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json')):require;
const {chromium}=req('playwright');
(async()=>{
 const output='artifacts/structure-upgrade';fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.SIGNAL_BREAKER_CHROME||undefined});
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5200/');
  await page.waitForFunction(()=>Array.from(document.images).length>=0&&SignalBreakerQA.engine());
  for(const id of ['CH-01','CH-02','CH-03','CH-04','CH-05','SB-01','SB-02','SB-03','SB-04']){
   await page.evaluate(id=>SignalBreakerQA.selectStage(id),id);await page.locator('#overlayPrimary').click();
   await page.waitForFunction(()=>SignalBreakerQA.actor()?.ready);await page.waitForTimeout(250);
   if(['CH-01','CH-04','CH-05','SB-03'].includes(id))await page.screenshot({path:path.join(output,id+'.png')});
   assert.equal(await page.evaluate(()=>SignalBreakerQA.engine().config.id),id);
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({stages:9,errors},null,2));console.log('PASS nine chapter/legacy structure render paths');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
