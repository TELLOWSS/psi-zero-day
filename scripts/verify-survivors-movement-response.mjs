import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/movement-response');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const rows=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const mobile=width<1000,context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/src/engine/patrol-survivors-engine.ts*',async route=>{
   const response=await route.fetch(),body=await response.text();
   await route.fulfill({response,body:body.replace('update(dt, input) {','update(dt, input) { window.qaEngine=this;')});
  });
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.evaluate(async()=>{
   window.qaLatency=[];window.qaMoveTime=0;
   for(const event of ['touchmove','keydown'])document.addEventListener(event,()=>window.qaMoveTime=performance.now(),true);
   let previousX;
   const sample=()=>{const x=window.qaEngine?.state.player.x;
    if(previousX!==undefined&&x!==previousX&&window.qaMoveTime){window.qaLatency.push(performance.now()-window.qaMoveTime);window.qaMoveTime=0;}
    previousX=x;requestAnimationFrame(sample);};requestAnimationFrame(sample);
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.gameTime>1);
  const heldTime=await page.evaluate(()=>{window.qaEngine.state.hitStopTimer=1;return window.qaEngine.state.gameTime;});
  const client=await context.newCDPSession(page),x=width*.25,y=height*.55;
  const send=async(type,dx=0)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x:x+dx,y,radiusX:1,radiusY:1,id:1}]});
  if(mobile){await send('touchStart');await page.waitForTimeout(50);await send('touchMove',55);}else await page.keyboard.down('ArrowRight');
  await page.waitForFunction(()=>window.qaLatency.length>=1);await page.waitForTimeout(120);
  if(mobile)await send('touchMove',-55);else{await page.keyboard.up('ArrowRight');await page.keyboard.down('ArrowLeft');}
  await page.waitForFunction(()=>window.qaLatency.length>=2);await page.waitForTimeout(100);
  if(mobile)await send('touchEnd');else await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(50);const stoppedX=await page.evaluate(()=>window.qaEngine.state.player.x);await page.waitForTimeout(100);
  const result=await page.evaluate(({stoppedX,heldTime})=>({latency:window.qaLatency,stopped:window.qaEngine.state.player.x===stoppedX,combatHeld:window.qaEngine.state.gameTime===heldTime,motionAdvanced:window.qaEngine.state.playerMotionTime>heldTime,overflow:document.documentElement.scrollWidth>innerWidth}),{stoppedX,heldTime});
  await page.screenshot({path:path.join(out,`${width}x${height}.png`)});
  rows.push({width,height,mobile,...result,errors,pass:result.stopped&&result.combatHeld&&result.motionAdvanced&&!result.overflow&&result.latency.length===2&&result.latency.every(ms=>ms>=0&&ms<100)&&!errors.length});await context.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}
