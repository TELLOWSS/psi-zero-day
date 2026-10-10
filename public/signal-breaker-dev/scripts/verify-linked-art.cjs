/* Reproducible production-asset and linked manual control flow QA. No deployment. */
const {createRequire}=require('node:module'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const runtime=process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT?createRequire(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT,'package.json')):require;
const {chromium}=runtime('playwright');
(async()=>{const output=process.env.SIGNAL_BREAKER_QA_OUTPUT||path.resolve(__dirname,'../../../docs/qa/signal-breaker-linked-art-20261010');fs.mkdirSync(output,{recursive:true});
 const server=spawn(process.execPath,[path.join(__dirname,'../dev-preview.mjs')],{env:{...process.env,SIGNAL_BREAKER_PORT:'5202'}});let browser;
 try{await new Promise((ok,no)=>{server.stdout.once('data',ok);server.once('error',no);});browser=await chromium.launch({executablePath:process.env.SIGNAL_BREAKER_CHROME||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const reports=[];
 for(const [width,height]of [[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage(),errors=[],svg=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());if(/\.svg(?:\?|$)/.test(r.url()))svg.push(r.url());});
  await page.goto('http://127.0.0.1:5202/?entry=prepare');await page.evaluate(()=>document.fonts.ready);assert.equal(await page.locator('#controlBtn').getAttribute('aria-pressed'),'true');
  const manifest=await page.evaluate(async()=>await(await fetch('manifest.webmanifest')).json());assert.ok(manifest.icons.every(i=>i.type==='image/png'));
  const cdp=await context.newCDPSession(page);
  for(const [stage,asset]of [['CH-01','delivery'],['CH-02','conveyor'],['CH-03','extraction'],['CH-04','hoist'],['CH-05','power']]){
   await page.evaluate(id=>SignalBreakerQA.selectStage(id),stage);await page.waitForFunction(name=>window.PSIPresentationAssets.image((innerHeight>innerWidth?'art/world-'+name+'-v4.webp':'art/map-'+name+(name==='delivery'?'-v3.webp':'-v2.webp'))).complete&&window.PSIPresentationAssets.image(innerHeight>innerWidth?'art/world-'+name+'-v4.webp':'art/map-'+name+(name==='delivery'?'-v3.webp':'-v2.webp')).naturalWidth>0,asset);
   await page.locator('#overlayPrimary').click();await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired),0,'no automatic firing');
   if(stage==='CH-01'){
    const joy=await page.locator('#joystick').boundingBox(),x=joy.x+joy.width/2,y=joy.y+joy.height/2,before=await page.evaluate(()=>SignalBreakerQA.engine().player.x);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:3}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-30,y,id:3}]});await page.waitForTimeout(180);
    assert.ok(await page.evaluate(()=>SignalBreakerQA.engine().player.x)<before);const left=await page.evaluate(()=>SignalBreakerQA.engine().launchGeometry().direction);assert.ok(left.x<0);assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired),0);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+30,y,id:3}]});await page.waitForTimeout(180);const right=await page.evaluate(()=>SignalBreakerQA.engine().launchGeometry().direction);assert.ok(right.x>0);assert.ok(Math.abs(right.y-left.y)<1e-8,'left/right change retains elevation');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+30,y:y-28,id:3}]});await page.waitForTimeout(180);assert.ok(Math.abs(await page.evaluate(()=>SignalBreakerQA.engine().launchGeometry().direction.y)-right.y)<1e-8,'vertical movement never changes chosen angle');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});const stopped=await page.evaluate(()=>SignalBreakerQA.engine().player.x);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>SignalBreakerQA.engine().player.x),stopped);assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired),0);
    const fire=await page.locator('#fireBtn').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:fire.x+fire.width/2,y:fire.y+fire.height/2,id:4}]});await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired),0);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired),1);const released=await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired),released,'release stops manual fire');
    await page.locator('#pauseBtn').click();const pausedShot=await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>SignalBreakerQA.snapshot().shotsFired),pausedShot);await page.locator('#overlayPrimary').click();
   }
   if(stage==='CH-03')await page.evaluate(()=>{SignalBreakerQA.engine().time=6;});
   await page.screenshot({path:path.join(output,`${stage}-${width}.jpg`),type:'jpeg',quality:82});
   const metadata=await page.evaluate(name=>{const i=window.PSIPresentationAssets.image((innerHeight>innerWidth?'art/world-'+name+'-v4.webp':'art/map-'+name+(name==='delivery'?'-v3.webp':'-v2.webp')));return {width:i.naturalWidth,height:i.naturalHeight,state:SignalBreakerQA.snapshot().state};},asset);reports.push({viewport:{width,height},stage,asset,metadata});
  }
  await page.waitForFunction(()=>window.PSIPresentationAssets.image('art/industrial-devices-v2.webp').naturalWidth===1536);assert.deepEqual(svg,[],'no active SVG images');assert.deepEqual(errors,[]);await context.close();
 }
 fs.writeFileSync(path.join(output,'stage-assets.json'),JSON.stringify(reports,null,2));console.log('PASS five distinct maps × two mobile orientations; PNG icons; six-device atlas; linked direction/elevation and manual fire; cancel/pause; no active SVG or page errors');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
