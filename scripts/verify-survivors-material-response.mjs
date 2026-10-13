import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/material-response');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),results=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');const update=SurvivorsEngine.prototype.update;
   window.qaUpdate=update;SurvivorsEngine.prototype.update=function(dt,input){window.qaEngine=this;if(!window.qaFreeze)return update.call(this,dt,input);};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.5);
  for(const type of ['RUNAWAY_CART','GAS_LEAK','FALLING_DEBRIS']){
   await page.evaluate(type=>{
    window.qaFreeze=true;const s=window.qaEngine.state;s.gameTime=10;s.hazards=[];s.projectiles=[];s.interactiveHazards=[];
    s.player.x=700;s.player.y=450;s.player.critRate=0;
    const h={id:'qa-material',type,x:790,y:450,hp:10000,maxHp:10000,speed:0,radius:24,damage:0,expValue:0};
    if(type==='FALLING_DEBRIS')h.motion={phase:'fall',timer:.1,directionX:0,directionY:0};s.hazards=[h];
   },type);
   await page.waitForTimeout(200);await page.screenshot({path:path.join(out,`${width}x${height}-${type}-base.png`)});
   await page.evaluate(()=>{
    const e=window.qaEngine,s=e.state,h=s.hazards[0];e.drainProjectileFeedback();
    const drain=e.drainProjectileFeedback.bind(e);window.qaObserved=[];
    e.drainProjectileFeedback=()=>{const events=drain();window.qaObserved.push(...events);return events;};
    s.projectiles=[{id:'qa-impact',kind:'radio',x:h.x,y:h.y,vx:0,vy:0,radius:10,damage:10,pierce:1,duration:1}];
    window.qaUpdate.call(e,1/60,{moveX:0,moveY:0});
   });
   await page.waitForFunction(()=>window.qaObserved.some(ev=>ev.projectileId==='qa-impact'&&ev.phase==='impact'));
   const confirmed=await page.evaluate(()=>{const event=window.qaObserved.find(ev=>ev.projectileId==='qa-impact'&&ev.phase==='impact');return {hp:window.qaEngine.state.hazards[0].hp,actorKind:event.actorKind,worker:!!event.worker};});
   await page.screenshot({path:path.join(out,`${width}x${height}-${type}-hit.png`)});
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,phase:window.qaEngine.state.phase}));
   results.push({width,height,type,confirmed,layout,errors:[...errors],pass:confirmed.actorKind===type&&!confirmed.worker&&confirmed.hp<10000&&!layout.overflow&&!errors.length});
  }
  await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'CONTROLLED_ACTUAL_PROJECTILE_HITS_NOT_NATURAL_PLAYTHROUGHS',results},null,2));
 console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
