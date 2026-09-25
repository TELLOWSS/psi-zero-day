import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_G5_ARTIFACT_DIR || 'artifacts/g5-map-family');
fs.mkdirSync(outputDir, { recursive: true });

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('G5 browser QA requires Chrome/Chromium.');

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9555);
const profileDir = fs.mkdtempSync('/tmp/psi-g5-chrome-');
const browser = spawn(chrome, [
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--mute-audio',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=' + port,'--user-data-dir=' + profileDir,'about:blank',
], { stdio: ['ignore','pipe','pipe'] });

let browserStderr = '';
browser.stderr.on('data', chunk => { browserStderr += chunk.toString(); });
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
async function setViewport(cdp, width, height, mobile) {
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
async function clickButtonContaining(cdp, text) {
  const clicked = await evaluate(cdp, `(() => {
    const button = [...document.querySelectorAll('button')].find(item => (item.textContent || '').includes(${JSON.stringify(text)}));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error('Button not found: ' + text);
}
async function clearDefenseSave(cdp) {
  await evaluate(cdp, "localStorage.removeItem('psi-zero-day.defense.save.v1'); true");
}
async function enterProfile(cdp, label) {
  await clickButtonContaining(cdp, '현장 · 공정');
  await waitFor(cdp, "Boolean(document.querySelector('.site-profile-screen'))");
  await clickButtonContaining(cdp, label);
  await waitFor(cdp, "Boolean(document.querySelector('.site-process-preview:not(.is-pending)'))");
}
async function launchPractice(cdp) {
  await clickButtonContaining(cdp, '이 공정으로 디펜스 체험');
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="support-select"]'))`, 15000);
  await evaluate(cdp, "document.querySelector('.zb-support-card')?.click(); true");
  await waitFor(cdp, `Boolean(document.querySelector('[data-defense-screen="combat"]'))`, 12000);
  await sleep(220);
}
async function combatMetrics(cdp) {
  return evaluate(cdp, `(() => {
    const shell = document.querySelector('[data-defense-screen="combat"]');
    const overlay = document.querySelector('.zb-site-process-map');
    const rect = document.querySelector('.zb-board-wrap')?.getBoundingClientRect();
    return {
      scenario: shell?.getAttribute('data-scenario') || null,
      map: shell?.getAttribute('data-map') || null,
      overlay: overlay?.getAttribute('data-site-process-map') || null,
      zones: document.querySelectorAll('.zb-site-zone').length,
      visibility: document.querySelectorAll('.zb-site-visibility circle').length,
      transfers: document.querySelectorAll('.zb-site-transfers > g').length,
      workerRoutes: document.querySelectorAll('.zb-site-route-worker').length,
      materialRoutes: document.querySelectorAll('.zb-site-route-material').length,
      pads: document.querySelectorAll('.zb-pad-runtime').length,
      board: rect ? { left: Math.round(rect.left), top: Math.round(rect.top), right: Math.round(rect.right), bottom: Math.round(rect.bottom), width: Math.round(rect.width), height: Math.round(rect.height) } : null,
      overflow: document.documentElement.scrollWidth > innerWidth + 2,
    };
  })()`);
}
async function profileMetrics(cdp) {
  return evaluate(cdp, `(() => {
    const priority = document.querySelector('.site-profile-priority')?.getBoundingClientRect();
    const picker = document.querySelector('.site-profile-picker')?.getBoundingClientRect();
    const preview = document.querySelector('.site-process-preview')?.getBoundingClientRect();
    return {
      profile: document.querySelector('.site-profile-screen')?.getAttribute('data-site-profile') || null,
      top: [...document.querySelectorAll('.site-profile-top3 article')].map(item => item.getAttribute('data-risk')),
      priorityTop: priority ? Math.round(priority.top) : null,
      pickerTop: picker ? Math.round(picker.top) : null,
      preview: preview ? { top: Math.round(preview.top), bottom: Math.round(preview.bottom), width: Math.round(preview.width) } : null,
      overflow: document.documentElement.scrollWidth > innerWidth + 2,
    };
  })()`);
}

const report = { schema_version: 1, source_sha: process.env.GITHUB_SHA || null, bottom_up: null, top_down: null, mobile: null, failures: [] };
let cdp;
let target;
try {
  await waitJson('http://127.0.0.1:' + port + '/json/version');
  const response = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' });
  target = await response.json();
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  await setViewport(cdp, 1440, 900, false);
  await navigate(cdp);
  await clearDefenseSave(cdp);
  await enterProfile(cdp, '순타 · 굴착');
  await screenshot(cdp, '01-bottom-up-profile.png');
  await launchPractice(cdp);
  report.bottom_up = await combatMetrics(cdp);
  if (report.bottom_up.map !== 'map-apt-bottom-up-excavation-01') throw new Error('Bottom-up map mismatch: ' + JSON.stringify(report.bottom_up));
  if (report.bottom_up.transfers !== 1 || report.bottom_up.visibility !== 1) throw new Error('Bottom-up topology mismatch: ' + JSON.stringify(report.bottom_up));
  if (!report.bottom_up.overlay || report.bottom_up.pads !== 8) throw new Error('Bottom-up live topology missing: ' + JSON.stringify(report.bottom_up));
  await screenshot(cdp, '02-bottom-up-combat.png');

  await clearDefenseSave(cdp);
  await navigate(cdp);
  await enterProfile(cdp, '역타 · 슬래브 하부굴착');
  await screenshot(cdp, '03-top-down-profile.png');
  await launchPractice(cdp);
  report.top_down = await combatMetrics(cdp);
  if (report.top_down.map !== 'map-apt-top-down-under-slab-01') throw new Error('Top-down map mismatch: ' + JSON.stringify(report.top_down));
  if (report.top_down.transfers !== 2 || report.top_down.visibility !== 2) throw new Error('Top-down topology mismatch: ' + JSON.stringify(report.top_down));
  if (!report.top_down.overlay || report.top_down.pads !== 8) throw new Error('Top-down live topology missing: ' + JSON.stringify(report.top_down));
  if (report.top_down.zones <= report.bottom_up.zones) throw new Error('Top-down world complexity did not increase');
  await screenshot(cdp, '04-top-down-combat.png');

  await clearDefenseSave(cdp);
  await setViewport(cdp, 390, 844, true);
  await navigate(cdp);
  await enterProfile(cdp, '역타 · 슬래브 하부굴착');
  report.mobile = await profileMetrics(cdp);
  if (report.mobile.overflow) throw new Error('Mobile profile horizontal overflow');
  if (report.mobile.priorityTop === null || report.mobile.pickerTop === null || report.mobile.priorityTop >= report.mobile.pickerTop) {
    throw new Error('Mobile PSI priority must precede map picker: ' + JSON.stringify(report.mobile));
  }
  if (!report.mobile.preview || report.mobile.preview.width < 300) throw new Error('Mobile G5 topology preview missing');
  await screenshot(cdp, '05-mobile-top-down-profile.png');
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

fs.writeFileSync(path.join(outputDir, 'g5-map-family-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('G5_MAP_FAMILY=' + JSON.stringify(report));
if (report.failures.length) {
  if (browserStderr.trim()) console.error(browserStderr.slice(-3000));
  process.exit(1);
}
console.log('G5 MAP-FAMILY browser QA passed.');
