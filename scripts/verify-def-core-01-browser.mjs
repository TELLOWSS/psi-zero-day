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
    // Keep the representative SWIFT alive long enough to measure the choice-specific
    // movement consequence. Combat balance is covered by the protected engine suite.
    towers: [],
    enemies: [
      {
        id: 'enemy-11', enemyId: 'SWIFT', hp: 28, distance: 42,
        spawnSequence: 11, revealUntilTick: 0, slowEffects: [],
        bossPhaseTriggered: false, bossArmorFromTick: 0, bossArmorUntilTick: 0,
      },
    ],
    spawnedByGroup: [10, 1],
    nextTowerSequence: 1,
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
  runtime_motion: null,
  final: null,
  mobile: {
    viewport: '390x844',
    phases: [],
    no_horizontal_overflow: false,
    signal_rect: null,
    read_rect: null,
    decision_rect: null,
    hook_rect: null,
  },
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

  // While HOOK is paused, capture the vehicle's pre-release location.
  // Choice C must create a real setback once the player resumes the world.
  const preReleaseDistance = await evaluate(cdp, "Number(document.querySelector('.zb-enemy-swift')?.getAttribute('data-distance'))");
  if (!Number.isFinite(preReleaseDistance)) {
    throw new Error('DEF-CORE pre-release SWIFT distance telemetry missing');
  }

  await clickText(cdp, '기록하기');
  report.followup = 'RECORD';
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'DONE'");
  report.phases.push('DONE');

  await waitFor(
    cdp,
    `Number(document.querySelector('.zb-enemy-swift')?.getAttribute('data-distance')) < ${Math.max(0, preReleaseDistance - 20)}`,
    1800,
  );
  const runtimeStart = await evaluate(cdp, "Number(document.querySelector('.zb-enemy-swift')?.getAttribute('data-distance'))");
  await sleep(300);
  const runtimeEnd = await evaluate(cdp, "Number(document.querySelector('.zb-enemy-swift')?.getAttribute('data-distance'))");
  report.runtime_motion = {
    choice: 'C',
    pre_release_distance: preReleaseDistance,
    start_distance: runtimeStart,
    end_distance: runtimeEnd,
    delta: Number((runtimeEnd - runtimeStart).toFixed(3)),
  };
  if (!Number.isFinite(runtimeStart) || !Number.isFinite(runtimeEnd)) {
    throw new Error('DEF-CORE runtime SWIFT distance telemetry missing');
  }
  if (runtimeStart >= preReleaseDistance - 20) {
    throw new Error('Choice C did not create a meaningful live setback: ' + JSON.stringify(report.runtime_motion));
  }
  if (runtimeEnd <= runtimeStart || runtimeEnd - runtimeStart > 28) {
    throw new Error('Choice C safer-approach movement did not remain live and reduced-speed: ' + JSON.stringify(report.runtime_motion));
  }

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
      'assets/episode01/cg/gate-dawn.webp',
      'assets/episode01/cg/ramp-entry.webp',
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

  // Required mobile-first gate: rerun the representative slice at 390x844.
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2.75, mobile: true,
    screenOrientation: { type: 'portraitPrimary', angle: 0 },
  });

  const mobileLoaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: baseUrl });
  await mobileLoaded;
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");

  const mobileSave = qaDefenseSave();
  await evaluate(cdp, `(() => {
    localStorage.setItem('psi-zero-day.defense.save.v1', ${JSON.stringify(JSON.stringify(mobileSave))});
    localStorage.setItem('psi-zero-day.defense.tutorial.v1', 'seen');
    sessionStorage.removeItem('psi-zero-day.def-core-01.def-core-01-browser-qa');
    return true;
  })()`);

  const rectOf = async selector => evaluate(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      left: Math.round(r.left), top: Math.round(r.top),
      right: Math.round(r.right), bottom: Math.round(r.bottom),
      width: Math.round(r.width), height: Math.round(r.height),
      innerWidth: window.innerWidth, innerHeight: window.innerHeight,
    };
  })()`);

  const assertMobileRect = (rect, label) => {
    if (!rect) throw new Error('Mobile missing ' + label);
    if (rect.left < -1 || rect.right > 391 || rect.top < -1 || rect.bottom > 845) {
      throw new Error('Mobile ' + label + ' escaped 390x844 viewport: ' + JSON.stringify(rect));
    }
  };

  await clickText(cdp, '현장 디펜스');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\\\"persistence-gate\\\"]')) || document.body.textContent.includes('중단한 훈련이 있습니다')");
  await clickText(cdp, '이어서 훈련');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-wave') === '8'");
  await clickText(cdp, '재개');

  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'SIGNAL'");
  report.mobile.phases.push('SIGNAL');
  report.mobile.no_horizontal_overflow = await evaluate(cdp, "document.documentElement.scrollWidth <= window.innerWidth + 1");
  if (!report.mobile.no_horizontal_overflow) {
    throw new Error('Mobile horizontal overflow at SIGNAL: ' + await evaluate(cdp, "document.documentElement.scrollWidth + '>' + window.innerWidth"));
  }
  report.mobile.signal_rect = await rectOf('.def-core-signal-card');
  assertMobileRect(report.mobile.signal_rect, 'SIGNAL card');
  await screenshot(cdp, 'mobile-01-signal.png');

  await clickText(cdp, '서측 Gate 집중해서 보기');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'READ'");
  report.mobile.phases.push('READ');
  report.mobile.read_rect = await rectOf('.def-core-read-panel');
  assertMobileRect(report.mobile.read_rect, 'READ panel');
  const mobileRead = await evaluate(cdp, "document.querySelector('.def-core-read-panel')?.textContent || ''");
  for (const required of ['후진 차량','자재','시야 제한','CONTROL']) {
    if (!mobileRead.includes(required)) throw new Error('Mobile READ missing: ' + required);
  }
  await screenshot(cdp, 'mobile-02-read.png');

  await clickText(cdp, 'CONTROL · 유도원 + 보행동선 분리');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'IMPACT'");
  report.mobile.phases.push('IMPACT');
  await screenshot(cdp, 'mobile-03-impact.png');

  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'DECISION'", 20000);
  report.mobile.phases.push('DECISION');
  report.mobile.decision_rect = await rectOf('.def-core-decision-card');
  assertMobileRect(report.mobile.decision_rect, 'DECISION card');
  const mobileChoices = await evaluate(cdp, "document.querySelectorAll('.def-core-choice-grid button').length");
  if (mobileChoices !== 3) throw new Error('Mobile DECISION lost A/B/C choices');
  await screenshot(cdp, 'mobile-05-decision.png');

  await clickText(cdp, '대기 위치를 바꾸죠');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\\\"combat\\\"]')?.getAttribute('data-def-core-phase') === 'HOOK'", 5000);
  report.mobile.phases.push('HOOK');
  report.mobile.hook_rect = await rectOf('.def-core-hook-card');
  assertMobileRect(report.mobile.hook_rect, 'HOOK card');
  const mobileHookActions = await evaluate(cdp, "document.querySelectorAll('.def-core-hook-actions button').length");
  if (mobileHookActions !== 3) throw new Error('Mobile HOOK lost three follow-up actions');
  await screenshot(cdp, 'mobile-07-hook.png');
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
