import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_DEFENSE_STEP4_ARTIFACT_DIR || 'artifacts/zero-breach-step4-browser');
fs.mkdirSync(outputDir, { recursive: true });

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));

if (!chrome) {
  console.error('ZERO BREACH Step 4 browser QA requires Chrome/Chromium.');
  process.exit(1);
}

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9555);
const profile = fs.mkdtempSync('/tmp/psi-zero-breach-step4-');
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

let browserStderr = '';
browser.stderr.on('data', chunk => { browserStderr += chunk.toString(); });
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result?.value;
}

async function waitFor(cdp, expression, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(20);
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

async function selectPad(cdp, padId) {
  const clicked = await evaluate(cdp, `(() => {
    const button = document.querySelector('button[aria-label^="${padId} ·"]');
    if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error('Missing clickable pad: ' + padId);
  await sleep(20);
}

async function build(cdp, padId, label) {
  await selectPad(cdp, padId);
  await clickText(cdp, label);
  await sleep(30);
}

async function upgrade(cdp, padId, label) {
  await selectPad(cdp, padId);
  await clickText(cdp, label);
  await sleep(30);
}

async function targetStrong(cdp, padId) {
  await selectPad(cdp, padId);
  await clickText(cdp, '강한 위험');
  await sleep(20);
}

async function waitCombat(cdp, status, wave, timeoutMs = 30000) {
  await waitFor(
    cdp,
    `(() => {
      const shell = document.querySelector('[data-defense-screen="combat"]');
      return shell?.getAttribute('data-status') === ${JSON.stringify(status)}
        && Number(shell?.getAttribute('data-wave')) === ${wave};
    })()`,
    timeoutMs,
  );
}

async function pauseIntermission(cdp, wave) {
  await waitCombat(cdp, 'INTERMISSION', wave);
  await clickText(cdp, '정지');
  await waitFor(cdp, "[...document.querySelectorAll('button')].some(b => (b.textContent || '').includes('재개'))");
}

async function resumeIntermission(cdp) {
  await clickText(cdp, '재개');
}

async function useSupportAtWave(cdp, wave) {
  await waitCombat(cdp, 'RUNNING', wave);
  await waitFor(cdp, `[...document.querySelectorAll('button')].some(b => !b.disabled && (b.textContent || '').includes('동료 지원'))`, 10000);
  await clickText(cdp, '동료 지원');
}

async function snapshotState(cdp) {
  return evaluate(cdp, `(() => {
    const shell = document.querySelector('[data-defense-screen="combat"]');
    return {
      status: shell?.getAttribute('data-status') || null,
      wave: Number(shell?.getAttribute('data-wave') || 0),
      tick: Number(shell?.getAttribute('data-tick') || 0),
      shield: Number(shell?.getAttribute('data-shield') || 0),
      resource: Number(shell?.getAttribute('data-resource') || 0),
      tutorial: document.querySelector('.zb-tutorial')?.getAttribute('data-tutorial-step') || null,
      result: document.querySelector('.zb-result h2')?.textContent || null,
      resultText: document.querySelector('.zb-result')?.textContent || null,
    };
  })()`);
}

const report = {
  schema_version: 1,
  strategy: 'PRECISION_PURE_UI',
  acceleration: 'wall scheduling only; fixed 50ms logical ticks and production content unchanged',
  tutorial: {},
  purchases: [],
  support_waves: [],
  result: null,
  failures: [],
};

let target;
let cdp;
const startedAt = Date.now();

try {
  await waitForJson('http://127.0.0.1:' + port + '/json/version');
  const response = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' });
  if (!response.ok) throw new Error('Unable to create browser target');
  target = await response.json();
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
    screenOrientation: { type: 'landscapePrimary', angle: 90 },
  });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      const nativeSetInterval = window.setInterval.bind(window);
      window.setInterval = (handler, timeout, ...args) => {
        if (timeout === 50 && typeof handler === 'function') {
          return nativeSetInterval(() => {
            for (let i = 0; i < 4; i += 1) handler(...args);
          }, 10);
        }
        return nativeSetInterval(handler, timeout, ...args);
      };
    })();`,
  });

  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: baseUrl });
  await loaded;
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
  await evaluate(cdp, `(() => {
    localStorage.removeItem('psi-zero-day.defense.save.v1');
    localStorage.removeItem('psi-zero-day.defense.tutorial.v1');
  })()`);

  await clickText(cdp, '현장 디펜스');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"support-select\"]'))");
  const support = await evaluate(cdp, `(() => {
    const button = document.querySelector('[data-support="COORDINATOR"]');
    if (!(button instanceof HTMLButtonElement)) return false;
    button.click();
    return true;
  })()`);
  if (!support) throw new Error('COORDINATOR support selection failed');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"combat\"]'))");
  await waitFor(cdp, "document.querySelector('.zb-tutorial')?.getAttribute('data-tutorial-step') === 'PLACE'");
  report.tutorial.place = true;
  await screenshot(cdp, '01-tutorial-place.png');

  await build(cdp, 'P1', '펄스 대응기');
  await waitFor(cdp, "document.querySelector('.zb-tutorial')?.getAttribute('data-tutorial-step') === 'START'");
  report.purchases.push({ wave: 1, action: 'PULSE@P1 L1' });
  report.tutorial.start = true;
  await build(cdp, 'P6', '펄스 대응기');
  report.purchases.push({ wave: 1, action: 'PULSE@P6 L1' });
  await screenshot(cdp, '02-tutorial-start.png');

  await clickText(cdp, '웨이브 시작');
  await waitCombat(cdp, 'RUNNING', 1);
  await waitFor(cdp, "!document.querySelector('.zb-tutorial')");

  // First intermission is intentionally intercepted by the tutorial and paused.
  await waitFor(cdp, "document.querySelector('.zb-tutorial')?.getAttribute('data-tutorial-step') === 'UPGRADE'", 30000);
  report.tutorial.upgrade = true;
  await screenshot(cdp, '03-tutorial-upgrade.png');
  await upgrade(cdp, 'P1', '강화 L2');
  report.purchases.push({ wave: 2, action: 'PULSE@P1 L2' });
  await waitFor(cdp, "document.querySelector('.zb-tutorial')?.getAttribute('data-tutorial-step') === 'PREVIEW'");
  report.tutorial.preview = true;
  await screenshot(cdp, '04-tutorial-preview.png');
  await clickText(cdp, '안내 완료');
  await waitFor(cdp, "!document.querySelector('.zb-tutorial')");
  report.tutorial.completed = true;

  // Wave 3 prep
  await pauseIntermission(cdp, 3);
  await upgrade(cdp, 'P6', '강화 L2');
  report.purchases.push({ wave: 3, action: 'PULSE@P6 L2' });
  await resumeIntermission(cdp);

  // Wave 4 prep + support
  await pauseIntermission(cdp, 4);
  await build(cdp, 'P4', '분산 해소기');
  report.purchases.push({ wave: 4, action: 'BURST@P4 L1' });
  await resumeIntermission(cdp);
  await useSupportAtWave(cdp, 4);
  report.support_waves.push(4);

  // Wave 5 prep
  await pauseIntermission(cdp, 5);
  await build(cdp, 'P8', '정밀 관측기');
  report.purchases.push({ wave: 5, action: 'SENSOR@P8 L1' });
  await resumeIntermission(cdp);

  // Wave 6 prep
  await pauseIntermission(cdp, 6);
  await upgrade(cdp, 'P8', '강화 L2');
  report.purchases.push({ wave: 6, action: 'SENSOR@P8 L2' });
  await upgrade(cdp, 'P1', '관통 펄스');
  report.purchases.push({ wave: 6, action: 'PULSE@P1 L3B' });
  await resumeIntermission(cdp);

  // Wave 7 prep + support
  await pauseIntermission(cdp, 7);
  await upgrade(cdp, 'P4', '강화 L2');
  report.purchases.push({ wave: 7, action: 'BURST@P4 L2' });
  await resumeIntermission(cdp);
  await useSupportAtWave(cdp, 7);
  report.support_waves.push(7);

  // Wave 8 prep
  await pauseIntermission(cdp, 8);
  await upgrade(cdp, 'P8', '광역 관측');
  report.purchases.push({ wave: 8, action: 'SENSOR@P8 L3A' });
  await upgrade(cdp, 'P6', '관통 펄스');
  report.purchases.push({ wave: 8, action: 'PULSE@P6 L3B' });
  await resumeIntermission(cdp);
  await screenshot(cdp, '05-wave8-branches.png');

  // Wave 9 prep
  await pauseIntermission(cdp, 9);
  await upgrade(cdp, 'P4', '고밀도 해소');
  report.purchases.push({ wave: 9, action: 'BURST@P4 L3B' });
  await targetStrong(cdp, 'P1');
  await targetStrong(cdp, 'P6');
  await resumeIntermission(cdp);

  // Wave 10 prep + support
  await pauseIntermission(cdp, 10);
  await build(cdp, 'P5', '흐름 제어기');
  report.purchases.push({ wave: 10, action: 'CONTROL@P5 L1' });
  await upgrade(cdp, 'P5', '강화 L2');
  report.purchases.push({ wave: 10, action: 'CONTROL@P5 L2' });
  await resumeIntermission(cdp);
  await useSupportAtWave(cdp, 10);
  report.support_waves.push(10);
  await screenshot(cdp, '06-wave10-running.png');

  await waitFor(cdp, "Boolean(document.querySelector('.zb-result'))", 30000);
  const final = await snapshotState(cdp);
  report.result = {
    ...final,
    stars: Number((final.resultText?.match(/별(\d) \/ 3/) || [])[1] || 0),
    logical_1x_seconds: Number((final.tick * 0.05).toFixed(1)),
    accelerated_wall_seconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
  };
  await screenshot(cdp, '07-result.png');

  if (final.result !== '방어 성공') throw new Error('UI strategy did not win: ' + JSON.stringify(final));
  if (report.result.stars < 1) throw new Error('UI victory did not produce a star result');
  if (!report.tutorial.place || !report.tutorial.start || !report.tutorial.upgrade || !report.tutorial.preview || !report.tutorial.completed) {
    throw new Error('First-run tutorial did not complete all four steps');
  }
  if (report.purchases.filter(item => item.action.includes('L3A')).length < 1) throw new Error('UI run did not use an L3A branch');
  if (report.purchases.filter(item => item.action.includes('L3B')).length < 1) throw new Error('UI run did not use an L3B branch');
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

fs.writeFileSync(path.join(outputDir, 'step4-browser-report.json'), JSON.stringify(report, null, 2) + '\n');

console.log('ZERO_BREACH_STEP4_BROWSER=' + JSON.stringify(report));
if (report.failures.length) {
  console.error('ZERO BREACH Step 4 browser playthrough failed.');
  for (const failure of report.failures) console.error('  - ' + failure);
  if (browserStderr.trim()) console.error(browserStderr.slice(-2500));
  process.exit(1);
}
console.log('ZERO BREACH Step 4 browser playthrough passed with the production content and UI controls.');
