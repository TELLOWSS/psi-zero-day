const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(path.join(process.env.SIGNAL_BREAKER_PLAYWRIGHT_ROOT||'/tmp/boss-browser','node_modules/playwright'));
const sharp=require('../../../node_modules/sharp');
const {spawn}=require('node:child_process');
(async()=>{
 const root=path.resolve(__dirname,'../../..'),out=process.env.SIGNAL_BREAKER_QA_OUTPUT||'/tmp/boss-articulation-qa';
 fs.mkdirSync(out,{recursive:true});
 const port=process.env.BOSS_QA_PORT||'4174',server=spawn('python3',['-m','http.server',port,'--directory','public'],{cwd:root,stdio:'ignore'});
 const url='http://127.0.0.1:'+port+'/signal-breaker-dev/index.html';
 let browser;
 try{
  for(let i=0;i<60;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({executablePath:process.env.CHROME_BIN||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  const results=[];
  for(const [width,height] of [[1920,1080],[844,390],[390,844],[768,1024]]){
   const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await page.locator('#operationLobby').waitFor({state:'visible'});await page.locator('#heroStartBtn').click();
   for(let i=1;i<=5;i++){
    const id='CH-0'+i;
    await page.evaluate(id=>{SignalBreakerQA.selectStage(id,true);const g=SignalBreakerQA.engine();g.boss=g.operationBoss();g.state='paused';g.time=2;},id);
    await page.waitForFunction(id=>SignalBreakerQA.view().bossArt?.ready&&SignalBreakerQA.engine().config.id===id,id);
    await page.waitForTimeout(120);
    const before=await page.evaluate(()=>SignalBreakerQA.view().bossArt.motion.phase);
    const first=await page.locator('#arena').screenshot();
    await page.evaluate(()=>{SignalBreakerQA.engine().time+=.45;});await page.waitForTimeout(80);
    const moved=await page.evaluate(()=>SignalBreakerQA.view().bossArt.motion.phase);
    assert.notEqual(moved,before,'authored joint advances with simulation time');
    const second=await page.locator('#arena').screenshot();
    const a=await sharp(first).raw().toBuffer(),b=await sharp(second).raw().toBuffer();let different=0;
    for(let k=0;k<a.length;k++)if(a[k]!==b[k])different++;
    assert.ok(different>20,'mechanical change appears in real canvas pixels');
    const isolated=await page.evaluate(()=>{
     const art=new SignalBreakerPremiumArt.PremiumArt(),b={...SignalBreakerQA.engine().boss,x:256,y:180,hp:3,maxHp:3,warningUntil:0};
     const canvas=document.createElement('canvas');canvas.width=512;canvas.height=400;const ctx=canvas.getContext('2d');
     art.bossBody(ctx,b,0);const a=ctx.getImageData(0,0,512,400).data;
     ctx.clearRect(0,0,512,400);art.bossBody(ctx,b,.45);const z=ctx.getImageData(0,0,512,400).data;
     let changed=0;for(let i=0;i<a.length;i++)if(a[i]!==z[i])changed++;
     art.setReducedMotion(true);ctx.clearRect(0,0,512,400);art.bossBody(ctx,b,1);const r=ctx.getImageData(0,0,512,400).data;
     ctx.clearRect(0,0,512,400);art.bossBody(ctx,b,2);const s=ctx.getImageData(0,0,512,400).data;
     let reducedChanged=0;for(let i=0;i<r.length;i++)if(r[i]!==s[i])reducedChanged++;
     return {changed,reducedChanged};
    });
    assert.ok(isolated.changed>20,'isolated boss pixels move without ambient or UI animation');
    assert.equal(isolated.reducedChanged,0,'isolated boss pixels freeze with reduced motion');
    await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>SignalBreakerQA.view().bossArt.motion.phase),moved,'actual pause freezes joints');
    await page.evaluate(()=>document.getElementById('motionBtn').click());await page.waitForTimeout(60);
    const reduced=await page.evaluate(()=>SignalBreakerQA.view().bossArt.motion.phase);
    await page.evaluate(()=>{SignalBreakerQA.engine().time+=1;});await page.waitForTimeout(60);
    assert.equal(await page.evaluate(()=>SignalBreakerQA.view().bossArt.motion.phase),reduced,'motion reduction freezes joints');
    await page.evaluate(()=>document.getElementById('motionBtn').click());
    await page.evaluate(()=>{const g=SignalBreakerQA.engine();g.boss.hp=1;g.boss.phase='exposed';});await page.waitForTimeout(60);
    assert.ok(await page.evaluate(()=>SignalBreakerQA.view().bossArt.motion.wear)>0,'live engine damage reaches renderer');
    await page.screenshot({path:path.join(out,id+'-'+width+'.jpg'),type:'jpeg',quality:87});
    results.push({id,width,height,changedChannels:different,isolated,pause:true,reducedMotion:true,damage:true});
   }
   assert.deepEqual(errors,[]);await context.close();
  }
  fs.writeFileSync(path.join(out,'boss-articulation-results.json'),JSON.stringify(results,null,2));
  console.log('PASS',results.length,'boss/viewport combinations: raster motion, pause, reduced motion, damage, console');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
