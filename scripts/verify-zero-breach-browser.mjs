import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_DEFENSE_ARTIFACT_DIR || 'artifacts/zero-breach-browser');
fs.mkdirSync(outputDir, { recursive: true });

const candidates = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const chrome = candidates.find(candidate => fs.existsSync(candidate));
if (!chrome) {
  console.error('ZERO BREACH browser QA requires Chrome/Chromium.');
  process.exit(1);
}

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9333);
const profile = fs.mkdtempSync('/tmp/psi-zero-breach-chrome-');
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
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return await response.json();
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error('Timed out waiting for ' + url + ': ' + (lastError?.message || 'unknown error'));
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

  async once(method, timeoutMs = 10000) {
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

async function waitFor(cdp, expression, timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(80);
  }
  throw new Error('Timed out waiting for: ' + expression);
}

async function screenshot(cdp, filename) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(result.data, 'base64'));
}

const clickText = (cdp, text) => evaluate(cdp, `(() => {
  const visible = el => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  };
  const button = [...document.querySelectorAll('button')].find(el => visible(el) && (el.textContent || '').includes(${JSON.stringify(text)}));
  if (!button) return false;
  button.click();
  return true;
})()`);

async function metrics(cdp) {
  return evaluate(cdp, `(() => {
    const visible = el => {
      if (!(el instanceof HTMLElement)) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0;
    };
    const shell = document.querySelector('.zb-shell');
    const buttons = [...document.querySelectorAll('.zb-shell button')].filter(visible);
    const small = buttons.map(button => {
      const r = button.getBoundingClientRect();
      return { text:(button.textContent || '').trim().replace(/\\s+/g,' ').slice(0,60), width:Math.round(r.width), height:Math.round(r.height) };
    }).filter(item => item.width < 44 || item.height < 44);
    const broken = [...document.images].filter(img => visible(img) && img.complete && img.naturalWidth === 0).map(img => img.getAttribute('src'));
    return {
      screen: shell?.getAttribute('data-defense-screen') || null,
      status: shell?.getAttribute('data-status') || null,
      speed: shell?.getAttribute('data-speed') || null,
      pads: document.querySelectorAll('.zb-pad-hit').length,
      towers: document.querySelectorAll('.zb-tower').length,
      enemies: document.querySelectorAll('.zb-enemy').length,
      result: document.querySelector('.zb-result h2')?.textContent || null,
      rotate: Boolean(document.querySelector('.zb-rotate')),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
      smallTargets: small,
      brokenImages: broken,
      body: document.body.innerText.slice(0,1200),
    };
  })()`);
}

const viewports = [
  { name: 'desktop-1280x720', width: 1280, height: 720, mobile: false, portrait: false },
  { name: 'phone-landscape-844x390', width: 844, height: 390, mobile: true, portrait: false },
  { name: 'phone-portrait-390x844', width: 390, height: 844, mobile: true, portrait: true },
];

const report = [];
let failed = false;

try {
  await waitForJson('http://127.0.0.1:' + port + '/json/version');

  for (const viewport of viewports) {
    const targetResponse = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' });
    if (!targetResponse.ok) throw new Error('Unable to create target for ' + viewport.name);
    const target = await targetResponse.json();
    const cdp = new Cdp(target.webSocketDebuggerUrl);
    const failures = [];

    try {
      await cdp.send('Page.enable');
      await cdp.send('Runtime.enable');
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.mobile ? 2 : 1,
        mobile: viewport.mobile,
        screenOrientation: viewport.portrait
          ? { type: 'portraitPrimary', angle: 0 }
          : { type: 'landscapePrimary', angle: 90 },
      });

      // QA acceleration changes wall scheduling only. The engine still advances in its fixed 50 ms logical ticks.
      await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `(() => {
          const nativeSetInterval = window.setInterval.bind(window);
          window.setInterval = (handler, timeout, ...args) => {
            if (timeout === 50 && typeof handler === 'function') {
              return nativeSetInterval(() => {
                for (let i = 0; i < 20; i += 1) handler(...args);
              }, 4);
            }
            return nativeSetInterval(handler, timeout, ...args);
          };
        })();`,
      });

      const loaded = cdp.once('Page.loadEventFired', 12000);
      await cdp.send('Page.navigate', { url: baseUrl });
      await loaded;
      await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
      await waitFor(cdp, "[...document.querySelectorAll('button')].some(b => (b.textContent || '').includes('현장 디펜스'))");
      if (!(await clickText(cdp, '현장 디펜스'))) throw new Error('Hub defense entry button was not clickable');
      await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen="support-select"]'))");
      await screenshot(cdp, viewport.name + '-support-select.png');

      const supportClicked = await evaluate(cdp, `(() => {
        const button = document.querySelector('[data-support="COORDINATOR"]');
        if (!(button instanceof HTMLElement)) return false;
        button.click();
        return true;
      })()`);
      if (!supportClicked) throw new Error('COORDINATOR support card was not clickable');
      await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen="combat"]'))");

      if (viewport.portrait) {
        await waitFor(cdp, "Boolean(document.querySelector('.zb-rotate'))");
        const row = await metrics(cdp);
        if (!row.rotate) failures.push('portrait rotate guard missing');
        if (!row.body.includes('재개')) failures.push('portrait entry did not pause the run');
        if (row.horizontalOverflow) failures.push('portrait screen has horizontal overflow');
        await screenshot(cdp, viewport.name + '-rotate-guard.png');
        report.push({ viewport: viewport.name, ...row, failures });
        if (failures.length) failed = true;
        continue;
      }

      let row = await metrics(cdp);
      if (row.pads !== 8) failures.push('expected 8 pad hit targets, got ' + row.pads);
      if (row.horizontalOverflow) failures.push('combat screen has horizontal overflow');
      if (row.smallTargets.length) failures.push('touch targets below 44px: ' + JSON.stringify(row.smallTargets.slice(0,8)));
      if (row.brokenImages.length) failures.push('broken visible images: ' + JSON.stringify(row.brokenImages));

      const padClicked = await evaluate(cdp, `(() => {
        const button = document.querySelector('button[aria-label^="P1 ·"]');
        if (!(button instanceof HTMLElement)) return false;
        button.click();
        return true;
      })()`);
      if (!padClicked) throw new Error('P1 pad was not clickable');
      await waitFor(cdp, "document.body.innerText.includes('설치할 타워를 선택하세요.')");
      if (!(await clickText(cdp, '펄스 대응기'))) throw new Error('PULSE tower button was not clickable');
      await waitFor(cdp, "document.body.innerText.includes('R 120')");
      await screenshot(cdp, viewport.name + '-tower-built.png');

      if (!(await clickText(cdp, '웨이브 시작'))) throw new Error('Wave start button was not clickable');
      await waitFor(cdp, "document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-status') === 'RUNNING'");
      if (!(await clickText(cdp, '2×'))) throw new Error('2x speed button was not clickable');
      await waitFor(cdp, "document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-speed') === '2'");
      await clickText(cdp, '동료 지원');
      await screenshot(cdp, viewport.name + '-running.png');

      await waitFor(cdp, "Boolean(document.querySelector('.zb-result'))", 25000);
      row = await metrics(cdp);
      if (!['WON','LOST'].includes(row.status)) failures.push('combat did not settle to a result: ' + row.status);
      if (!row.result) failures.push('result overlay missing');
      if (row.horizontalOverflow) failures.push('result screen has horizontal overflow');
      await screenshot(cdp, viewport.name + '-result.png');

      report.push({ viewport: viewport.name, ...row, failures });
      if (failures.length) failed = true;
    } catch (error) {
      failed = true;
      report.push({ viewport: viewport.name, failures: [...failures, error.message] });
      try { await screenshot(cdp, viewport.name + '-error.png'); } catch {}
    } finally {
      cdp.close();
      await fetch('http://127.0.0.1:' + port + '/json/close/' + target.id);
    }
  }
} finally {
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(1200)]);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 }); } catch {}
}

fs.writeFileSync(path.join(outputDir, 'browser-report.json'), JSON.stringify({
  schema_version: 1,
  generated_at: new Date().toISOString(),
  base_url: baseUrl,
  browser: chrome,
  results: report,
}, null, 2) + '\n');

for (const row of report) {
  const status = row.failures?.length ? 'FAIL' : 'PASS';
  console.log(status.padEnd(4), row.viewport, 'screen=' + (row.screen || '-'), 'status=' + (row.status || '-'), 'result=' + (row.result || '-'));
  for (const failure of row.failures || []) console.error('  - ' + failure);
}

if (failed) {
  console.error('ZERO BREACH browser QA failed. See artifacts/zero-breach-browser.');
  if (browserStderr.trim()) console.error(browserStderr.slice(-3000));
  process.exit(1);
}

console.log('ZERO BREACH browser QA passed across ' + viewports.length + ' viewport profiles.');
