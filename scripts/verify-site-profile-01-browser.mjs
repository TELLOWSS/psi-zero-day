import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_SITE_PROFILE_01_ARTIFACT_DIR || 'artifacts/site-profile-01-browser');
fs.mkdirSync(outputDir, { recursive: true });

const sourceSha = (() => {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return null; }
})();

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));

if (!chrome) {
  console.error('SITE-PROFILE-01 browser QA requires Chrome/Chromium.');
  process.exit(1);
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function allocateDebugPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close(error => {
        if (error) reject(error);
        else if (typeof port === 'number') resolve(port);
        else reject(new Error('Unable to allocate Chrome debug port'));
      });
    });
  });
}

const port = await allocateDebugPort();
const profile = fs.mkdtempSync('/tmp/psi-site-profile-01-');
const browser = spawn(chrome, [
  '--headless',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--hide-scrollbars',
  '--mute-audio',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=' + port,
  '--user-data-dir=' + profile,
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let browserStderr = '';
browser.stderr.on('data', chunk => { browserStderr += chunk.toString(); });

async function waitForJson(url, timeoutMs = 30000) {
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
    const result = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.socket.send(JSON.stringify({ id, method, params }));
    return result;
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
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed');
  }
  return result.result?.value;
}

async function waitFor(cdp, expression, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(30);
  }
  throw new Error('Timed out waiting for: ' + expression);
}

async function screenshot(cdp, filename) {
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png', fromSurface: true, captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(result.data, 'base64'));
}

async function clickText(cdp, text) {
  const clicked = await evaluate(cdp, `(() => {
    const visible = el => {
      if (!(el instanceof HTMLElement)) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== 'none'
        && s.visibility !== 'hidden' && !el.hasAttribute('disabled');
    };
    const button = [...document.querySelectorAll('button')]
      .find(el => visible(el) && (el.textContent || '').includes(${JSON.stringify(text)}));
    if (!button) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error('Missing clickable button: ' + text);
}

const report = {
  schema_version: 1,
  gate: 'SITE-PROFILE-01',
  generated_at: new Date().toISOString(),
  source_sha: sourceSha,
  mobile: null,
  desktop: null,
  failures: [],
};

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

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2.75, mobile: true,
    screenOrientation: { type: 'portraitPrimary', angle: 0 },
  });

  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: baseUrl });
  await loaded;
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
  await clickText(cdp, '현장 디펜스');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\\\"support-select\\\"]'))");

  const mobile = await evaluate(cdp, `(() => {
    const hud = document.querySelector('.zb-risk-priority.is-prep');
    const r = hud?.getBoundingClientRect();
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      profile: hud?.getAttribute('data-site-profile') || null,
      project: hud?.getAttribute('data-project-archetype') || null,
      method: hud?.getAttribute('data-construction-method') || null,
      phase: hud?.getAttribute('data-process-phase') || null,
      top3: hud?.getAttribute('data-risk-top3') || null,
      rect: r ? { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height } : null,
      text: hud?.textContent || '',
    };
  })()`);
  report.mobile = mobile;
  if (mobile.innerWidth !== 390 || mobile.innerHeight !== 844) throw new Error('Mobile viewport drifted');
  if (mobile.scrollWidth > mobile.innerWidth + 1) throw new Error('Mobile support-select has horizontal overflow');
  if (!mobile.rect || mobile.rect.left < -1 || mobile.rect.right > 391) throw new Error('Mobile site profile preview escaped viewport');
  if (mobile.profile !== 'apt-new-bottom-up-excavation') throw new Error('Mobile site profile mismatch: ' + mobile.profile);
  if (mobile.top3 !== 'ARMORED,SWIFT,VEILED') throw new Error('Mobile risk top3 mismatch: ' + mobile.top3);
  for (const copy of ['공동주택 신축','순타','굴착','PSI 위험 우선순위']) {
    if (!mobile.text.includes(copy)) throw new Error('Mobile site profile preview missing: ' + copy);
  }
  await screenshot(cdp, '01-mobile-site-profile.png');

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
    screenOrientation: { type: 'landscapePrimary', angle: 90 },
  });
  await sleep(180);

  const choseSupport = await evaluate(cdp, `(() => {
    const button = document.querySelector('button[data-support="COORDINATOR"]');
    if (!(button instanceof HTMLButtonElement)) return false;
    button.click();
    return true;
  })()`);
  if (!choseSupport) throw new Error('COORDINATOR support button missing');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\\\"combat\\\"]'))");

  const desktop = await evaluate(cdp, `(() => {
    const hud = document.querySelector('.zb-risk-priority:not(.is-prep)');
    const items = [...document.querySelectorAll('.zb-risk-priority:not(.is-prep) li')].map(el => ({
      riskId: el.getAttribute('data-risk-id'),
      rank: Number(el.getAttribute('data-risk-rank')),
      score: Number(el.getAttribute('data-risk-score')),
    }));
    const r = hud?.getBoundingClientRect();
    return {
      profile: hud?.getAttribute('data-site-profile') || null,
      top3: hud?.getAttribute('data-risk-top3') || null,
      items,
      rect: r ? { left:r.left, top:r.top, right:r.right, bottom:r.bottom } : null,
      board: Boolean(document.querySelector('.zb-board-production-art')),
      wavePreview: Boolean(document.querySelector('.zb-wave-preview')),
    };
  })()`);
  report.desktop = desktop;
  if (desktop.profile !== 'apt-new-bottom-up-excavation') throw new Error('Desktop site profile mismatch');
  if (desktop.top3 !== 'ARMORED,SWIFT,VEILED') throw new Error('Desktop risk top3 mismatch: ' + desktop.top3);
  if (desktop.items.length !== 3 || desktop.items.some((item,index) => item.rank !== index + 1 || item.score < 0 || item.score > 100)) {
    throw new Error('Desktop risk HUD ranks/scores invalid: ' + JSON.stringify(desktop.items));
  }
  if (!desktop.board || !desktop.wavePreview) throw new Error('G4 must remain inside existing DefenseGame board');
  await screenshot(cdp, '02-desktop-risk-priority.png');
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

fs.writeFileSync(path.join(outputDir, 'site-profile-01-browser-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('SITE_PROFILE_01_BROWSER=' + JSON.stringify(report));
if (report.failures.length) {
  console.error('SITE-PROFILE-01 browser QA failed.');
  for (const failure of report.failures) console.error('  - ' + failure);
  if (browserStderr.trim()) console.error(browserStderr.slice(-2400));
  process.exit(1);
}
console.log('SITE-PROFILE-01 browser QA passed.');
