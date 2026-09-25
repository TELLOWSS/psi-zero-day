import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_G7_ARTIFACT_DIR || 'artifacts/g7-data-center');
fs.mkdirSync(outputDir, { recursive: true });

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('G7 browser QA requires Chrome/Chromium.');

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9777);
const profileDir = fs.mkdtempSync('/tmp/psi-g7-chrome-');
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
  await sleep(250);
}
async function clearState(cdp) {
  await evaluate(cdp, `(() => {
    localStorage.removeItem('psi-zero-day.defense.save.v1');
    localStorage.removeItem('psi-zero-day.data-center-state.v1');
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
async function enterDataCenter(cdp) {
  await clickButton(cdp, '현장 · 공정');
  await waitFor(cdp, "Boolean(document.querySelector('.site-profile-screen'))");
  await clickButton(cdp, 'MEP Rough-in');
  await waitFor(cdp, "document.querySelector('.site-profile-screen')?.getAttribute('data-site-profile') === 'data-center-mep'");
  await waitFor(cdp, "Boolean(document.querySelector('.data-center-runtime-panel'))");
}
async function profileMetrics(cdp) {
  return evaluate(cdp, `(() => {
    const rect = sel => { const el=document.querySelector(sel); if(!el)return null; const r=el.getBoundingClientRect(); return {left:Math.round(r.left),top:Math.round(r.top),right:Math.round(r.right),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)}; };
    const practice=document.querySelector('.site-process-preview-head button');
    let persisted=null;
    try { persisted=JSON.parse(localStorage.getItem('psi-zero-day.data-center-state.v1')||'null'); } catch {}
    return {
      profile:document.querySelector('.site-profile-screen')?.getAttribute('data-site-profile')||null,
      phase:document.querySelector('.data-center-runtime-panel')?.getAttribute('data-data-center-phase')||null,
      top:[...document.querySelectorAll('.site-profile-top3 article')].map(el=>({risk:el.getAttribute('data-risk'),score:Number(el.querySelector(':scope > b')?.textContent||0)})),
      actions:document.querySelectorAll('.data-center-runtime-actions button').length,
      done:document.querySelectorAll('.data-center-runtime-actions button[data-done="true"]').length,
      practiceDisabled:Boolean(practice?.disabled),
      panel:rect('.data-center-runtime-panel'),
      preview:rect('.site-process-preview'),
      overflow:document.documentElement.scrollWidth>innerWidth+2,
      persisted,
      notice:(document.querySelector('.data-center-runtime-notice')?.textContent||'').trim(),
    };
  })()`);
}
async function combatMetrics(cdp) {
  return evaluate(cdp, `(() => {
    const shell=document.querySelector('[data-defense-screen="combat"]');
    const world=document.querySelector('.zb-data-center-world');
    return {
      scenario:shell?.getAttribute('data-scenario')||null,
      map:shell?.getAttribute('data-map')||null,
      phase:shell?.getAttribute('data-data-center-phase')||null,
      energy:shell?.getAttribute('data-energy-state')||null,
      overlay:Boolean(document.querySelector('[data-site-process-map="map-data-center-energization-commissioning-01"]')),
      world:{
        phase:world?.getAttribute('data-data-center-phase')||null,
        energy:world?.getAttribute('data-energy-state')||null,
        isolation:world?.getAttribute('data-isolation')||null,
        interlock:world?.getAttribute('data-interlock')||null,
        commissioning:world?.getAttribute('data-commissioning')||null,
      },
      energyNodes:document.querySelectorAll('.zb-data-center-energy > g').length,
      zones:document.querySelectorAll('.zb-site-zone').length,
      pads:document.querySelectorAll('.zb-pad-runtime').length,
      overflow:document.documentElement.scrollWidth>innerWidth+2,
    };
  })()`);
}

const TO_ENERGIZED = [
  'MEP 간섭·미완료 정리',
  '전기 작업경계 확인',
  '계통 격리계획 확정',
  '계통 격리 검증',
  '통전 전 점검',
  '제한 통전 상태 전환',
];

const report = {
  schema_version: 1,
  source_sha: process.env.GITHUB_SHA || null,
  desktop_initial: null,
  blocked_guard: null,
  energized_ready: null,
  combat: null,
  integrated: null,
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
  await enterDataCenter(cdp);

  report.desktop_initial = await profileMetrics(cdp);
  if (!report.desktop_initial.practiceDisabled) throw new Error('Data-center practice must be gated initially');
  if (report.desktop_initial.actions !== 10) throw new Error('Expected 10 data-center state actions');
  if (report.desktop_initial.top[0]?.risk !== 'SWARM') throw new Error('MEP initial top risk should be SWARM');
  if (report.desktop_initial.overflow) throw new Error('Desktop data-center profile overflow');
  await screenshot(cdp, '01-data-center-initial.png');

  await clickButton(cdp, '제한 통전 상태 전환', '.data-center-runtime-actions button');
  await sleep(80);
  report.blocked_guard = await profileMetrics(cdp);
  if (report.blocked_guard.done !== 0) throw new Error('Unsafe energization shortcut changed state');
  if (!report.blocked_guard.notice.includes('통전 전')) throw new Error('Unsafe energization guard message missing');

  for (const label of TO_ENERGIZED) {
    await clickButton(cdp, label, '.data-center-runtime-actions button');
    await sleep(90);
  }
  report.energized_ready = await profileMetrics(cdp);
  if (report.energized_ready.practiceDisabled) throw new Error('Data-center practice did not unlock after energized-state prerequisites');
  if (report.energized_ready.phase !== 'ENERGIZATION') throw new Error('Data-center phase did not reach ENERGIZATION');
  if (report.energized_ready.persisted?.energyState !== 'ENERGIZED'
    || report.energized_ready.persisted?.isolationState !== 'VERIFIED'
    || report.energized_ready.persisted?.commissioningState !== 'PRECHECK') {
    throw new Error('Persisted data-center energized state mismatch: ' + JSON.stringify(report.energized_ready.persisted));
  }
  if (!report.energized_ready.top.slice(0,3).some(row => row.risk === 'ARMORED')) {
    throw new Error('ARMORED did not enter energized top-3');
  }
  await screenshot(cdp, '02-data-center-energized.png');

  await clickButton(cdp, '이 공정으로 디펜스 체험', '.site-process-preview-head button');
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="support-select"]'))`, 15000);
  await evaluate(cdp, "document.querySelector('.zb-support-card')?.click(); true");
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="combat"]'))`, 12000);
  await sleep(220);
  report.combat = await combatMetrics(cdp);
  if (report.combat.scenario !== 'training-data-center:energization-commissioning') throw new Error('Data-center Defense scenario mismatch');
  if (report.combat.map !== 'map-data-center-energization-commissioning-01') throw new Error('Data-center map mismatch');
  if (!report.combat.overlay || report.combat.pads !== 8 || report.combat.zones < 6) throw new Error('Data-center topology missing in live Defense world');
  if (report.combat.world.energy !== 'ENERGIZED' || report.combat.world.isolation !== 'VERIFIED') {
    throw new Error('Energized data-center world state missing in Defense board: ' + JSON.stringify(report.combat.world));
  }
  if (report.combat.energyNodes !== 5) throw new Error('Energized system nodes missing from live board');
  await screenshot(cdp, '03-data-center-combat.png');

  await navigate(cdp);
  await enterDataCenter(cdp);
  for (const label of ['인터록 검증','단일계통 시험','통합시운전']) {
    await clickButton(cdp, label, '.data-center-runtime-actions button');
    await sleep(90);
  }
  report.integrated = await profileMetrics(cdp);
  if (report.integrated.phase !== 'INTEGRATED_COMMISSIONING') throw new Error('Integrated commissioning phase missing');
  if (!report.integrated.top.slice(0,3).some(row => row.risk === 'BOSS')) throw new Error('BOSS did not enter integrated commissioning top-3');
  if (report.integrated.persisted?.commissioningState !== 'INTEGRATED_TEST'
    || report.integrated.persisted?.energyState !== 'LIVE_CRITICAL') {
    throw new Error('Integrated commissioning state mismatch: ' + JSON.stringify(report.integrated.persisted));
  }
  await screenshot(cdp, '04-data-center-integrated.png');

  await viewport(cdp, 390, 844, true);
  await clearState(cdp);
  await navigate(cdp);
  await enterDataCenter(cdp);
  await evaluate(cdp, "document.querySelector('.data-center-runtime-panel')?.scrollIntoView({block:'start'}); true");
  await sleep(150);
  report.mobile = await profileMetrics(cdp);
  if (report.mobile.overflow) throw new Error('390x844 data-center screen horizontal overflow');
  if (!report.mobile.panel || report.mobile.panel.left < -1 || report.mobile.panel.right > 391 || report.mobile.panel.width < 300) {
    throw new Error('390x844 data-center state panel escaped viewport: ' + JSON.stringify(report.mobile.panel));
  }
  if (!report.mobile.practiceDisabled) throw new Error('Mobile data-center gate is not locked initially');
  await screenshot(cdp, '05-mobile-data-center-panel.png');
} catch (error) {
  report.failures.push(error instanceof Error ? error.message : String(error));
  if (cdp) { try { await screenshot(cdp, 'error.png'); } catch {} }
} finally {
  if (cdp) cdp.close();
  if (target) { try { await fetch('http://127.0.0.1:' + port + '/json/close/' + target.id); } catch {} }
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(1200)]);
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
}

fs.writeFileSync(path.join(outputDir, 'g7-data-center-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('G7_DATA_CENTER=' + JSON.stringify(report));
if (report.failures.length) {
  if (stderr.trim()) console.error(stderr.slice(-3000));
  process.exit(1);
}
console.log('G7 DATA-CENTER browser QA passed.');
