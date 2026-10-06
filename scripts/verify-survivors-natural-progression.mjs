import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/natural-progression',process.env.PSI_NATURAL_LABEL??'.');fs.mkdirSync(out,{recursive:true});
const seconds=Number(process.env.PSI_NATURAL_SECONDS??240);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage(),errors=[],failed=[],samples=[],choices=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>failed.push(r.url()));
 await page.route('**/assets/PatrolSurvivorsGame-*.js',async route=>{
  const response=await route.fetch(),body=await response.text(),pattern=/update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
  if([...body.matchAll(pattern)].length!==1)throw new Error('Read-only engine capture unavailable');
  await route.fulfill({response,body:body.replace(pattern,m=>`${m}window.naturalEngine=this;`)});
 });
 await page.goto('http://127.0.0.1:5197');
 const initialStorage=await page.evaluate(()=>({...localStorage}));
 await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
 await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
 await page.waitForFunction(()=>window.naturalEngine?.state.phase==='playing');
 const started=Date.now(),held=new Set(),seen=new Set();
 let lastSample=0,lastUltimate=-10000,terminal=null;
 const release=async()=>{for(const key of held)await page.keyboard.up(key);held.clear();};
 while(Date.now()-started<seconds*1000){
  const snapshot=await page.evaluate(()=>{
   const s=window.naturalEngine.state,p=s.player,b=s.hazards.find(h=>h.isStageBoss);
   let vx=0,vy=0;
   const target=b?.bossGameplay?.combatPhase==='weak_point'||b?.bossGameplay?.combatPhase==='burst'?b:
    s.drops.reduce((best,d)=>!best||Math.hypot(d.x-p.x,d.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?d:best,null);
   if(target){const dx=target.x-p.x,dy=target.y-p.y,n=Math.hypot(dx,dy)||1;vx=dx/n;vy=dy/n;}
   else{vx=Math.cos(s.gameTime*.3);vy=Math.sin(s.gameTime*.3);}
   for(const h of s.hazards){if(h.type==='UNHELMETED')continue;
    if(h.bossGameplay&&h.bossGameplay.combatPhase!=='pattern')continue;
    const dx=p.x-h.x,dy=p.y-h.y,n=Math.hypot(dx,dy)||1;
    if(n<135){const force=(135-n)/35;vx+=dx/n*force;vy+=dy/n*force;}
    if(h.type==='RUNAWAY_CART'&&['warning','charge'].includes(h.motion?.phase)){
     const m=h.motion,along=dx*m.directionX+dy*m.directionY;
     const across=dx*(-m.directionY)+dy*m.directionX;
     if(along>-h.radius&&along<650&&Math.abs(across)<h.radius+60){
      const side=across>=0?1:-1;vx=-m.directionY*side*4;vy=m.directionX*side*4;
     }
    }
   }
   if(p.x<90)vx+=2;if(p.x>1310)vx-=2;if(p.y<90)vy+=2;if(p.y>810)vy-=2;
   return{phase:s.phase,time:s.gameTime,hp:p.hp,level:s.level,credits:s.psiCredits,score:s.score,
    kills:s.hazardsNeutralized,perks:{...s.activePerks},options:s.perkOptions.map(o=>({id:o.id,level:o.level})),
    charge:s.ultimateCharge,stage:s.stageId,support:s.fieldTactics?{charges:s.fieldTactics.supportCharges,cooldown:s.fieldTactics.supportCooldown}:null,
    boss:b?{hp:b.hp,phase:b.bossGameplay?.combatPhase,cycles:b.bossGameplay?.cycleCount}:null,
    encounter:s.bossEncounter?.phase,bossNeutralized:!!s.stageBossNeutralized,
    move:{x:vx,y:vy},overflow:document.documentElement.scrollWidth>innerWidth};
  });
  if(Date.now()-lastSample>1000){samples.push({elapsed:Date.now()-started,...snapshot});lastSample=Date.now();}
  if(['victory','defeat'].includes(snapshot.phase)){terminal=snapshot;break;}
  if(snapshot.phase!=='playing'){await release();
   if(snapshot.phase==='levelup'){
    const preferred=snapshot.options.findIndex(o=>['radio_boost','safety_drone','damage_up','attack_speed'].includes(o.id));
    const index=preferred>=0?preferred:0;
    const cards=page.locator('.survivors-perk-card');await cards.nth(index).click();
    choices.push({time:snapshot.time,...snapshot.options[index]});
   }
  }else{
   const desired=new Set();
   if(Math.abs(snapshot.move.x)>.2)desired.add(snapshot.move.x>0?'ArrowRight':'ArrowLeft');
   if(Math.abs(snapshot.move.y)>.2)desired.add(snapshot.move.y>0?'ArrowDown':'ArrowUp');
   for(const key of [...held])if(!desired.has(key)){await page.keyboard.up(key);held.delete(key);}
   for(const key of desired)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
   if(snapshot.charge>=100&&Date.now()-lastUltimate>2000){await page.keyboard.press('KeyF');lastUltimate=Date.now();}
   if(snapshot.hp<65&&snapshot.support?.charges>0&&snapshot.support.cooldown<=0&&snapshot.encounter!=='arrival')await page.keyboard.press('KeyQ');
  }
  const milestone=snapshot.encounter==='arrival'?'boss-arrival':snapshot.boss?.phase==='burst'?'boss-burst':null;
  if(milestone&&!seen.has(milestone)){seen.add(milestone);await page.screenshot({path:path.join(out,`${milestone}.png`)});}
  await page.waitForTimeout(250);
 }
 await release();await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'outcome.png')});
 const finalStorage=await page.evaluate(()=>({...localStorage}));
 const last=terminal??samples.at(-1);
 const report={scope:'UNMODIFIED_NEW_SAVE_UI_INPUT_BOT_NOT_HUMAN_BALANCE_APPROVAL',seconds,
  outcome:terminal?.phase??'observation-timeout',initialStorage,finalStorage,choices,samples,errors,failed,
  reachedBoss:seen.has('boss-arrival')||samples.some(s=>s.boss),reachedBurst:seen.has('boss-burst'),
  falseTimerVictory:terminal?.phase==='victory'&&!terminal.bossNeutralized,
  technicalPass:!errors.length&&!failed.length&&!samples.some(s=>s.overflow)&&!(terminal?.phase==='victory'&&!terminal.bossNeutralized),last};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({...report,samples:`${samples.length} samples in report.json`}));
 if(!report.technicalPass)process.exitCode=1;
 await context.close();
}finally{await browser.close();}
