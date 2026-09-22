import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_DEFENSE_STEP5_ARTIFACT_DIR || 'artifacts/zero-breach-step5a-visual');
fs.mkdirSync(outputDir, { recursive: true });

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));

if (!chrome) {
  console.error('ZERO BREACH Step 5A visual QA requires Chrome/Chromium.');
  process.exit(1);
}

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9666);
const profile = fs.mkdtempSync('/tmp/psi-zero-breach-step5a-');
const browser = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--hide-scrollbars',
  '--mute-audio',
  '--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=' + port,
  '--user-data-dir=' + profile,
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForJson(url, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
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
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.events.get(message.method) || []) listener(message.params);
    });
  }
  async send(method, params = {}) {
    await this.opened;
    const id = this.nextId++;
    const pending = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return pending;
  }
  async once(method, timeoutMs = 15000) {
    await this.opened;
    return new Promise((resolve, reject) => {
      const listener = params => {
        clearTimeout(timer);
        this.events.set(method, (this.events.get(method) || []).filter(item => item !== listener));
        resolve(params);
      };
      const timer = setTimeout(() => {
        this.events.set(method, (this.events.get(method) || []).filter(item => item !== listener));
        reject(new Error('Timed out waiting for ' + method));
      }, timeoutMs);
      this.events.set(method, [...(this.events.get(method) || []), listener]);
    });
  }
  close() { this.socket.close(); }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result?.value;
}

async function waitFor(cdp, expression, timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(30);
  }
  throw new Error('Timed out waiting for: ' + expression);
}

async function screenshot(cdp, filename) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(result.data, 'base64'));
}

async function clickText(cdp, text) {
  const clicked = await evaluate(cdp, `(() => {
    const visible = el => {
      if (!(el instanceof HTMLElement)) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && !el.hasAttribute('disabled');
    };
    const button = [...document.querySelectorAll('button')].find(el => visible(el) && (el.textContent || '').includes(${JSON.stringify(text)}));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error('Missing clickable button: ' + text);
}

async function clickSelector(cdp, selector) {
  const clicked = await evaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!(el instanceof HTMLElement)) return false;
    el.click();
    return true;
  })()`);
  if (!clicked) throw new Error('Missing clickable selector: ' + selector);
}

async function setViewport(cdp, width, height) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false,
    screenOrientation: { type: 'landscapePrimary', angle: 90 },
  });
  await sleep(100);
}

async function visualSnapshot(cdp) {
  return evaluate(cdp, `(() => {
    const rect = el => {
      const r = el?.getBoundingClientRect();
      return r ? { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } : null;
    };
    const shell = document.querySelector('[data-defense-screen="combat"]');
    const board = document.querySelector('.zb-board');
    const boardArt = document.querySelector('image[data-production-board-art="ramp-01"]');
    const towerArt = document.querySelector('g[data-production-tower-art="PULSE:L1"] image');
    const normalArt = document.querySelector('image[data-production-enemy-art="NORMAL"]');
    const selectedPad = document.querySelector('.zb-pad-hit.is-selected');
    const range = document.querySelector('.zb-range-preview');
    const center = el => {
      const r = el?.getBoundingClientRect();
      return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : null;
    };
    const padCenter = center(selectedPad);
    const rangeCenter = center(range);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      visualVersion: shell?.getAttribute('data-visual-version') || null,
      board: rect(board),
      boardArt: {
        href: boardArt?.getAttribute('href') || null,
        rect: rect(boardArt),
      },
      towerArt: {
        href: towerArt?.getAttribute('href') || null,
        rect: rect(towerArt),
      },
      normalArt: {
        href: normalArt?.getAttribute('href') || null,
        rect: rect(normalArt),
      },
      prototypeCount: document.querySelectorAll('[data-art-state="prototype"]').length,
      padAlignment: padCenter && rangeCenter ? {
        dx: Number(Math.abs(padCenter.x - rangeCenter.x).toFixed(3)),
        dy: Number(Math.abs(padCenter.y - rangeCenter.y).toFixed(3)),
      } : null,
      overflow: {
        x: document.documentElement.scrollWidth - innerWidth,
        y: document.documentElement.scrollHeight - innerHeight,
      },
      status: shell?.getAttribute('data-status') || null,
    };
  })()`);
}

const report = { schema_version: 1, captures: [], failures: [] };
let target;
let cdp;

try {
  await waitForJson('http://127.0.0.1:' + port + '/json/version');
  const response = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' });
  if (!response.ok) throw new Error('Unable to create browser target');
  target = await response.json();
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await setViewport(cdp, 1280, 720);

  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: baseUrl });
  await loaded;
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
  await evaluate(cdp, `(() => {
    localStorage.removeItem('psi-zero-day.defense.save.v1');
    localStorage.setItem('psi-zero-day.defense.tutorial.v1', 'seen');
    localStorage.setItem('psi.audio.muted', '1');
    window.__zbAudioCues = [];
    window.addEventListener('psi:defense-audio-cue', event => {
      window.__zbAudioCues.push(event?.detail?.cue || 'unknown');
    });
  })()`);

  await clickText(cdp, '현장 디펜스');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"support-select\"]'))");
  await clickSelector(cdp, '[data-support="COORDINATOR"]');
  await waitFor(cdp, "Boolean(document.querySelector('image[data-production-board-art=\"ramp-01\"]'))");
  await clickText(cdp, '설정');
  await waitFor(cdp, "Boolean(document.querySelector('.zb-defense-settings-panel button[data-audio-muted=\"true\"]'))");
  await clickSelector(cdp, '.zb-defense-settings-panel button[data-audio-muted="true"]');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\"combat\"]')?.getAttribute('data-audio-muted') === 'false'");
  await clickText(cdp, '설정');

  await clickSelector(cdp, 'button[aria-label^="P2 ·"]');
  await clickText(cdp, '펄스 대응기');
  await waitFor(cdp, "Boolean(document.querySelector('g[data-production-tower-art=\"PULSE:L1\"] image'))");
  await clickText(cdp, '웨이브 시작');
  await waitFor(cdp, "Boolean(document.querySelector('image[data-production-enemy-art=\"NORMAL\"]'))", 10000);

  let snap = await visualSnapshot(cdp);
  report.captures.push({ id: 'desktop-1280x720', ...snap });
  if (!snap.visualVersion?.startsWith('zero-breach-visual-')) throw new Error('Unexpected visual version');
  if (!snap.boardArt.href?.endsWith('assets/defense/board/ramp-01.svg')) throw new Error('Production board not active');
  if (!snap.towerArt.href?.endsWith('assets/defense/towers/pulse-l1.svg')) throw new Error('PULSE L1 production art not active');
  if (!snap.normalArt.href?.endsWith('assets/defense/enemies/normal.svg')) throw new Error('NORMAL production art not active');
  if (!snap.board || snap.board.width < 760 || snap.board.height < 320) throw new Error('Desktop board is too small');
  if (!snap.towerArt.rect || snap.towerArt.rect.width < 60 || snap.towerArt.rect.height < 60) throw new Error('PULSE L1 runtime footprint is too small');
  if (!snap.normalArt.rect || snap.normalArt.rect.width < 28 || snap.normalArt.rect.height < 28) throw new Error('NORMAL runtime footprint is too small');
  if (!snap.padAlignment || snap.padAlignment.dx > 1 || snap.padAlignment.dy > 1) throw new Error('Desktop pad input is not aligned to the SVG coordinate space: ' + JSON.stringify(snap.padAlignment));
  const audioCues = await evaluate(cdp, "window.__zbAudioCues || []");
  for (const cue of ['place','wave_start','attack']) {
    if (!audioCues.includes(cue)) throw new Error('Missing defense audio cue in real combat: ' + cue + ' / ' + JSON.stringify(audioCues));
  }
  if (await evaluate(cdp, "localStorage.getItem('psi.audio.muted')") !== '0') throw new Error('Defense SOUND toggle did not update shared preference');
  report.audio = { cues: audioCues, sharedPreferenceAfterToggle: '0' };
  await screenshot(cdp, '01-desktop-1280x720.png');

  await setViewport(cdp, 844, 390);
  snap = await visualSnapshot(cdp);
  report.captures.push({ id: 'small-landscape-844x390', ...snap });
  if (!snap.board || snap.board.height < 180) throw new Error('Small-landscape board collapsed');
  if (!snap.towerArt.rect || snap.towerArt.rect.width < 36) throw new Error('PULSE L1 unreadable on small landscape');
  if (!snap.normalArt.rect || snap.normalArt.rect.width < 17) throw new Error('NORMAL unreadable on small landscape');
  if (!snap.padAlignment || snap.padAlignment.dx > 1 || snap.padAlignment.dy > 1) throw new Error('Small-landscape pad input is not aligned to the SVG coordinate space: ' + JSON.stringify(snap.padAlignment));
  if (snap.overflow.x > 2) throw new Error('Small-landscape horizontal overflow: ' + snap.overflow.x);
  await screenshot(cdp, '02-small-landscape-844x390.png');
  await clickText(cdp, '본편 허브로');
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-quick-settings'))", 15000);
  const mainAudio = await evaluate(cdp, `(() => {
    const button = document.querySelector('.commercial-title-quick-settings button:last-child');
    return { value: button?.querySelector('b')?.textContent || null, muted: localStorage.getItem('psi.audio.muted') };
  })()`);
  if (mainAudio.value !== 'ON' || mainAudio.muted !== '0') throw new Error('Main audio preference did not survive defense return: ' + JSON.stringify(mainAudio));
  report.audio.mainAfterReturn = mainAudio;
} catch (error) {
  report.failures.push(error instanceof Error ? error.message : String(error));
  if (cdp) {
    try { await screenshot(cdp, 'error.png'); } catch {}
  }
} finally {
  if (cdp) cdp.close();
  if (target) {
    try { await fetch('http://127.0.0.1:' + port + '/json/close/' + target.id); } catch {}
  }
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(1200)]);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 }); } catch {}
}

fs.writeFileSync(path.join(outputDir, 'step5a-visual-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('ZERO_BREACH_STEP5A_VISUAL=' + JSON.stringify(report));
if (report.failures.length) process.exit(1);
console.log('ZERO BREACH Step 5A production-art baseline passed desktop and small-landscape browser QA.');
