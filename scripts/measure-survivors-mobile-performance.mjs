import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PERF_URL??'http://127.0.0.1:5196';
const out=path.resolve('artifacts/mobile-performance');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
const percentile=(values,p)=>values.length?[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]:null;
try {
 const rows=[];
 for(const [width,height] of [[390,844],[844,390]])for(const throttle of [1,4]){
  if(process.env.PSI_PERF_CASE&&process.env.PSI_PERF_CASE!==`${width}x${height}-${throttle}x`)continue;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url);await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.evaluate(async()=>{
   const {SurvivorsEngine}=await import('/src/engine/patrol-survivors-engine.ts');const update=SurvivorsEngine.prototype.update;
   SurvivorsEngine.prototype.update=function(...args){window.perfEngine=this;return update.apply(this,args);};
  });
  await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
  await page.waitForFunction(()=>window.perfEngine?.state.gameTime>.3);
  const client=await context.newCDPSession(page);await client.send('Emulation.setCPUThrottlingRate',{rate:throttle});
  if(process.env.PSI_PERF_PROFILE==='1'){await client.send('Profiler.enable');await client.send('Profiler.start');}
  // Observe real early combat without changing health, enemies, weapons or clock.
  const raw=await page.evaluate(()=>new Promise(resolve=>{
   const start=performance.now(),intervals=[],longTasks=[],phases={},counts={hazards:0,projectiles:0};let last=start,playing=0;
   const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())longTasks.push(entry.duration);});observer.observe({type:'longtask',buffered:false});
   const tick=now=>{
    const state=window.perfEngine.state;phases[state.phase]=(phases[state.phase]??0)+1;
    if(state.phase==='playing'){intervals.push(now-last);playing++;counts.hazards=Math.max(counts.hazards,state.hazards.length);counts.projectiles=Math.max(counts.projectiles,state.projectiles.length);}
    last=now;
    if(now-start<15000){requestAnimationFrame(tick);return;}
    observer.disconnect();const canvas=document.querySelector('.survivors-canvas');
    resolve({intervals,longTasks,phases,playing,counts,elapsed:now-start,gameTime:state.gameTime,canvas:{width:canvas.width,height:canvas.height},overflow:document.documentElement.scrollWidth>innerWidth});
   };requestAnimationFrame(tick);
  }));
  const {intervals,longTasks,...detail}=raw;
  if(process.env.PSI_PERF_PROFILE==='1'){
   const {profile}=await client.send('Profiler.stop');fs.writeFileSync(path.join(out,`${width}x${height}-${throttle}x.cpuprofile`),JSON.stringify(profile));
   const hits=new Map();for(const id of profile.samples??[])hits.set(id,(hits.get(id)??0)+1);
   detail.cpuHotspots=profile.nodes.map(node=>({name:node.callFrame.functionName,url:node.callFrame.url,line:node.callFrame.lineNumber+1,samples:hits.get(node.id)??0})).sort((a,b)=>b.samples-a.samples).slice(0,12);
  }
  const row={width,height,dpr:2,cpuThrottle:throttle,kind:'desktop-chrome-emulation-not-physical-device',...detail,medianFrameMs:percentile(intervals,.5),p95FrameMs:percentile(intervals,.95),over50ms:intervals.filter(v=>v>50).length,longTaskCount:longTasks.length,maxLongTaskMs:Math.max(0,...longTasks),errors};
  row.measured=raw.playing>120&&!row.overflow&&!errors.length;
  row.target30fps=row.measured&&row.p95FrameMs<=34;
  await page.screenshot({path:path.join(out,`${width}x${height}-${throttle}x.png`)});
  rows.push(row);console.log(JSON.stringify(row));await context.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));
 if(rows.some(row=>!row.measured))process.exitCode=1;
}finally{await browser.close();}
