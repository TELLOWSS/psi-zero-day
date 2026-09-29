import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_CONTROL_L2_ARTIFACT_DIR || 'artifacts/control-l2');
fs.mkdirSync(outputDir, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.resolve('content/defense/control-tower-production-v1.json'), 'utf8'));
const l1 = manifest.levels?.find(item => item.levelId === 'L1');
const l2 = manifest.levels?.find(item => item.levelId === 'L2');
if (!l1 || !l2) throw new Error('CONTROL L1/L2 production manifest entries are required');
if (l2.status !== 'PRODUCTION_APPROVED') throw new Error('CONTROL:L2 must be PRODUCTION_APPROVED before browser QA');
if (l1.runtimeUri === l2.runtimeUri) throw new Error('CONTROL:L2 must not reuse the L1 runtime URI');

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('CONTROL:L2 browser QA requires Chrome/Chromium');

const port = Number(process.env.PSI_CONTROL_L2_CHROME_PORT || 9891);
const profileDir = fs.mkdtempSync('/tmp/psi-control-l2-');
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

async function waitFor(cdp, expression, timeoutMs = 12000, intervalMs = 100) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(intervalMs);
  }
  throw new Error('Timed out waiting for: ' + expression);
}

async function setViewport(cdp, width, height, mobile) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: mobile ? 2.75 : 1, mobile,
    screenOrientation: width > height
      ? { type: 'landscapePrimary', angle: 90 }
      : { type: 'portraitPrimary', angle: 0 },
  });
}

async function navigate(cdp) {
  const loaded = cdp.once('Page.loadEventFired', 15000);
  await cdp.send('Page.navigate', { url: baseUrl });
  await loaded;
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
}

async function clickText(cdp, text) {
  const clicked = await evaluate(cdp, `(() => {
    const el=[...document.querySelectorAll('button')].find(node => (node.textContent||'').includes(${JSON.stringify(text)}));
    if(!el) return false;
    el.click();
    return true;
  })()`);
  if (!clicked) throw new Error('Button not found: ' + text);
}

function fnv1a32(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return 'fnv1a32:' + (hash >>> 0).toString(16).padStart(8, '0');
}

function l2Save() {
  const run = {
    runId: 'control-l2-actual-play',
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
    resource: 180,
    towers: [{
      id: 'tower-l2',
      padId: 'BU-P3',
      towerId: 'CONTROL',
      levelId: 'L2',
      targetMode: 'FIRST',
      invested: 150,
      attackCooldown: 0,
      revealCooldown: 0,
    }],
    enemies: [{
      id: 'enemy-swift',
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
      scenarioId: run.scenarioId,
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
    buildVersion: 'control-l2-qa',
    revision: 1,
    savedAt: '2026-09-29T00:00:00.000Z',
    checksum: fnv1a32(JSON.stringify(payload)),
    payload,
  };
}

async function enterL2(cdp) {
  const save = l2Save();
  await evaluate(cdp, `(() => {
    localStorage.setItem('psi-zero-day.defense.save.v1', ${JSON.stringify(JSON.stringify(save))});
    localStorage.setItem('psi-zero-day.defense.tutorial.v1', 'seen');
    return true;
  })()`);
  await clickText(cdp, '현장 디펜스');
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="persistence-gate"]')) || document.body.textContent.includes('중단한 훈련이 있습니다')`);
  await clickText(cdp, '이어서 훈련');
  await waitFor(cdp, `document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-wave') === '8'`);
  await waitFor(cdp, `Boolean(document.querySelector('[data-g8a-control-dedicated="true"][data-g8a-tower-level="L2"]'))`);
  await sleep(180);
}

async function snapshot(cdp) {
  return evaluate(cdp, `(() => {
    const shell=document.querySelector('[data-defense-screen="combat"]');
    const l2=document.querySelector('[data-g8a-control-dedicated="true"][data-g8a-tower-level="L2"]');
    const l1=document.querySelector('[data-g8a-control-dedicated="true"][data-g8a-tower-level="L1"]');
    const image=l2?.querySelector('image');
    const rect=l2?.getBoundingClientRect();
    return {
      map:shell?.getAttribute('data-map')||null,
      wave:shell?.getAttribute('data-wave')||null,
      frameMode:shell?.getAttribute('data-frame-mode')||null,
      l2Dedicated:Boolean(l2),
      l1Dedicated:Boolean(l1),
      uri:l2?.getAttribute('data-g8a-tower-uri')||null,
      imageHref:image?.getAttribute('href')||null,
      bounds:rect ? { width:Math.round(rect.width), height:Math.round(rect.height) } : null,
      fallbackL1Composite:document.querySelectorAll('[data-pq-control="CONTROL:L1"]').length,
      activeSvg:[...document.querySelectorAll('image[href],img[src]')].map(el => el.getAttribute('href')||el.getAttribute('src')||'').filter(uri => uri.toLowerCase().includes('.svg')),
      overflow:document.documentElement.scrollWidth > innerWidth + 2,
      viewport:{width:innerWidth,height:innerHeight},
    };
  })()`);
}

async function screenshot(cdp, name) {
  const result = await cdp.send('Page.captureScreenshot', { format:'png', fromSurface:true, captureBeyondViewport:false });
  fs.writeFileSync(path.join(outputDir, name), Buffer.from(result.data, 'base64'));
}

const report = { sourceSha:process.env.GITHUB_SHA||null, desktop:null, mobile:null, failures:[] };
let cdp;
let target;

try {
  await waitJson('http://127.0.0.1:' + port + '/json/version');
  const response = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method:'PUT' });
  target = await response.json();
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  await setViewport(cdp, 1440, 900, false);
  await navigate(cdp);
  await enterL2(cdp);
  report.desktop = await snapshot(cdp);
  await screenshot(cdp, 'control-l2-desktop.png');

  if (!report.desktop.l2Dedicated || report.desktop.l1Dedicated) throw new Error('Desktop did not isolate CONTROL:L2 dedicated art');
  if (report.desktop.uri !== l2.runtimeUri || report.desktop.imageHref !== l2.runtimeUri) throw new Error('Desktop CONTROL:L2 URI mismatch');
  if (report.desktop.fallbackL1Composite !== 0) throw new Error('Desktop fell back to legacy CONTROL:L1 composite');
  if (!report.desktop.bounds || report.desktop.bounds.width > 135 || report.desktop.bounds.height > 120) throw new Error('Desktop CONTROL:L2 footprint too large: ' + JSON.stringify(report.desktop.bounds));
  if (report.desktop.activeSvg.length) throw new Error('Desktop CONTROL:L2 run contains active SVG final visuals');
  if (report.desktop.overflow) throw new Error('Desktop CONTROL:L2 caused horizontal overflow');

  await setViewport(cdp, 390, 844, true);
  await navigate(cdp);
  await enterL2(cdp);
  report.mobile = await snapshot(cdp);
  await screenshot(cdp, 'control-l2-mobile-390x844.png');

  if (!report.mobile.l2Dedicated || report.mobile.l1Dedicated) throw new Error('390x844 did not isolate CONTROL:L2 dedicated art');
  if (report.mobile.uri !== l2.runtimeUri || report.mobile.imageHref !== l2.runtimeUri) throw new Error('390x844 CONTROL:L2 URI mismatch');
  if (report.mobile.fallbackL1Composite !== 0) throw new Error('390x844 fell back to legacy CONTROL:L1 composite');
  if (!report.mobile.bounds || report.mobile.bounds.width > 108 || report.mobile.bounds.height > 110) throw new Error('390x844 CONTROL:L2 footprint too large: ' + JSON.stringify(report.mobile.bounds));
  if (report.mobile.activeSvg.length) throw new Error('390x844 CONTROL:L2 run contains active SVG final visuals');
  if (report.mobile.overflow) throw new Error('390x844 CONTROL:L2 caused horizontal overflow');

} catch (error) {
  report.failures.push(error instanceof Error ? error.message : String(error));
  if (cdp) {
    try { await screenshot(cdp, 'control-l2-error.png'); } catch {}
  }
} finally {
  if (cdp) cdp.close();
  if (target) {
    try { await fetch('http://127.0.0.1:' + port + '/json/close/' + target.id); } catch {}
  }
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(1200)]);
  try { fs.rmSync(profileDir, { recursive:true, force:true }); } catch {}
}

fs.writeFileSync(path.join(outputDir, 'control-l2-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('CONTROL_L2=' + JSON.stringify(report));
if (report.failures.length) {
  if (stderr.trim()) console.error(stderr.slice(-3000));
  process.exit(1);
}
console.log('CONTROL:L2 dedicated raster actual-play gate PASS');
