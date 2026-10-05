import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/boss-phases');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),results=[];
try {
 for(const [width,height] of [[1440,900],[390,844],[844,390]])for(const number of [1,3,22,35]) {
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196');
  await page.evaluate(()=>localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(Array.from({length:50},(_,i)=>`stage_${String(i+1).padStart(2,'0')}`))));
  await page.reload();await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.getByRole('button',{name:'작전 구역',exact:true}).click();
  await page.getByRole('tab').nth(Math.floor((number-1)/10)).click();
  await page.locator('.survivors-stage-card').filter({hasText:`STAGE ${String(number).padStart(2,'0')}`}).click();
  await page.getByRole('button',{name:'작전 준비',exact:true}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(dt,input){window.qaEngine=this;if(!window.qaFreeze)return update.call(this,dt,input);};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.3);
  const transition=await page.evaluate(()=>{
   const e=window.qaEngine,s=e.state;s.gameTime=61;
   for(let i=0;i<120&&!s.stageBossSpawned;i++)e.update(1/60,{moveX:0,moveY:0});
   const h=s.hazards.find(h=>h.isStageBoss);s.hazards=[h];s.projectiles=[];s.player.x=510;s.player.y=450;
   h.x=580;h.y=450;h.hp=h.maxHp*.45;h.motion={phase:'cooldown',timer:2,directionX:1,directionY:0};
   s.bossAlertTimer=0;s.bossName=null;e.drainAudioEvents();e.update(1/60,{moveX:0,moveY:0});window.qaFreeze=true;
   return {type:h.type,phase:h.bossPhase,cues:e.drainAudioEvents().filter(ev=>ev.type==='boss_alarm').length};
  });
  const statuses=[];
  for(const phase of ['warning','spent']) {
   await page.evaluate(async phase=>{
    const {bossPattern}=await import('/src/engine/survivors-boss-pattern.ts');
    const h=window.qaEngine.state.hazards.find(h=>h.isStageBoss);
    h.motion.phase=phase==='spent'&&(h.type==='RUNAWAY_CART'||h.type==='GAS_LEAK')?'cooldown':phase;
    h.motion.timer=phase==='warning'?bossPattern(h).warning:bossPattern(h).recovery;
   },phase);
   await page.waitForFunction(phase=>document.querySelector('.survivors-boss-readout')?.textContent.includes(phase==='warning'?'경고':'통제 기회'),phase);
   statuses.push(await page.locator('.survivors-boss-readout').innerText());
   await page.screenshot({path:path.join(out,`${width}x${height}-${number}-${phase}.png`)});
  }
  const layout=await page.evaluate(()=>{
   const readout=document.querySelector(innerWidth<=900?'.survivors-focus-status':'.survivors-boss-readout'),r=readout?.getBoundingClientRect(),canvas=document.querySelector('canvas');
   return {text:readout?.textContent,bar:readout?.querySelector('progress')?.value,overflow:document.documentElement.scrollWidth>innerWidth,
    inside:!!r&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,
    nonblank:canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4!==3&&v>30)};
  });
  results.push({width,height,number,transition,layout,statuses,errors,pass:transition.phase===2&&transition.cues===1&&statuses.length===2&&layout.inside&&!layout.overflow&&layout.nonblank&&layout.bar>0&&!errors.length});
  await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'CONTROLLED_BOSS_PHASE_AND_RENDER_FIXTURES_NOT_NATURAL_PLAYTHROUGHS',results},null,2));
 console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
