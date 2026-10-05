import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/command-cast');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.goto('http://127.0.0.1:5196');
 const cast=await page.evaluate(async()=>{
  const {COMMAND_ART,authoredCommandFrame}=await import('/src/ui/survivors-command-art.ts');
  const {loadAuthoredCommand}=await import('/src/ui/survivors-authored-command.ts');
  const {CHARACTER_MAP_ART}=await import('/src/ui/survivors-character-art.ts');
  const {registerSpriteBounds,spriteOpaqueBounds,SpriteMotionTracker,drawGroundedSprite}=await import('/src/ui/survivors-sprite-motion.ts');
  const {drawAuthoredBody,authoredEquipmentOccluders}=await import('/src/ui/survivors-rig-renderer.ts');
  const {drawWearableLayer,loadWearableImages}=await import('/src/ui/survivors-wearable-art.ts');
  const {createInitialSurvivorsState}=await import('/src/engine/patrol-survivors-engine.ts');
  const hash=data=>{let value=2166136261;for(const byte of data)value=Math.imul(value^byte,16777619);return value>>>0;};
  const rows=[];
  for(const id of ['player','kang_taesik','lim_junho','yoon_sungho','lee_jaehoon','safety_monitor']){
   const actor=new Image();actor.src=CHARACTER_MAP_ART[id];await actor.decode();registerSpriteBounds(actor);const registered=await loadAuthoredCommand(actor);
   const profile=COMMAND_ART[actor.src.split('/').pop()],bounds=spriteOpaqueBounds(actor);
   const state=createInitialSurvivorsState(id,undefined,undefined,undefined,{owned:['shock_mantle','voice_lens'],equipped:['shock_mantle','voice_lens']}),base=new SpriteMotionTracker().sample(state.player,0,0,0);
   const wearables=await loadWearableImages(id),c=document.createElement('canvas');c.width=320;c.height=290;const ctx=c.getContext('2d',{willReadFrequently:true});
   const sheet=document.createElement('canvas');sheet.width=1280;sheet.height=860;const paint=sheet.getContext('2d');paint.fillStyle='#172323';paint.fillRect(0,0,1280,860);
   const frames=[];
   for(let index=0;index<8;index++){
    const pose={...base,actionProgress:(index+.5)/8};ctx.clearRect(0,0,320,290);ctx.save();ctx.translate(160,270);drawAuthoredBody(ctx,actor,256,pose);ctx.restore();
    const region=profile.preserve??{x:0,y:0,width:1,height:profile.top},left=160-bounds.width/2,top=14;
    const face=ctx.getImageData(Math.ceil(left+region.x*bounds.width)+2,Math.ceil(top+region.y*256)+2,Math.floor(region.width*bounds.width)-4,Math.floor(region.height*256)-4).data;
    const lower=Math.ceil(top+profile.bottom*256)+2;
    frames.push({index,body:hash(ctx.getImageData(0,0,320,290).data),face:hash(face),legs:hash(ctx.getImageData(0,lower,320,270-lower).data),occluders:authoredEquipmentOccluders(actor,pose)});
    paint.drawImage(c,index%4*320,Math.floor(index/4)*290);paint.fillStyle='#fff';paint.font='14px sans-serif';paint.fillText(`${id} POSE ${index+1}`,index%4*320+8,Math.floor(index/4)*290+18);
    for(const facing of [1,-1]){
     const walking={...pose,facing,action:.6,gaitBlend:1,cycle:index*Math.PI/4};ctx.clearRect(0,0,320,290);ctx.save();ctx.translate(160,105);
     drawWearableLayer(ctx,state,actor,74,walking,wearables,'back');drawGroundedSprite(ctx,actor,74,walking);drawWearableLayer(ctx,state,actor,74,walking,wearables,'front');ctx.restore();
     paint.drawImage(c,0,0,320,140,index%4*320,580+Math.floor(index/4)*140+(facing===1?0:70),320,140);
    }
   }
   const sequence=frames.map(f=>authoredCommandFrame(actor.src,(f.index+.5)/8));
   ctx.clearRect(0,0,320,290);ctx.save();ctx.translate(160,270);drawAuthoredBody(ctx,actor,256,{...base,actionProgress:.98});ctx.restore();
   const settled=hash(ctx.getImageData(0,0,320,290).data)===frames[0].body;
   rows.push({id,registered,bounds,frames,sequence,settled,sheet:sheet.toDataURL(),pass:registered&&bounds.height===256&&new Set(frames.map(f=>f.body)).size===new Set(sequence).size&&settled&&new Set(frames.map(f=>f.face)).size===1&&new Set(frames.map(f=>f.legs)).size===1});
  }
  return rows;
 });
 for(const row of cast){fs.writeFileSync(path.join(out,`${row.id}-poses.png`),Buffer.from(row.sheet.split(',')[1],'base64'));delete row.sheet;}
 await page.close();
 const views=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390],[568,320]])for(const [id,name] of [['kang_taesik','강태식'],['lim_junho','임준호'],['yoon_sungho','윤성호'],['lee_jaehoon','이재훈'],['safety_monitor','안전감시단']]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',error=>errors.push(String(error)));
  await page.addInitScript(()=>performance.setResourceTimingBufferSize(3000));
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();await page.getByRole('button',{name:'순찰 요원',exact:true}).click();
  await page.locator('.survivors-char-card').filter({hasText:name}).click();await page.getByRole('button',{name:'PSI 상점 · 구매·수리',exact:true}).click();await page.getByRole('tab',{name:'착용 미리보기',exact:true}).click();
  await page.getByLabel('생존 지원',{exact:true}).selectOption('shock_mantle');await page.getByLabel('계도 전달',{exact:true}).selectOption('broadcast_crown');
  await page.waitForFunction(()=>!document.querySelector('.survivors-fitting-art figcaption'));
  const pixels=()=>page.evaluate(()=>{const c=document.querySelector('.survivors-fitting-art canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let value=2166136261;for(const byte of data)value=Math.imul(value^byte,16777619);return value>>>0;});
  await page.getByRole('combobox',{name:'미리보기 동작',exact:true}).selectOption('ultimate');await page.waitForTimeout(180);const attack=await pixels();await page.waitForTimeout(100);const next=await pixels();
  await page.getByRole('button',{name:'미리보기 일시정지',exact:true}).click();const stopped=await pixels();await page.waitForTimeout(150);const paused=stopped===await pixels();
  await page.getByRole('button',{name:'왼쪽',exact:true}).click();const mirrored=stopped!==await pixels();
  await page.screenshot({path:path.join(out,`${id}-${width}x${height}.png`)});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(80);const quiet=await pixels();await page.waitForTimeout(150);const reduced=quiet===await pixels();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const loaded=await page.evaluate(id=>performance.getEntriesByType('resource').some(resource=>resource.name.includes(`${id.split('_')[0]}-command-v1.png`)),id);
  const pass=attack!==next&&paused&&mirrored&&reduced&&loaded&&!overflow&&!errors.length;views.push({id,width,height,paused,mirrored,reduced,loaded,overflow,errors,pass});await page.close();
 }
 const report={cast,views,errors,pass:cast.every(row=>row.pass)&&views.every(row=>row.pass)&&!errors.length};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
