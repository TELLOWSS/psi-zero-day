import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PREVIEW_URL;
if(!url)throw Error('PSI_PREVIEW_URL must point at a Vite dev server (for test-only module hooks)');
const out=path.resolve('artifacts/stage12-real-route');
fs.mkdirSync(out,{recursive:true});
const rows=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
   localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(['stage_01','stage_12']));
   localStorage.setItem('psi.survivors.last_played_stage','stage_12');
  });
  try{
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
   const label=await page.locator('.survivors-ready-launch strong').textContent();
   if(!label?.includes('STAGE 12'))throw Error('Expected ST12 preflight, got '+label);
   await page.evaluate(async()=>{
    const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
    const update=SurvivorsEngine.prototype.update;
    SurvivorsEngine.prototype.update=function(dt,input){window.qaRouteEngine=this;return update.call(this,dt,input);};
    window.qaRouteLabels=[];
    const previous=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(value,...args){
      if(value==='잔재 장애 · 우회 필요'||value==='잔재 정리 · 직접 통과 가능')window.qaRouteLabels.push(value);
      return previous.call(this,value,...args);
    };
   });
   await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
   await page.waitForFunction(()=>window.qaRouteEngine?.state?.phase==='playing',{timeout:15000});
   const before=await page.evaluate(async()=>{
    const {stage12RubbleRoute}=await import('/src/engine/survivors-stage12-route.ts');
    const {terrainHit,terrainMove}=await import('/src/engine/survivors-terrain.ts');
    const e=window.qaRouteEngine,r=stage12RubbleRoute(e.state.terrain);
    if(!r)throw Error('No ST12 rubble crossing is available');
    e.state.player.x=r.from.x;e.state.player.y=r.from.y;
    e.state.player.invincibleTime=30;
    return {route:r,blocked:!!terrainHit(e.state.terrain,r.from,r.to,14),
      stopped:terrainMove(e.state.terrain,r.from,r.to,14),rubble:e.state.terrain.find(o=>o.id===r.rubbleId)?.hp};
   });
   await page.waitForFunction(()=>window.qaRouteLabels.includes('잔재 장애 · 우회 필요'),{timeout:10000});
   await page.screenshot({path:path.join(out,`${width}x${height}-before.png`)});
   const first=await page.evaluate(()=>window.qaRouteEngine.clearTerrain());
   if(!first)throw Error('Real cleanup action did not start');
   await page.waitForTimeout(800);
   const second=await page.evaluate(()=>window.qaRouteEngine.clearTerrain());
   if(!second)throw Error('Real cleanup action failed after cooldown');
   const after=await page.evaluate(async()=>{
    const {stage12RubbleRoute}=await import('/src/engine/survivors-stage12-route.ts');
    const {terrainHit,terrainMove}=await import('/src/engine/survivors-terrain.ts');
    const e=window.qaRouteEngine,r=stage12RubbleRoute(e.state.terrain);
    return {route:r,collision:r?!!terrainHit(e.state.terrain,r.from,r.to,14):true,
      moved:r?terrainMove(e.state.terrain,r.from,r.to,14):null,
      rubble:e.state.terrain.find(o=>o.id===r?.rubbleId)?.hp,
      rubbleCleared:e.state.terrainRecord?.rubbleCleared??0};
   });
   await page.waitForFunction(()=>window.qaRouteLabels.includes('잔재 정리 · 직접 통과 가능'),{timeout:10000});
   await page.screenshot({path:path.join(out,`${width}x${height}-after.png`)});
   const duplicate=await page.evaluate(()=>window.qaRouteEngine.clearTerrain());
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
   const passed=before.blocked&&before.route.open===false&&before.rubble>0
    &&after.route?.open===true&&!after.collision&&after.rubble===0
    &&after.moved?.x===after.route.to.x&&after.moved?.y===after.route.to.y
    &&after.rubbleCleared===1&&!duplicate&&!overflow&&!errors.length;
   rows.push({width,height,before,after,first,second,duplicate,overflow,errors,pass:passed,scope:'Real ST12 launch and cleanup logic after a synthetic actor reposition; not natural-player completion or Android FPS'});
  }finally{await page.close();}
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));
 console.log(JSON.stringify(rows));
 if(rows.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}
