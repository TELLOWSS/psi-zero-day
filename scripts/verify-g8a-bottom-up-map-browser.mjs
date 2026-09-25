import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_G8A_ARTIFACT_DIR || 'artifacts/g8a-bottom-up-map');
fs.mkdirSync(outputDir, { recursive: true });

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('G8-A browser QA requires Chrome/Chromium.');

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9888);
const profileDir = fs.mkdtempSync('/tmp/psi-g8a-chrome-');
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
    const detail = result.exceptionDetails.exception?.description
      || result.exceptionDetails.text
      || JSON.stringify(result.exceptionDetails);
    throw new Error(detail);
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
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(result.data, 'base64'));
}
async function viewport(cdp, width, height, mobile) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: mobile ? 2.75 : 1, mobile,
    screenOrientation: width > height ? { type: 'landscapePrimary', angle: 90 } : { type: 'portraitPrimary', angle: 0 },
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
    runId: 'g8a-bottom-up-representative',
    mode: 'TRAINING',
    variant: 'STANDARD',
    scenarioId: 'training-site:apt-new-bottom-up-excavation',
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
      padId: 'BU-P3',
      towerId: 'CONTROL',
      levelId: 'L1',
      targetMode: 'FIRST',
      invested: 90,
      attackCooldown: 0,
      revealCooldown: 0,
    }],
    enemies: [{
      id: 'enemy-11',
      enemyId: 'SWIFT',
      hp: 28,
      distance: 42,
      spawnSequence: 11,
      revealUntilTick: 0,
      slowEffects: [],
      bossPhaseTriggered: false,
      bossArmorFromTick: 0,
      bossArmorUntilTick: 0,
    }],
    spawnedByGroup: [10, 1],
    nextTowerSequence: 2,
    nextEnemySequence: 12,
    supportId: 'COORDINATOR',
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
      scenarioId: 'training-site:apt-new-bottom-up-excavation',
      finishedRuns: 0,
      clears: 0,
      bestStars: 0,
      bestScore: 0,
      bestShield: 0,
      bestCompletedWaves: 7,
      lastResultRunId: null,
      updatedAt: '2026-09-25T00:00:00.000Z',
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
    buildVersion: 'g8a-representative-qa',
    revision: 1,
    savedAt: '2026-09-25T00:00:00.000Z',
    checksum: fnv1a32(JSON.stringify(payload)),
    payload,
  };
}

async function enterRepresentativeBottomUp(cdp) {
  const save = representativeDefenseSave();
  await evaluate(cdp, `(() => {
    localStorage.setItem('psi-zero-day.defense.save.v1', ${JSON.stringify(JSON.stringify(save))});
    localStorage.setItem('psi-zero-day.defense.tutorial.v1', 'seen');
    return true;
  })()`);
  await clickButton(cdp, '현장 디펜스');
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="persistence-gate"]')) || document.body.textContent.includes('중단한 훈련이 있습니다')`, 12000);
  await clickButton(cdp, '이어서 훈련');
  await waitFor(cdp, `document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-map') === 'map-apt-bottom-up-excavation-01'`, 12000);
  await waitFor(cdp, `document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-wave') === '8'`, 12000);
  await sleep(220);
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
async function enterBottomUp(cdp) {
  await clickButton(cdp, '현장 · 공정');
  await waitFor(cdp, "Boolean(document.querySelector('.site-profile-screen'))");
  await clickButton(cdp, '순타 · 굴착');
  await waitFor(cdp, "document.querySelector('.site-profile-screen')?.getAttribute('data-site-profile') === 'apt-new-bottom-up-excavation'");
  await clickButton(cdp, '이 공정으로 디펜스 체험', '.site-process-preview-head button');
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="support-select"]'))`, 15000);
  await evaluate(cdp, "document.querySelector('.zb-support-card')?.click(); true");
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="combat"]'))`, 12000);
  await sleep(220);
}
async function dismissTutorial(cdp) {
  await evaluate(cdp, `(() => {
    const btn=[...document.querySelectorAll('.zb-tutorial button')].find(b=>(b.textContent||'').includes('건너뛰기'));
    if(btn)btn.click();
    return true;
  })()`);
  await sleep(100);
}
async function placeAndStart(cdp) {
  await evaluate(cdp, "document.querySelector('.zb-pad-hit')?.click(); true");
  await waitFor(cdp, "Boolean(document.querySelector('.zb-tower-shop button'))");
  await evaluate(cdp, "document.querySelector('.zb-tower-shop button')?.click(); true");
  await sleep(80);
  const pausedBeforeStart = await evaluate(cdp, "Boolean(document.querySelector('.zb-status b'))");
  if (pausedBeforeStart) {
    await evaluate(cdp, "document.querySelector('.zb-hud-button')?.click(); true");
    await waitFor(cdp, "!document.querySelector('.zb-status b')", 3000);
  }
  const start = await evaluate(cdp, `(() => {
    const b=document.querySelector('.zb-start-wave');
    if(!b)return false;
    b.click();
    return true;
  })()`);
  if (!start) throw new Error('Wave start button missing');
  await waitFor(cdp, `document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-status') === 'RUNNING'`, 4000);
  const pausedAfterStart = await evaluate(cdp, "Boolean(document.querySelector('.zb-status b'))");
  if (pausedAfterStart) {
    await evaluate(cdp, "document.querySelector('.zb-hud-button')?.click(); true");
    await sleep(120);
  }
  await waitFor(cdp, "document.querySelectorAll('.zb-enemy').length > 0", 8000);
  await sleep(500);
}
async function metrics(cdp) {
  return evaluate(cdp, `(async () => {
    const shell=document.querySelector('[data-defense-screen="combat"]');
    const board=document.querySelector('.zb-board-wrap')?.getBoundingClientRect();
    const art=document.querySelector('.zb-board-production-art');
    const href=art?.getAttribute('href') || null;
    let artBytes=0;
    let sourceBytes=0;
    if(href){
      const response=await fetch(href);
      if(response.ok) artBytes=(await response.arrayBuffer()).byteLength;
    }
    const sourceResponse=await fetch('assets/defense/board/ramp-01-hd01.webp');
    if(sourceResponse.ok) sourceBytes=(await sourceResponse.arrayBuffer()).byteLength;
    return {
      scenario:shell?.getAttribute('data-scenario')||null,
      map:shell?.getAttribute('data-map')||null,
      productionMap:shell?.getAttribute('data-production-map')||null,
      artHref:href,
      artBytes,
      sourceBytes,
      productionArtCount:document.querySelectorAll('.zb-board-production-art').length,
      processOverlay:Boolean(document.querySelector('[data-site-process-map="map-apt-bottom-up-excavation-01"]')),
      pads:document.querySelectorAll('.zb-pad-runtime').length,
      routePoints:document.querySelector('.zb-path')?.getAttribute('points')||null,
      towers:document.querySelectorAll('.zb-tower').length,
      controlPq:document.querySelectorAll('[data-pq-control="CONTROL:L1"]').length,
      enemies:document.querySelectorAll('.zb-enemy').length,
      swift:document.querySelectorAll('.zb-enemy-swift').length,
      prototypeBoardItems:document.querySelectorAll('.zb-board [data-art-state="prototype"]').length,
      activeSvgVisuals:[...document.querySelectorAll('image[href],img[src]')].filter(el => {
        const uri=el.getAttribute('href') || el.getAttribute('src') || '';
        const r=el.getBoundingClientRect();
        return uri.toLowerCase().includes('.svg') && r.width>0 && r.height>0;
      }).map(el => el.getAttribute('href') || el.getAttribute('src')),
      status:shell?.getAttribute('data-status')||null,
      board:board?{left:Math.round(board.left),top:Math.round(board.top),right:Math.round(board.right),bottom:Math.round(board.bottom),width:Math.round(board.width),height:Math.round(board.height)}:null,
      overflow:document.documentElement.scrollWidth>innerWidth+2,
      viewport:{width:innerWidth,height:innerHeight},
    };
  })()`);
}

const EXPECTED_ROUTE='0,500 180,500 180,390 370,390 370,240 620,240 620,120 1000,120';
const report={schema_version:1,source_sha:process.env.GITHUB_SHA||null,desktop:null,mobile:null,failures:[]};
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
  await enterRepresentativeBottomUp(cdp);
  report.desktop=await metrics(cdp);
  if(report.desktop.map!=='map-apt-bottom-up-excavation-01') throw new Error('G8-A map mismatch');
  if(report.desktop.productionMap!=='HD_REFERENCE_ONLY') throw new Error('G8-A must remain HD_REFERENCE_ONLY until non-SVG final art exists');
  if(!report.desktop.artHref?.includes('ramp-01-hd01.webp') || report.desktop.artBytes<100000 || report.desktop.sourceBytes<100000) throw new Error('HD raster reference did not load');
  if(report.desktop.productionArtCount!==1 || !report.desktop.processOverlay) throw new Error('Production map or topology overlay missing');
  if(report.desktop.pads!==8 || report.desktop.routePoints!==EXPECTED_ROUTE) throw new Error('Locked topology coordinates changed');
  if(report.desktop.towers!==1 || report.desktop.controlPq!==1 || report.desktop.enemies<1 || report.desktop.swift<1 || report.desktop.status!=='RUNNING') throw new Error('Representative CONTROL/SWIFT actors missing from G8-A evidence');
  if(report.desktop.prototypeBoardItems!==0) throw new Error('Prototype art leaked into representative G8-A board');
  if(report.desktop.activeSvgVisuals.length>0) throw new Error('SVG visual asset still active; G8-A Production Lock forbidden: '+JSON.stringify(report.desktop.activeSvgVisuals));
  if(report.desktop.overflow) throw new Error('Desktop G8-A horizontal overflow');
  await screenshot(cdp,'01-g8a-bottom-up-live.png');

  await viewport(cdp,390,844,true);
  await clearState(cdp);
  await navigate(cdp);
  await enterRepresentativeBottomUp(cdp);
  report.mobile=await metrics(cdp);
  if(report.mobile.map!=='map-apt-bottom-up-excavation-01' || report.mobile.productionMap!=='HD_REFERENCE_ONLY') throw new Error('Mobile G8-A must remain HD_REFERENCE_ONLY');
  if(report.mobile.pads!==8 || report.mobile.routePoints!==EXPECTED_ROUTE) throw new Error('Mobile G8-A topology changed');
  if(report.mobile.towers!==1 || report.mobile.controlPq!==1 || report.mobile.enemies<1 || report.mobile.swift<1) throw new Error('Mobile representative CONTROL/SWIFT actors missing');
  if(report.mobile.prototypeBoardItems!==0) throw new Error('Prototype art leaked into mobile G8-A board');
  if(report.mobile.activeSvgVisuals.length>0) throw new Error('SVG visual asset still active on mobile; G8-A Production Lock forbidden: '+JSON.stringify(report.mobile.activeSvgVisuals));
  if(report.mobile.overflow) throw new Error('390x844 G8-A horizontal overflow');
  if(!report.mobile.board || report.mobile.board.left < -2 || report.mobile.board.right > 392 || report.mobile.board.width < 300) {
    throw new Error('390x844 G8-A board escaped viewport: '+JSON.stringify(report.mobile.board));
  }
  await screenshot(cdp,'02-g8a-bottom-up-mobile.png');
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

fs.writeFileSync(path.join(outputDir,'g8a-bottom-up-map-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('G8A_BOTTOM_UP='+JSON.stringify(report));
if(report.failures.length){
  if(stderr.trim()) console.error(stderr.slice(-3000));
  process.exit(1);
}
console.log('G8-A raster-only production-map browser QA passed.');
