import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));
const out=path.resolve(process.env.PSI_ACCOUNTABILITY_QA_DIR||'artifacts/accountability-audio');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const audioOnly=process.env.PSI_AUDIO_ONLY==='1';
const prior=audioOnly?JSON.parse(fs.readFileSync(path.join(out,'report.json'),'utf8')):null;
if(audioOnly&&(!prior.pass||prior.rows.length!==8))throw new Error('Successful full UI evidence required before audio-only check');
const report={scope:'SAVED_UNLOCK_FIXTURE_REAL_UI_AND_OFFLINE_RENDER_NOT_ANDROID_DEVICE',rows:audioOnly?prior.rows:[],uiEvidenceReused:audioOnly,audio:null,errors:[]};
try {
 if(!audioOnly)for(const viewport of [{width:390,height:844},{width:844,height:390}]) {
  const page=await browser.newPage({viewport,hasTouch:true});page.on('pageerror',e=>report.errors.push(String(e)));
  await page.addInitScript(()=>localStorage.setItem('psi.survivors.unlocked_stages',JSON.stringify(Array.from({length:20},(_,i)=>`stage_${String(i+1).padStart(2,'0')}`))));
  for(const n of ['11','12','13','14']) {
   await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
   await page.locator('.survivors-stage-select-section > summary').click();
   await page.locator('.survivors-stage-card').filter({hasText:`STAGE ${n}`}).click();
   await page.getByRole('button',{name:'순찰 시작하기',exact:true}).click();
   await page.keyboard.down('d');
   const radio=page.locator('.survivors-field-radio');await radio.waitFor({timeout:15000});
   await page.screenshot({path:path.join(out,`${viewport.width}x${viewport.height}-stage${n}-shooting-story.png`)});
   const dialog=page.locator('.survivors-accountability-event');
   for(let tick=0;tick<120&&!await dialog.isVisible();tick++){
    const perk=page.locator('.survivors-perk-card').first();if(await perk.isVisible())await page.keyboard.press('1');
    await page.waitForTimeout(250);
   }
   if(!await dialog.isVisible()){await page.screenshot({path:path.join(out,'failed-encounter.png')});throw new Error('No in-play accountability encounter at stage '+n+': '+await page.locator('.survivors-timer').innerText());}
   await page.keyboard.up('d');
   const confirm=dialog.locator('[data-accountability-confirm]');
   if(!await confirm.isDisabled())throw new Error('Decision available before evidence');
   for(const name of ['근로자 진술 듣기','장비·교육 이해 확인','기록·책임자 확인'])await dialog.getByRole('button',{name,exact:true}).click();
   await confirm.click();const consequence=await dialog.getByRole('status').innerText();
   await dialog.screenshot({path:path.join(out,`${viewport.width}x${viewport.height}-stage${n}.png`)});
   await dialog.getByRole('button',{name:'대체·인계 계획 확인 후 순찰 시작',exact:true}).click();
   await page.locator('.survivors-hud-top').waitFor();
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('psi.survivors.accountability.v1')));
   report.rows.push({viewport,stage:n,decisionCount:saved.length,consequence,pass:saved.length===Number(n)-10});
  }
  // Replay cannot create a fourth strike; the access consequence remains visible.
  await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173');
  await page.getByRole('button',{name:/야간 긴급 순찰/}).click();
  await page.getByText(/민재의 이 현장 출입배제 기록이 인계됐다/).waitFor();
  await page.close();
 }
 const page=await browser.newPage();await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173');
 report.audio=await page.evaluate(async()=>{
  const {SurvivorsSessionAudio}=await import('/src/ui/survivors-session-audio.ts');
  const kinds=['radio','extinguisher','drone_laser','cryo_blast','tesla_bolt','emf_beam','cone_trap'];
  const original=window.AudioContext;const renders=[];
  for(const kind of kinds) {
   const ctx=new OfflineAudioContext(2,22050,44100);Object.defineProperty(ctx,'state',{value:'running'});
   window.AudioContext=function(){return ctx;};
   const audio=new SurvivorsSessionAudio();audio.playEquipmentFeedback({projectileId:'preview',kind,phase:'impact',x:0,y:0,angle:0,radius:12},{x:0,y:0});
   const rendered=await ctx.startRendering(),left=Array.from(rendered.getChannelData(0)),right=Array.from(rendered.getChannelData(1));
   const peak=Math.max(...left.map(Math.abs),...right.map(Math.abs));renders.push({kind,peak,left,right});
  }
  // A single actual source graph receives every equipment phase in a dense batch.
  const ctx=new OfflineAudioContext(2,22050,44100);Object.defineProperty(ctx,'state',{value:'running'});window.AudioContext=function(){return ctx;};
  const audio=new SurvivorsSessionAudio();
  for(const kind of [...kinds,'hunter_beam','satellite_wave','shout_shockwave'])for(const phase of ['launch','impact','release'])audio.playEquipmentFeedback({projectileId:kind,kind,phase,x:0,y:0,angle:0,radius:12},{x:0,y:0});
  const maximumVoices=audio.voiceCount;const rendered=await ctx.startRendering();const peak=Math.max(...rendered.getChannelData(0).map(Math.abs),...rendered.getChannelData(1).map(Math.abs));
  audio.setMuted(true);audio.playDecisionCue('record');const silentVoices=audio.voiceCount;
  window.AudioContext=original;
  return {maximumVoices,silentVoices,stressPeak:peak,pass:maximumVoices<=24&&silentVoices===0&&peak<.99&&renders.every(r=>r.peak>0&&r.peak<.99),renders};
 });
 // Preview uses the production Web Audio renderer. No invented approval metadata.
 const segments=report.audio.renders,previewGain=Math.min(12,.5/Math.max(...segments.map(r=>r.peak)));report.audio.previewGain=previewGain;const frames=segments.reduce((sum,r)=>sum+r.left.length,0),pcm=Buffer.alloc(frames*4);let offset=0;
 for(const segment of segments)for(let i=0;i<segment.left.length;i++){pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,segment.left[i]*previewGain))*32767),offset);pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,segment.right[i]*previewGain))*32767),offset+2);offset+=4;}
 const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(2,22);header.writeUInt32LE(44100,24);header.writeUInt32LE(176400,28);header.writeUInt16LE(4,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
 fs.writeFileSync(path.join(out,'equipment-contact-preview.wav'),Buffer.concat([header,pcm]));
 report.audio.renders=segments.map(({kind,peak})=>({kind,peak}));report.pass=report.rows.every(r=>r.pass)&&report.audio.pass&&!report.errors.length;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
}finally{await browser.close();}
