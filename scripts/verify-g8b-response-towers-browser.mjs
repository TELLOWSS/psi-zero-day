import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_G8B_ARTIFACT_DIR || 'artifacts/g8b-response-towers');
fs.mkdirSync(outputDir, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.resolve('content/defense/g8b-response-tower-final-art.json'),'utf8'));
const expectedByFamily = Object.fromEntries(manifest.assets.map(asset => [asset.towerId, asset.runtimeUri]));
const chrome = [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser']
  .filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('G8-B browser QA requires Chrome/Chromium.');

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9891);
const profileDir = fs.mkdtempSync('/tmp/psi-g8b-chrome-');
const browser = spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--mute-audio',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port='+port,'--user-data-dir='+profileDir,'about:blank',
],{stdio:['ignore','pipe','pipe']});
let stderr=''; browser.stderr.on('data',c=>{stderr+=c.toString();});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function waitJson(url,timeout=30000){const s=Date.now();while(Date.now()-s<timeout){try{const r=await fetch(url);if(r.ok)return r.json();}catch{}await sleep(100);}throw new Error('Timed out '+url);}
class Cdp{
  constructor(url){this.socket=new WebSocket(url);this.nextId=1;this.pending=new Map();this.events=new Map();this.opened=new Promise((res,rej)=>{this.socket.addEventListener('open',res,{once:true});this.socket.addEventListener('error',rej,{once:true});});this.socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);return;}for(const l of this.events.get(m.method)||[])l(m.params);});}
  async send(method,params={}){await this.opened;const id=this.nextId++;const p=new Promise((res,rej)=>this.pending.set(id,{resolve:res,reject:rej}));this.socket.send(JSON.stringify({id,method,params}));return p;}
  async once(method,timeout=10000){await this.opened;return new Promise((res,rej)=>{const l=p=>{clearTimeout(t);this.events.set(method,(this.events.get(method)||[]).filter(x=>x!==l));res(p);};const t=setTimeout(()=>rej(new Error('Timed out '+method)),timeout);this.events.set(method,[...(this.events.get(method)||[]),l]);});}
  close(){this.socket.close();}
}
async function evaluate(cdp,expression){const r=await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;}
async function waitFor(cdp,expression,timeout=12000){const s=Date.now();while(Date.now()-s<timeout){if(await evaluate(cdp,expression))return;await sleep(100);}throw new Error('Timed out waiting for '+expression);}
async function screenshot(cdp,name){const r=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(path.join(outputDir,name),Buffer.from(r.data,'base64'));}
async function viewport(cdp,width,height,mobile){await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:mobile?2.75:1,mobile,screenOrientation:width>height?{type:'landscapePrimary',angle:90}:{type:'portraitPrimary',angle:0}});}
async function navigate(cdp){const loaded=cdp.once('Page.loadEventFired',15000);await cdp.send('Page.navigate',{url:baseUrl});await loaded;await waitFor(cdp,"Boolean(document.querySelector('.commercial-title-home'))");await sleep(220);}
async function clickText(cdp,text){const ok=await evaluate(cdp,`(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').includes(${JSON.stringify(text)}));if(!b)return false;b.click();return true;})()`);if(!ok)throw new Error('Button not found: '+text);}

function fnv1a32(value){let hash=0x811c9dc5;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,0x01000193);}return 'fnv1a32:'+(hash>>>0).toString(16).padStart(8,'0');}
function savePayload(){
  const run={
    runId:'g8b-response-tower-qa',mode:'TRAINING',variant:'STANDARD',
    scenarioId:'training-site:apt-new-bottom-up-excavation',eventId:null,eventContentVersion:null,
    status:'RUNNING',paused:true,speed:1,tick:180,waveId:1,waveTick:0,intermissionRemaining:0,
    shield:20,resource:45,
    towers:[
      {id:'tower-pulse',padId:'BU-P4',towerId:'PULSE',levelId:'L1',targetMode:'FIRST',invested:80,attackCooldown:0,revealCooldown:0},
      {id:'tower-burst',padId:'BU-P2',towerId:'BURST',levelId:'L1',targetMode:'FIRST',invested:110,attackCooldown:0,revealCooldown:0},
      {id:'tower-sensor',padId:'BU-P6',towerId:'SENSOR',levelId:'L1',targetMode:'FIRST',invested:75,attackCooldown:0,revealCooldown:0},
    ],
    enemies:[],spawnedByGroup:[],nextTowerSequence:4,nextEnemySequence:1,supportId:'OBSERVER',
    supportCooldownRemaining:0,freezeMovementUntilTick:0,revealAllUntilTick:0,rangeBonusUntilTick:0,
    completedWaves:0,leakedByEnemy:{},
  };
  const payload={activeRun:run,records:[{scenarioId:run.scenarioId,finishedRuns:0,clears:0,bestStars:0,bestScore:0,bestShield:0,bestCompletedWaves:0,lastResultRunId:null,updatedAt:'2026-09-26T00:00:00.000Z'}],cosmeticIds:[],claimIds:[],settledRunIds:[]};
  return {namespace:'defense',schemaVersion:1,rulesVersion:'zero-breach-1.0.0',contentVersion:'prototype-1.0.0',buildVersion:'g8b-response-tower-qa',revision:1,savedAt:'2026-09-26T00:00:00.000Z',checksum:fnv1a32(JSON.stringify(payload)),payload};
}
async function enter(cdp){
  const save=savePayload();
  await evaluate(cdp,`(()=>{localStorage.setItem('psi-zero-day.defense.save.v1',${JSON.stringify(JSON.stringify(save))});localStorage.setItem('psi-zero-day.defense.tutorial.v1','seen');return true;})()`);
  await clickText(cdp,'현장 디펜스');
  await waitFor(cdp,`Boolean(document.querySelector('[data-defense-screen="persistence-gate"]')) || document.body.textContent.includes('중단한 훈련이 있습니다')`);
  await clickText(cdp,'이어서 훈련');
  await waitFor(cdp,`document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-map')==='map-apt-bottom-up-excavation-01'`);
  await waitFor(cdp,`document.querySelectorAll('.zb-tower').length===3`);
  await sleep(300);
}
async function metrics(cdp){
  return evaluate(cdp,`(()=> {
    const families=['PULSE','BURST','SENSOR'];
    const towers=[...document.querySelectorAll('.zb-tower')].map(el=>({
      family:el.getAttribute('data-tower-family'),
      production:el.getAttribute('data-production-tower-art'),
      prototype:el.getAttribute('data-art-state'),
      href:el.querySelector('image')?.getAttribute('href')||null,
    }));
    return {
      towers,
      familyCounts:Object.fromEntries(families.map(f=>[f,towers.filter(t=>t.family===f).length])),
      productionCount:towers.filter(t=>t.production).length,
      prototypeCount:towers.filter(t=>families.includes(t.family)&&t.prototype==='prototype').length,
      svgTowerImages:towers.map(t=>t.href).filter(Boolean).filter(uri=>uri.toLowerCase().includes('.svg')),
      overflow:document.documentElement.scrollWidth>innerWidth+2,
      viewport:{width:innerWidth,height:innerHeight},
    };
  })()`);
}
function assertMetrics(m,label){
  for(const family of ['PULSE','BURST','SENSOR']){
    if(m.familyCounts[family]!==1) throw new Error(label+' missing '+family+' tower');
    const row=m.towers.find(t=>t.family===family);
    if(row?.production!==family+':L1') throw new Error(label+' '+family+' production binding missing: '+JSON.stringify(row));
    if(row?.href!==expectedByFamily[family]) throw new Error(label+' '+family+' unexpected raster '+row?.href);
  }
  if(m.productionCount!==3) throw new Error(label+' expected 3 production tower rasters');
  if(m.prototypeCount!==0) throw new Error(label+' prototype PULSE/BURST/SENSOR glyph leaked');
  if(m.svgTowerImages.length) throw new Error(label+' active SVG tower image leaked: '+JSON.stringify(m.svgTowerImages));
  if(m.overflow) throw new Error(label+' horizontal overflow');
}

const report={schemaVersion:1,sourceSha:process.env.GITHUB_SHA||null,desktop:null,mobile:null,failures:[]};
let cdp,target;
try{
  await waitJson('http://127.0.0.1:'+port+'/json/version');
  target=await (await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'})).json();
  cdp=new Cdp(target.webSocketDebuggerUrl);await cdp.send('Page.enable');await cdp.send('Runtime.enable');

  await viewport(cdp,1440,900,false);await navigate(cdp);await evaluate(cdp,"localStorage.clear();true");await navigate(cdp);await enter(cdp);
  report.desktop=await metrics(cdp);assertMetrics(report.desktop,'desktop');await screenshot(cdp,'01-g8b-response-towers-desktop.png');

  await viewport(cdp,390,844,true);await evaluate(cdp,"localStorage.clear();true");await navigate(cdp);await enter(cdp);
  report.mobile=await metrics(cdp);assertMetrics(report.mobile,'mobile');await screenshot(cdp,'02-g8b-response-towers-mobile.png');

  fs.writeFileSync(path.join(outputDir,'g8b-response-towers-report.json'),JSON.stringify(report,null,2));
  console.log('G8B_RESPONSE_TOWER_BROWSER='+JSON.stringify(report));
}catch(error){
  report.failures.push(String(error?.stack||error));
  fs.writeFileSync(path.join(outputDir,'g8b-response-towers-report.json'),JSON.stringify(report,null,2));
  if(cdp){try{await screenshot(cdp,'error.png');}catch{}}
  console.error(stderr);
  throw error;
}finally{
  try{cdp?.close();}catch{}
  browser.kill('SIGTERM');
}
