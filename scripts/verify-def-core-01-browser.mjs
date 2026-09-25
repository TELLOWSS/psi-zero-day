import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_DEF_CORE_01_ARTIFACT_DIR || 'artifacts/def-core-01-browser');
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
  console.error('DEF-CORE-01 browser QA requires Chrome/Chromium.');
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
const profile = fs.mkdtempSync('/tmp/psi-def-core-01-');
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
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result?.value;
}

async function waitFor(cdp, expression, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(25);
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

function fnv1a32(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return 'fnv1a32:' + (hash >>> 0).toString(16).padStart(8, '0');
}

function qaDefenseSave() {
  const run = {
    runId: 'def-core-01-browser-qa',
    mode: 'EVENT',
    variant: 'EVENT_MODIFIED',
    scenarioId: 'event-ramp-reconstruction-v1',
    eventId: 'event-ramp-reconstruction-v1',
    eventContentVersion: 'event-ramp-reconstruction-1.0.0',
    status: 'RUNNING',
    paused: false,
    speed: 1,
    tick: 4120,
    waveId: 8,
    waveTick: 84,
    intermissionRemaining: 0,
    shield: 18,
    resource: 210,
    towers: [
      {
        id: 'tower-1', padId: 'P1', towerId: 'PULSE', levelId: 'L2',
        targetMode: 'FIRST', invested: 140, attackCooldown: 4, revealCooldown: 0,
      },
      {
        id: 'tower-2', padId: 'P6', towerId: 'PULSE', levelId: 'L2',
        targetMode: 'FIRST', invested: 140, attackCooldown: 7, revealCooldown: 0,
      },
    ],
    enemies: [
      {
        id: 'enemy-11', enemyId: 'SWIFT', hp: 28, distance: 42,
        spawnSequence: 11, revealUntilTick: 0, slowEffects: [],
        bossPhaseTriggered: false, bossArmorFromTick: 0, bossArmorUntilTick: 0,
      },
    ],
    spawnedByGroup: [10, 1],
    nextTowerSequence: 3,
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
      scenarioId: 'training-ramp-v1',
      finishedRuns: 1,
      clears: 1,
      bestStars: 2,
      bestScore: 11800,
      bestShield: 18,
      bestCompletedWaves: 10,
      lastResultRunId: 'qa-training-clear',
      updatedAt: '2026-09-25T00:00:00.000Z',
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
    buildVersion: 'def-core-01-qa',
    revision: 1,
    savedAt: '2026-09-25T00:00:00.000Z',
    checksum: fnv1a32(JSON.stringify(payload)),
    payload,
  };
}

const report = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  source_sha: sourceSha,
  gate: 'DEF-CORE-01',
  scenario: 'event-ramp-reconstruction-v1',
  wave: 8,
  phases: [],
  shots: [],
  decision_count: 0,
  chosen: null,
  followup: null,
  cinematic_wall_ms: null,
  audio_cues: [],
  assets: {},
  final: null,
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
    width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
    screenOrientation: { type: 'landscapePrimary', angle: 90 },
  });
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `(() => {
      window.__defCoreAudioCues = [];
      window.__defCoreShotsSeen = [];
      window.__defCoreTimeline = [];
      window.addEventListener('psi:defense-audio-cue', event => {
        const cue = event?.detail?.cue;
        if (cue) window.__defCoreAudioCues.push(cue);
      });

      const remember = () => {
        const cinematic = document.querySelector('.def-core-cinematic');
        const shot = cinematic?.getAttribute('data-def-core-shot');
        if (shot && !window.__defCoreShotsSeen.includes(shot)) {
          window.__defCoreShotsSeen.push(shot);
          window.__defCoreTimeline.push({ kind: 'shot', value: shot, at: performance.now() });
        }
        if (document.querySelector('[data-def-core-phase="DECISION"]')
          && !window.__defCoreTimeline.some(item => item.kind === 'phase' && item.value === 'DECISION')) {
          window.__defCoreTimeline.push({ kind: 'phase', value: 'DECISION', at: performance.now() });
        }
      };

      const observer = new MutationObserver(remember);
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['data-def-core-shot','data-def-core-phase'],
        });
        remember();
      }, { once: true });
    })();`,
  });

  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: baseUrl });
  await loaded;
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");

  const save = qaDefenseSave();
  await evaluate(cdp, `(() => {
    localStorage.setItem('psi-zero-day.defense.save.v1', ${JSON.stringify(JSON.stringify(save))});
    localStorage.setItem('psi-zero-day.defense.tutorial.v1', 'seen');
    sessionStorage.removeItem('psi-zero-day.def-core-01.def-core-01-browser-qa');
    return true;
  })()`);

  await clickText(cdp, '현장 디펜스');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\\\"persistence-gate\\\"]')) || document.body.textContent.includes('중단한 훈련이 있습니다')");
  await clickText(cdp, '이어서 훈련');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-wave') === '8'");
  await clickText(cdp, '재개');

  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'SIGNAL'");
  report.phases.push('SIGNAL');
  const pausedAtSignal = await evaluate(cdp, "document.querySelector('.zb-hud-button')?.getAttribute('aria-pressed') === 'true'");
  if (!pausedAtSignal) throw new Error('DEF-CORE SIGNAL did not auto-pause the active run');
  await screenshot(cdp, '01-signal.png');

  await clickText(cdp, '서측 Gate 집중해서 보기');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'READ'");
  report.phases.push('READ');
  const readCopy = await evaluate(cdp, "document.querySelector('.def-core-read-panel')?.textContent || ''");
  for (const required of ['후진 차량','자재','시야 제한','SWIFT CONFIRMED']) {
    if (!readCopy.includes(required)) throw new Error('READ missing observation: ' + required);
  }
  await screenshot(cdp, '02-read.png');

  await clickText(cdp, 'CONTROL · 유도원 + 보행동선 분리');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'IMPACT'");
  report.phases.push('IMPACT');
  await waitFor(cdp, "document.querySelectorAll('.def-core-barrier').length === 1 && document.querySelectorAll('.def-core-marshal').length >= 1");
  await screenshot(cdp, '03-impact.png');

  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'CINEMATIC'");
  report.phases.push('CINEMATIC');
  await screenshot(cdp, '04-cinematic-wide.png');

  await waitFor(cdp, "(window.__defCoreShotsSeen || []).includes('SIGNAL')", 12000);
  await screenshot(cdp, '04-cinematic-signal.png');
  await waitFor(cdp, "(window.__defCoreShotsSeen || []).includes('BRAKE')", 12000);
  await screenshot(cdp, '04-cinematic-brake.png');

  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'DECISION'", 12000);
  report.phases.push('DECISION');

  const cinematicTrace = await evaluate(cdp, `(() => ({
    shots: window.__defCoreShotsSeen || [],
    timeline: window.__defCoreTimeline || [],
  }))()`);
  report.shots = cinematicTrace.shots;
  const wide = cinematicTrace.timeline.find(item => item.kind === 'shot' && item.value === 'WIDE');
  const decision = cinematicTrace.timeline.find(item => item.kind === 'phase' && item.value === 'DECISION');
  report.cinematic_wall_ms = wide && decision ? Math.round(decision.at - wide.at) : null;

  const requiredShots = ['WIDE','FOCUS','REAR','SIGNAL','RADIO','BRAKE'];
  if (JSON.stringify(report.shots) !== JSON.stringify(requiredShots)) {
    throw new Error('Cinematic shot sequence drifted: ' + JSON.stringify(report.shots));
  }
  if (report.cinematic_wall_ms === null || report.cinematic_wall_ms < 12000 || report.cinematic_wall_ms > 20000) {
    throw new Error('Cinematic duration outside 12-20s contract: ' + report.cinematic_wall_ms);
  }

  report.decision_count = await evaluate(cdp, "document.querySelectorAll('.def-core-choice-grid button').length");
  if (report.decision_count !== 3) throw new Error('DEF-CORE decision must expose exactly A/B/C');
  const decisionCopy = await evaluate(cdp, "document.querySelector('.def-core-decision-card')?.textContent || ''");
  if (!decisionCopy.includes('차를 세우면 뒤에 두 대가 밀립니다.')) throw new Error('Lee Jaehoon schedule-pressure line missing');
  await screenshot(cdp, '05-decision.png');

  await clickText(cdp, '대기 위치를 바꾸죠');
  report.chosen = 'C';
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'RETURN'");
  report.phases.push('RETURN');
  await waitFor(cdp, "document.querySelector('.def-core-world')?.getAttribute('data-def-core-world') === 'REROUTED_STAGING'");
  await screenshot(cdp, '06-return-c.png');

  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'HOOK'");
  report.phases.push('HOOK');
  const hookCopy = await evaluate(cdp, "document.querySelector('.def-core-hook-card')?.textContent || ''");
  if (!hookCopy.includes('어제도 한번 비슷했습니다')) throw new Error('Lim Junho repeat-signal hook missing');
  const hookActions = await evaluate(cdp, "document.querySelectorAll('.def-core-hook-actions button').length");
  if (hookActions !== 3) throw new Error('Story hook must expose three follow-up choices');
  await screenshot(cdp, '07-hook.png');

  await clickText(cdp, '기록하기');
  report.followup = 'RECORD';
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'DONE'");
  report.phases.push('DONE');
  const final = await evaluate(cdp, `(() => {
    const shell = document.querySelector('[data-defense-screen="combat"]');
    return {
      phase: shell?.getAttribute('data-def-core-phase') || null,
      choice: shell?.getAttribute('data-def-core-choice') || null,
      paused: document.querySelector('.zb-hud-button')?.getAttribute('aria-pressed') === 'true',
      world: document.querySelector('.def-core-world')?.getAttribute('data-def-core-world') || null,
      barrier: document.querySelectorAll('.def-core-barrier').length,
      marshal: document.querySelectorAll('.def-core-marshal').length,
    };
  })()`);
  report.final = final;
  if (final.choice !== 'C' || final.paused || final.world !== 'REROUTED_STAGING') {
    throw new Error('RETURN state did not persist the chosen world result: ' + JSON.stringify(final));
  }
  await screenshot(cdp, '08-done.png');

  report.audio_cues = await evaluate(cdp, "window.__defCoreAudioCues || []");
  for (const cue of ['warning','support','select','area_resolve']) {
    if (!report.audio_cues.includes(cue)) throw new Error('Missing DEF-CORE audio cue: ' + cue);
  }

  report.assets = await evaluate(cdp, `(async () => {
    const urls = [
      'assets/defense/board/ramp-01-hd01.webp',
      'assets/defense/enemies/swift-pq01.svg',
      'assets/episode01/characters/choi-minseok-map.webp',
      'assets/episode01/scene-elements/access-barrier.webp',
      'assets/episode01/characters/lim-junho-concerned.webp',
      'assets/episode01/characters/lee-jaehoon-portrait.webp',
      'assets/episode01/audio/gate-queue.ogg',
      'assets/episode01/audio/radio-burst.ogg',
      'assets/episode01/audio/stopwork-silence-drop.ogg'
    ];
    const pairs = await Promise.all(urls.map(async url => {
      const response = await fetch(url);
      return [url, { ok: response.ok, contentType: response.headers.get('content-type') || '' }];
    }));
    return Object.fromEntries(pairs);
  })()`);
  for (const [asset, status] of Object.entries(report.assets)) {
    if (!status.ok) throw new Error('DEF-CORE asset failed to load: ' + asset);
  }
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

fs.writeFileSync(path.join(outputDir, 'def-core-01-browser-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('DEF_CORE_01_BROWSER=' + JSON.stringify(report));
if (report.failures.length) {
  console.error('DEF-CORE-01 browser QA failed.');
  for (const failure of report.failures) console.error('  - ' + failure);
  if (browserStderr.trim()) console.error(browserStderr.slice(-2500));
  process.exit(1);
}
console.log('DEF-CORE-01 browser QA passed.');
