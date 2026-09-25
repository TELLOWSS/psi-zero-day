import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_HOME_ARTIFACT_DIR || 'artifacts/home-defense-01');
fs.mkdirSync(outputDir, { recursive: true });

const chrome = [
  process.env.CHROME_BIN,
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error('HOME-DEFENSE-01 QA requires Chrome/Chromium');

const port = Number(process.env.PSI_HOME_CHROME_DEBUG_PORT || 9333);
const profile = fs.mkdtempSync('/tmp/psi-home-chrome-');
const browser = spawn(chrome, [
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--mute-audio',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=' + port,'--user-data-dir=' + profile,'about:blank',
], { stdio: ['ignore','pipe','pipe'] });
let browserStderr = '';
browser.stderr.on('data', chunk => { browserStderr += chunk.toString(); });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForJson(url, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try { const response = await fetch(url); if (response.ok) return await response.json(); } catch {}
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result?.value;
}
async function waitFor(cdp, expression, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(100);
  }
  throw new Error('Timed out waiting for ' + expression);
}
async function screenshot(cdp, name) {
  const result = await cdp.send('Page.captureScreenshot', { format:'png', fromSurface:true, captureBeyondViewport:false });
  fs.writeFileSync(path.join(outputDir, name), Buffer.from(result.data, 'base64'));
}

const viewports = [
  { name:'desktop-1440x900', width:1440, height:900, mobile:false },
  { name:'phone-portrait-390x844', width:390, height:844, mobile:true },
  { name:'phone-landscape-844x390', width:844, height:390, mobile:true },
];

const report = { schema_version:1, source_sha:process.env.GITHUB_SHA || null, gate:'HOME-DEFENSE-01', viewports:[], failures:[] };

try {
  await waitForJson('http://127.0.0.1:' + port + '/json/version');
  for (const viewport of viewports) {
    const response = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method:'PUT' });
    if (!response.ok) throw new Error('Unable to create target for ' + viewport.name);
    const target = await response.json();
    const cdp = new Cdp(target.webSocketDebuggerUrl);
    try {
      await cdp.send('Page.enable');
      await cdp.send('Runtime.enable');
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width:viewport.width, height:viewport.height, deviceScaleFactor:viewport.mobile ? 2 : 1, mobile:viewport.mobile,
        screenOrientation:viewport.width > viewport.height ? { type:'landscapePrimary', angle:90 } : { type:'portraitPrimary', angle:0 },
      });
      const loaded = cdp.once('Page.loadEventFired', 12000);
      await cdp.send('Page.navigate', { url:baseUrl });
      await loaded;
      await waitFor(cdp, "Boolean(document.querySelector('[data-home-mode=\\\"DEFENSE_FIRST\\\"]'))", 12000);
      await waitFor(cdp, "Boolean(document.querySelector('.defense-command-backdrop')?.complete)", 7000);
      await sleep(350);

      const metrics = await evaluate(cdp, `(() => {
        const visible = el => {
          if (!(el instanceof HTMLElement)) return false;
          const s = getComputedStyle(el), r = el.getBoundingClientRect();
          return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0 && r.width > 0 && r.height > 0;
        };
        const rect = selector => {
          const el = document.querySelector(selector);
          if (!(el instanceof HTMLElement) || !visible(el)) return null;
          const r = el.getBoundingClientRect();
          return {left:Math.round(r.left),top:Math.round(r.top),right:Math.round(r.right),bottom:Math.round(r.bottom),width:Math.round(r.width),height:Math.round(r.height)};
        };
        const buttons = [...document.querySelectorAll('.defense-command-home button')].filter(visible);
        return {
          innerWidth:window.innerWidth, innerHeight:window.innerHeight,
          scrollWidth:document.documentElement.scrollWidth, scrollHeight:document.documentElement.scrollHeight,
          primaryText:document.querySelector('.defense-command-primary')?.textContent?.trim() || '',
          secondaryText:document.querySelector('.defense-command-secondary')?.textContent?.trim() || '',
          primary:rect('.defense-command-primary'),
          secondary:rect('.defense-command-secondary'),
          hero:rect('.defense-command-hero'),
          ops:rect('.defense-command-ops'),
          dock:rect('.defense-command-dock'),
          backdropLoaded:Boolean(document.querySelector('.defense-command-backdrop')?.complete && document.querySelector('.defense-command-backdrop')?.naturalWidth),
          smallButtons:buttons.map(el => { const r=el.getBoundingClientRect(); return {text:(el.textContent||'').trim().slice(0,40),width:Math.round(r.width),height:Math.round(r.height)}; }).filter(x => x.width < 44 || x.height < 44),
        };
      })()`);

      const failures = [];
      if (!metrics.primaryText.includes('현장 디펜스')) failures.push('primary CTA is not field defense');
      if (!metrics.secondaryText.includes('스토리')) failures.push('story secondary CTA missing');
      if (!metrics.backdropLoaded) failures.push('defense world background did not load');
      if (metrics.scrollWidth > viewport.width + 1) failures.push('horizontal overflow');
      if (!metrics.primary || metrics.primary.top < 0 || metrics.primary.top >= viewport.height || metrics.primary.bottom > viewport.height + 1) failures.push('primary CTA not fully visible in first viewport');
      if (metrics.primary && metrics.secondary && metrics.primary.top >= metrics.secondary.top) failures.push('defense CTA is not above story CTA');
      if (viewport.mobile && metrics.smallButtons.length) failures.push('touch target below 44px: ' + JSON.stringify(metrics.smallButtons.slice(0,4)));
      report.viewports.push({ name:viewport.name, ...metrics, failures });
      report.failures.push(...failures.map(f => viewport.name + ': ' + f));
      await screenshot(cdp, viewport.name + '-home.png');
    } finally {
      cdp.close();
      try { await fetch('http://127.0.0.1:' + port + '/json/close/' + target.id); } catch {}
    }
  }
} catch (error) {
  report.failures.push(error instanceof Error ? error.message : String(error));
} finally {
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(1200)]);
  try { fs.rmSync(profile, { recursive:true, force:true, maxRetries:4, retryDelay:100 }); } catch {}
}

fs.writeFileSync(path.join(outputDir, 'home-defense-01-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('HOME_DEFENSE_01=' + JSON.stringify(report));
if (report.failures.length) {
  console.error('HOME-DEFENSE-01 browser QA failed.');
  for (const failure of report.failures) console.error(' - ' + failure);
  if (browserStderr.trim()) console.error(browserStderr.slice(-1800));
  process.exit(1);
}
console.log('HOME-DEFENSE-01 browser QA passed.');
