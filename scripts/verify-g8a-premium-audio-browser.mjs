import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173';
const outDir=path.resolve(process.env.PSI_G8A_AUDIO_ARTIFACT_DIR||'artifacts/g8a-premium-audio');
fs.mkdirSync(outDir,{recursive:true});

const contract=JSON.parse(fs.readFileSync(path.resolve('content/defense/g8a-premium-audio-production.json'),'utf8'));
const finalMode=contract.status==='AUDIO_PRODUCTION_LOCKED' && contract.acceptance?.productionLockAllowed===true;
const qaMode=contract.status==='PREMIUM_AUDIO_QA_READY'
  && contract.acceptance?.runtimeQaAllowed===true
  && contract.acceptance?.productionLockAllowed===false;
const runtimeMode=qaMode||finalMode;

const chrome=[
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(p=>fs.existsSync(p));
if(!chrome) throw new Error('Chrome/Chromium required');

const port=Number(process.env.PSI_CHROME_DEBUG_PORT||9891);
const profileDir=fs.mkdtempSync('/tmp/psi-g8a-audio-');
const browser=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--mute-audio',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port='+port,'--user-data-dir='+profileDir,'about:blank',
],{stdio:['ignore','pipe','pipe']});

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitJson(url,timeout=30000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    try{const r=await fetch(url);if(r.ok)return r.json();}catch{}
    await sleep(100);
  }
  throw new Error('Timeout '+url);
}
class Cdp{
  constructor(url){
    this.socket=new WebSocket(url);this.id=1;this.pending=new Map();this.events=new Map();
    this.opened=new Promise((resolve,reject)=>{
      this.socket.addEventListener('open',resolve,{once:true});
      this.socket.addEventListener('error',reject,{once:true});
    });
    this.socket.addEventListener('message',e=>{
      const m=JSON.parse(e.data);
      if(m.id){
        const p=this.pending.get(m.id);if(!p)return;
        this.pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);return;
      }
      for(const fn of this.events.get(m.method)||[]) fn(m.params);
    });
  }
  async send(method,params={}){await this.opened;const id=this.id++;const p=new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));this.socket.send(JSON.stringify({id,method,params}));return p;}
  async once(method,timeout=10000){await this.opened;return new Promise((resolve,reject)=>{const fn=p=>{clearTimeout(t);this.events.set(method,(this.events.get(method)||[]).filter(x=>x!==fn));resolve(p)};const t=setTimeout(()=>reject(new Error('Timeout '+method)),timeout);this.events.set(method,[...(this.events.get(method)||[]),fn]);});}
  close(){this.socket.close();}
}
async function evaluate(cdp,expression){
  const r=await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text||'Runtime error');
  return r.result?.value;
}
async function waitFor(cdp,expr,timeout=12000){
  const start=Date.now();
  while(Date.now()-start<timeout){if(await evaluate(cdp,expr))return;await sleep(80);}
  throw new Error('Timeout '+expr);
}
async function viewport(cdp,width,height,mobile){
  await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:mobile?2.75:1,mobile,screenOrientation:width>height?{type:'landscapePrimary',angle:90}:{type:'portraitPrimary',angle:0}});
}
async function navigate(cdp){
  const loaded=cdp.once('Page.loadEventFired',15000);
  await cdp.send('Page.navigate',{url:baseUrl});await loaded;
  await waitFor(cdp,"Boolean(document.querySelector('.commercial-title-home'))");
}
function fnv1a32(value){let hash=0x811c9dc5;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,0x01000193);}return 'fnv1a32:'+(hash>>>0).toString(16).padStart(8,'0');}

function baseRun(runId){
  return {
    runId,mode:'TRAINING',variant:'STANDARD',
    scenarioId:'training-site:apt-new-bottom-up-excavation',eventId:null,eventContentVersion:null,
    status:'RUNNING',paused:true,speed:1,tick:4120,waveId:8,waveTick:84,intermissionRemaining:0,
    shield:18,resource:500,towers:[],enemies:[],spawnedByGroup:[8,1],
    nextTowerSequence:1,nextEnemySequence:12,supportId:'COORDINATOR',supportCooldownRemaining:0,
    freezeMovementUntilTick:0,revealAllUntilTick:0,rangeBonusUntilTick:0,completedWaves:7,leakedByEnemy:{},
  };
}
function swiftEnemy(slow=false){
  return {
    id:'enemy-11',enemyId:'SWIFT',hp:28,distance:42,spawnSequence:11,revealUntilTick:0,
    slowEffects:slow?[{sourceId:'control-1',fraction:0.3,startTick:4100,endTick:4300}]:[],
    bossPhaseTriggered:false,bossArmorFromTick:0,bossArmorUntilTick:0,
  };
}
function controlTower(){
  return {
    id:'control-1',padId:'BU-P3',towerId:'CONTROL',levelId:'L1',targetMode:'FIRST',
    invested:90,attackCooldown:0,revealCooldown:0,
  };
}
function runForCase(name){
  if(name==='READY_TO_WAVE_BUILD'){
    return {...baseRun('g8a-audio-ready'),status:'READY',paused:false,waveId:8,waveTick:0,spawnedByGroup:[0,0],enemies:[]};
  }
  if(name==='SWIFT_THREAT'){
    return {...baseRun('g8a-audio-swift'),enemies:[swiftEnemy(false)],towers:[]};
  }
  if(name==='CONTROL_INTERVENTION'){
    return {...baseRun('g8a-audio-control'),enemies:[swiftEnemy(true)],towers:[controlTower()],nextTowerSequence:2};
  }
  if(name==='RESOLUTION'){
    return {
      ...baseRun('g8a-audio-resolution'),
      waveId:10,waveTick:999,completedWaves:9,spawnedByGroup:[1,10,8],enemies:[],towers:[],
    };
  }
  throw new Error('Unknown audio QA case '+name);
}
function saveForCase(name){
  const run=runForCase(name);
  const payload={
    activeRun:run,
    records:[{
      scenarioId:run.scenarioId,finishedRuns:0,clears:0,bestStars:0,bestScore:0,bestShield:0,
      bestCompletedWaves:Math.max(0,run.completedWaves),lastResultRunId:null,updatedAt:'2026-09-26T00:00:00.000Z',
    }],
    cosmeticIds:[],claimIds:[],settledRunIds:[],
  };
  return {
    namespace:'defense',schemaVersion:1,rulesVersion:'zero-breach-1.0.0',contentVersion:'prototype-1.0.0',
    buildVersion:'g8a-audio-final-integration-qa',revision:1,savedAt:'2026-09-26T00:00:00.000Z',
    checksum:fnv1a32(JSON.stringify(payload)),payload,
  };
}
async function clickText(cdp,text,scope='button'){
  const ok=await evaluate(cdp,`(()=>{const el=[...document.querySelectorAll(${JSON.stringify(scope)})].find(x=>(x.textContent||'').includes(${JSON.stringify(text)}));if(!el)return false;el.click();return true})()`);
  if(!ok) throw new Error('Button not found '+text);
}
async function trustedClick(cdp, elementExpression, label){
  const point=await evaluate(cdp,`(()=>{
    const el=${elementExpression};
    if(!el)return null;
    const r=el.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  })()`);
  if(!point) throw new Error('Trusted click target missing: '+label);
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',buttons:1,clickCount:1});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',buttons:0,clickCount:1});
}
async function installTelemetry(cdp){
  await evaluate(cdp,`(()=>{
    window.__psiAudioTelemetry={premiumBinary:0,oscillatorFallback:0,mixTransitions:[],cueEvents:0,sources:[],mixPlaybackSuccess:0,mixPlaybackFailures:0,mixPlaybackEvents:[]};
    window.addEventListener('psi:defense-audio-cue',()=>window.__psiAudioTelemetry.cueEvents++);
    window.addEventListener('psi:defense-audio-source',event=>{
      const d=event.detail||{};
      window.__psiAudioTelemetry.sources.push(d);
      if(d.source==='premium-binary')window.__psiAudioTelemetry.premiumBinary++;
      if(d.source==='oscillator-fallback')window.__psiAudioTelemetry.oscillatorFallback++;
    });
    window.addEventListener('psi:g8a-premium-mix',event=>window.__psiAudioTelemetry.mixTransitions.push(event.detail||{}));
    window.addEventListener('psi:g8a-premium-playback',event=>{
      const d=event.detail||{};
      window.__psiAudioTelemetry.mixPlaybackEvents.push(d);
      if(d.status==='playing')window.__psiAudioTelemetry.mixPlaybackSuccess++;
      if(d.status==='failed')window.__psiAudioTelemetry.mixPlaybackFailures++;
    });
    return true;
  })()`);
}
async function seedCase(cdp,name){
  const save=saveForCase(name);
  await evaluate(cdp,`(()=>{
    localStorage.setItem('psi-zero-day.defense.save.v1',${JSON.stringify(JSON.stringify(save))});
    localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');
    return true;
  })()`);
}
async function enterPersistedRun(cdp,name){
  await seedCase(cdp,name);
  await installTelemetry(cdp);
  await clickText(cdp,'현장 디펜스');
  await waitFor(cdp,`Boolean(document.querySelector('[data-defense-screen="persistence-gate"]')) || document.body.textContent.includes('중단한 훈련이 있습니다')`);
  await clickText(cdp,'이어서 훈련');
  await waitFor(cdp,`document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-map')==='map-apt-bottom-up-excavation-01'`);
}
async function armByResume(cdp){
  const ok=await evaluate(cdp,`(()=>{
    const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes('계속')||(x.textContent||'').includes('재개'));
    if(b){b.click();return true}
    const h=document.querySelector('.zb-hud-button');
    if(h){h.click();return true}
    return false;
  })()`);
  if(!ok) throw new Error('Could not resume representative run to arm audio');
}
async function triggerPremiumPlacementCue(cdp){
  const selected=await evaluate(cdp,`(()=>{
    const b=[...document.querySelectorAll('.zb-pad-hit')].find(x=>!(x.getAttribute('aria-label')||'').includes('타워 설치됨'));
    if(!b)return false;b.click();return true;
  })()`);
  if(!selected) return false;
  await waitFor(cdp,"Boolean(document.querySelector('.zb-tower-shop button:not([disabled])'))",3000);
  return evaluate(cdp,`(()=>{const b=document.querySelector('.zb-tower-shop button:not([disabled])');if(!b)return false;b.click();return true})()`);
}
async function snapshot(cdp){
  return evaluate(cdp,`(()=>{
    const shell=document.querySelector('[data-defense-screen="combat"]');
    return {
      premiumAudio:shell?.getAttribute('data-premium-audio')||null,
      premiumMixState:shell?.getAttribute('data-premium-mix-state')||null,
      telemetry:window.__psiAudioTelemetry||null,
      map:shell?.getAttribute('data-map')||null,
      status:shell?.getAttribute('data-status')||null,
    };
  })()`);
}
async function resetToHome(cdp){
  await evaluate(cdp,"localStorage.removeItem('psi-zero-day.defense.save.v1'); true");
  await navigate(cdp);
}
async function runAudioCase(cdp,name){
  await resetToHome(cdp);
  await enterPersistedRun(cdp,name);
  const before=await snapshot(cdp);
  if(before.map!=='map-apt-bottom-up-excavation-01') throw new Error(name+': G8-A map mismatch');
  if(runtimeMode && before.premiumAudio!=='true') throw new Error(name+': premium QA runtime not enabled');

  if(name==='READY_TO_WAVE_BUILD'){
    if(before.premiumMixState!=='READY') throw new Error('READY state not exposed before wave start: '+JSON.stringify(before));
    const started=await evaluate(cdp,`(()=>{const b=document.querySelector('.zb-start-wave');if(!b)return false;b.click();return true})()`);
    if(!started) throw new Error('READY_TO_WAVE_BUILD: start-wave button missing');
    await waitFor(cdp,`document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-premium-mix-state')==='WAVE_BUILD'`,5000);
    await triggerPremiumPlacementCue(cdp);
    await sleep(900);
  }else if(name==='SWIFT_THREAT'){
    await armByResume(cdp);
    await waitFor(cdp,`document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-premium-mix-state')==='SWIFT_THREAT'`,5000);
    await triggerPremiumPlacementCue(cdp);
    await sleep(900);
  }else if(name==='CONTROL_INTERVENTION'){
    await armByResume(cdp);
    await waitFor(cdp,`document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-premium-mix-state')==='CONTROL_INTERVENTION'`,5000);
    await sleep(1000);
  }else if(name==='RESOLUTION'){
    await armByResume(cdp);
    await waitFor(cdp,`document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-status')==='WON'`,5000);
    await waitFor(cdp,`document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-premium-mix-state')==='RESOLUTION'`,5000);
    await sleep(1000);
  }

  const after=await snapshot(cdp);
  const expected=name==='READY_TO_WAVE_BUILD'?'WAVE_BUILD':name;
  if(after.premiumMixState!==expected) throw new Error(name+': expected '+expected+' got '+after.premiumMixState);
  if(runtimeMode){
    if((after.telemetry?.oscillatorFallback??-1)!==0) throw new Error(name+': oscillator fallback detected '+JSON.stringify(after.telemetry));
    if((after.telemetry?.mixTransitions?.length??0)<1) throw new Error(name+': no premium mix transition observed');
  }
  return {before,after};
}

const report={
  schemaVersion:3,qaMode,finalMode,runtimeMode,
  sourceSha:process.env.GITHUB_SHA||null,
  desktop:{cases:{}},mobile:{cases:{}},
  stateCoverage:[],premiumBinaryCueCount:0,oscillatorFallbackCount:0,
  failures:[],
};
let cdp,target;
try{
  await waitJson('http://127.0.0.1:'+port+'/json/version');
  const r=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'});target=await r.json();
  cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.send('Page.enable');await cdp.send('Runtime.enable');

  const cases=['READY_TO_WAVE_BUILD','SWIFT_THREAT','CONTROL_INTERVENTION','RESOLUTION'];
  for(const cfg of [{name:'desktop',w:1440,h:900,m:false},{name:'mobile',w:390,h:844,m:true}]){
    await viewport(cdp,cfg.w,cfg.h,cfg.m);
    await navigate(cdp);
    for(const name of cases){
      const result=await runAudioCase(cdp,name);
      report[cfg.name].cases[name]=result;
      const states=[
        result.before?.premiumMixState,
        ...(result.after?.telemetry?.mixTransitions||[]).map(x=>x.state),
        result.after?.premiumMixState,
      ].filter(Boolean);
      for(const state of states) if(!report.stateCoverage.includes(state)) report.stateCoverage.push(state);
      report.premiumBinaryCueCount+=result.after?.telemetry?.premiumBinary||0;
      report.oscillatorFallbackCount+=result.after?.telemetry?.oscillatorFallback||0;
    }
  }

  const required=['READY','WAVE_BUILD','SWIFT_THREAT','CONTROL_INTERVENTION','RESOLUTION'];
  for(const state of required) if(!report.stateCoverage.includes(state)) throw new Error('Missing G8-A premium state coverage: '+state);
  if(runtimeMode && report.premiumBinaryCueCount<2) throw new Error('Insufficient premium binary cue evidence: '+report.premiumBinaryCueCount);
  if(runtimeMode && report.oscillatorFallbackCount!==0) throw new Error('Oscillator fallback count is not zero: '+report.oscillatorFallbackCount);
}catch(error){
  report.failures.push(error instanceof Error?error.message:String(error));
}finally{
  if(cdp)cdp.close();
  if(target){try{await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id)}catch{}}
  browser.kill('SIGTERM');await sleep(500);try{fs.rmSync(profileDir,{recursive:true,force:true})}catch{}
}

report.stateCoverage.sort((a,b)=>['READY','WAVE_BUILD','SWIFT_THREAT','CONTROL_INTERVENTION','RESOLUTION'].indexOf(a)-['READY','WAVE_BUILD','SWIFT_THREAT','CONTROL_INTERVENTION','RESOLUTION'].indexOf(b));
fs.writeFileSync(path.join(outDir,'g8a-premium-audio-browser-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('G8A_PREMIUM_AUDIO_BROWSER='+JSON.stringify(report));
if(report.failures.length)process.exit(1);
