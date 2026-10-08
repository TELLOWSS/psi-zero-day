import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/workface-roster');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const reports=[];
try{
 for(const [width,height,number] of [[1440,900,2],[390,844,12],[1440,900,37],[1440,900,46]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5199',{waitUntil:'networkidle'});
  await page.evaluate(()=>localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(Array.from({length:50},(_,i)=>`stage_${String(i+1).padStart(2,'0')}`))));
  await page.reload();
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.getByRole('button',{name:'작전 구역',exact:true}).click();
  await page.getByRole('tab').nth(Math.floor((number-1)/10)).click();
  await page.locator('.survivors-stage-card').filter({hasText:new RegExp(`STAGE 0?${number}(?:\\D|$)`)}).click();
  await page.getByRole('button',{name:'작전 준비',exact:true}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(dt,input){window.workfaceEngine=this;this.state.player.hp=100000;return update.call(this,dt,input);};
  });
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.waitForFunction(()=>window.workfaceEngine?.state.gameTime>3);
  // Controlled placement exercises the real spawn and render path for each family.
  await page.evaluate(()=>{
   const e=window.workfaceEngine,p=e.state.player;
   for(const [index,type] of ['RUNAWAY_CART','FALLING_DEBRIS','GAS_LEAK'].entries())e.spawnHazard(type,undefined,false,{x:p.x+(index-1)*100,y:p.y-110,warningTimer:1.25,directionX:0,directionY:1});
  });
  await page.waitForTimeout(100);
  const state=await page.evaluate(()=>({stage:window.workfaceEngine.state.stage.stageNumber,species:window.workfaceEngine.state.hazards.map(h=>h.species).filter(Boolean),overflow:document.documentElement.scrollWidth>innerWidth}));
  await page.screenshot({path:path.join(out,`${width}x${height}-stage${number}.png`)});
  reports.push({...state,errors,failed,pass:state.stage===number&&state.species.length>0&&!state.overflow&&!errors.length&&!failed.length});
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5199');
 const atlas=await page.evaluate(async()=>{
  const {INDUSTRIAL_HAZARD_ART,WORKFACE_HAZARD_ART,registerWorkfaceHazards,drawIndustrialHazard}=await import('/src/ui/survivors-industrial-art.ts');
  const {registerPropAtlas}=await import('/src/ui/survivors-equipment-art.ts');
  const {WORKFACE_SPECIES}=await import('/src/engine/survivors-workface-roster.ts');
  const {SpriteMotionTracker}=await import('/src/ui/survivors-sprite-motion.ts');
  const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
  const base=await load(INDUSTRIAL_HAZARD_ART),image=await load(WORKFACE_HAZARD_ART);
  registerPropAtlas(base,3,2);registerWorkfaceHazards(base,image);
  document.body.innerHTML='';document.body.style.background='#17232a';
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;document.body.append(canvas);
  const ctx=canvas.getContext('2d'),tracker=new SpriteMotionTracker(),cells=[];
  for(let i=0;i<12;i++){
   const h={id:'preview'+i,type:i<4?'RUNAWAY_CART':i<8?'FALLING_DEBRIS':'GAS_LEAK',species:WORKFACE_SPECIES[i],radius:40,hp:100,maxHp:100,motion:{phase:'approach',timer:0,directionX:1,directionY:0}};
   tracker.sample(h,0,0,0);const pose=tracker.sample(h,4,0,.05);
   ctx.save();ctx.translate(i%4*300+150,Math.floor(i/4)*290+230);
   const drawn=drawIndustrialHazard(ctx,base,h,pose,'formwork','surface_logistics',1,false,0);
   ctx.fillStyle='#e0e8ef';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText(h.species,0,35);ctx.restore();cells.push(drawn);
  }
  const pixels=ctx.getImageData(0,0,1200,900).data;
  return {cells,alpha:pixels.some((v,i)=>i%4===3&&v>0),pass:cells.every(Boolean)};
 });
 await page.screenshot({path:path.join(out,'all-species-render.png')});reports.push(atlas);await page.close();
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
 if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
