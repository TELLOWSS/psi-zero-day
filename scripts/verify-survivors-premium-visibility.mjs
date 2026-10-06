import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/premium-visibility');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try {
 const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},hasTouch:width<900,...(width===390?{recordVideo:{dir:out,size:{width,height}}}:{})}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{window.qaMetalStamps=0;window.qaDebrisStamps=0;window.qaVaporStamps=0;const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image?.src?.includes('metal-impact-sequence-v1.png'))window.qaMetalStamps++;if(image?.src?.includes('debris-impact-sequence-v1.png'))window.qaDebrisStamps++;if(image?.src?.includes('vapor-impact-sequence-v1.png'))window.qaVaporStamps++;return draw.call(this,image,...args);};});
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  const result=await page.evaluate(async()=>{
   const {preparePremiumPresence}=await import('/src/ui/survivors-equipment-animation.ts');
   const {drawPremiumPresence}=await import('/src/ui/survivors-premium-presence.ts');
   const {drawEquipmentMantle,EVOLUTION_IDENTITIES}=await import('/src/ui/survivors-equipment-identity.ts');
   const oldMantle=await import('/artifacts/premium-visibility/baseline-survivors-equipment-identity.ts');
   const oldGear=await import('/artifacts/premium-visibility/baseline-survivors-premium-render.ts');
   const {drawPremiumGear}=await import('/src/ui/survivors-premium-render.ts');
   const {SpriteMotionTracker,drawGroundedSprite}=await import('/src/ui/survivors-sprite-motion.ts');
   const {loadDirectionalActor}=await import('/src/ui/survivors-directional-art.ts');
   const {applyActorTorsoTransform}=await import('/src/ui/survivors-rig-renderer.ts');
   const {loadWearableImages,drawWearableLayer}=await import('/src/ui/survivors-wearable-art.ts');
   const {EQUIPMENT_ART,PICKUP_ART}=await import('/src/ui/survivors-equipment-art.ts');
   const {createInitialSurvivorsState,SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const load=async src=>{const image=new Image();image.src=src;await image.decode();return image;};
   const actor=await load('/assets/episode01/characters/player-map.webp');await loadDirectionalActor(actor);
   const atlas=await load('/assets/survivors/cinematic-vfx-v3.png'),equipment=await load(EQUIPMENT_ART),items=await load(PICKUP_ART),floor=await load('/assets/survivors/stage-01-ground-v2.webp');
   const presence=preparePremiumPresence(await load('/assets/survivors/premium-presence-v1.png')),wearables=await loadWearableImages('player');
   const ids=['broadcast_crown','sync_gauntlet','extraction_pack','shock_mantle','inspection_wing','barrier_forge'];
   const s=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});s.player.x=0;s.player.y=0;s.gameTime=1;s.premiumGear.shield=0;
   const pose=new SpriteMotionTracker().sample(s.player,0,0,1),attachment={pose,height:74,rigged:true};
   const render=(mode,count=6,action=0,busy=false,time=1,background='floor')=>{
    s.premiumGear.equipped=ids.slice(0,count);s.gameTime=time;
    const canvas=document.createElement('canvas');canvas.width=210;canvas.height=190;const ctx=canvas.getContext('2d');
    if(background==='floor')ctx.drawImage(floor,0,0,210,190);else{ctx.fillStyle=background;ctx.fillRect(0,0,210,190);}
    ctx.save();ctx.translate(105,144);
    if(mode==='new'){ctx.save();applyActorTorsoTransform(ctx,pose,74,true);drawPremiumPresence(ctx,presence,s.premiumGear.equipped,time,false,busy,action);ctx.restore();}
    drawWearableLayer(ctx,s,actor,74,pose,wearables,'back');drawGroundedSprite(ctx,actor,74,pose);drawWearableLayer(ctx,s,actor,74,pose,wearables,'front');
    const actorPose={actor,height:74,pose,vfxAtlas:mode==='bare'?undefined:atlas};
    if(mode==='new')drawPremiumGear(ctx,s,equipment,false,0,items,wearables,actorPose);
    else oldGear.drawPremiumGear(ctx,s,equipment,mode==='bare',0,items,wearables,actorPose);
    if(mode==='old')oldMantle.drawEquipmentMantle(ctx,s,atlas,false,busy,undefined,action,attachment);
    if(mode==='new')drawEquipmentMantle(ctx,s,atlas,false,busy,undefined,action,attachment);
    ctx.restore();return canvas;
   };
   const diff=(image,reference)=>{
    const a=image.getContext('2d').getImageData(0,0,210,190).data,b=reference.getContext('2d').getImageData(0,0,210,190).data;
    let visible=0,strong=0,total=0;
    for(let i=0;i<a.length;i+=4){const delta=Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]));if(delta>=12)visible++;if(delta>=30)strong++;total+=delta;}
    return {visible,strong,total};
   };
   const gallery=document.createElement('canvas');gallery.width=1050;gallery.height=630;const g=gallery.getContext('2d'),measurements=[];
   const scenarios=[['floor','Actual floor'],['#b1b3ae','Bright concrete'],['#303b39','Dark floor']];
   for(const [row,[background,label]] of scenarios.entries()){
    const bare=render('bare',6,0,false,1,background),old=render('old',6,0,false,1,background),single=render('new',1,0,false,1,background),current=render('new',6,0,false,1,background),peak=render('new',6,1,false,1,background),busy=render('new',6,0,true,1,background);
    const oldPixels=diff(old,bare),newPixels=diff(current,bare),peakPixels=diff(peak,bare),busyPixels=diff(busy,bare);
    measurements.push({background:label,old:oldPixels,current:newPixels,peak:peakPixels,busy:busyPixels,
      pass:newPixels.visible>oldPixels.visible*1.5&&newPixels.strong>oldPixels.strong*1.5&&peakPixels.total>newPixels.total&&busyPixels.total>newPixels.total*.55});
    for(const [column,image] of [render('bare',0,0,false,1,background),single,old,current,peak].entries()){
     g.drawImage(image,column*210,row*210+20);g.fillStyle='#151b1c';g.fillRect(column*210,row*210,210,20);g.fillStyle='#fff';g.font='12px sans-serif';g.fillText(`${label}: ${['Unequipped','New 1 item','Previous 6 items','New 6 items','New action peak'][column]}`,column*210+5,row*210+14);
    }
   }
   for(const id of Object.keys(EVOLUTION_IDENTITIES))s.activePerks[id]=1;
   const evolution=diff(render('new',6),render('old',6));
   const animation=diff(render('new',6,0,false,1.12),render('new',6,0,false,1));
   const update=SurvivorsEngine.prototype.update;SurvivorsEngine.prototype.update=function(...args){
    window.qaEngine=this;
    if(window.qaMetalProbe&&this.state.phase==='playing'){
     const s=this.state;let h=s.hazards.find(h=>h.id==='qa-metal-contact');
     if(!h){h={id:'qa-metal-contact',type:'RUNAWAY_CART',x:s.player.x+70,y:s.player.y,hp:100000,maxHp:100000,speed:0,radius:20,damage:0,expValue:0};s.hazards.push(h);}
     h.x=s.player.x+70;h.y=s.player.y;
     let debris=s.hazards.find(h=>h.id==='qa-debris-contact');
     if(!debris){debris={id:'qa-debris-contact',type:'FALLING_DEBRIS',x:s.player.x+110,y:s.player.y+36,hp:100000,maxHp:100000,speed:0,radius:20,damage:0,expValue:0};s.hazards.push(debris);}
     debris.x=s.player.x+110;debris.y=s.player.y+36;debris.motion=undefined;
     let vapor=s.hazards.find(h=>h.id==='qa-vapor-contact');
     if(!vapor){vapor={id:'qa-vapor-contact',type:'GAS_LEAK',x:s.player.x-70,y:s.player.y+30,hp:100000,maxHp:100000,speed:0,radius:20,damage:0,expValue:0};s.hazards.push(vapor);}
     vapor.x=s.player.x-70;vapor.y=s.player.y+30;
     if(s.gameTime-(window.qaLastMetalHit??-1)>.18){window.qaLastMetalHit=s.gameTime;for(const target of [h,debris,vapor])s.projectiles.push({id:`qa-${target.id}-${s.gameTime}`,kind:'radio',x:target.x,y:target.y,vx:0,vy:0,radius:4,damage:1,duration:1,pierce:1});}
    }
    return update.apply(this,args);
   };
   return {measurements,evolution,animation,gallery:gallery.toDataURL(),pass:measurements.every(m=>m.pass)&&evolution.visible>100&&animation.visible>100};
  });
  fs.writeFileSync(path.join(out,`${width}x${height}-comparison.png`),Buffer.from(result.gallery.split(',')[1],'base64'));delete result.gallery;
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.phase==='playing');
  await page.evaluate(()=>{const s=window.qaEngine.state;const ids=['broadcast_crown','sync_gauntlet','extraction_pack','shock_mantle','inspection_wing','barrier_forge'];s.premiumGear.equipped=ids;s.premiumGear.owned=ids;s.interactiveHazards=[];window.qaMetalStamps=0;window.qaDebrisStamps=0;window.qaVaporStamps=0;window.qaMetalProbe=true;});
  await page.waitForTimeout(width===390?2500:950);await page.screenshot({path:path.join(out,`${width}x${height}-actual-game.png`)});
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(200);await page.screenshot({path:path.join(out,`${width}x${height}-moving-game.png`)});await page.keyboard.up('ArrowRight');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const metalStamps=await page.evaluate(()=>window.qaMetalStamps);
  const debrisStamps=await page.evaluate(()=>window.qaDebrisStamps);
  const vaporStamps=await page.evaluate(()=>window.qaVaporStamps);
  reports.push({width,height,...result,metalStamps,debrisStamps,vaporStamps,errors,overflow,pass:result.pass&&metalStamps>0&&debrisStamps>0&&vaporStamps>0&&!errors.length&&!overflow});
  const video=page.video();await page.close();
  if(video){const file=await video.path();fs.renameSync(file,path.join(out,'six-equipped-portrait.webm'));}
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
