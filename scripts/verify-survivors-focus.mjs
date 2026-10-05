import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/combat-focus');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),results=[];
try {
 for(const [width,height] of [[1440,900],[390,844],[360,740],[844,390],[667,375]]){
  const mobile=width<1000;
  const page=await browser.newPage({viewport:{width,height},hasTouch:mobile}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196');
  await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(dt,input){window.qaEngine=this;return update.call(this,dt,input);};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.3);
  if(mobile){
   const cdp=await page.context().newCDPSession(page);
   const x=90,y=height-150;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+55,y}]});
   const before=await page.evaluate(()=>window.qaEngine.state.player.x);
   await page.waitForFunction(before=>window.qaEngine.state.player.x>before+5,before);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await cdp.detach();
  }
  await page.screenshot({path:path.join(out,`${width}x${height}-combat.png`)});
  const layout=await page.evaluate(()=>{
   const hud=document.querySelector('.survivors-hud-top').getBoundingClientRect();
   const buttons=[...document.querySelectorAll('.survivors-pause-command,.survivors-tactical-actions button,.survivors-ultimate-btn')].map(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,inside:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight};});
   const canvas=document.querySelector('canvas');
   return {hudHeight:hud.height,buttons,overflow:document.documentElement.scrollWidth>innerWidth,nonblank:canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4!==3&&v>30)};
  });
  await page.getByRole('button',{name:'일시정지',exact:true}).click();
  await page.getByRole('button',{name:'장비 확인',exact:true}).click();
  const arsenal=await page.locator('.survivors-arsenal-dialog').isVisible();
  await page.getByRole('button',{name:'도감 닫기',exact:true}).click();
  await page.getByRole('button',{name:'PSI 상점 · 구매·수리',exact:true}).click();
  const shop=await page.getByRole('button',{name:'장비실 닫기',exact:true}).isVisible();
  await page.getByRole('button',{name:'장비실 닫기',exact:true}).click();
  await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
  await page.evaluate(()=>{
   const e=window.qaEngine,s=e.state;s.gameTime=60;s.hazards=[];e.update(1/60,{moveX:0,moveY:0});
   const boss=s.hazards.find(h=>h.isStageBoss);boss.hp=boss.maxHp*.75;
  });
  await page.waitForFunction(()=>document.querySelector('.survivors-focus-status progress')?.value>0);
  await page.screenshot({path:path.join(out,`${width}x${height}-boss.png`)});
  // The ending fixture uses the actual dead-boss engine pipeline, not a forced victory phase.
  await page.evaluate(()=>{
   const e=window.qaEngine,s=e.state;const boss=s.hazards.find(h=>h.isStageBoss);boss.hp=0;
   e.update(1/60,{moveX:0,moveY:0});
  });
  await page.waitForFunction(()=>window.qaEngine.state.phase==='victory');
  await page.screenshot({path:path.join(out,`${width}x${height}-victory.png`)});
  const ending=await page.evaluate(()=>({phase:window.qaEngine.state.phase,boss:window.qaEngine.state.stageBossNeutralized}));
  const pass=arsenal&&shop&&ending.boss&&layout.nonblank&&!layout.overflow&&!errors.length&&(!mobile||(layout.hudHeight<=48&&layout.buttons.every(b=>b.inside&&b.width>=44&&b.height>=44)));
  results.push({width,height,layout,arsenal,shop,ending,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'BROWSER_TOUCH_LAYOUT_AND_CONTROLLED_ACTUAL_BOSS_DEATH_NOT_PHYSICAL_DEVICE_QA',results},null,2));
 console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
