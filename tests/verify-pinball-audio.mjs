import fs from 'node:fs';import {createHash} from 'node:crypto';import {createRequire} from 'node:module';import {createServer} from 'vite';
const require=createRequire(import.meta.url),{chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const server=await createServer({server:{host:'127.0.0.1',port:5213,strictPort:true,hmr:false}});await server.listen();
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--autoplay-policy=no-user-gesture-required']});
try{const page=await browser.newPage();await page.goto('http://127.0.0.1:5213/');
 const report=await page.evaluate(async()=>{const {PINBALL_AUDIO_FILES,PinballAudio}=await import('/src/ui/survivors-pinball-audio.ts');const ctx=new AudioContext(),assets=[];
  for(const [event,file] of Object.entries(PINBALL_AUDIO_FILES)){const bytes=await fetch('/assets/survivors/pinball/audio-candidates-v1/'+file).then(r=>r.arrayBuffer());const b=await ctx.decodeAudioData(bytes);let peak=0,energy=0,over=0;for(let c=0;c<b.numberOfChannels;c++)for(const v of b.getChannelData(c)){peak=Math.max(peak,Math.abs(v));energy+=v*v;if(Math.abs(v)>=1)over++;}
   assets.push({event,file,duration:b.duration,decodedSampleRate:b.sampleRate,channels:b.numberOfChannels,peakDb:20*Math.log10(peak),rmsDb:20*Math.log10(Math.sqrt(energy/(b.length*b.numberOfChannels))),overFullScaleSamples:over});}
  await ctx.close();const a=new PinballAudio();await a.load();await a.unlock();a.setActive(true);a.play('metal');a.play('crane');a.play('flipper');await new Promise(r=>setTimeout(r,150));
  const active={music:!!a.musicSource,voices:a.voices.size,state:a.context.state};a.setActive(false);const stopped={music:!!a.musicSource,voices:a.voices.size,offset:a.offset};a.setMusic('theme');a.setActive(true);const alternate=!!a.musicSource;const peak=[];for(const [key,b] of a.buffers){let p=0;for(let c=0;c<b.numberOfChannels;c++)for(const v of b.getChannelData(c))p=Math.max(p,Math.abs(v));peak.push({key,peak:p});}a.dispose();return {assets,active,stopped,alternate,peak};
 });
 if(report.assets.some(a=>!Number.isFinite(a.rmsDb)||a.duration<=0)||!report.active.music||report.active.voices<1||report.stopped.music||report.stopped.voices||!report.alternate||report.peak.some(p=>p.peak>.701))throw Error(JSON.stringify(report));
 for(const asset of report.assets){asset.sha256=createHash('sha256').update(fs.readFileSync('public/assets/survivors/pinball/audio-candidates-v1/'+asset.file)).digest('hex');asset.status='CANDIDATE';asset.listeningApproval=false;asset.rightsApproval=false;}
 fs.mkdirSync('artifacts/pinball',{recursive:true});fs.writeFileSync('artifacts/pinball/audio-report.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync('content/pinball-audio-candidates-v1.json',JSON.stringify(report.assets,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();await server.close();}
