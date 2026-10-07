import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5200');
 const result=await page.evaluate(async()=>{
  const {SurvivorsSessionAudio}=await import('/src/ui/survivors-session-audio.ts');
  const {recordedSfxFamily}=await import('/src/app/survivors-sfx-assets.ts');
  const decoded=[];
  const ctx=new AudioContext();await ctx.resume();
  for(const id of ['impact_steel','impact_concrete','impact_finisher'])for(const asset of recordedSfxFamily(id)){
   const response=await fetch(asset.uri);if(!response.ok)throw new Error('Missing '+asset.uri);
   const buffer=await ctx.decodeAudioData(await response.arrayBuffer());
   let peak=0;for(const sample of buffer.getChannelData(0))peak=Math.max(peak,Math.abs(sample));
   decoded.push({id,uri:asset.uri,duration:buffer.duration,channels:buffer.numberOfChannels,peak});
  }
  await ctx.close();
  let starts=0;const original=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(...args){starts++;return original.apply(this,args);};
  const audio=new SurvivorsSessionAudio();
  try{
   const preloaded=await audio.preloadEquipmentRecordings();
   const event={projectileId:'qa',kind:'radio',phase:'impact',x:0,y:0,angle:0,radius:4};
   for(const actorKind of ['RUNAWAY_CART','FALLING_DEBRIS','CRANE_BOSS']){
    await new Promise(r=>setTimeout(r,500));
    audio.playEquipmentFeedback({...event,actorKind,critical:actorKind==='CRANE_BOSS'},{x:0,y:0});
    await new Promise(r=>setTimeout(r,30));
   }
   const audibleStarts=starts;audio.silence();const silenced=audio.voiceCount===0;
   audio.setMuted(true);audio.playEquipmentFeedback({...event,actorKind:'CRANE_BOSS',critical:true},{x:0,y:0});
   await new Promise(r=>setTimeout(r,100));
   return {decoded,preloaded,audibleStarts,silenced,muted:starts===audibleStarts,failures:audio.failures};
  }finally{audio.dispose();AudioBufferSourceNode.prototype.start=original;}
 });
 result.errors=errors;result.pass=result.decoded.length===9&&result.decoded.every(r=>r.peak>0&&r.peak<.72&&r.channels===1&&r.duration>.4&&r.duration<.6)&&result.preloaded&&result.audibleStarts===3&&result.silenced&&result.muted&&!errors.length&&!result.failures.length;
 fs.mkdirSync('artifacts/impact-audio',{recursive:true});fs.writeFileSync('artifacts/impact-audio/report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));if(!result.pass)process.exitCode=1;
}finally{await browser.close();}
