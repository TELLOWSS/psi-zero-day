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
   const {SurvivorsSessionAudio}=await import('/src/ui/survivors-session-audio.ts');
   const score=SurvivorsSessionAudio.prototype.auditionScore;window.qaScores=[];
   SurvivorsSessionAudio.prototype.auditionScore=function(asset,seconds){window.qaAudio=this;window.qaScores.push(asset.id);return score.call(this,asset,seconds);};
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');const update=SurvivorsEngine.prototype.update;window.qaUpdate=update;
   SurvivorsEngine.prototype.update=function(dt,input){window.qaEngine=this;if(!window.qaFreeze)return update.call(this,dt,input);};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.3);
  await page.evaluate(()=>{window.qaEngine.state.gameTime=61;});
  await page.getByRole('alert').filter({hasText:'대표 위험 출현'}).waitFor();
  await page.waitForFunction(async()=>{
   const a=window.qaAudio;if(a?.scoreId!=='patrol.heavy_risk')return false;
   const buffer=await a.buffers.get(a.scoreUri);return [...a.scoreNodes.keys()].some(source=>source.buffer===buffer);
  });
  const notice=await page.locator('.survivors-encounter-notice').boundingBox();
  if(await page.locator('.survivors-tactical-actions button:enabled, .survivors-ultimate-btn:enabled, .survivors-live-shop:enabled').count())throw new Error('Encounter arrival controls remain enabled');
  if(!notice||notice.width<100||notice.height<30)throw new Error('Encounter notice is visually clipped');
  await page.screenshot({path:path.join(out,`${width}x${height}-arrival.png`)});
  const arrival=await page.evaluate(()=>({phase:window.qaEngine.state.bossEncounter.phase,bossHp:window.qaEngine.state.hazards.find(h=>h.isStageBoss).hp}));
  await page.waitForFunction(()=>window.qaEngine.state.bossEncounter.phase==='combat');
  const locked=await page.evaluate(()=>{
   window.qaFreeze=true;const e=window.qaEngine,s=e.state,h=s.hazards.find(h=>h.isStageBoss);
   s.hazards=[h];s.interactiveHazards=[];h.hp=h.maxHp*.5;h.bossPhase=1;h.bossAttackCycles=0;h.motion={phase:'cooldown',timer:2,directionX:0,directionY:0};
   e.drainProjectileFeedback();s.projectiles=[{id:'qa-locked',kind:'radio',x:h.x,y:h.y,vx:0,vy:0,radius:10,damage:9999,duration:1,pierce:1}];
   window.qaUpdate.call(e,1/60,{moveX:0,moveY:0});
   return {hp:h.hp,max:h.maxHp,blocked:e.drainProjectileFeedback().some(ev=>ev.projectileId==='qa-locked'&&ev.blocked)};
  });
  await page.waitForFunction(()=>document.querySelectorAll('.survivors-tactical-actions button:enabled').length===2);
  const readout=page.locator(width<=900?'.survivors-focus-status':'.survivors-boss-readout');
  await page.waitForFunction(()=>document.querySelector('.survivors-boss-readout')?.dataset.core==='interlocked');
  if(!(await readout.innerText()).includes('인터록 잠김'))throw new Error('Locked core feedback missing');
  await page.screenshot({path:path.join(out,`${width}x${height}-locked.png`)});
  await page.evaluate(()=>{const h=window.qaEngine.state.hazards.find(h=>h.isStageBoss);h.bossPhase=2;h.bossAttackCycles=1;h.hp=h.maxHp*.08;h.motion.phase='cooldown';});
  await page.waitForFunction(()=>document.querySelector('.survivors-boss-readout')?.dataset.core==='exposed');
  if(!(await readout.innerText()).includes('핵심부 개방'))throw new Error('Open core feedback missing');
  await page.evaluate(()=>{
   window.qaFreeze=true;const e=window.qaEngine,s=e.state,boss=s.hazards.find(h=>h.isStageBoss);s.hazards=[boss];s.projectiles=[];
   // Controlled resolution fixture; the full engine tests cover earned attack-cycle unlocks.
   boss.hp=0;window.qaUpdate.call(e,1/60,{moveX:0,moveY:0});
  });
  await page.getByRole('status').filter({hasText:'대표 위험 통제 완료'}).waitFor();
  await page.waitForFunction(()=>document.querySelector('.survivors-focus-status')?.dataset.core==='secured');
  if(!(await page.locator('.survivors-focus-status').innerText()).includes('대표 위험 통제 완료'))throw new Error('Secured focus feedback missing');
  if(await page.locator('.survivors-combo-banner, .survivors-damage-notice, .survivors-supply-countdown').count())throw new Error('Combat notices remain during clear confirmation');
  if(await page.locator('.survivors-tactical-actions button:enabled, .survivors-ultimate-btn:enabled, .survivors-live-shop:enabled').count())throw new Error('Secured controls remain enabled');
  const chargesBefore=await page.evaluate(()=>JSON.stringify(window.qaEngine.state.fieldTactics));
  await page.keyboard.press('q');await page.keyboard.press('e');
  if(await page.evaluate(()=>JSON.stringify(window.qaEngine.state.fieldTactics))!==chargesBefore)throw new Error('Secured keyboard commands consumed charges');
  const soundtrack=await page.evaluate(async()=>{
   const {SURVIVORS_SCORE_CANDIDATES}=await import('/src/app/survivors-audio-manifest.ts');
   const audio=window.qaAudio,epoch=audio.scoreEpoch;
   const overlay=await audio.auditionCue(SURVIVORS_SCORE_CANDIDATES.find(a=>a.id==='patrol.evolution'),3);
   const bossIndex=window.qaScores.indexOf('patrol.heavy_risk');
   return {overlay,score:audio.scoreId,unchangedEpoch:audio.scoreEpoch===epoch,voices:audio.voiceCount,continuousBoss:bossIndex>=0&&window.qaScores.slice(bossIndex).every(id=>id==='patrol.heavy_risk'),failures:audio.failures};
  });
  if(!soundtrack.overlay||soundtrack.score!=='patrol.heavy_risk'||!soundtrack.unchangedEpoch||!soundtrack.voices||!soundtrack.continuousBoss||soundtrack.failures.length)throw new Error('Encounter soundtrack continuity failed');
  await page.screenshot({path:path.join(out,`${width}x${height}-secured.png`)});
  const secured=await page.evaluate(()=>({phase:window.qaEngine.state.phase,encounter:window.qaEngine.state.bossEncounter.phase,remaining:window.qaEngine.state.bossEncounter.remaining}));
  const aura=await page.evaluate(async()=>{
   const {drawEquipmentIdentity,drawEquipmentMantle,drawEvolutionIdentity}=await import('/src/ui/survivors-equipment-identity.ts');
   const {createInitialSurvivorsState}=await import('/src/engine/patrol-survivors-engine.ts');
   const {SpriteMotionTracker}=await import('/src/ui/survivors-sprite-motion.ts');
   const ids=['broadcast_crown','sync_gauntlet','shock_mantle'],s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});
   s.player.x=120;s.player.y=120;s.activePerks.tesla_dome=1;const atlas=new Image();atlas.src='/assets/survivors/cinematic-vfx-v2.webp';await atlas.decode();
   const c=document.createElement('canvas');c.width=240;c.height=180;const ctx=c.getContext('2d');
   const frame=(time,reduced=false,action=0)=>{ctx.clearRect(0,0,240,180);s.gameTime=time;drawEquipmentIdentity(ctx,s,atlas,reduced);drawEvolutionIdentity(ctx,s,atlas,reduced);drawEquipmentMantle(ctx,s,atlas,reduced,false,undefined,action);return Array.from(ctx.getImageData(0,0,240,180).data);};
   const diff=(a,b)=>a.reduce((sum,v,i)=>sum+(v!==b[i]?1:0),0);
   const base=new SpriteMotionTracker().sample(s.player,120,120,.8);
   const action={...base,cycle:Math.PI/2,gaitBlend:1,lean:.03,action:1,reaction:.5};
   const attached=(pose,reduced=false)=>{ctx.clearRect(0,0,240,180);s.gameTime=.8;drawEquipmentMantle(ctx,s,atlas,reduced,false,undefined,0,{pose,height:74,rigged:true});return Array.from(ctx.getImageData(0,0,240,180).data);};
   return {changed:diff(frame(0),frame(.8)),actionChanged:diff(frame(.8),frame(.8,false,1)),paused:diff(frame(.8),frame(.8)),reduced:diff(frame(0,true),frame(.8,true)),nonblank:frame(0).some(v=>v>0),attachedChanged:diff(attached(base),attached(action)),mirrorChanged:diff(attached(action),attached({...action,facing:-1})),attachedPaused:diff(attached(action),attached(action)),attachedReduced:diff(attached(base,true),attached(action,true))};
  });
  const bossArt=await page.evaluate(async()=>{
   const {BossEncounterDirection}=await import('/src/ui/survivors-boss-direction.ts');
   const {registerPropAtlas}=await import('/src/ui/survivors-equipment-art.ts');
   const {createInitialSurvivorsState}=await import('/src/engine/patrol-survivors-engine.ts');
   const paths={RUNAWAY_CART:'runaway-carrier-boss-v1.webp',CRANE_BOSS:'crane-boss-load-v1.webp',GAS_LEAK:'gas-manifold-boss-v1.webp',FALLING_DEBRIS:'collapse-core-boss-v1.webp'};
   const c=document.createElement('canvas');c.width=240;c.height=200;const ctx=c.getContext('2d'),rows=[];
   for(const [type,file] of Object.entries(paths)){
    const image=new Image();image.src='/assets/survivors/'+file;await image.decode();registerPropAtlas(image,1,1);
    const s=createInitialSurvivorsState(),h={id:'raster',type,x:120,y:160,hp:100,maxHp:100,radius:34,isStageBoss:true,bossEncounterManaged:true};
    s.hazards=[h];s.bossEncounter={bossId:h.id,phase:'combat',remaining:0};const layer=new BossEncounterDirection();layer.observe(s);
    s.hazards=[];s.bossEncounter.phase='secured';layer.observe(s);
    const frame=remaining=>{ctx.clearRect(0,0,240,200);s.bossEncounter.remaining=remaining;layer.draw(ctx,s,undefined,{[type]:image},false,false);return Array.from(ctx.getImageData(0,0,240,200).data);};
    const early=frame(2.4),late=frame(1.7),ended=frame(.1);
    rows.push({type,nonblank:early.some((v,i)=>i%4===3&&v>0),changed:early.reduce((sum,v,i)=>sum+(v!==late[i]?1:0),0),endedBlank:ended.every(v=>v===0)});
   }
   return rows;
  });
  await page.evaluate(()=>{window.qaFreeze=false;});
  await page.waitForFunction(()=>window.qaEngine.state.phase==='victory');
  await page.waitForFunction(async()=>{
   const a=window.qaAudio;if(a?.scoreId!=='patrol.success')return false;
   const buffer=await a.buffers.get(a.scoreUri);return [...a.scoreNodes.keys()].some(source=>source.buffer===buffer);
  });
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  results.push({width,height,arrival,locked,secured,soundtrack,aura,bossArt,overflow,errors,pass:arrival.phase==='arrival'&&arrival.bossHp>0&&locked.blocked&&locked.hp===locked.max*.5&&secured.phase==='playing'&&secured.encounter==='secured'&&secured.remaining>0&&aura.changed>0&&aura.actionChanged>0&&aura.paused===0&&aura.reduced===0&&aura.nonblank&&aura.attachedChanged>0&&aura.mirrorChanged>0&&aura.attachedPaused===0&&aura.attachedReduced===0&&bossArt.every(r=>r.nonblank&&r.changed>0&&r.endedBlank)&&!overflow&&!errors.length});
  await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'REAL_SPAWN_AND_CONTROLLED_CLEAR_UI_PLUS_RASTER_AURA_FRAMES',results},null,2));console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
