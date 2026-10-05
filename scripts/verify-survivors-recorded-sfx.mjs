import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve(process.env.PSI_SURVIVORS_QA_DIR||'artifacts/recorded-sfx');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],loaded=new Set();
 page.on('pageerror',error=>errors.push(String(error)));
 page.on('response',response=>{if(response.url().includes('/sfx-v1/')&&response.ok())loaded.add(response.url().split('/').pop());});
 await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5196');
 await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
 await page.getByRole('button',{name:'PSI 상점 · 구매·수리',exact:true}).click();
 const result=await page.evaluate(async()=>{
   const {RECORDED_SFX}=await import('/src/app/survivors-sfx-assets.ts');
   const {SurvivorsSessionAudio}=await import('/src/ui/survivors-session-audio.ts');
   const audio=new SurvivorsSessionAudio(),ctx=audio.getContext();await ctx.resume();
   const decoded=[];
   for(const asset of RECORDED_SFX){
     const response=await fetch(asset.uri),buffer=await ctx.decodeAudioData(await response.arrayBuffer());
     let peak=0,energy=0;const data=buffer.getChannelData(0);
     for(const value of data){peak=Math.max(peak,Math.abs(value));energy+=value*value;}
     decoded.push({id:asset.id,duration:buffer.duration,peak,rms:Math.sqrt(energy/data.length),channels:buffer.numberOfChannels});
   }
   const preloaded=await audio.preloadEquipmentRecordings();
   for(const asset of RECORDED_SFX)audio.playRecordedEffect(asset.id);
   await new Promise(resolve=>setTimeout(resolve,40));const voices=audio.voiceCount;
   audio.setMuted(true);const cancelled=audio.voiceCount===0;audio.dispose();
   return {decoded,preloaded,voices,cancelled,pass:preloaded&&voices>0&&voices<=24&&cancelled&&decoded.every(item=>item.duration>0&&item.peak<1&&item.rms>0)};
 });
 const report={...result,loaded:[...loaded],errors,scope:'CHROMIUM_DECODE_AND_LIFECYCLE_NOT_SEMANTIC_LISTENING_APPROVAL',pass:result.pass&&!errors.length&&loaded.size===8};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
