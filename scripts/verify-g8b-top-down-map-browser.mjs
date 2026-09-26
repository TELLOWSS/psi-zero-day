import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_G8B_ARTIFACT_DIR || 'artifacts/g8b-top-down-map');
fs.mkdirSync(outputDir, { recursive: true });

const worldManifest = JSON.parse(fs.readFileSync(path.resolve('content/defense/g8b-world-final-art.json'), 'utf8'));
const veiledManifest = JSON.parse(fs.readFileSync(path.resolve('content/defense/g8b-veiled-final-art.json'), 'utf8'));
const sensorManifest = JSON.parse(fs.readFileSync(path.resolve('content/defense/g8b-sensor-runtime-composite.json'), 'utf8'));
const gate = JSON.parse(fs.readFileSync(path.resolve('content/defense/g8b-representative-asset-gate.json'), 'utf8'));

const worldApproved = worldManifest.status === 'PRODUCTION_APPROVED' && worldManifest.promotion?.productionApproved === true;
const veiledApproved = veiledManifest.status === 'PRODUCTION_APPROVED' && veiledManifest.promotion?.productionApproved === true;
const sensorApproved = sensorManifest.status === 'PRODUCTION_APPROVED' && sensorManifest.promotion?.productionApproved === true;
if (!sensorApproved) throw new Error('G8-B SENSOR:L1 runtime composite must be approved before PRE-ART browser QA.');

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('G8-B browser QA requires Chrome/Chromium.');

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9889);
const profileDir = fs.mkdtempSync('/tmp/psi-g8b-chrome-');
const browser = spawn(chrome, [
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--mute-audio',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=' + port,'--user-data-dir=' + profileDir,'about:blank',
], { stdio: ['ignore','pipe','pipe'] });

let stderr = '';
browser.stderr.on('data', chunk => { stderr += chunk.toString(); });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitJson(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {}
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
    this.opened = new Promise((resolve, reject) => {
      this.socket.addEventListener('open', resolve, { once: true });
      this.socket.addEventListener('error', reject, { once: true });
    });
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
        return;
      }
      for (const listener of this.events.get(message.method) || []) listener(message.params);
    });
  }
  async send(method, params = {}) {
    await this.opened;
    const id = this.nextId++;
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return result;
  }
  async once(method, timeoutMs = 10000) {
    await this.opened;
    return new Promise((resolve, reject) => {
      const listener = params => {
        clearTimeout(timer);
        this.events.set(method, (this.events.get(method) || []).filter(item => item !== listener));
        resolve(params);
      };
      const timer = setTimeout(() => reject(new Error('Timed out waiting for ' + method)), timeoutMs);
      this.events.set(method, [...(this.events.get(method) || []), listener]);
    });
  }
  close() { this.socket.close(); }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || JSON.stringify(result.exceptionDetails));
  }
  return result.result?.value;
}
async function waitFor(cdp, expression, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(100);
  }
  throw new Error('Timed out waiting for: ' + expression);
}
async function screenshot(cdp, filename) {
  const result = await cdp.send('Page.captureScreenshot', { format:'png', fromSurface:true, captureBeyondViewport:false });
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(result.data, 'base64'));
}
async function viewport(cdp, width, height, mobile) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: mobile ? 2.75 : 1, mobile,
    screenOrientation: width > height ? { type:'landscapePrimary', angle:90 } : { type:'portraitPrimary', angle:0 },
  });
}
async function navigate(cdp) {
  const loaded = cdp.once('Page.loadEventFired', 15000);
  await cdp.send('Page.navigate', { url: baseUrl });
  await loaded;
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
  await sleep(220);
}
async function clearState(cdp) {
  await evaluate(cdp, `(() => {
    localStorage.removeItem('psi-zero-day.defense.save.v1');
    localStorage.removeItem('psi-zero-day.site-profile.v1');
    return true;
  })()`);
}
function fnv1a32(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return 'fnv1a32:' + (hash >>> 0).toString(16).padStart(8, '0');
}

function representativeDefenseSave() {
  const run = {
    runId: 'g8b-top-down-representative',
    mode: 'TRAINING',
    variant: 'STANDARD',
    scenarioId: 'training-site:apt-new-top-down-under-slab',
    eventId: null,
    eventContentVersion: null,
    status: 'RUNNING',
    paused: false,
    speed: 1,
    tick: 4120,
    waveId: 8,
    waveTick: 84,
    intermissionRemaining: 0,
    shield: 18,
    resource: 210,
    towers: [{
      id: 'tower-1',
      padId: 'TD-P3',
      towerId: 'SENSOR',
      levelId: 'L1',
      targetMode: 'FIRST',
      invested: 75,
      attackCooldown: 0,
      revealCooldown: 20,
    }],
    enemies: [{
      id: 'enemy-11',
      enemyId: 'VEILED',
      hp: 48,
      distance: 42,
      spawnSequence: 11,
      revealUntilTick: 4170,
      slowEffects: [],
      bossPhaseTriggered: false,
      bossArmorFromTick: 0,
      bossArmorUntilTick: 0,
    }],
    spawnedByGroup: [1, 0],
    nextTowerSequence: 2,
    nextEnemySequence: 12,
    supportId: 'OBSERVER',
    supportCooldownRemaining: 0,
    freezeMovementUntilTick: 0,
    revealAllUntilTick: 0,
    rangeBonusUntilTick: 0,
    completedWaves: 7,
    leakedByEnemy: {},
  };
  const payload = {
    activeRun: run,
    records: [{
      scenarioId: 'training-site:apt-new-top-down-under-slab',
      finishedRuns: 0,
      clears: 0,
      bestStars: 0,
      bestScore: 0,
      bestShield: 0,
      bestCompletedWaves: 7,
      lastResultRunId: null,
      updatedAt: '2026-09-26T00:00:00.000Z',
    }],
    cosmeticIds: [],
    claimIds: [],
    settledRunIds: [],
  };
  return {
    namespace: 'defense',
    schemaVersion: 1,
    rulesVersion: 'zero-breach-1.0.0',
    contentVersion: 'prototype-1.0.0',
    buildVersion: 'g8b-representative-qa',
    revision: 1,
    savedAt: '2026-09-26T00:00:00.000Z',
    checksum: fnv1a32(JSON.stringify(payload)),
    payload,
  };
}

async function clickButton(cdp, text, scope = 'button') {
  const clicked = await evaluate(cdp, `(() => {
    const el=[...document.querySelectorAll(${JSON.stringify(scope)})].find(b=>(b.textContent||'').includes(${JSON.stringify(text)}));
    if(!el)return false;
    el.click();
    return true;
  })()`);
  if (!clicked) throw new Error('Button not found: ' + text);
}
async function enterRepresentativeTopDown(cdp) {
  const save = representativeDefenseSave();
  await evaluate(cdp, `(() => {
    localStorage.setItem('psi-zero-day.defense.save.v1', ${JSON.stringify(JSON.stringify(save))});
    localStorage.setItem('psi-zero-day.defense.tutorial.v1', 'seen');
    return true;
  })()`);
  await clickButton(cdp, '현장 디펜스');
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="persistence-gate"]')) || document.body.textContent.includes('중단한 훈련이 있습니다')`, 12000);
  await clickButton(cdp, '이어서 훈련');
  await waitFor(cdp, `document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-map') === 'map-apt-top-down-under-slab-01'`, 12000);
  await waitFor(cdp, `document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-wave') === '8'`, 12000);
  await sleep(260);
}

async function metrics(cdp) {
  return evaluate(cdp, `(async () => {
    const shell=document.querySelector('[data-defense-screen="combat"]');
    const board=document.querySelector('.zb-board-wrap')?.getBoundingClientRect();
    const art=document.querySelector('.zb-board-production-art');
    const href=art?.getAttribute('href') || null;
    let artBytes=0;
    if(href){
      const response=await fetch(href);
      if(response.ok) artBytes=(await response.arrayBuffer()).byteLength;
    }
    return {
      scenario:shell?.getAttribute('data-scenario')||null,
      map:shell?.getAttribute('data-map')||null,
      productionMap:shell?.getAttribute('data-production-map')||null,
      worldFinal:shell?.getAttribute('data-g8b-world-final')==='true',
      artHref:href,
      artBytes,
      productionArtCount:document.querySelectorAll('.zb-board-production-art').length,
      processOverlay:Boolean(document.querySelector('[data-site-process-map="map-apt-top-down-under-slab-01"]')),
      pads:document.querySelectorAll('.zb-pad-runtime').length,
      routePoints:document.querySelector('.zb-path')?.getAttribute('points')||null,
      towers:document.querySelectorAll('.zb-tower').length,
      sensorPq:document.querySelectorAll('[data-pq-sensor="SENSOR:L1"]').length,
      sensorRevealPulse:document.querySelectorAll('.zb-sensor-g8b .zb-detect-pulse').length,
      enemies:document.querySelectorAll('.zb-enemy').length,
      veiled:document.querySelectorAll('.zb-enemy-veiled').length,
      veiledFinal:document.querySelectorAll('[data-pq-veiled="VEILED"]').length,
      veiledRevealRing:document.querySelectorAll('.zb-enemy-veiled .zb-reveal-ring').length,
      prototypeBoardItems:document.querySelectorAll('.zb-board [data-art-state="prototype"]').length,
      activeSvgVisuals:[...document.querySelectorAll('image[href],img[src]')].filter(el => {
        const uri=el.getAttribute('href') || el.getAttribute('src') || '';
        const r=el.getBoundingClientRect();
        return uri.toLowerCase().includes('.svg') && r.width>0 && r.height>0;
      }).map(el => el.getAttribute('href') || el.getAttribute('src')),
      g8aWorldLeak:[...document.querySelectorAll('image[href],img[src]')].map(el => el.getAttribute('href') || el.getAttribute('src') || '').filter(uri => uri.includes('g8a-bottom-up-excavation-final')),
      status:shell?.getAttribute('data-status')||null,
      board:board?{left:Math.round(board.left),top:Math.round(board.top),right:Math.round(board.right),bottom:Math.round(board.bottom),width:Math.round(board.width),height:Math.round(board.height)}:null,
      overflow:document.documentElement.scrollWidth>innerWidth+2,
      viewport:{width:innerWidth,height:innerHeight},
    };
  })()`);
}

const EXPECTED_ROUTE = gate.topologyContract.routePoints;
const report = {
  schema_version:1,
  source_sha:process.env.GITHUB_SHA||null,
  gate_state:null,
  expected_blocker:null,
  desktop:null,
  mobile:null,
  failures:[],
};

function verifyCommon(view, label) {
  if(view.map!=='map-apt-top-down-under-slab-01') throw new Error(label+' G8-B map mismatch');
  if(view.scenario!=='training-site:apt-new-top-down-under-slab') throw new Error(label+' G8-B scenario mismatch');
  if(view.pads!==8 || view.routePoints!==EXPECTED_ROUTE) throw new Error(label+' locked top-down topology changed');
  if(!view.processOverlay) throw new Error(label+' top-down process overlay missing');
  if(view.towers!==1 || view.sensorPq!==1 || view.sensorRevealPulse!==1) throw new Error(label+' SENSOR:L1 raster composite/reveal pulse missing');
  if(view.enemies!==1 || view.veiled!==1 || view.veiledRevealRing!==1) throw new Error(label+' VEILED representative risk/reveal state missing');
  if(view.activeSvgVisuals.length>0) throw new Error(label+' active SVG visual leaked into G8-B: '+JSON.stringify(view.activeSvgVisuals));
  if(view.g8aWorldLeak.length>0) throw new Error(label+' G8-A WORLD was illegally reused in G8-B');
  if(view.status!=='RUNNING') throw new Error(label+' representative run is not RUNNING');
  if(view.overflow) throw new Error(label+' horizontal overflow');
}

let cdp;
let target;
try {
  await waitJson('http://127.0.0.1:' + port + '/json/version');
  const response=await fetch('http://127.0.0.1:' + port + '/json/new?about:blank',{method:'PUT'});
  target=await response.json();
  cdp=new Cdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  await viewport(cdp,1440,900,false);
  await navigate(cdp);
  await clearState(cdp);
  await navigate(cdp);
  await enterRepresentativeTopDown(cdp);
  report.desktop=await metrics(cdp);
  verifyCommon(report.desktop,'Desktop');
  if(!worldApproved && (report.desktop.worldFinal || report.desktop.productionArtCount!==0 || report.desktop.artHref!==null)) {
    throw new Error('Desktop PRE-ART must not inject a WORLD plate before approval');
  }
  if(!veiledApproved && (report.desktop.veiledFinal!==0 || report.desktop.prototypeBoardItems!==1)) {
    throw new Error('Desktop PRE-ART must contain exactly one VEILED prototype fallback');
  }
  await screenshot(cdp,'01-g8b-top-down-preart.png');

  await viewport(cdp,390,844,true);
  await clearState(cdp);
  await navigate(cdp);
  await enterRepresentativeTopDown(cdp);
  report.mobile=await metrics(cdp);
  verifyCommon(report.mobile,'Mobile');
  if(!worldApproved && (report.mobile.worldFinal || report.mobile.productionArtCount!==0 || report.mobile.artHref!==null)) {
    throw new Error('Mobile PRE-ART must not inject a WORLD plate before approval');
  }
  if(!veiledApproved && (report.mobile.veiledFinal!==0 || report.mobile.prototypeBoardItems!==1)) {
    throw new Error('Mobile PRE-ART must contain exactly one VEILED prototype fallback');
  }
  if(!report.mobile.board || report.mobile.board.left < -2 || report.mobile.board.right > 392 || report.mobile.board.width < 300) {
    throw new Error('390x844 G8-B board escaped viewport: '+JSON.stringify(report.mobile.board));
  }
  await screenshot(cdp,'02-g8b-top-down-mobile.png');

  if(!worldApproved && !veiledApproved){
    report.gate_state='BLOCKED_WORLD_AND_VEILED_FINAL_RASTER_REQUIRED';
    report.expected_blocker={
      id:'WORLD_AND_VEILED_FINAL_RASTER_MISSING',
      sensorCompositePass:report.desktop.sensorPq===1 && report.mobile.sensorPq===1,
      worldFinalApproved:false,
      veiledFinalApproved:false,
      prototypeBoardItems:{desktop:report.desktop.prototypeBoardItems,mobile:report.mobile.prototypeBoardItems},
    };
  } else if(worldApproved && !veiledApproved){
    report.gate_state='BLOCKED_VEILED_FINAL_RASTER_REQUIRED';
    report.expected_blocker={id:'VEILED_FINAL_RASTER_MISSING',worldFinalApproved:true,veiledFinalApproved:false};
  } else if(!worldApproved && veiledApproved){
    report.gate_state='BLOCKED_WORLD_FINAL_RASTER_REQUIRED';
    report.expected_blocker={id:'WORLD_FINAL_RASTER_MISSING',worldFinalApproved:false,veiledFinalApproved:true};
  } else {
    if(report.desktop.prototypeBoardItems!==0 || report.mobile.prototypeBoardItems!==0 || report.desktop.veiledFinal!==1 || report.mobile.veiledFinal!==1){
      throw new Error('Approved G8-B final assets are not fully active in actual play');
    }
    report.gate_state='READY_FOR_PRODUCTION_REVIEW';
    report.expected_blocker=null;
  }
} catch(error) {
  report.failures.push(error instanceof Error ? error.message : String(error));
  if(cdp){try{await screenshot(cdp,'error.png');}catch{}}
} finally {
  if(cdp) cdp.close();
  if(target){try{await fetch('http://127.0.0.1:'+port+'/json/close/'+target.id);}catch{}}
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve=>browser.once('exit',resolve)),sleep(1200)]);
  try{fs.rmSync(profileDir,{recursive:true,force:true});}catch{}
}

fs.writeFileSync(path.join(outputDir,'g8b-top-down-map-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('G8B_TOP_DOWN='+JSON.stringify(report));
if(report.failures.length){
  if(stderr.trim()) console.error(stderr.slice(-3000));
  process.exit(1);
}
console.log('G8-B runtime art gate verified: '+report.gate_state);
