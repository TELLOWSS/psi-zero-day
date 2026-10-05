import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/encounter-aura');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),results=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');const update=SurvivorsEngine.prototype.update;window.qaUpdate=update;
   SurvivorsEngine.prototype.update=function(dt,input){window.qaEngine=this;if(!window.qaFreeze)return update.call(this,dt,input);};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.3);
  await page.evaluate(()=>{window.qaEngine.state.gameTime=61;});
  await page.getByRole('alert').filter({hasText:'대표 위험 출현'}).waitFor();
  const notice=await page.locator('.survivors-encounter-notice').boundingBox();
  if(!notice||notice.width<100||notice.height<30)throw new Error('Encounter notice is visually clipped');
  await page.screenshot({path:path.join(out,`${width}x${height}-arrival.png`)});
  const arrival=await page.evaluate(()=>({phase:window.qaEngine.state.bossEncounter.phase,bossHp:window.qaEngine.state.hazards.find(h=>h.isStageBoss).hp}));
  await page.waitForFunction(()=>window.qaEngine.state.bossEncounter.phase==='combat');
  await page.evaluate(()=>{
   window.qaFreeze=true;const e=window.qaEngine,s=e.state,boss=s.hazards.find(h=>h.isStageBoss);s.hazards=[boss];s.projectiles=[];
   // Controlled resolution fixture; the full engine tests cover earned attack-cycle unlocks.
   boss.hp=0;window.qaUpdate.call(e,1/60,{moveX:0,moveY:0});
  });
  await page.getByRole('status').filter({hasText:'대표 위험 통제 완료'}).waitFor();
  await page.screenshot({path:path.join(out,`${width}x${height}-secured.png`)});
  const secured=await page.evaluate(()=>({phase:window.qaEngine.state.phase,encounter:window.qaEngine.state.bossEncounter.phase,remaining:window.qaEngine.state.bossEncounter.remaining}));
  const aura=await page.evaluate(async()=>{
   const {drawEquipmentIdentity,drawEquipmentMantle,drawEvolutionIdentity}=await import('/src/ui/survivors-equipment-identity.ts');
   const {createInitialSurvivorsState}=await import('/src/engine/patrol-survivors-engine.ts');
   const ids=['broadcast_crown','sync_gauntlet','shock_mantle'],s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});
   s.player.x=120;s.player.y=120;s.activePerks.tesla_dome=1;const atlas=new Image();atlas.src='/assets/survivors/cinematic-vfx-v2.webp';await atlas.decode();
   const c=document.createElement('canvas');c.width=240;c.height=180;const ctx=c.getContext('2d');
   const frame=(time,reduced=false)=>{ctx.clearRect(0,0,240,180);s.gameTime=time;drawEquipmentIdentity(ctx,s,atlas,reduced);drawEvolutionIdentity(ctx,s,atlas,reduced);drawEquipmentMantle(ctx,s,atlas,reduced);return Array.from(ctx.getImageData(0,0,240,180).data);};
   const diff=(a,b)=>a.reduce((sum,v,i)=>sum+(v!==b[i]?1:0),0);
   return {changed:diff(frame(0),frame(.8)),paused:diff(frame(.8),frame(.8)),reduced:diff(frame(0,true),frame(.8,true)),nonblank:frame(0).some(v=>v>0)};
  });
  await page.evaluate(()=>{for(let i=0;i<150;i++)window.qaUpdate.call(window.qaEngine,1/60,{moveX:0,moveY:0});});
  await page.waitForFunction(()=>window.qaEngine.state.phase==='victory');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  results.push({width,height,arrival,secured,aura,overflow,errors,pass:arrival.phase==='arrival'&&arrival.bossHp>0&&secured.phase==='playing'&&secured.encounter==='secured'&&secured.remaining>0&&aura.changed>0&&aura.paused===0&&aura.reduced===0&&aura.nonblank&&!overflow&&!errors.length});
  await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'REAL_SPAWN_AND_CONTROLLED_CLEAR_UI_PLUS_RASTER_AURA_FRAMES',results},null,2));console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
