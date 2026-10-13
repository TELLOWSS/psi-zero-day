import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/passing-motion');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const rows=[];
const storeText=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8'));
try {
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5197',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).waitFor();
  const result=await page.evaluate(async()=>{
   const {loadDirectionalActor,drawDirectionalBody,directionalSocket}=await import('/src/ui/survivors-directional-art.ts');
   const actor=new Image();actor.src='/assets/episode01/characters/player-map.webp';await actor.decode();
   const loaded=await loadDirectionalActor(actor);
   const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=1440;
   const ctx=sheet.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#34443c';ctx.fillRect(0,0,1200,1440);
   const phases=[0,1,1.65,2,3,4,5,5.65,6,7],frames=[];
   for(let direction=0;direction<8;direction++)for(let column=0;column<phases.length;column++){
    const pose={moving:true,cycle:phases[column]/8*Math.PI*2,gaitBlend:1,direction,directional:true,facing:direction>=3&&direction<=5?-1:1,lean:0,scaleY:1,reaction:0,action:0};
    ctx.save();ctx.translate(column*120+60,direction*180+170);drawDirectionalBody(ctx,actor,154,pose);ctx.restore();
    const data=ctx.getImageData(column*120,direction*180,120,180).data;let count=0,hash=2166136261;
    for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===0&&(data[i]!==52||data[i+1]!==68||data[i+2]!==60))count++;}
    frames.push({direction,column,count,hash:hash>>>0});
   }
   let socketJump=0;
   const base={moving:true,gaitBlend:1,facing:1,lean:0,scaleY:1,reaction:0,action:0};
   for(let direction=0;direction<8;direction++)for(const phase of [0,1,1.5,2,3,4,5,5.5,6,7,8]){
    const a=directionalSocket(actor,{...base,direction,cycle:(phase-.000001)/8*Math.PI*2},154,'chest');
    const b=directionalSocket(actor,{...base,direction,cycle:(phase+.000001)/8*Math.PI*2},154,'chest');
    if(!a||!b){socketJump=Infinity;break;}socketJump=Math.max(socketJump,Math.hypot(a.x-b.x,a.y-b.y));
   }
   return {loaded,frames,socketJump,sheet:sheet.toDataURL(),pass:loaded&&socketJump<.01&&frames.every(f=>f.count>1000)&&Array.from({length:8},(_,direction)=>new Set(frames.filter(f=>f.direction===direction).map(f=>f.hash)).size===10).every(Boolean)};
  });
  fs.writeFileSync(path.join(out,`${width}x${height}.png`),Buffer.from(result.sheet.split(',')[1],'base64'));delete result.sheet;
  await page.evaluate(async()=>{
   const {EquipmentMotion}=await import('/src/ui/survivors-equipment-motion.ts'),sample=EquipmentMotion.prototype.sample;
   window.qaEquipment={};
   EquipmentMotion.prototype.sample=function(entity,clock,pose,reduced,id='tool',joint='tool'){
    const angle=sample.call(this,entity,clock,pose,reduced,id,joint);
    const item=window.qaEquipment[id]??={joint,max:0,samples:0};item.max=Math.max(item.max,Math.abs(angle));item.samples++;
    return angle;
   };
  });
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:storeText.briefBrowse,exact:true}).click();
  await page.getByRole('tab',{name:'착용 미리보기',exact:true}).click();
  const selected=[['계도 전달','broadcast_crown'],['대응 방식','sync_gauntlet'],['보급·출동','extraction_pack'],['생존 지원','shock_mantle'],['동행 지원','inspection_wing'],['현장 전술','barrier_forge']];
  for(const [slot,id] of selected)await page.getByLabel(slot,{exact:true}).selectOption(id);
  await page.waitForFunction(()=>!document.querySelector('.survivors-fitting-art figcaption'));
  await page.getByRole('combobox',{name:'미리보기 동작',exact:true}).selectOption('walk');
  await page.waitForTimeout(1000);
  const equipment=await page.evaluate(()=>window.qaEquipment);
  const independent=selected.every(([,id])=>equipment[id]?.max>0&&equipment[id]?.samples>3)&&new Set(selected.map(([,id])=>equipment[id]?.max)).size===6;
  await page.screenshot({path:path.join(out,`${width}x${height}-fitting.png`)});
  rows.push({width,height,...result,equipment,independent,errors,pass:result.pass&&independent&&!errors.length});await page.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));
 console.log(JSON.stringify(rows.map(({frames,...row})=>row)));if(rows.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}
