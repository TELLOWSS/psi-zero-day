import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_DEFENSE_STEP3_ARTIFACT_DIR || 'artifacts/zero-breach-step3-browser');
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
  console.error('ZERO BREACH Step 3 browser QA requires Chrome/Chromium.');
  process.exit(1);
}

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9444);
const profile = fs.mkdtempSync('/tmp/psi-zero-breach-step3-');
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

async function waitFor(cdp, expression, timeoutMs = 15000) {
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

async function openTarget(width = 1280, height = 720) {
  const response = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' });
  if (!response.ok) throw new Error('Unable to create browser target');
  const target = await response.json();
  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false,
    screenOrientation: { type: 'landscapePrimary', angle: 90 },
  });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      const nativeSetInterval = window.setInterval.bind(window);
      window.setInterval = (handler, timeout, ...args) => {
        if (timeout === 50 && typeof handler === 'function') {
          return nativeSetInterval(() => {
            for (let i = 0; i < 8; i += 1) handler(...args);
          }, 8);
        }
        return nativeSetInterval(handler, timeout, ...args);
      };
    })();`,
  });
  return { target, cdp };
}

async function navigate(cdp, url = baseUrl) {
  const loaded = cdp.once('Page.loadEventFired', 15000);
  await cdp.send('Page.navigate', { url });
  await loaded;
}

const clickText = (cdp, text) => evaluate(cdp, `(() => {
  const visible = el => {
    if (!(el instanceof HTMLElement)) return false;
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
  };
  const button = [...document.querySelectorAll('button')].find(el => visible(el) && (el.textContent || '').includes(${JSON.stringify(text)}));
  if (!button) return false;
  button.click();
  return true;
})()`);

async function closeTarget(target, cdp) {
  cdp.close();
  try { await fetch('http://127.0.0.1:' + port + '/json/close/' + target.id); } catch {}
}

const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  base_url: baseUrl,
  browser: chrome,
  reload_resume: { pass: false },
  two_tab_guard: { pass: false },
  episode_return: { pass: false },
  failures: [],
};

let primary;
let secondary;

try {
  await waitForJson('http://127.0.0.1:' + port + '/json/version');
  primary = await openTarget();
  const cdp = primary.cdp;

  await navigate(cdp);
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
  if (!(await clickText(cdp, '현장 디펜스'))) throw new Error('Could not enter ZERO BREACH from hub');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"support-select\"]'))");

  const chose = await evaluate(cdp, `(() => {
    const button = document.querySelector('[data-support="COORDINATOR"]');
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  })()`);
  if (!chose) throw new Error('Could not choose COORDINATOR');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"combat\"]'))");

  const clickedPad = await evaluate(cdp, `(() => {
    const button = document.querySelector('button[aria-label^="P1 ·"]');
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  })()`);
  if (!clickedPad) throw new Error('Could not select P1');
  await waitFor(cdp, "document.body.innerText.includes('설치할 타워를 선택하세요.')");
  if (!(await clickText(cdp, '펄스 대응기'))) throw new Error('Could not install PULSE');
  if (!(await clickText(cdp, '웨이브 시작'))) throw new Error('Could not start wave');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\"combat\"]')?.getAttribute('data-status') === 'RUNNING'");

  const runBeforeExit = await evaluate(cdp, `(() => {
    const shell = document.querySelector('[data-defense-screen="combat"]');
    return {
      runId: shell?.getAttribute('data-run-id'),
      tick: Number(shell?.getAttribute('data-tick') || 0),
      episodeRaw: localStorage.getItem('psi-zero-day.episode01.save.v1'),
    };
  })()`);
  await screenshot(cdp, '01-active-before-exit.png');

  if (!(await clickText(cdp, '본편 허브로'))) throw new Error('Could not exit ZERO BREACH');
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
  await waitFor(cdp, "Boolean(localStorage.getItem('psi-zero-day.defense.save.v1'))");
  await screenshot(cdp, '02-hub-after-saved-exit.png');

  // A full page load must never auto-run the stored battle.
  await navigate(cdp);
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
  if (!(await clickText(cdp, '현장 디펜스'))) throw new Error('Could not re-enter after reload');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"save-resume\"]'))");
  if (await evaluate(cdp, "Boolean(document.querySelector('[data-defense-screen=\"combat\"]'))")) {
    throw new Error('Stored battle auto-ran after reload');
  }
  await screenshot(cdp, '03-explicit-resume-gate.png');

  if (!(await clickText(cdp, '이어서 훈련'))) throw new Error('Resume action missing');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"combat\"]'))");
  const resumed = await evaluate(cdp, `(() => {
    const shell = document.querySelector('[data-defense-screen="combat"]');
    return {
      runId: shell?.getAttribute('data-run-id'),
      tick: Number(shell?.getAttribute('data-tick') || 0),
      paused: [...document.querySelectorAll('button')].some(b => (b.textContent || '').includes('재개')),
    };
  })()`);
  if (resumed.runId !== runBeforeExit.runId) throw new Error('Run identity changed across reload');
  if (!resumed.paused) throw new Error('Reloaded run was not paused');

  await sleep(500);
  const pausedTick = await evaluate(cdp, "Number(document.querySelector('[data-defense-screen=\"combat\"]')?.getAttribute('data-tick') || 0)");
  if (pausedTick !== resumed.tick) throw new Error('Paused resumed run advanced without player input');

  if (!(await clickText(cdp, '재개'))) throw new Error('Resume combat control missing');
  await waitFor(cdp, `Number(document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-tick') || 0) > ${resumed.tick}`);
  report.reload_resume = {
    pass: true,
    run_id: resumed.runId,
    saved_tick_before_reload: runBeforeExit.tick,
    restored_tick: resumed.tick,
    paused_tick_after_wait: pausedTick,
  };
  await screenshot(cdp, '04-resumed-combat.png');

  // While the first tab owns the defense lock, a second tab must be read-only/blocked.
  secondary = await openTarget(1100, 680);
  await navigate(secondary.cdp);
  await waitFor(secondary.cdp, "Boolean(document.querySelector('.commercial-title-home'))");
  if (!(await clickText(secondary.cdp, '현장 디펜스'))) throw new Error('Second tab could not attempt defense entry');
  await waitFor(secondary.cdp, "Boolean(document.querySelector('[data-defense-screen=\"save-blocked\"]'))");
  report.two_tab_guard = { pass: true, screen: 'save-blocked' };
  await screenshot(secondary.cdp, '05-second-tab-blocked.png');
  await closeTarget(secondary.target, secondary.cdp);
  secondary = null;

  // Save and leave side mode, then start the episode and prove the same episode DOM state survives a side-mode trip.
  if (!(await clickText(cdp, '본편 허브로'))) throw new Error('Could not exit resumed defense');
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");

  const newGameClicked = await evaluate(cdp, `(() => {
    const button = document.querySelector('.commercial-title-action.is-primary');
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  })()`);
  if (!newGameClicked) throw new Error('Could not start episode for return-boundary QA');
  await waitFor(cdp, "Boolean(document.querySelector('.game-frame')) && Boolean(document.querySelector('.game-defense-toggle'))", 30000);

  const beforeEpisode = await evaluate(cdp, `(() => {
    const frame = document.querySelector('.game-frame');
    return {
      storyAct: frame?.getAttribute('data-story-act') || null,
      storyBeat: frame?.getAttribute('data-story-beat') || null,
      productionScene: frame?.getAttribute('data-production-scene') || null,
      episodeSave: localStorage.getItem('psi-zero-day.episode01.save.v1'),
    };
  })()`);
  await screenshot(cdp, '06-episode-before-defense.png');

  const sideModeClicked = await evaluate(cdp, `(() => {
    const button = document.querySelector('.game-defense-toggle');
    if (!(button instanceof HTMLElement)) return false;
    button.click();
    return true;
  })()`);
  if (!sideModeClicked) throw new Error('Episode defense toggle was not clickable');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"save-resume\"]'))");
  if (!(await clickText(cdp, '이어서 훈련'))) throw new Error('Could not resume saved run from episode');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"combat\"]'))");
  if (!(await clickText(cdp, '본편 허브로'))) throw new Error('Could not return to episode from defense');
  await waitFor(cdp, "Boolean(document.querySelector('.game-frame')) && Boolean(document.querySelector('.game-defense-toggle'))");

  const afterEpisode = await evaluate(cdp, `(() => {
    const frame = document.querySelector('.game-frame');
    return {
      storyAct: frame?.getAttribute('data-story-act') || null,
      storyBeat: frame?.getAttribute('data-story-beat') || null,
      productionScene: frame?.getAttribute('data-production-scene') || null,
      episodeSave: localStorage.getItem('psi-zero-day.episode01.save.v1'),
    };
  })()`);

  for (const key of ['storyAct','storyBeat','productionScene','episodeSave']) {
    if (afterEpisode[key] !== beforeEpisode[key]) {
      throw new Error('Episode state changed across defense side mode at ' + key);
    }
  }
  report.episode_return = {
    pass: true,
    story_act: beforeEpisode.storyAct,
    story_beat: beforeEpisode.storyBeat,
    production_scene: beforeEpisode.productionScene,
    episode_save_unchanged: true,
  };
  await screenshot(cdp, '07-episode-after-defense.png');
} catch (error) {
  report.failures.push(error instanceof Error ? error.message : String(error));
} finally {
  if (secondary) await closeTarget(secondary.target, secondary.cdp);
  if (primary) await closeTarget(primary.target, primary.cdp);
  browser.kill('SIGTERM');
  await Promise.race([new Promise(resolve => browser.once('exit', resolve)), sleep(1200)]);
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 }); } catch {}
}

fs.writeFileSync(path.join(outputDir, 'step3-browser-report.json'), JSON.stringify(report, null, 2) + '\n');

for (const [name, result] of Object.entries({
  reload_resume: report.reload_resume,
  two_tab_guard: report.two_tab_guard,
  episode_return: report.episode_return,
})) {
  console.log((result.pass ? 'PASS' : 'FAIL').padEnd(4), name, JSON.stringify(result));
}
for (const failure of report.failures) console.error('  - ' + failure);

if (report.failures.length || !report.reload_resume.pass || !report.two_tab_guard.pass || !report.episode_return.pass) {
  console.error('ZERO BREACH Step 3 browser QA failed. See ' + outputDir);
  if (browserStderr.trim()) console.error(browserStderr.slice(-3000));
  process.exit(1);
}

console.log('ZERO BREACH Step 3 browser QA passed: reload resume, two-tab guard, and episode return boundary.');
