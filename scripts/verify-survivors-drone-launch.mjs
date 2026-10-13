import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const evolved=process.env.QA_DRONE_MODE==='hunter';
const out=path.resolve(evolved?'artifacts/hunter-launch':'artifacts/drone-launch');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try {
 const reports=[];
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const page=await browser.newPage({viewport:{width,height},...(width===390?{recordVideo:{dir:out,size:{width,height}}}:{})}),errors=[];
  await page.route('**/@vite/client',route=>route.fulfill({status:200,contentType:'text/javascript',body:'const styles=new Map();export const injectQuery=(url)=>url;export const updateStyle=(id,content)=>{let style=styles.get(id);if(!style){style=document.createElement("style");document.head.appendChild(style);styles.set(id,style);}style.textContent=content;};export const removeStyle=(id)=>{styles.get(id)?.remove();styles.delete(id);};export const createHotContext=()=>({accept(){},dispose(){},on(){},prune(){},invalidate(){},data:{}});'}));
  page.on('pageerror',error=>errors.push(String(error)));
  await page.addInitScript(evolved=>{
   window.qaEvolved=evolved;
   window.qaDroneStamps=0;window.qaDroneLaunches=[];
   const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
    if(image?.src?.includes(window.qaEvolved?'hunter-drone-launch-v1.png':'inspection-drone-launch-v1.png'))window.qaDroneStamps++;
    return draw.call(this,image,...args);
   };
  },evolved);
  await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  const fixture=await page.evaluate(async evolved=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');
   const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(...args){window.qaEngine=this;return update.apply(this,args);};
   const drain=SurvivorsEngine.prototype.drainProjectileFeedback;
   SurvivorsEngine.prototype.drainProjectileFeedback=function(){
    const events=drain.call(this);
    for(const event of events)if(event.kind===(evolved?'hunter_beam':'drone_laser')&&event.phase==='launch')window.qaDroneLaunches.push({x:event.x,y:event.y,distance:Math.hypot(event.x-this.state.player.x,event.y-this.state.player.y),angle:event.angle});
    return events;
   };
   const {ProjectileFeedbackLayer}=await import('/src/ui/survivors-projectile-feedback.ts');
   const atlas=new Image();atlas.src=evolved?'/assets/survivors/hunter-drone-launch-v1.png':'/assets/survivors/inspection-drone-launch-v1.png';await atlas.decode();
   const gallery=document.createElement('canvas');gallery.width=720;gallery.height=240;
   const ctx=gallery.getContext('2d');ctx.fillStyle='#242a2b';ctx.fillRect(0,0,720,240);
   const samples=[];
   for(const [row,angle] of [0,Math.PI/2].entries())for(const [column,age] of [0,.012,.032,.064,.1,.13].entries()){
    const layer=new ProjectileFeedbackLayer();layer.ingest([{projectileId:'sample',kind:evolved?'hunter_beam':'drone_laser',phase:'launch',x:column*120+45,y:row*120+55,angle,radius:4}],false,['inspection_wing']);layer.advance(age);
    layer.draw(ctx,false,false,{droneLaunchAtlas:atlas,hunterLaunchAtlas:atlas,equipped:['inspection_wing']});
    const rgba=ctx.getImageData(column*120,row*120,120,100).data;let colored=0;
    for(let i=0;i<rgba.length;i+=4)if(Math.abs(rgba[i]-36)+Math.abs(rgba[i+1]-42)+Math.abs(rgba[i+2]-43)>20)colored++;
    ctx.fillStyle='#fff';ctx.font='12px sans-serif';ctx.fillText(`${age}s`,column*120+8,row*120+112);
    samples.push({angle,age,colored,pass:colored>0});
   }
   return {samples,gallery:gallery.toDataURL(),pass:samples.every(sample=>sample.pass)};
  },evolved);
  fs.writeFileSync(path.join(out,`${width}x${height}-timeline.png`),Buffer.from(fixture.gallery.split(',')[1],'base64'));delete fixture.gallery;
  await page.screenshot({path:path.join(out,`${width}x${height}-preparation.png`)});
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();await page.waitForFunction(()=>window.qaEngine?.state.phase==='playing');
  await page.evaluate(evolved=>{
   const s=window.qaEngine.state;
   const ids=['broadcast_crown','sync_gauntlet','extraction_pack','shock_mantle','inspection_wing','barrier_forge'];
   s.premiumGear.equipped=ids;s.premiumGear.owned=ids;s.activePerks.safety_drone=5;
   s.activePerks.hunter_swarm=evolved?1:0;
   s.interactiveHazards=[];
   s.hazards=[{id:'qa-drone-target',type:'RUNAWAY_CART',x:s.player.x+150,y:s.player.y+30,hp:100000,maxHp:100000,speed:0,radius:24,damage:0,expValue:0}];
   window.qaDroneStamps=0;window.qaDroneLaunches=[];
  },evolved);
  await page.waitForFunction(()=>window.qaDroneStamps>0);await page.screenshot({path:path.join(out,`${width}x${height}-launch.png`)});
  await page.waitForTimeout(width===390?5000:1800);
  const actual=await page.evaluate(()=>({stamps:window.qaDroneStamps,launches:window.qaDroneLaunches,overflow:document.documentElement.scrollWidth>innerWidth}));
  const pass=fixture.pass&&actual.stamps>0&&actual.launches.length>0&&actual.launches.every(event=>Math.abs(event.distance-(evolved?85:65))<.1)&&!actual.overflow&&!errors.length;
  reports.push({width,height,...fixture,...actual,errors,pass});
  const video=page.video();await page.close();if(video)fs.renameSync(await video.path(),path.join(out,evolved?'hunter-launch-portrait.webm':'inspection-launch-portrait.webm'));
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
 if(reports.some(report=>!report.pass))process.exitCode=1;
}finally{await browser.close();}
