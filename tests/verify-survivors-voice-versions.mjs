import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const url=process.env.PSI_PREVIEW_URL;if(!url)throw Error('Set PSI_PREVIEW_URL');
const assets=['v1','p1-v1','covert-v1','engineer-v1'].flatMap(version=>JSON.parse(fs.readFileSync(`content/survivors-player-voice-${version}-ingest.json`,'utf8')).assets);
fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN}),rows=[];
try{
 const sizes=process.env.PSI_VOICE_LANDSCAPE_ONLY==='1'?[[844,390]]:[[1440,900],[390,844],[844,390]];
 for(const [width,height] of sizes)for(const version of ['original','covert','engineer']){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.addInitScript(assets=>{
   const data=window.qaVoiceVersion={files:[],starts:[]},buffers=new WeakMap(),names=new Map(assets.map(row=>[row.sha256,row.file]));
   const fetchOriginal=window.fetch;window.fetch=async(...args)=>{const uri=String(args[0]);if(uri.includes('/voice-player-'))data.files.push(uri);return fetchOriginal(...args);};
   const create=AudioContext.prototype.createBufferSource,decode=AudioContext.prototype.decodeAudioData;
   AudioContext.prototype.decodeAudioData=async function(bytes){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');const buffer=await decode.call(this,bytes);if(names.has(hash))buffers.set(buffer,names.get(hash));return buffer;};
   AudioContext.prototype.createBufferSource=function(){const source=create.call(this),start=source.start.bind(source);source.start=(...args)=>{const file=buffers.get(source.buffer);if(file)data.starts.push(file);return start(...args);};return source;};
  },assets);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(url,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  const select=page.getByRole('combobox',{name:'주인공 음성',exact:true});await select.selectOption(version);
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('button',{name:/시그널 워치.*SURVIVORS/}).click();
  if(await select.inputValue()!==version)throw Error('Voice selection did not persist');
  await page.screenshot({path:path.resolve('artifacts',`voice-version-${width}-${height}-${version}.png`)});
  const fits=await select.evaluate(element=>{const r=element.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.height>=44;});
  await page.getByRole('button',{name:'시그널 워치 시작',exact:true}).click();
  await page.waitForFunction(()=>window.qaVoiceVersion.files.length===26&&window.qaVoiceVersion.starts.length>0);
  const evidence=await page.evaluate(()=>window.qaVoiceVersion);
  const suffix=version==='original'?/_v01\.wav$/:new RegExp(`_v01_${version}\\.wav$`);
  const pass=fits&&evidence.files.every(file=>suffix.test(file))&&evidence.starts.some(file=>file.includes('_START_A_')&&suffix.test(file))&&!errors.length;
  rows.push({width,height,version,fits,files:evidence.files,starts:evidence.starts,errors,pass});
  fs.writeFileSync('artifacts/voice-versions-report.json',JSON.stringify({url,rows},null,2));
  await page.close();
 }
 fs.writeFileSync('artifacts/voice-versions-report.json',JSON.stringify({url,rows},null,2));
 console.log(JSON.stringify(rows.map(({files,...row})=>row)));if(rows.some(row=>!row.pass))process.exitCode=1;
}finally{await browser.close();}
