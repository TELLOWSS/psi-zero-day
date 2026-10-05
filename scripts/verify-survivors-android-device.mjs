import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {parseAdbDevices,androidProbeDecision,summarizeFrameIntervals} from './survivors-android-probe.mjs';
const out=path.resolve('artifacts/android-device');fs.mkdirSync(out,{recursive:true});
const adb=process.env.ADB_BIN??path.resolve('artifacts/android-tools/platform-tools/adb.exe');
const report={requestedDevice:'Galaxy S26 Ultra',kind:'physical-device',verified:false,measured:false,reason:'not-started'};
const save=()=>{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));};
let browser,forwarded=false,selected,port;
try {
 const run=args=>execFileSync(adb,args,{encoding:'utf8',timeout:15000,windowsHide:true}).trim();
 const decision=androidProbeDecision(parseAdbDevices(run(['devices','-l'])),process.env.ANDROID_SERIAL);
 if(!decision.ready){report.reason=decision.reason;process.exitCode=2;}
 else {
  selected=decision.serial;const device=args=>run(['-s',selected,...args]);
  report.device={model:device(['shell','getprop','ro.product.model']),manufacturer:device(['shell','getprop','ro.product.manufacturer']),android:device(['shell','getprop','ro.build.version.release']),screen:device(['shell','wm','size']),density:device(['shell','wm','density'])};
  report.verified=true;
  const battery=()=>device(['shell','dumpsys','battery']).split(/\r?\n/).filter(line=>/^\s*(level|temperature|status):/.test(line)).map(line=>line.trim());
  report.batteryBefore=battery();
  port=device(['forward','tcp:0','localabstract:chrome_devtools_remote']);forwarded=true;
  const require=createRequire(import.meta.url);const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
  browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`,{timeout:15000});
  const page=browser.contexts().flatMap(context=>context.pages()).find(page=>{
   try {return new URL(page.url()).hostname==='psi-zero-day.vercel.app';}catch{return false;}
  });
  if(!page){report.reason='open-production-game-in-phone-chrome';process.exitCode=2;}
  else {
   const raw=await page.evaluate(()=>new Promise(resolve=>{
    const canvas=document.querySelector('.survivors-canvas');
    const active=()=>!!document.querySelector('.survivors-ultimate-btn')&&document.visibilityState==='visible';
    if(!canvas||!canvas.getBoundingClientRect().width||!active()){resolve({ready:false,reason:'visible-active-game-required'});return;}
    const start=performance.now(),frames=[],longTasks=[];let previous=start;
    const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries())longTasks.push(entry.duration);});observer.observe({type:'longtask',buffered:false});
    const finish=reason=>{if(done)return;done=true;observer.disconnect();clearTimeout(timer);cancelAnimationFrame(raf);resolve({ready:!reason,reason,frames,longTasks,elapsed:performance.now()-start,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},canvas:{width:canvas.width,height:canvas.height},overflow:document.documentElement.scrollWidth>innerWidth});};
    let done=false,raf;const timer=setTimeout(()=>finish('sampling-timeout'),35000);
    const tick=now=>{if(!active()){finish('game-interrupted-or-hidden');return;}frames.push(now-previous);previous=now;if(now-start>=30000)finish();else raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
   }));
   const {frames=[],longTasks=[],...detail}=raw;report.sample={...detail,...summarizeFrameIntervals(frames),longTaskCount:longTasks.length,maxLongTaskMs:Math.max(0,...longTasks)};
   report.measured=raw.ready&&frames.length>120&&!raw.overflow;report.reason=report.measured?'sampled-not-full-stage-approval':raw.reason??'insufficient-frames';
   report.batteryAfter=battery();if(!report.measured)process.exitCode=2;
  }
 }
}catch(error){report.reason='probe-error';report.error=String(error);process.exitCode=2;}
finally {
 // Disconnect our CDP client without closing the user's Chrome or tabs.
 if(browser)await browser.close();
 if(forwarded)try{execFileSync(adb,['-s',selected,'forward','--remove',`tcp:${port}`],{windowsHide:true,timeout:15000});}catch{}
 save();
}
