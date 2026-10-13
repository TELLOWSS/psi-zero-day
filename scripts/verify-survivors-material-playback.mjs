import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/material-playback');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const page=await browser.newPage({viewport:{width:900,height:480},recordVideo:{dir:out,size:{width:900,height:480}}}),errors=[];
 // Recording under the workspace otherwise triggers Vite's artifact-file reloads.
 await page.route('**/@vite/client',route=>route.fulfill({status:200,contentType:'text/javascript',body:'export const injectQuery=(url)=>url;export const updateStyle=()=>{};export const removeStyle=()=>{};export const createHotContext=()=>({accept(){},dispose(){},on(){},prune(){},invalidate(){},data:{}});'}));
 page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:5196');
 const result=await page.evaluate(async()=>{
  const {ProjectileFeedbackLayer}=await import('/src/ui/survivors-projectile-feedback.ts');
  const {registerPropAtlas}=await import('/src/ui/survivors-equipment-art.ts');
  const {prepareMaterialFragments}=await import('/src/ui/survivors-material-fragments.ts');
  const {drawIndustrialHazard}=await import('/src/ui/survivors-industrial-art.ts');
  const {SpriteMotionTracker}=await import('/src/ui/survivors-sprite-motion.ts');
  const load=async src=>{const i=new Image();i.src=src;await i.decode();return i;};
  const atlas=await load('/assets/survivors/cinematic-vfx-v3.png'),materialAtlas=await load('/assets/survivors/industrial-contacts-v3.webp');
  const metalAtlas=await load('/assets/survivors/metal-impact-sequence-v1.png');
  const debrisAtlas=await load('/assets/survivors/debris-impact-sequence-v1.png');
  const vaporAtlas=await load('/assets/survivors/vapor-impact-sequence-v1.png');
  const hazards=await load('/assets/survivors/industrial-hazards-v3.webp'),floor=await load('/assets/survivors/stage-01-ground-v2.webp');
  registerPropAtlas(materialAtlas,3,2);registerPropAtlas(hazards,3,2);prepareMaterialFragments(materialAtlas);
  document.body.replaceChildren();document.body.style.margin='0';
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=480;document.body.append(canvas);const ctx=canvas.getContext('2d');
  const actors=['RUNAWAY_CART','FALLING_DEBRIS','GAS_LEAK'].map((type,i)=>({id:type,type,x:180+i*270,y:250,hp:1000,maxHp:1000,speed:0,radius:36,damage:0,expValue:0}));
  const tracker=new SpriteMotionTracker(),layer=new ProjectileFeedbackLayer(),hashes=new Set(),paused=new Set();
  const equipped=['broadcast_crown','sync_gauntlet'];let previous=0,lastHit=-1,frames=0;
  await new Promise(resolve=>{
   const start=performance.now();
   const render=now=>{
    const wall=(now-start)/1000,clock=wall-Math.max(0,Math.min(.3,wall-2));
    const dt=clock-previous;previous=clock;layer.advance(dt);
    const hit=Math.floor(clock/1.1);
    for(let i=0;i<actors.length;i++){const h=actors[i];h.x=180+i*270+Math.sin(clock*1.8+i)*28;h.y=250+Math.cos(clock*1.8+i)*10;}
    if(hit!==lastHit){lastHit=hit;for(const h of actors)h.hp-=1;
     layer.ingest(actors.map((h,i)=>({projectileId:`${hit}:${i}`,kind:i===2?'tesla_bolt':i===1?'hunter_beam':'radio',phase:'impact',x:h.x,y:h.y-22,angle:i*.7,radius:14,critical:true,actorKind:h.type})),false,equipped);
    }
    ctx.drawImage(floor,0,0,900,480);
    for(const h of actors){const pose=tracker.sample(h,h.x,h.y,clock,h.hp);ctx.save();ctx.translate(h.x,h.y);drawIndustrialHazard(ctx,hazards,h,pose,'handover',clock,false,h.type==='FALLING_DEBRIS'?14:0);ctx.restore();}
    layer.draw(ctx,false,false,{atlas,materialAtlas,metalAtlas,debrisAtlas,vaporAtlas,equipped});
    const data=ctx.getImageData(0,150,900,180).data;let hash=0;for(let i=0;i<data.length;i+=16)hash=(hash*31+data[i])>>>0;hashes.add(hash);
    if(wall>2.05&&wall<2.25)paused.add(hash);frames++;
    if(wall<5.8)requestAnimationFrame(render);else resolve();
   };requestAnimationFrame(render);
  });
  if(hashes.size<30||paused.size!==1)throw Error(`playback gate failed: ${hashes.size} moving / ${paused.size} paused`);
  return {frames,distinctFrames:hashes.size,pausedFrames:paused.size,fixture:'three moving industrial hazards with confirmed-style contact events; not a full engine combat replay'};
 });
 await page.screenshot({path:path.join(out,'playback.png')});const video=page.video();await page.close();await video.saveAs(path.join(out,'material-motion.webm'));
 if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...result,errors},null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
