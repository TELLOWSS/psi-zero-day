import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/hero-impact');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5197',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).waitFor();
  const art=await page.evaluate(async()=>{
   const {loadDirectionalActor,drawDirectionalBody,drawDirectionalLight}=await import('/src/ui/survivors-directional-art.ts');
   const actor=new Image();actor.src='/assets/episode01/characters/player-map.webp';await actor.decode();
   const loaded=await loadDirectionalActor(actor),sheet=document.createElement('canvas');sheet.width=1280;sheet.height=540;
   const paint=sheet.getContext('2d');paint.fillStyle='#34443c';paint.fillRect(0,0,1280,540);
   const canvas=document.createElement('canvas');canvas.width=160;canvas.height=180;const ctx=canvas.getContext('2d',{willReadFrequently:true});
   const hashes=[],commandHashes=[],counts=[];let spill=0,tinted=0;
   for(let direction=0;direction<8;direction++)for(let stage=0;stage<3;stage++){
    const pose={moving:false,cycle:0,direction,directional:true,facing:1,gaitBlend:0,lean:0,scaleY:1,reaction:0,action:stage===1?1:0,actionProgress:[0,.25,.8][stage],attackAngle:direction*Math.PI/4};
    ctx.clearRect(0,0,160,180);ctx.save();ctx.translate(80,170);drawDirectionalBody(ctx,actor,154,pose);ctx.restore();
    const before=ctx.getImageData(0,0,160,180).data;let hash=2166136261,count=0;
    for(let i=0;i<before.length;i++){hash=Math.imul(hash^before[i],16777619);if(i%4===3&&before[i]>32)count++;}
    hashes.push(hash>>>0);counts.push(count);if(stage===1)commandHashes.push(hash>>>0);
    ctx.save();ctx.translate(80,170);drawDirectionalLight(ctx,actor,154,pose,'#78e8ff',.2);ctx.restore();
    const after=ctx.getImageData(0,0,160,180).data;
    for(let i=0;i<after.length;i+=4){if(before[i+3]===0&&after[i+3]!==0)spill++;if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])tinted++;}
    paint.drawImage(canvas,direction*160,stage*180);
   }
   return {loaded,counts,distinctCommands:new Set(commandHashes).size,changedCommands:Array.from({length:8},(_,d)=>hashes[d*3]!==hashes[d*3+1]).every(Boolean),spill,tinted,sheet:sheet.toDataURL()};
  });
  fs.writeFileSync(path.join(out,`${width}x${height}-poses.png`),Buffer.from(art.sheet.split(',')[1],'base64'));delete art.sheet;
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),drain=SurvivorsEngine.prototype.drainProjectileFeedback;
   window.qaCombat={launch:0,impact:0};
   SurvivorsEngine.prototype.drainProjectileFeedback=function(...args){const events=drain.apply(this,args);window.qaEngine=this;for(const e of events)if(e.phase in window.qaCombat)window.qaCombat[e.phase]++;return events;};
  });
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.waitForFunction(()=>window.qaEngine?.state.phase==='playing');
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(450);await page.keyboard.up('ArrowRight');
  await page.waitForFunction(()=>window.qaCombat.launch>0&&window.qaCombat.impact>0,undefined,{timeout:25000});
  const combat=await page.evaluate(()=>({counts:window.qaCombat,hp:window.qaEngine.state.player.hp,time:window.qaEngine.state.gameTime,overflow:document.documentElement.scrollWidth>innerWidth}));
  await page.screenshot({path:path.join(out,`${width}x${height}-game.png`)});
  await page.locator('.survivors-pause-command').click();
  await page.waitForFunction(()=>window.qaEngine.state.phase==='paused');
  await page.getByRole('button',{name:'순찰 재개',exact:true}).waitFor();await page.waitForTimeout(500);
  const pixelHash=()=>page.evaluate(()=>{const c=document.querySelector('.survivors-canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261;for(const value of data)hash=Math.imul(hash^value,16777619);return hash>>>0;});
  const paused=await pixelHash();await page.waitForTimeout(200);const held=await pixelHash();
  const pass=art.loaded&&art.distinctCommands===8&&art.changedCommands&&art.counts.every(c=>c>1000)&&art.spill===0&&art.tinted>100&&combat.counts.impact>0&&!combat.overflow&&paused===held&&!errors.length;
  rows.push({width,height,art,combat,paused,held,errors,pass});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
