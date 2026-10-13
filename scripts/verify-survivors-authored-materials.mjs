import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/authored-materials');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('http://127.0.0.1:5196');
 const result=await page.evaluate(async()=>{
  const {loadAuthoredCommand,PLAYER_COMMAND_ART}=await import('/src/ui/survivors-authored-command.ts');
  const {registerSpriteBounds,SpriteMotionTracker,drawGroundedSprite,spriteOpaqueBounds}=await import('/src/ui/survivors-sprite-motion.ts');
  const {drawAuthoredBody,actorTorsoPoint}=await import('/src/ui/survivors-rig-renderer.ts');
  const {drawEquipmentMantle}=await import('/src/ui/survivors-equipment-identity.ts');
  const {CINEMATIC_VFX_ATLAS,drawCinematicContact,cinematicLook}=await import('/src/ui/survivors-cinematic-vfx.ts');
  const {drawWearableLayer,loadWearableImages,premiumBodySocket}=await import('/src/ui/survivors-wearable-art.ts');
  const {createInitialSurvivorsState}=await import('/src/engine/patrol-survivors-engine.ts');
  const load=async(src)=>{const image=new Image();image.src=src;await image.decode();return image;};
  const actor=await load('/assets/episode01/characters/player-map.webp');registerSpriteBounds(actor);
  const registered=await loadAuthoredCommand(actor),atlas=await load(CINEMATIC_VFX_ATLAS),wearables=await loadWearableImages('player');
  const ids=['broadcast_crown','shock_mantle','sync_gauntlet'];
  const state=createInitialSurvivorsState('player',undefined,undefined,undefined,{owned:ids,equipped:ids});state.player.x=0;state.player.y=0;
  const base=new SpriteMotionTracker().sample(state.player,0,0,0);
  const c=document.createElement('canvas');c.width=220;c.height=290;const ctx=c.getContext('2d');
  const sheet=document.createElement('canvas');sheet.width=880;sheet.height=760;const paint=sheet.getContext('2d');
  paint.fillStyle='#172323';paint.fillRect(0,0,sheet.width,sheet.height);
  const hash=data=>{let value=2166136261;for(const byte of data)value=Math.imul(value^byte,16777619);return value>>>0;};
  const frames=[];
  for(let index=0;index<8;index++){
   ctx.clearRect(0,0,220,290);ctx.save();ctx.translate(110,270);drawAuthoredBody(ctx,actor,256,{...base,actionProgress:(index+.5)/8});ctx.restore();
   frames.push({index,body:hash(ctx.getImageData(0,0,220,290).data),head:hash(ctx.getImageData(0,14,220,53).data),legs:hash(ctx.getImageData(0,137,220,133).data)});
   paint.drawImage(c,index%4*220,Math.floor(index/4)*290);paint.fillStyle='#ffffff';paint.font='14px sans-serif';paint.fillText(`POSE ${index+1}`,index%4*220+10,Math.floor(index/4)*290+20);
  }
  for(let index=0;index<8;index++){
   const pose={...base,gaitBlend:1,cycle:index*Math.PI/4,action:.6,actionProgress:(index+.5)/8};
   ctx.clearRect(0,0,220,290);ctx.save();ctx.translate(110,105);
   drawWearableLayer(ctx,state,actor,74,pose,wearables,'back');drawGroundedSprite(ctx,actor,74,pose);drawWearableLayer(ctx,state,actor,74,pose,wearables,'front');
   state.gameTime=.8+index*.05;drawEquipmentMantle(ctx,state,atlas,false,false,0,.6,{pose,height:74,rigged:true});ctx.restore();
   paint.drawImage(c,0,0,220,140,index%4*220,580+Math.floor(index/4)*90,220,140);
  }
  const aura=(time,reduced=false,busy=false)=>{
   ctx.clearRect(0,0,220,290);state.gameTime=time;ctx.save();ctx.translate(110,270);drawEquipmentMantle(ctx,state,atlas,reduced,busy,undefined,0,{pose:base,height:74,rigged:true});ctx.restore();
   return hash(ctx.getImageData(0,0,220,290).data);
  };
  const auraChanged=aura(.2)!==aura(.4),paused=aura(.4)===aura(.4),reduced=aura(.2,true)===aura(.4,true),busyVisible=aura(.4,false,true)!==hash(new Uint8ClampedArray(220*290*4));
  const contacts=[];
  for(const kind of ['satellite_wave','cryo_blast','tesla_bolt','hunter_beam']){
   const event={projectileId:'qa',kind,phase:'impact',x:0,y:0,angle:0,radius:10};
   const draw=age=>{ctx.clearRect(0,0,220,290);ctx.save();ctx.translate(110,140);drawCinematicContact(ctx,event,age,.4,cinematicLook(kind,5,ids),atlas,false,false);ctx.restore();return hash(ctx.getImageData(0,0,220,290).data);};
   contacts.push({kind,changed:draw(.02)!==draw(.15),paused:draw(.15)===draw(.15)});
  }
  const socket=premiumBodySocket('player',actor,74,'protection'),pose={...base,gaitBlend:1,cycle:1,action:.6,lean:.02};
  const right=actorTorsoPoint(socket,pose,74,true),left=actorTorsoPoint(socket,{...pose,facing:-1},74,true);
  return {registered,art:PLAYER_COMMAND_ART,atlas:CINEMATIC_VFX_ATLAS,bounds:spriteOpaqueBounds(actor),frames,auraChanged,paused,reduced,busyVisible,contacts,mirroredSocket:right.x===-left.x&&right.y===left.y,sheet:sheet.toDataURL()};
 });
 fs.writeFileSync(path.join(out,'registered-poses.png'),Buffer.from(result.sheet.split(',')[1],'base64'));delete result.sheet;
 result.errors=errors;
 result.pass=result.registered&&result.bounds.height===256&&new Set(result.frames.map(frame=>frame.body)).size===8&&new Set(result.frames.map(frame=>frame.head)).size===1&&new Set(result.frames.map(frame=>frame.legs)).size===1&&result.auraChanged&&result.paused&&result.reduced&&result.busyVisible&&result.mirroredSocket&&result.contacts.every(contact=>contact.changed&&contact.paused)&&!errors.length;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(!result.pass)process.exitCode=1;
}finally{await browser.close();}
