import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl=process.env.PSI_PREVIEW_URL||'http://127.0.0.1:4173';
const out=path.resolve(process.env.PSI_G4_ARTIFACT_DIR||'artifacts/g4-site-profile');
fs.mkdirSync(out,{recursive:true});
const chrome=[process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].filter(Boolean).find(p=>fs.existsSync(p));
if(!chrome) throw new Error('Chrome required');
const port=Number(process.env.PSI_CHROME_DEBUG_PORT||9444);
const profile=fs.mkdtempSync('/tmp/psi-g4-');
const browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{stdio:['ignore','pipe','pipe']});
let stderr=''; browser.stderr.on('data',c=>{stderr+=c.toString()});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitJson(url,timeout=30000){const t=Date.now();while(Date.now()-t<timeout){try{const r=await fetch(url);if(r.ok)return r.json()}catch{}await sleep(100)}throw new Error('timeout '+url)}
class Cdp{constructor(url){this.ws=new WebSocket(url);this.i=1;this.pending=new Map();this.events=new Map();this.opened=new Promise((res,rej)=>{this.ws.addEventListener('open',res,{once:true});this.ws.addEventListener('error',rej,{once:true})});this.ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(!p)return;this.pending.delete(m.id);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);return}for(const fn of this.events.get(m.method)||[])fn(m.params)})}async send(method,params={}){await this.opened;const id=this.i++;const p=new Promise((res,rej)=>this.pending.set(id,{resolve:res,reject:rej}));this.ws.send(JSON.stringify({id,method,params}));return p}async once(method,timeout=10000){await this.opened;return new Promise((res,rej)=>{const fn=v=>{clearTimeout(t);this.events.set(method,(this.events.get(method)||[]).filter(x=>x!==fn));res(v)};const t=setTimeout(()=>rej(new Error('timeout '+method)),timeout);this.events.set(method,[...(this.events.get(method)||[]),fn])})}close(){this.ws.close()}}
async function ev(cdp,expression){const r=await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.text||'eval');return r.result?.value}
async function wait(cdp,expr,timeout=10000){const t=Date.now();while(Date.now()-t<timeout){if(await ev(cdp,expr))return;await sleep(100)}throw new Error('condition timeout '+expr)}
async function shot(cdp,name){const r=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(path.join(out,name),Buffer.from(r.data,'base64'))}
async function vp(cdp,width,height,mobile){await cdp.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:mobile?2.75:1,mobile,screenOrientation:width>height?{type:'landscapePrimary',angle:90}:{type:'portraitPrimary',angle:0}})}
async function nav(cdp){const p=cdp.once('Page.loadEventFired');await cdp.send('Page.navigate',{url:baseUrl});await p;await wait(cdp,"Boolean(document.querySelector('.commercial-title-home'))");await sleep(300)}
async function clickText(cdp,text){const ok=await ev(cdp,`(() => {const el=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes(${JSON.stringify(text)}));if(!el)return false;el.click();return true})()`);if(!ok)throw new Error('button missing '+text)}
async function clickContext(cdp,text){const ok=await ev(cdp,`(() => {const el=[...document.querySelectorAll('.site-profile-context button')].find(b=>(b.textContent||'').includes(${JSON.stringify(text)}));if(!el)return false;el.click();return true})()`);if(!ok)throw new Error('context button missing '+text)}
async function metrics(cdp){return ev(cdp,`(() => {
 const rect=sel=>{const el=document.querySelector(sel);if(!el)return null;const r=el.getBoundingClientRect();return {left:Math.round(r.left),top:Math.round(r.top),right:Math.round(r.right),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)}};
 return {
   viewport:{width:innerWidth,height:innerHeight},
   overflow:document.documentElement.scrollWidth>innerWidth+1,
   profile:document.querySelector('.site-profile-screen')?.getAttribute('data-site-profile')||null,
   top:[...document.querySelectorAll('.site-profile-top3 article')].map(el=>({risk:el.getAttribute('data-risk'),score:Number(el.querySelector(':scope > b')?.textContent||0)})),
   screenRect:rect('.site-profile-screen'),
   priorityRect:rect('.site-profile-priority'),
   pickerRect:rect('.site-profile-picker'),
   selected:[...document.querySelectorAll('.site-profile-group button[aria-pressed="true"] strong')].map(x=>(x.textContent||'').trim())
 };
})()`)}

const report={schema_version:1,source_sha:process.env.GITHUB_SHA||null,desktop:null,mobile:null,dynamic:null,failures:[]};
let cdp,target;
try{
 await waitJson('http://127.0.0.1:'+port+'/json/version');
 const tr=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'});target=await tr.json();cdp=new Cdp(target.webSocketDebuggerUrl);
 await cdp.send('Page.enable');await cdp.send('Runtime.enable');

 await vp(cdp,1440,900,false);await nav(cdp);await clickText(cdp,'현장 · 공정');await wait(cdp,"Boolean(document.querySelector('.site-profile-screen'))");
 report.desktop=await metrics(cdp);
 if(report.desktop.overflow) throw new Error('desktop horizontal overflow');
 await clickText(cdp,'역타 · 슬래브 하부굴착');await sleep(120);
 const topDown=await metrics(cdp);
 if(JSON.stringify(topDown.top.map(x=>x.risk))!==JSON.stringify(['VEILED','SWARM','ARMORED'])) throw new Error('top-down priority drift '+JSON.stringify(topDown.top));
 const before=topDown.top.map(x=>x.score);
 await clickContext(cdp,'정보 불확실');await clickContext(cdp,'동시작업');await sleep(100);
 const after=await metrics(cdp);
 report.dynamic={profile:after.profile,before,after:after.top.map(x=>x.score),top:after.top};
 if(after.top[0]?.risk!=='VEILED') throw new Error('dynamic VEILED priority lost');
 if(!after.top.some((x,i)=>x.score>before[i])) throw new Error('dynamic context did not change top scores');
 await shot(cdp,'desktop-site-profile.png');

 await vp(cdp,390,844,true);await nav(cdp);await clickText(cdp,'현장 · 공정');await wait(cdp,"Boolean(document.querySelector('.site-profile-screen'))");
 report.mobile=await metrics(cdp);
 if(report.mobile.overflow) throw new Error('mobile horizontal overflow');
 const rr=report.mobile.screenRect;
 if(!rr||rr.left<-1||rr.right>391) throw new Error('mobile site screen width escaped '+JSON.stringify(rr));
 await shot(cdp,'mobile-site-profile.png');
}catch(e){report.failures.push(e instanceof Error?e.message:String(e));if(cdp){try{await shot(cdp,'error.png')}catch{}}}
finally{if(cdp)cdp.close();if(target){try{await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id)}catch{}}browser.kill('SIGTERM');await Promise.race([new Promise(r=>browser.once('exit',r)),sleep(1000)]);try{fs.rmSync(profile,{recursive:true,force:true})}catch{}}
fs.writeFileSync(path.join(out,'g4-site-profile-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('G4_SITE_PROFILE='+JSON.stringify(report));
if(report.failures.length){if(stderr.trim())console.error(stderr.slice(-2500));process.exit(1)}
console.log('G4 SITE-PROFILE browser QA passed.');
