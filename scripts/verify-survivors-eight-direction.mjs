import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/eight-direction-runtime');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try {
 const rows=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  const report=await page.evaluate(async()=>{
   const {loadDirectionalActor,drawDirectionalBody,directionalSocket}=await import('/src/ui/survivors-directional-art.ts');
   const {loadWearableImages,drawWearableLayer}=await import('/src/ui/survivors-wearable-art.ts');
   const actor=new Image();actor.src='/assets/episode01/characters/player-map.webp';await actor.decode();
   const loaded=await loadDirectionalActor(actor),wearables=await loadWearableImages('player');
   const c=document.createElement('canvas');c.width=160;c.height=180;const ctx=c.getContext('2d',{willReadFrequently:true});
   const sheet=document.createElement('canvas');sheet.width=1280;sheet.height=1440;const s=sheet.getContext('2d');s.fillStyle='#24362e';s.fillRect(0,0,sheet.width,sheet.height);
   const frames=[];
   const state={characterId:'player',premiumGear:{equipped:['voice_lens','shock_mantle','inspection_wing'],shield:10,feedback:0}};
   for(let direction=0;direction<8;direction++)for(let frame=0;frame<8;frame++){
    const pose={moving:true,cycle:(frame+.5)/8*Math.PI*2,facing:direction>=3&&direction<=5?-1:1,direction,directional:true,lean:0,scaleY:1,reaction:0,action:0};
    ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.translate(80,170);drawDirectionalBody(ctx,actor,154,pose);ctx.restore();
    const data=ctx.getImageData(0,0,160,180).data;let hash=2166136261,top=180,bottom=-1,count=0;
    for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3&&data[i]>32){const y=Math.floor(i/4/160);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}}
    frames.push({direction,frame,hash:hash>>>0,top,bottom,count});
    ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.translate(80,170);drawWearableLayer(ctx,state,actor,154,pose,wearables,'back');drawDirectionalBody(ctx,actor,154,pose);drawWearableLayer(ctx,state,actor,154,pose,wearables,'front');ctx.restore();
    s.drawImage(c,frame*160,direction*180);
   }
   const pose={moving:false,cycle:0,facing:-1,direction:6,directional:true,lean:0,scaleY:1,reaction:0,action:0};
   const back=directionalSocket(actor,pose,154,'back');
   let socketJump=0;
   for(let direction=0;direction<8;direction++)for(let frame=1;frame<=8;frame++){
    const a=directionalSocket(actor,{...pose,moving:true,direction,cycle:(frame-.0001)/8*Math.PI*2},154,'chest');
    const b=directionalSocket(actor,{...pose,moving:true,direction,cycle:(frame+.0001)/8*Math.PI*2},154,'chest');
    socketJump=Math.max(socketJump,Math.hypot(a.x-b.x,a.y-b.y));
   }
   const allocation=document.createElement;let allocations=0;document.createElement=function(...args){allocations++;return allocation.apply(this,args);};
   try{for(let i=0;i<100;i++)drawDirectionalBody(ctx,actor,74,{...pose,moving:true,cycle:i*.1});}finally{document.createElement=allocation;}
   return {loaded,frames,allocations,back,socketJump,contactSheet:sheet.toDataURL(),pass:loaded&&allocations===0&&socketJump<.01&&new Set(frames.filter(f=>f.frame===0).map(f=>f.hash)).size===8&&frames.every(f=>f.count>1000&&f.bottom>=168&&f.bottom<=169)&&Array.from({length:8},(_,d)=>new Set(frames.filter(f=>f.direction===d).map(f=>f.hash)).size>=6).every(Boolean)};
  });
  fs.writeFileSync(path.join(out,`${width}x${height}.png`),Buffer.from(report.contactSheet.split(',')[1],'base64'));delete report.contactSheet;
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts'),update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(...args){window.qaEngine=this;return update.apply(this,args);};
   const {SpriteMotionTracker}=await import('/src/ui/survivors-sprite-motion.ts'),sample=SpriteMotionTracker.prototype.sample;
   SpriteMotionTracker.prototype.sample=function(entity,...args){const pose=sample.call(this,entity,...args);if(entity===window.qaEngine?.state.player)window.qaPose=pose;return pose;};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaPose);
  const directions=[];
  for(const keys of [['ArrowRight'],['ArrowRight','ArrowDown'],['ArrowDown'],['ArrowLeft','ArrowDown'],['ArrowLeft'],['ArrowLeft','ArrowUp'],['ArrowUp'],['ArrowRight','ArrowUp']]){
   for(const key of keys)await page.keyboard.down(key);await page.waitForTimeout(100);
   directions.push(await page.evaluate(()=>window.qaPose.direction));for(const key of keys)await page.keyboard.up(key);
  }
  await page.screenshot({path:path.join(out,`${width}x${height}-game.png`)});
  rows.push({width,height,...report,directions,errors,pass:report.pass&&directions.every((d,i)=>d===i)&&!errors.length});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.map(({frames,...row})=>row)));if(rows.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}
