import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
fs.mkdirSync('artifacts/equipment-check',{recursive:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5200');
 const result=await page.evaluate(async()=>{
  const {loadDirectionalActor,drawDirectionalBody}=await import('/src/ui/survivors-directional-art.ts');
  const {fittingPose}=await import('/src/ui/survivors-fitting-pose.ts');
  const actor=new Image();actor.src='/assets/episode01/characters/player-map.webp';await actor.decode();const loaded=await loadDirectionalActor(actor);
  const canvas=document.createElement('canvas');canvas.width=220;canvas.height=240;const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const sheet=document.createElement('canvas');sheet.width=1760;sheet.height=480;const paint=sheet.getContext('2d');paint.fillStyle='#24352f';paint.fillRect(0,0,sheet.width,sheet.height);
  const frames=[];
  for(let direction=0;direction<8;direction++)for(const check of [false,true]){
   const pose={...fittingPose(.45,check?'check':'idle',1,false),direction,visualAngle:direction*Math.PI/4,directional:true};ctx.clearRect(0,0,220,240);ctx.save();ctx.translate(110,225);drawDirectionalBody(ctx,actor,210,pose,false);ctx.restore();
   const data=ctx.getImageData(0,0,220,240).data;let hash=2166136261,opaque=0,bottom=-1;
   for(let i=0;i<data.length;i++){hash=Math.imul(hash^data[i],16777619);if(i%4===3&&data[i]>32){opaque++;bottom=Math.max(bottom,Math.floor(i/4/220));}}
   frames.push({direction,check,hash:hash>>>0,opaque,bottom});paint.drawImage(canvas,direction*220,check?240:0);
  }
  return {loaded,frames,sheet:sheet.toDataURL()};
 });
 fs.writeFileSync('artifacts/equipment-check/eight-view-comparison.png',Buffer.from(result.sheet.split(',')[1],'base64'));delete result.sheet;
 result.errors=errors;result.pass=result.loaded&&result.frames.every(f=>f.opaque>1000&&f.bottom>=220&&f.bottom<=225)&&Array.from({length:8},(_,d)=>result.frames[d*2].hash!==result.frames[d*2+1].hash).every(Boolean)&&new Set(result.frames.filter(f=>f.check).map(f=>f.hash)).size===8&&!errors.length;
 fs.writeFileSync('artifacts/equipment-check/report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(!result.pass)process.exitCode=1;
 await page.close();
 const copy=JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json','utf8')),views=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const view=await browser.newPage({viewport:{width,height}}),viewErrors=[];view.on('pageerror',e=>viewErrors.push(String(e)));
  await view.emulateMedia({reducedMotion:'reduce'});await view.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5200',{waitUntil:'networkidle'});
  await view.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();await view.getByRole('button',{name:copy.briefBrowse,exact:true}).click();await view.getByRole('tab',{name:'착용 미리보기',exact:true}).click();
  await view.waitForFunction(()=>!document.querySelector('.survivors-fitting-art figcaption'));await view.emulateMedia({reducedMotion:'no-preference'});
  const storage=await view.evaluate(()=>JSON.stringify({...localStorage}));await view.getByRole('combobox',{name:copy.attackMotion,exact:true}).selectOption('check');
  const pixels=()=>view.evaluate(()=>{const c=document.querySelector('.survivors-fitting-art canvas'),data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261;for(const byte of data)hash=Math.imul(hash^byte,16777619);return hash>>>0;});
  const first=await pixels();await view.waitForTimeout(380);const changed=first!==await pixels();
  await view.getByRole('button',{name:copy.pausePreview,exact:true}).click();const paused=await pixels();await view.waitForTimeout(150);const frozen=paused===await pixels();
  await view.screenshot({path:`artifacts/equipment-check/${width}x${height}-fitting.png`});
  const unchanged=storage===await view.evaluate(()=>JSON.stringify({...localStorage})),overflow=await view.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const pass=changed&&frozen&&unchanged&&!overflow&&!viewErrors.length;views.push({width,height,changed,frozen,unchanged,overflow,errors:viewErrors,pass});await view.close();
 }
 fs.writeFileSync('artifacts/equipment-check/fitting-report.json',JSON.stringify(views,null,2));console.log(JSON.stringify(views));if(views.some(v=>!v.pass))process.exitCode=1;
}finally{await browser.close();}
