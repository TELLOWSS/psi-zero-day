import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve('artifacts/drone-v3-cadence');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:5196');await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
 const result=await page.evaluate(async()=>{
  const {SurvivorsSessionAudio}=await import('/src/ui/survivors-session-audio.ts');
  const {DRONE_V3_ASSETS}=await import('/src/app/survivors-drone-sfx-v3.ts');
  const audio=new SurvivorsSessionAudio(),ctx=audio.getContext();await ctx.resume();
  const decoded=[];
  for(const asset of DRONE_V3_ASSETS){const response=await fetch(asset.uri),buffer=await ctx.decodeAudioData(await response.arrayBuffer());
   let energy=0,peak=0;for(const value of buffer.getChannelData(0)){energy+=value*value;peak=Math.max(peak,Math.abs(value));}
   decoded.push({id:asset.id,duration:buffer.duration,peak,rms:Math.sqrt(energy/buffer.length)});
  }
  const preloaded=await audio.preloadEquipmentRecordings(),records=[],nodes=new WeakMap();
  const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.start=function(at,...args){
   if(this.context===ctx){const row={at,duration:this.buffer.duration,rate:this.playbackRate.value};records.push(row);nodes.set(this,row);}
   return start.call(this,at,...args);
  };
  AudioBufferSourceNode.prototype.stop=function(at){const row=nodes.get(this);if(row&&at)row.stop=at;return stop.call(this,at);};
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const bursts=[];
  try{
   for(const busy of [false,true]){
    audio.silence();const begin=records.length;
    for(let i=0;i<40;i++){audio.playDroneV3(['base_release','premium_release','hunter_a','hunter_b'][i%4],undefined,undefined,busy);await wait(100);}
    await wait(600);const admitted=records.slice(begin),gaps=admitted.slice(1).map((row,i)=>row.at-admitted[i].at);
    bursts.push({busy,attempts:40,admitted:admitted.length,minGap:Math.min(...gaps),fullTails:admitted.every(row=>Math.abs(row.stop-row.at-row.duration/row.rate)<.0001)});
   }
   audio.playDroneV3('launch');audio.playDroneV3('dock');await wait(40);
   const beforeMute=audio.voiceCount;audio.setMuted(true);const muted=audio.voiceCount===0;audio.dispose();
   return{decoded,preloaded,bursts,beforeMute,muted,failures:audio.failures,
    pass:preloaded&&decoded.length===6&&decoded.every(d=>d.rms>0&&d.peak<=1)&&beforeMute>0&&muted&&
     bursts.every(b=>b.admitted>5&&b.admitted<40&&b.minGap>=(b.busy?.3:.22)-.001&&b.fullTails)&&!audio.failures.length};
  }finally{AudioBufferSourceNode.prototype.start=start;AudioBufferSourceNode.prototype.stop=stop;audio.dispose();}
 });
 const report={...result,errors,scope:'REAL_WEB_AUDIO_V3_DECODE_CADENCE_TAIL_LIFECYCLE_NOT_LISTENING_APPROVAL',pass:result.pass&&!errors.length};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
