import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/equipment-mantle');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),results=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(dt,input){window.qaEngine=this;if(!window.qaFreeze)return update.call(this,dt,input);};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.gameTime>.5);
  await page.evaluate(()=>{window.qaFreeze=true;const s=window.qaEngine.state;s.gameTime=10;s.hazards=[];s.projectiles=[];s.player.x=700;s.player.y=450;});
  for(const mode of ['base','premium','evolved']){
   await page.evaluate(async mode=>{
    const e=window.qaEngine,s=e.state;
    const {applyPremiumLoadout}=await import('/src/engine/survivors-premium-gear.ts');
    const ids=mode==='base'?[]:['broadcast_crown','sync_gauntlet','extraction_pack','shock_mantle','inspection_wing','barrier_forge'];
    e.setPaused(true);applyPremiumLoadout(s,{owned:ids,equipped:ids});e.setPaused(false);
    if(mode==='evolved')Object.assign(s.activePerks,{satellite_broadcast:1,cryo_blizzard:1,tesla_dome:1,emf_barricade:1,hunter_swarm:1});
   },mode);
   await page.waitForTimeout(300);await page.screenshot({path:path.join(out,`${width}x${height}-${mode}.png`)});
   const pixels=await page.evaluate(()=>{const c=document.querySelector('canvas'),a=c.getContext('2d').getImageData(c.width/2-60,c.height/2-90,120,120).data;let sum=0;for(let i=0;i<a.length;i++)if(i%4!==3)sum+=a[i];return sum;});
   results.push({width,height,mode,pixels,errors:[...errors]});
  }
  await page.close();
 }
 const pass=results.every(r=>r.pixels>0&&!r.errors.length)&&results.filter(r=>r.mode==='premium').every(r=>r.pixels!==results.find(b=>b.width===r.width&&b.mode==='base').pixels);
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({scope:'CONTROLLED_VISUAL_LOADOUT_FIXTURES_NOT_EARNED_PLAYTHROUGHS',pass,results},null,2));console.log(JSON.stringify({pass,results}));if(!pass)process.exitCode=1;
}finally{await browser.close();}
