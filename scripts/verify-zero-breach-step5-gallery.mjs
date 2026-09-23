import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_DEFENSE_STEP5_GALLERY_DIR || 'artifacts/zero-breach-step5-gallery');
fs.mkdirSync(outputDir, { recursive: true });

const manifest = JSON.parse(fs.readFileSync('content/defense/visual-production.json', 'utf8'));
const towers = manifest.assets.filter(asset => asset.kind === 'TOWER');
const enemies = manifest.assets.filter(asset => asset.kind === 'ENEMY');

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));

if (!chrome) throw new Error('Chrome/Chromium not found');

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9777);
const profile = fs.mkdtempSync('/tmp/psi-zero-breach-step5-gallery-');
const browser = spawn(chrome, [
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--mute-audio',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=' + port,'--user-data-dir=' + profile,'about:blank',
], { stdio: ['ignore','pipe','pipe'] });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForJson(url, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {}
    await sleep(100);
  }
  throw new Error('Timed out waiting for ' + url);
}

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
    this.opened = new Promise((resolve,reject) => {
      this.socket.addEventListener('open', resolve, { once:true });
      this.socket.addEventListener('error', reject, { once:true });
    });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.events.get(message.method) || []) listener(message.params);
    });
  }
  async send(method, params={}) {
    await this.opened;
    const id=this.nextId++;
    const result=new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));
    this.socket.send(JSON.stringify({id,method,params}));
    return result;
  }
  async once(method, timeoutMs=15000) {
    await this.opened;
    return new Promise((resolve,reject)=>{
      const listener=params=>{
        clearTimeout(timer);
        this.events.set(method,(this.events.get(method)||[]).filter(x=>x!==listener));
        resolve(params);
      };
      const timer=setTimeout(()=>{
        this.events.set(method,(this.events.get(method)||[]).filter(x=>x!==listener));
        reject(new Error('Timed out waiting for '+method));
      },timeoutMs);
      this.events.set(method,[...(this.events.get(method)||[]),listener]);
    });
  }
  close(){this.socket.close();}
}

async function evaluate(cdp, expression) {
  const result=await cdp.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result?.value;
}

async function screenshot(cdp, filename) {
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  fs.writeFileSync(path.join(outputDir,filename),Buffer.from(shot.data,'base64'));
}

function htmlFor(title, assets, imageSize) {
  const cards=assets.map(asset=>`
    <article class="card" data-id="${asset.assetId}">
      <div class="stage"><img src="${baseUrl}/${asset.uri}" alt="${asset.assetId}"></div>
      <strong>${asset.assetId.replace('defense.tower.','').replace('defense.enemy.','')}</strong>
      <small>${asset.status}</small>
    </article>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;background:#101a24;color:#eef4f8;font-family:Arial,sans-serif}
    body{padding:28px}header{display:flex;justify-content:space-between;align-items:end;margin-bottom:22px}
    h1{margin:0;font-size:28px}p{margin:0;color:#b9c8d3}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
    .card{background:#1c2a36;border:1px solid #3c5260;border-radius:12px;padding:12px;min-width:0}
    .stage{height:${imageSize}px;display:grid;place-items:center;border-radius:8px;background:radial-gradient(circle at 35% 25%,#425762,#162630 70%);overflow:hidden}
    img{width:${imageSize}px;height:${imageSize}px;object-fit:contain;filter:drop-shadow(8px 10px 7px rgba(0,0,0,.38))}
    strong{display:block;margin-top:9px;font-size:13px}small{display:block;margin-top:3px;color:#ffad42;font-size:10px}
  </style></head><body><header><div><h1>${title}</h1><p>${manifest.visualVersion}</p></div><p>${assets.length} assets</p></header><main class="grid">${cards}</main></body></html>`;
}

const report={schema_version:1,visual_version:manifest.visualVersion,towers:[],enemies:[],failures:[]};
let target,cdp;

try {
  await waitForJson('http://127.0.0.1:'+port+'/json/version');
  const response=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'});
  target=await response.json();
  cdp=new Cdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  for(const [kind,assets,height,size] of [['towers',towers,1500,180],['enemies',enemies,780,180]]) {
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height,deviceScaleFactor:1,mobile:false});
    const html=htmlFor(kind==='towers'?'ZERO BREACH — 16 TOWER STATES':'ZERO BREACH — 6 RISK SILHOUETTES',assets,size);
    const loaded=cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate',{url:baseUrl});
    await loaded;
    await evaluate(cdp,`document.open();document.write(${JSON.stringify(html)});document.close();`);
    const started=Date.now();
    while(Date.now()-started<15000) {
      const state=await evaluate(cdp,`(() => [...document.images].map(img => ({src:img.src,complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight})))()`);
      if(state.length===assets.length && state.every(item=>item.complete && item.naturalWidth>0)) {
        report[kind]=state;
        break;
      }
      await sleep(80);
    }
    if(report[kind].length!==assets.length) throw new Error(kind+' assets did not all load');
    await screenshot(cdp,`step5-${kind}-contact-sheet.png`);
  }
} catch(error) {
  report.failures.push(error instanceof Error ? error.message : String(error));
} finally {
  if(cdp) cdp.close();
  if(target) try { await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id); } catch {}
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>browser.once('exit',resolve)),sleep(1200)]);
  try { fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:100}); } catch {}
}

fs.writeFileSync(path.join(outputDir,'step5-gallery-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('ZERO_BREACH_STEP5_GALLERY='+JSON.stringify({
  visual_version:report.visual_version,towers:report.towers.length,enemies:report.enemies.length,failures:report.failures
}));
if(report.failures.length || report.towers.length!==16 || report.enemies.length!==6) process.exit(1);
console.log('ZERO BREACH Step 5 gallery passed: all 16 tower states and 6 risk silhouettes rendered in Chromium.');
