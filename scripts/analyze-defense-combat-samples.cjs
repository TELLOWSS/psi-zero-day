const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PSI_PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,headless:true});
 try{
  const page=await browser.newPage();await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4176/');
  const result=await page.evaluate(async()=>{
   const context=new AudioContext(),rows=[];
   try{for(const file of ['control-resolve.ogg','area-resolve.ogg','control-barrier-clack.ogg']){
    const response=await fetch('/assets/defense/audio/g8a/'+file);if(!response.ok)throw Error(file);
    const buffer=await context.decodeAudioData(await response.arrayBuffer());const samples=buffer.getChannelData(0);
    const energy=seconds=>{let power=0,peak=0,count=Math.min(samples.length,Math.floor(seconds*buffer.sampleRate));for(let i=0;i<count;i++){power+=samples[i]*samples[i];peak=Math.max(peak,Math.abs(samples[i]));}return {rms:Math.sqrt(power/count),peak};};
    rows.push({file,duration:buffer.duration,sampleRate:buffer.sampleRate,channels:buffer.numberOfChannels,attack:energy(.09),impact:energy(.22)});
   }}finally{await context.close();}return rows;
  });
  const out=path.resolve(process.env.PSI_QA_OUTPUT||'docs/qa/defense-combat-av-20261015');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'sample-analysis.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));if(result.some(r=>r.attack.rms<.00001||r.impact.rms<.00001||r.attack.peak>=1))throw Error('Silent or clipped sample prefix');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
