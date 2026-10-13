import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/terrain');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});const reports=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5203',{waitUntil:'networkidle'});await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.evaluate(async()=>{const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(dt,input){window.terrainEngine=this;return update.call(this,window.terrainHold?0:dt,input);};});
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();await page.waitForFunction(()=>window.terrainEngine?.state.gameTime>.2);
  const fixture=await page.evaluate(()=>{
   const e=window.terrainEngine,s=e.state;window.terrainHold=true;s.interactiveHazards=[];s.hazards=[];s.projectiles=[];s.player.invincibleTime=99;
   const o=s.terrain.find(o=>o.kind==='pillar');if(!o)throw Error('No pillar');
   s.player.x=o.x-60;s.player.y=o.y+o.height/2;s.player.dashDuration=.25;s.player.dashVx=900;s.player.dashVy=0;
   for(let i=0;i<15;i++)e.update(0,{moveX:0,moveY:0});
   // Explicit simulation method advances the real fixed-step engine despite display hold.
   e.movePlayer(.25,{moveX:1,moveY:0});const blocked=s.player.x<o.x-13;
   s.player.x=o.x+o.width+90;s.player.y=o.y+o.height/2;
   const h={id:'fixture_cart',type:'RUNAWAY_CART',x:o.x-40,y:s.player.y,hp:999,maxHp:999,speed:180,radius:18,damage:10,expValue:1,motion:{phase:'charge',timer:1,directionX:1,directionY:0}};
   s.hazards=[h];e.updateHazards(.15);const cartStopped=h.motion.phase==='cooldown'&&h.weakPointExposed;
   const rubble=s.terrain.find(o=>o.kind==='rubble');if(!rubble)throw Error('No rubble');s.player.x=rubble.x-25;s.player.y=rubble.y+rubble.height/2;
   return {blocked,cartStopped,terrain:s.terrain.length};
  });
  await page.waitForTimeout(200);await page.screenshot({path:path.join(out,`${width}-terrain.png`)});
  await page.getByRole('button',{name:'잔재물 정리',exact:true}).click();
  const half=await page.evaluate(()=>window.terrainEngine.state.terrain.find(o=>o.kind==='rubble').hp);
  await page.evaluate(()=>{window.terrainHold=false;});await page.waitForTimeout(750);await page.evaluate(()=>{window.terrainHold=true;});
  await page.getByRole('button',{name:'잔재물 정리',exact:true}).click();
  const cleared=await page.evaluate(()=>window.terrainEngine.state.terrainRecord.rubbleCleared===1);
  const art=await page.evaluate(async()=>{const i=new Image();i.src='/assets/survivors/terrain-workface-v1.png';await i.decode();return i.naturalWidth>0;});
  if(!fixture.blocked||!fixture.cartStopped||half!==40||!cleared||!art||errors.length)throw Error(JSON.stringify({fixture,half,cleared,art,errors}));
  reports.push({width,height,...fixture,cleared,art,errors});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
}finally{await browser.close();}
