import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_PULSE_ARTIFACT_DIR || 'artifacts/pulse-l1');
fs.mkdirSync(outputDir, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.resolve('content/defense/pulse-tower-production-v1.json'), 'utf8'));
const target = manifest.levels?.find(item => item.levelId === 'L1');
if (!target || target.status !== 'PRODUCTION_APPROVED') throw new Error('PULSE:L1 production raster must be approved before browser QA');
const expectedUri = target.runtimeUri;

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('PULSE:L1 browser QA requires Chrome/Chromium.');

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9892);
const profileDir = fs.mkdtempSync('/tmp/psi-pulse-chrome-');
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
      const timer = setTimeout(() => reject(new Error('Timed out waiting for ' + method), timeoutMs));
      this.events.set(method, [...(this.events.get(method) || []), listener]);
    });
  }
  close() { this.socket.close(); }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime.evaluate failed');
  return result.result?.value;
}

async function waitFor(cdp, expression, timeoutMs = 12000, intervalMs = 100) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(intervalMs);
  }
  throw new Error('Timed out waiting for: ' + expression);
}

async function screenshot(cdp, filename) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(result.data, 'base64'));
}

async function viewport(cdp, width, height, mobile) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: mobile ? 2.75 : 1,
    mobile,
    screenOrientation: width > height ? { type: 'landscapePrimary', angle: 90 } : { type: 'portraitPrimary', angle: 0 },
  });
}

async function navigate(cdp) {
  const loaded = cdp.once('Page.loadEventFired', 15000);
  await cdp.send('Page.navigate', { url: baseUrl });
  await loaded;
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
  await sleep(180);
}

function fnv1a32(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return 'fnv1a32:' + (hash >>> 0).toString(16).padStart(8, '0');
}

function representativeDefenseSave(firing = false) {
  const run = {
    runId: 'g8a-pulse-l1-representative',
    mode: 'TRAINING',
    variant: 'STANDARD',
    scenarioId: 'training-site:apt-new-bottom-up-excavation',
    eventId: null,
    eventContentVersion: null,
    status: 'RUNNING',
    paused: firing,
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
      towerId: 'PULSE',
      levelId: 'L1',
      targetMode: 'FIRST',
      invested: 80,
      attackCooldown: firing ? 16 : 0,
      revealCooldown: 0,
    }],
    enemies: [{
      id: 'enemy-10',
      enemyId: 'VEILED',
      hp: 48,
      distance: 76,
      spawnSequence: 10,
      revealUntilTick: 4300,
      slowEffects: [],
      bossPhaseTriggered: false,
      bossArmorFromTick: 0,
      bossArmorUntilTick: 0,
    }, {
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
    spawnedByGroup: [1, 1],
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
      updatedAt: '2026-09-29T00:00:00.000Z',
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
    buildVersion: 'pulse-l1-representative-qa',
    revision: 1,
    savedAt: '2026-09-29T00:00:00.000Z',
    checksum: fnv1a32(JSON.stringify(payload)),
    payload,
  };
}

async function setSave(cdp, firing = false) {
  const save = representativeDefenseSave(firing);
  const expression = "(() => { localStorage.setItem('psi-zero-day.defense.save.v1', " + JSON.stringify(JSON.stringify(save)) + "); localStorage.setItem('psi-zero-day.defense.tutorial.v1', 'seen'); return true; })()";
  await evaluate(cdp, expression);
}

async function clickButton(cdp, label) {
  const expression = "(() => { const el=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes(" + JSON.stringify(label) + ")); if(!el)return false; el.click(); return true; })()";
  const clicked = await evaluate(cdp, expression);
  if (!clicked) throw new Error('Button not found: ' + label);
}

async function enterRepresentative(cdp, firing = false) {
  await setSave(cdp, firing);
  await clickButton(cdp, '현장 디펜스');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"persistence-gate\"]')) || document.body.textContent.includes('중단한 훈련이 있습니다')");
  await clickButton(cdp, '이어서 훈련');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\"combat\"]')?.getAttribute('data-map') === 'map-apt-bottom-up-excavation-01'");
  await waitFor(cdp, "Boolean(document.querySelector('[data-g8a-pulse-dedicated=\"true\"]'))");
  await sleep(180);
}

async function metrics(cdp) {
  return evaluate(cdp, "(() => { const tower=document.querySelector('[data-g8a-pulse-dedicated=\"true\"][data-g8a-tower=\"PULSE\"][data-g8a-tower-level=\"L1\"]'); const image=tower?.querySelector('image'); const tr=tower?.getBoundingClientRect(); const board=document.querySelector('.zb-board')?.getBoundingClientRect(); return { towerCount:document.querySelectorAll('.zb-tower').length, dedicated:document.querySelectorAll('[data-g8a-pulse-dedicated=\"true\"]').length, genericDedicated:document.querySelectorAll('[data-g8a-tower-dedicated=\"true\"]').length, uri:tower?.getAttribute('data-g8a-tower-uri')||null, imageHref:image?.getAttribute('href')||null, semantic:tower?.getAttribute('data-g8a-semantic')||null, bounds:tr?{width:Math.round(tr.width),height:Math.round(tr.height)}:null, board:board?{width:Math.round(board.width),height:Math.round(board.height),left:Math.round(board.left),right:Math.round(board.right)}:null, interventionCue:document.querySelectorAll('[data-g8a-pulse-dedicated=\"true\"] .zb-g8a-intervention-cue').length, legacyDistributionBoard:[...document.querySelectorAll('image[href],img[src]')].filter(el=>{ const uri=el.getAttribute('href')||el.getAttribute('src')||''; const r=el.getBoundingClientRect(); return uri.includes('temporary-distribution-board.webp')&&r.width>0&&r.height>0; }).length, activeSvgVisuals:[...document.querySelectorAll('image[href],img[src]')].filter(el=>{ const uri=el.getAttribute('href')||el.getAttribute('src')||''; const r=el.getBoundingClientRect(); return uri.toLowerCase().includes('.svg')&&r.width>0&&r.height>0; }).map(el=>el.getAttribute('href')||el.getAttribute('src')), prototypeBoardItems:document.querySelectorAll('.zb-board [data-art-state=\"prototype\"]').length, motionWorkers:[...document.querySelectorAll('[data-motion-worker]')].filter(el=>{ const r=el.getBoundingClientRect(); return r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight; }).length, motionVehicles:[...document.querySelectorAll('[data-motion-vehicle]')].filter(el=>{ const r=el.getBoundingClientRect(); return r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&r.bottom>0&&r.top<innerHeight; }).length, overflow:document.documentElement.scrollWidth>innerWidth+1||document.body.scrollWidth>innerWidth+1, viewport:{width:innerWidth,height:innerHeight} }; })()");
}

function assertBase(label, m, maxW, maxH) {
  if (m.towerCount !== 1 || m.dedicated !== 1 || m.genericDedicated !== 1) throw new Error(label+' dedicated PULSE count mismatch: '+JSON.stringify(m));
  if (m.uri !== expectedUri || m.imageHref !== expectedUri) throw new Error(label+' PULSE runtime URI mismatch: '+JSON.stringify({uri:m.uri,image:m.imageHref,expected:expectedUri}));
  if (m.semantic !== 'ALERT_CONTROL') throw new Error(label+' PULSE semantic mismatch: '+m.semantic);
  if (!m.bounds || m.bounds.width > maxW || m.bounds.height > maxH || m.bounds.width < 30 || m.bounds.height < 45) throw new Error(label+' PULSE footprint mismatch: '+JSON.stringify(m.bounds));
  if (m.legacyDistributionBoard !== 0) throw new Error(label+' legacy distribution-board fallback is still active');
  if (m.activeSvgVisuals.length > 0) throw new Error(label+' active SVG visuals remain: '+JSON.stringify(m.activeSvgVisuals));
  if (m.prototypeBoardItems !== 0) throw new Error(label+' prototype board item remains: '+m.prototypeBoardItems);
  if (m.motionWorkers < 3 || m.motionVehicles < 1) throw new Error(label+' living-site context missing');
  if (m.overflow) throw new Error(label+' horizontal overflow');
}

const report = { schemaVersion: 1, sourceSha: process.env.GITHUB_SHA || null, expectedUri, desktop: null, landscape: null, mobile: null, firing: null, failures: [] };
let cdp;

try {
  const version = await waitJson('http://127.0.0.1:' + port + '/json/version');
  cdp = new Cdp(version.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  await viewport(cdp, 1440, 900, false);
  await navigate(cdp);
  await enterRepresentative(cdp, false);
  report.desktop = await metrics(cdp);
  assertBase('desktop', report.desktop, 115, 135);
  await screenshot(cdp, '01-pulse-l1-desktop.png');

  await viewport(cdp, 780, 360, true);
  await navigate(cdp);
  await enterRepresentative(cdp, false);
  report.landscape = await metrics(cdp);
  assertBase('780x360', report.landscape, 72, 86);
  await screenshot(cdp, '02-pulse-l1-landscape.png');

  await viewport(cdp, 390, 844, true);
  await navigate(cdp);
  await enterRepresentative(cdp, false);
  report.mobile = await metrics(cdp);
  assertBase('390x844', report.mobile, 105, 125);
  await screenshot(cdp, '03-pulse-l1-mobile.png');

  await viewport(cdp, 390, 844, true);
  await navigate(cdp);
  await enterRepresentative(cdp, true);
  report.firing = await metrics(cdp);
  assertBase('390x844 firing', report.firing, 125, 145);
  if (report.firing.interventionCue !== 1) throw new Error('PULSE direct-intervention firing cue missing: '+JSON.stringify(report.firing));
  await screenshot(cdp, '04-pulse-l1-direct-intervention.png');

  fs.writeFileSync(path.join(outputDir, 'pulse-l1-browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('PULSE_L1_BROWSER=' + JSON.stringify(report));
} catch (error) {
  report.failures.push(String(error?.stack || error));
  fs.writeFileSync(path.join(outputDir, 'pulse-l1-browser-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.error('PULSE_L1_BROWSER=' + JSON.stringify(report));
  console.error(stderr);
  process.exitCode = 1;
} finally {
  try { cdp?.close(); } catch {}
  try { browser.kill('SIGTERM'); } catch {}
}
