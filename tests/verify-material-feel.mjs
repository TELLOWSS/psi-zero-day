import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/material-feel');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const reports=[];
const url=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5200';
try{
 for(const [width,height] of [[1440,900],[390,844]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.getByRole('button',{name:'설정',exact:true}).click();
  await page.getByText('눈이 편한 화면 · 세부 조절',{exact:true}).click();
  for(const [name,value] of [['화면 흔들림','0'],['타격 섬광','0.4']])await page.getByRole('slider',{name:new RegExp(name)}).fill(value);
  const prefs=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.feel_v1')));
  await page.screenshot({path:path.join(out,`${width}-settings.png`)});
  await page.reload();await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.getByRole('button',{name:'설정',exact:true}).click();
  await page.getByText('눈이 편한 화면 · 세부 조절',{exact:true}).click();
  const restored=await page.getByRole('slider',{name:/画面|화면 흔들림/}).inputValue();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const update=SurvivorsEngine.prototype.update;
   const drain=SurvivorsEngine.prototype.drainProjectileFeedback;
   window.materialReceipts=[];
   SurvivorsEngine.prototype.update=function(dt,input){window.materialEngine=this;return update.call(this,dt,input);};
   SurvivorsEngine.prototype.drainProjectileFeedback=function(){const e=drain.call(this);window.materialReceipts.push(...e);return e;};
  });
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  try{await page.waitForFunction(()=>window.materialEngine?.state.gameTime>.3);}catch(error){await page.screenshot({path:path.join(out,'failure.png')});console.log(JSON.stringify({errors,body:await page.locator('body').innerText()}));throw error;}
  await page.evaluate(()=>{
   const e=window.materialEngine,p=e.state.player;e.state.interactiveHazards=[];e.state.player.critRate=0;
   for(const [i,species] of ['masonry','rebar_rack','gas_cylinders'].entries()){
    const x=p.x+(i-1)*80,y=p.y-90;
    e.state.hazards.push({id:'qa'+i,type:i===0?'FALLING_DEBRIS':i===1?'RUNAWAY_CART':'GAS_LEAK',species,x,y,hp:10,maxHp:10,radius:18,speed:0,damage:0,expValue:0});
    e.state.projectiles.push({id:'qa-shot'+i,kind:i===0?'grout_slug':i===1?'radio':'emp_pulse',x,y,vx:1,vy:0,radius:12,damage:100,duration:1,pierce:1});
   }
  });
  await page.waitForFunction(()=>window.materialReceipts.filter(e=>e.finishing).length>=3);
  await page.waitForTimeout(170);await page.screenshot({path:path.join(out,`${width}-finishing.png`)});
  const runtime=await page.evaluate(()=>({finishes:window.materialReceipts.filter(e=>e.finishing).map(e=>e.species),overflow:document.documentElement.scrollWidth>innerWidth}));
  reports.push({width,prefs,restored,runtime,errors,pass:prefs.shake===0&&prefs.flash===.4&&restored==='0'&&runtime.finishes.length>=3&&!runtime.overflow&&!errors.length});await page.close();
 }
 const page=await browser.newPage({viewport:{width:1200,height:900}});await page.goto(url);
 const gallery=await page.evaluate(async()=>{
  const {MaterialResolutionLayer}=await import('/src/ui/survivors-material-resolution.ts');
  const {WORKFACE_SPECIES}=await import('/src/engine/survivors-workface-roster.ts');
  const {INDUSTRIAL_HAZARD_ART,WORKFACE_HAZARD_ART,registerWorkfaceHazards}=await import('/src/ui/survivors-industrial-art.ts');
  const {registerPropAtlas}=await import('/src/ui/survivors-equipment-art.ts');
  const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
  const base=await load(INDUSTRIAL_HAZARD_ART),image=await load(WORKFACE_HAZARD_ART);registerPropAtlas(base,3,2);registerWorkfaceHazards(base,image);
  document.body.innerHTML='';document.body.style.background='#17232a';
  const c=document.createElement('canvas');c.width=1200;c.height=900;document.body.append(c);const ctx=c.getContext('2d');
  const layer=new MaterialResolutionLayer();
  const kills=WORKFACE_SPECIES.map((species,i)=>({species,type:i<4?'RUNAWAY_CART':i<8?'FALLING_DEBRIS':'GAS_LEAK',x:i%4*300+150,y:Math.floor(i/4)*290+230,radius:45}));
  layer.observe([],kills);
  window.materialGallery={layer,ctx,base,kills};
  window.drawMaterialGallery=reduced=>{ctx.clearRect(0,0,1200,900);layer.draw(ctx,base,reduced,false,1);for(const k of kills){ctx.fillStyle='#e0e8ef';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.fillText(k.species,k.x,k.y+35);}};
  window.drawMaterialGallery(false);return {size:layer.size};
 });
 await page.screenshot({path:path.join(out,'all-species-before.png')});
 await page.evaluate(()=>{window.materialGallery.layer.advance(.25);window.materialGallery.layer.advance(.15);window.drawMaterialGallery(false);});
 await page.screenshot({path:path.join(out,'all-species-settling.png')});
 await page.evaluate(()=>window.drawMaterialGallery(true));await page.screenshot({path:path.join(out,'all-species-reduced.png')});
 reports.push({...gallery,pass:gallery.size===12});await page.close();
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
 if(reports.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
