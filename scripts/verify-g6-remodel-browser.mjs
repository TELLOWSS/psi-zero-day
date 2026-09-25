import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_G6_ARTIFACT_DIR || 'artifacts/g6-remodel');
fs.mkdirSync(outputDir, { recursive: true });

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('G6 browser QA requires Chrome/Chromium.');

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9666);
const profileDir = fs.mkdtempSync('/tmp/psi-g6-chrome-');
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
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
async function shot(cdp, filename) {
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
  await sleep(250);
}
async function clearState(cdp) {
  await evaluate(cdp, `(() => {
    localStorage.removeItem('psi-zero-day.defense.save.v1');
    localStorage.removeItem('psi-zero-day.remodel-state.v1');
    localStorage.removeItem('psi-zero-day.site-profile.v1');
    return true;
  })()`);
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
async function enterRemodel(cdp) {
  await clickButton(cdp, '현장 · 공정');
  await waitFor(cdp, "Boolean(document.querySelector('.site-profile-screen'))");
  await clickButton(cdp, '선택철거');
  await waitFor(cdp, "document.querySelector('.site-profile-screen')?.getAttribute('data-site-profile') === 'apt-remodel-selective-demolition'");
  await waitFor(cdp, "Boolean(document.querySelector('.remodel-runtime-panel'))");
}
async function profileMetrics(cdp) {
  return evaluate(cdp, `(() => {
    const rect = sel => { const el=document.querySelector(sel); if(!el)return null; const r=el.getBoundingClientRect(); return {left:Math.round(r.left),top:Math.round(r.top),right:Math.round(r.right),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)}; };
    const practice=[...document.querySelectorAll('.site-process-preview-head button')][0];
    let persisted=null;
    try { persisted=JSON.parse(localStorage.getItem('psi-zero-day.remodel-state.v1')||'null'); } catch {}
    return {
      profile:document.querySelector('.site-profile-screen')?.getAttribute('data-site-profile')||null,
      phase:document.querySelector('.remodel-runtime-panel')?.getAttribute('data-remodel-phase')||null,
      top:[...document.querySelectorAll('.site-profile-top3 article')].map(el=>({risk:el.getAttribute('data-risk'),score:Number(el.querySelector(':scope > b')?.textContent||0)})),
      actions:document.querySelectorAll('.remodel-runtime-actions button').length,
      done:document.querySelectorAll('.remodel-runtime-actions button[data-done="true"]').length,
      practiceDisabled:Boolean(practice?.disabled),
      panel:rect('.remodel-runtime-panel'),
      preview:rect('.site-process-preview'),
      overflow:document.documentElement.scrollWidth>innerWidth+2,
      persisted,
      notice:(document.querySelector('.remodel-runtime-notice')?.textContent||'').trim(),
    };
  })()`);
}
async function combatMetrics(cdp) {
  return evaluate(cdp, `(() => {
    const shell=document.querySelector('[data-defense-screen="combat"]');
    const world=document.querySelector('.zb-remodel-world');
    return {
      scenario:shell?.getAttribute('data-scenario')||null,
      map:shell?.getAttribute('data-map')||null,
      phase:shell?.getAttribute('data-remodel-phase')||null,
      overlay:Boolean(document.querySelector('[data-site-process-map="map-apt-remodel-selective-connection-01"]')),
      world:{
        phase:world?.getAttribute('data-remodel-phase')||null,
        asBuilt:world?.getAttribute('data-as-built')||null,
        isolation:world?.getAttribute('data-isolation')||null,
        tempSupport:world?.getAttribute('data-temp-support')||null,
        opening:world?.getAttribute('data-opening')||null,
      },
      supports:document.querySelectorAll('.zb-remodel-supports > g').length,
      opening:Boolean(document.querySelector('.zb-remodel-opening')),
      zones:document.querySelectorAll('.zb-site-zone').length,
      pads:document.querySelectorAll('.zb-pad-runtime').length,
      overflow:document.documentElement.scrollWidth>innerWidth+2,
    };
  })()`);
}

const ACTION_SEQUENCE = [
  '도면·기록 검토',
  '현장 실측 확인',
  '계통 차단 확인',
  '임시지지 적용',
  '임시지지 검증',
  '선택철거 구역 확정',
];

const report = {
  schema_version: 1,
  source_sha: process.env.GITHUB_SHA || null,
  desktop_initial: null,
  blocked_guard: null,
  desktop_ready: null,
  combat: null,
  mobile: null,
  failures: [],
};

let cdp;
let target;
try {
  await waitJson('http://127.0.0.1:' + port + '/json/version');
  const response = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' });
  target = await response.json();
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  await viewport(cdp, 1440, 900, false);
  await navigate(cdp);
  await clearState(cdp);
  await navigate(cdp);
  await enterRemodel(cdp);

  report.desktop_initial = await profileMetrics(cdp);
  if (!report.desktop_initial.practiceDisabled) throw new Error('Remodel practice must be gated initially');
  if (report.desktop_initial.actions !== 10) throw new Error('Expected 10 remodeling state actions');
  if (report.desktop_initial.overflow) throw new Error('Desktop remodeling profile overflow');
  await shot(cdp, '01-remodel-initial.png');

  await clickButton(cdp, '임시지지 적용', '.remodel-runtime-actions button');
  await sleep(80);
  report.blocked_guard = await profileMetrics(cdp);
  if (report.blocked_guard.done !== 0) throw new Error('Unsafe shortcut changed remodeling state');
  if (!report.blocked_guard.notice.includes('기존 구조')) throw new Error('Unsafe shortcut guard message missing');

  for (const label of ACTION_SEQUENCE) {
    await clickButton(cdp, label, '.remodel-runtime-actions button');
    await sleep(80);
  }
  report.desktop_ready = await profileMetrics(cdp);
  if (report.desktop_ready.practiceDisabled) throw new Error('Remodel practice did not unlock after verified prerequisites');
  if (report.desktop_ready.phase !== 'SELECTIVE_DEMOLITION') throw new Error('Remodel phase did not reach SELECTIVE_DEMOLITION');
  if (report.desktop_ready.done !== 6) throw new Error('Expected six prerequisite actions complete');
  if (report.desktop_ready.persisted?.asBuiltConfidence !== 'HIGH'
    || report.desktop_ready.persisted?.isolationState !== 'VERIFIED'
    || report.desktop_ready.persisted?.tempSupportState !== 'VERIFIED'
    || report.desktop_ready.persisted?.structuralOpeningState !== 'PLANNED') {
    throw new Error('Persisted remodel world state mismatch: ' + JSON.stringify(report.desktop_ready.persisted));
  }
  const initialVeiled = report.desktop_initial.top.find(row => row.risk === 'VEILED')?.score ?? 0;
  const readyVeiled = report.desktop_ready.top.find(row => row.risk === 'VEILED')?.score ?? 0;
  if (!(readyVeiled < initialVeiled)) throw new Error('VEILED score did not fall after field verification');
  await shot(cdp, '02-remodel-ready.png');

  await clickButton(cdp, '이 공정으로 디펜스 체험', '.site-process-preview-head button');
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="support-select"]'))`, 15000);
  await evaluate(cdp, "document.querySelector('.zb-support-card')?.click(); true");
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="combat"]'))`, 12000);
  await sleep(220);
  report.combat = await combatMetrics(cdp);
  if (report.combat.scenario !== 'training-remodel:selective-demolition-connection') throw new Error('Remodel Defense scenario mismatch');
  if (report.combat.map !== 'map-apt-remodel-selective-connection-01') throw new Error('Remodel map mismatch');
  if (!report.combat.overlay || report.combat.pads !== 8 || report.combat.zones < 5) throw new Error('Remodel topology missing in live Defense world');
  if (report.combat.world.asBuilt !== 'HIGH' || report.combat.world.isolation !== 'VERIFIED'
    || report.combat.world.tempSupport !== 'VERIFIED' || report.combat.world.opening !== 'PLANNED') {
    throw new Error('Verified remodeling world state missing in Defense board: ' + JSON.stringify(report.combat.world));
  }
  if (report.combat.supports !== 9) throw new Error('Temporary support world cues missing');
  await shot(cdp, '03-remodel-combat.png');

  await viewport(cdp, 390, 844, true);
  await clearState(cdp);
  await navigate(cdp);
  await enterRemodel(cdp);
  await evaluate(cdp, "document.querySelector('.remodel-runtime-panel')?.scrollIntoView({block:'start'}); true");
  await sleep(150);
  report.mobile = await profileMetrics(cdp);
  if (report.mobile.overflow) throw new Error('390x844 remodeling screen horizontal overflow');
  if (!report.mobile.panel || report.mobile.panel.left < -1 || report.mobile.panel.right > 391 || report.mobile.panel.width < 300) {
    throw new Error('390x844 remodeling state panel escaped viewport: ' + JSON.stringify(report.mobile.panel));
  }
  if (!report.mobile.practiceDisabled) throw new Error('Mobile remodeling gate is not locked initially');
  await shot(cdp, '04-mobile-remodel-panel.png');
} catch (error) {
  report.failures.push(error instanceof Error ? error.message : String(error));
  if (cdp) { try { await shot(cdp, 'error.png'); } catch {} }
} finally {
  if (cdp) cdp.close();
  if (target) { try { await fetch('http://127.0.0.1:' + port + '/json/close/' + target.id); } catch {} }
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(1200)]);
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
}

fs.writeFileSync(path.join(outputDir, 'g6-remodel-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('G6_REMODEL=' + JSON.stringify(report));
if (report.failures.length) {
  if (stderr.trim()) console.error(stderr.slice(-3000));
  process.exit(1);
}
console.log('G6 REMODEL browser QA passed.');
