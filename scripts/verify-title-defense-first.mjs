import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_TITLE_ARTIFACT_DIR || 'artifacts/title-defense-first');
fs.mkdirSync(outputDir, { recursive: true });
const chrome = [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium']
  .filter(Boolean).find(p => fs.existsSync(p));
if (!chrome) throw new Error('Chrome/Chromium required');
const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9333);
const profile = fs.mkdtempSync('/tmp/psi-title-');
const browser = spawn(chrome, [
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank',
], { stdio:['ignore','pipe','pipe'] });
let stderr=''; browser.stderr.on('data', c => { stderr += c.toString(); });
const sleep = ms => new Promise(r=>setTimeout(r,ms));
async function waitJson(url, timeout=30000){const start=Date.now(); while(Date.now()-start<timeout){try{const r=await fetch(url);if(r.ok)return r.json();}catch{} await sleep(100);} throw new Error('timeout '+url);}
class Cdp{
  constructor(url){this.ws=new WebSocket(url);this.i=1;this.pending=new Map();this.events=new Map();this.opened=new Promise((res,rej)=>{this.ws.addEventListener('open',res,{once:true});this.ws.addEventListener('error',rej,{once:true});});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);return;}for(const fn of this.events.get(m.method)||[])fn(m.params);});}
  async send(method,params={}){await this.opened;const id=this.i++;const p=new Promise((res,rej)=>this.pending.set(id,{resolve:res,reject:rej}));this.ws.send(JSON.stringify({id,method,params}));return p;}
  async once(method,timeout=10000){await this.opened;return new Promise((res,rej)=>{const fn=v=>{clearTimeout(t);this.events.set(method,(this.events.get(method)||[]).filter(x=>x!==fn));res(v)};const t=setTimeout(()=>rej(new Error('timeout '+method)),timeout);this.events.set(method,[...(this.events.get(method)||[]),fn]);});}
  close(){this.ws.close();}
}
async function evalJs(cdp, expression){const r=await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text||'eval failed');return r.result?.value;}
async function waitFor(cdp, expression, timeout=10000){const start=Date.now();while(Date.now()-start<timeout){if(await evalJs(cdp,expression))return;await sleep(100);}throw new Error('condition timeout: '+expression);}
async function shot(cdp,name){const r=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(path.join(outputDir,name),Buffer.from(r.data,'base64'));}
async function viewport(cdp,w,h,mobile){await cdp.send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:mobile?2.75:1,mobile,screenOrientation:w>h?{type:'landscapePrimary',angle:90}:{type:'portraitPrimary',angle:0}});}
async function navigate(cdp){const p=cdp.once('Page.loadEventFired');await cdp.send('Page.navigate',{url:baseUrl});await p;await waitFor(cdp,"Boolean(document.querySelector('.commercial-title-home'))");await sleep(350);}
async function titleMetrics(cdp){return evalJs(cdp,`(() => {
  const rect = sel => { const el=document.querySelector(sel); if(!el)return null; const r=el.getBoundingClientRect(); return {left:Math.round(r.left),top:Math.round(r.top),right:Math.round(r.right),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)}; };
  const primary=document.querySelector('.commercial-title-action.is-primary');
  const labels=[...document.querySelectorAll('.commercial-title-actions .commercial-title-action strong')].map(el=>(el.textContent||'').trim());
  return {
    viewport:{width:innerWidth,height:innerHeight},
    overflow:document.documentElement.scrollWidth>innerWidth+1,
    primary:(primary?.textContent||'').replace(/\\s+/g,' ').trim(),
    labels,
    primaryRect:rect('.commercial-title-action.is-primary'),
    lastActionRect:rect('.commercial-title-actions .commercial-title-action:last-child'),
    liveRect:rect('.commercial-title-field-status'),
    liveText:(document.querySelector('.commercial-title-field-status')?.textContent||'').replace(/\\s+/g,' ').trim(),
    subcopy:(document.querySelector('.commercial-title-subcopy')?.textContent||'').trim(),
    featuresVisible:getComputedStyle(document.querySelector('.commercial-title-features')).display!=='none'
  };
})()`);}
const report={schema_version:1,source_sha:process.env.GITHUB_SHA||null,desktop:null,mobile:null,defense_entry:null,failures:[]};
let cdp,target;
try{
  await waitJson('http://127.0.0.1:'+port+'/json/version');
  const tr=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'});target=await tr.json();cdp=new Cdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');await cdp.send('Runtime.enable');

  await viewport(cdp,1440,900,false);await navigate(cdp);
  report.desktop=await titleMetrics(cdp);
  if(!report.desktop.primary.includes('현장 디펜스 시작')) throw new Error('desktop primary CTA is not Field Defense');
  if(!report.desktop.liveText.includes('LIVE SITE') || !report.desktop.liveText.includes('SWIFT')) throw new Error('desktop LIVE SITE panel missing');
  if(report.desktop.overflow) throw new Error('desktop title horizontal overflow');
  await shot(cdp,'desktop-1440x900-home.png');

  await evalJs(cdp,"document.querySelector('.commercial-title-action.is-primary')?.click(); true");
  await waitFor(cdp,"Boolean(document.querySelector('[data-defense-screen], .zb-shell'))",12000);
  report.defense_entry=await evalJs(cdp,`(() => ({
    titleVisible:Boolean(document.querySelector('.commercial-title-home')),
    defenseVisible:Boolean(document.querySelector('[data-defense-screen], .zb-shell')),
    screen:document.querySelector('[data-defense-screen]')?.getAttribute('data-defense-screen')||null
  }))()`);
  if(!report.defense_entry.defenseVisible || report.defense_entry.titleVisible) throw new Error('primary CTA did not enter DefenseGame');
  await shot(cdp,'desktop-defense-entry.png');

  await viewport(cdp,390,844,true);await navigate(cdp);
  report.mobile=await titleMetrics(cdp);
  if(!report.mobile.primary.includes('현장 디펜스 시작')) throw new Error('mobile primary CTA is not Field Defense');
  if(!report.mobile.liveText.includes('LIVE SITE')) throw new Error('mobile LIVE SITE panel missing');
  if(report.mobile.overflow) throw new Error('mobile title horizontal overflow');
  const pr=report.mobile.primaryRect, lr=report.mobile.liveRect, ar=report.mobile.lastActionRect;
  if(!pr || pr.left < -1 || pr.right > 391 || pr.top < -1 || pr.bottom > 845) throw new Error('mobile primary CTA outside viewport '+JSON.stringify(pr));
  if(!lr || lr.left < -1 || lr.right > 391 || lr.top < -1 || lr.bottom > 845) throw new Error('mobile LIVE SITE outside viewport '+JSON.stringify(lr));
  if(!ar || lr.top < ar.bottom + 8) throw new Error('mobile LIVE SITE overlaps action stack '+JSON.stringify({lastAction:ar,live:lr}));
  await shot(cdp,'mobile-390x844-home.png');
}catch(e){report.failures.push(e instanceof Error?e.message:String(e)); if(cdp){try{await shot(cdp,'error.png')}catch{}}}
finally{if(cdp)cdp.close();if(target){try{await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id)}catch{}}browser.kill('SIGTERM');await Promise.race([new Promise(r=>browser.once('exit',r)),sleep(1000)]);try{fs.rmSync(profile,{recursive:true,force:true})}catch{}}
fs.writeFileSync(path.join(outputDir,'title-defense-first-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('TITLE_DEFENSE_FIRST='+JSON.stringify(report));
if(report.failures.length){if(stderr.trim())console.error(stderr.slice(-2500));process.exit(1);}
console.log('TITLE-DEFENSE-FIRST browser QA passed.');
