import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/vfx-composition');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const page=await browser.newPage({viewport:{width:1100,height:560}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:5196');
 const report=await page.evaluate(async()=>{
  const {ProjectileFeedbackLayer}=await import('/src/ui/survivors-projectile-feedback.ts');
  const {feedbackCoreOwners}=await import('/src/ui/survivors-vfx-composition.ts');
  const {registerPropAtlas}=await import('/src/ui/survivors-equipment-art.ts');
  const {prepareMaterialFragments}=await import('/src/ui/survivors-material-fragments.ts');
  const load=async src=>{const i=new Image();i.src=src;await i.decode();return i;};
  const atlas=await load('/assets/survivors/cinematic-vfx-v3.png'),materialAtlas=await load('/assets/survivors/industrial-contacts-v3.webp');
  const metalAtlas=await load('/assets/survivors/metal-impact-sequence-v1.png');
  const debrisAtlas=await load('/assets/survivors/debris-impact-sequence-v1.png');
  const vaporAtlas=await load('/assets/survivors/vapor-impact-sequence-v1.png');
  registerPropAtlas(materialAtlas,3,2);
  prepareMaterialFragments(materialAtlas);
  document.body.replaceChildren();document.body.style.background='#151c1c';
  const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=560;document.body.append(canvas);const ctx=canvas.getContext('2d');
  const equipped=['broadcast_crown','sync_gauntlet','shock_mantle','barrier_forge','inspection_wing','extraction_pack'];
  const ages=[.01,.04,.08,.14,.22],counts=[];
  for(let row=0;row<3;row++)for(let column=0;column<5;column++){
   const x=110+column*215,y=90+row*160,layer=new ProjectileFeedbackLayer();
   const kinds=row===0?['radio']:row===1?['hunter_beam']:['radio','hunter_beam','tesla_bolt'];
   const events=kinds.map((kind,i)=>({projectileId:String(i),kind,phase:'impact',x:0,y:0,angle:i*2.1,radius:14,critical:true,actorKind:row===0?'RUNAWAY_CART':row===1?'GAS_LEAK':'FALLING_DEBRIS'}));
   layer.ingest(events,false,equipped);layer.advance(ages[column]);
   ctx.fillStyle='#303b39';ctx.fillRect(x-95,y-65,190,130);ctx.save();ctx.translate(x,y);
   layer.draw(ctx,false,false,{atlas,materialAtlas,metalAtlas,debrisAtlas,vaporAtlas,equipped});ctx.restore();
   const data=ctx.getImageData(x-90,y-60,180,120).data;let changed=0;
   for(let i=0;i<data.length;i+=4)if(Math.abs(data[i]-48)+Math.abs(data[i+1]-59)+Math.abs(data[i+2]-57)>30)changed++;
   counts.push(changed);ctx.fillStyle='white';ctx.font='14px sans-serif';ctx.fillText(`${row===2?'3-weapon overlap':kinds[0]} ${ages[column]}s`,x-95,y+81);
   if(feedbackCoreOwners(events.map(event=>({event})),equipped).size!==1)throw Error('overlap core ownership failed');
  }
  if(counts.some(n=>n===0)||counts[0]===counts[4])throw Error('blank or static material sequence');
  return {counts,atlasLoaded:true,oneCorePerContact:true};
 });
 await page.screenshot({path:path.join(out,'contact-timeline.png')});
 const enemy=await page.evaluate(async()=>{
  const {drawIndustrialHazard}=await import('/src/ui/survivors-industrial-art.ts');
  const {registerPropAtlas}=await import('/src/ui/survivors-equipment-art.ts');
  const {materialFragmentTexture}=await import('/src/ui/survivors-material-fragments.ts');
  const atlas=new Image();atlas.src='/assets/survivors/industrial-hazards-v3.webp';await atlas.decode();registerPropAtlas(atlas,3,2);
  const contacts=new Image();contacts.src='/assets/survivors/industrial-contacts-v3.webp';await contacts.decode();
  const {prepareMaterialFragments}=await import('/src/ui/survivors-material-fragments.ts');prepareMaterialFragments(contacts);
  const feather=materialFragmentTexture(contacts,2,2).getContext('2d').getImageData(0,0,1,1).data[3];if(feather!==0)throw Error('fragment crop edge is opaque');
  const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  const reactions=[0,1,.65,.4,0],samples=[];
  for(let row=0;row<3;row++)for(let column=0;column<5;column++){
   const type=['RUNAWAY_CART','GAS_LEAK','FALLING_DEBRIS'][row],x=110+column*215,y=90+row*160;
   const h={id:type,type,x:0,y:0,hp:100,maxHp:100,speed:0,radius:28,damage:0,expValue:0};const before=JSON.stringify(h);
   const pose={moving:true,cycle:1,facing:1,directionY:.3,lean:0,reaction:reactions[column]};
   const tile=document.createElement('canvas');tile.width=190;tile.height=130;const paint=tile.getContext('2d');
   paint.fillStyle='#303b39';paint.fillRect(0,0,190,130);paint.save();paint.translate(95,87);
   if(!drawIndustrialHazard(paint,atlas,h,pose,'handover',1,false,18))throw Error('hazard asset blank');paint.restore();ctx.drawImage(tile,x-95,y-65);
   if(before!==JSON.stringify(h))throw Error('presentation mutated hazard');
   const data=paint.getImageData(5,5,180,120).data;let hash=0;for(let i=0;i<data.length;i++)hash=(hash*31+data[i])>>>0;samples.push(hash);
   ctx.fillStyle='white';ctx.font='14px sans-serif';ctx.fillText(`${type} reaction ${reactions[column]}`,x-95,y+81);
  }
  for(let row=0;row<3;row++)if(samples[row*5]===samples[row*5+1]||samples[row*5]!==samples[row*5+4])throw Error(`hazard response does not recover: row ${row}, ${samples.slice(row*5,row*5+5)}`);
  return {samples,featheredEdges:true,restoredPose:true,collisionStateUnchanged:true};
 });
 await page.screenshot({path:path.join(out,'hazard-response.png')});
 if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,enemy,errors},null,2));console.log(JSON.stringify({...report,enemy}));
}finally{await browser.close();}
