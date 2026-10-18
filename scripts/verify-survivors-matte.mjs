import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const out='artifacts/signal-watch-matte';fs.mkdirSync(out,{recursive:true});
const rows=[];
try {
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{localStorage.setItem('psi.survivors.last_played_stage','stage_01');});
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4174',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  await page.locator('.survivors-ready-dialog').waitFor();
  const pixel=await page.evaluate(async()=>{
   const {prepareForegroundMatte}=await import('/src/ui/survivors-matte-texture.ts');
   const {approvedForegroundMattes,matteVisibleAlpha}=await import('/src/ui/survivors-stage-mattes.ts');
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(...args){window.foregroundQaEngine=this;return update.apply(this,args);};
   const matte=approvedForegroundMattes('stage_01')[0];
   const load=uri=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=uri;});
   const [coverage,ground]=await Promise.all([load(matte.imageUri),load(matte.sourceGround)]);
   const texture=prepareForegroundMatte(coverage,ground,matte);
   if(!texture)throw Error('No source-registered foreground texture');
   const actual=texture.getContext('2d').getImageData(0,0,texture.width,texture.height).data;
   const expected=document.createElement('canvas');expected.width=texture.width;expected.height=texture.height;
   const ctx=expected.getContext('2d'),crop=matte.sourceCrop;
   ctx.drawImage(ground,crop.x,crop.y,crop.width,crop.height,0,0,texture.width,texture.height);
   const original=ctx.getImageData(0,0,texture.width,texture.height).data;
   let opaque=0,maxError=0,lane=0;
   for(let i=0;i<actual.length;i+=4){
    const x=(i/4)%texture.width;
    if(x>=716&&x<850&&actual[i+3]>8)lane++;
    if(actual[i+3]>200){opaque++;for(let c=0;c<3;c++)maxError=Math.max(maxError,Math.abs(actual[i+c]-original[i+c]));}
   }
   const bad=prepareForegroundMatte(coverage,ground,{...matte,sourceCrop:{x:0,y:1000,width:1564,height:71}});
   return {width:texture.width,height:texture.height,opaque,maxError,lane,invalidCropRejected:!bad,
    actorAlpha:matteVisibleAlpha(matte,{x:500,y:875},[]),
    warningAlpha:matteVisibleAlpha(matte,{x:700,y:450},[{x:500,y:870,radius:24,warning:true}])};
  });
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.waitForFunction(()=>window.foregroundQaEngine?.state.phase==='playing');
  await page.evaluate(()=>{
   const e=window.foregroundQaEngine;e.state.player.x=500;e.state.player.y=875;
   e.state.hazards=[];e.state.projectiles=[];e.state.drops=[];e.setPaused(true);
  });
  await page.addStyleTag({content:'.survivors-modal-backdrop{visibility:hidden!important}'});
  await page.waitForFunction(()=>document.querySelector('.survivors-canvas')?.dataset.drawnForegroundMattes==='1');
  const normal=await page.locator('.survivors-canvas').getAttribute('data-drawn-foreground-mattes');
  await page.screenshot({path:out+'/'+width+'x'+height+'-overlap.png'});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(120);
  const reduced=await page.locator('.survivors-canvas').getAttribute('data-drawn-foreground-mattes');
  await page.screenshot({path:out+'/'+width+'x'+height+'-reduced.png'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  const pass=pixel.width===1564&&pixel.height===71&&pixel.opaque>50000&&pixel.maxError<=2&&pixel.lane===0&&pixel.invalidCropRejected&&pixel.actorAlpha===.55&&pixel.warningAlpha===.25&&normal==='1'&&reduced==='1'&&!overflow&&!errors.length;
  rows.push({width,height,scope:'Seeded player overlap; source-color and real renderer checks, not natural combat',pixel,normal,reduced,overflow,errors,pass});
  await page.close();
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
 if(rows.some(r=>!r.pass))process.exitCode=1;
}finally{await browser.close();}
