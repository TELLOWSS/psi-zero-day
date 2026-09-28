import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_GAMEPLAY_IDENTITY_ARTIFACT_DIR || 'artifacts/def-gameplay-identity');
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
  console.error('DEF-GAMEPLAY-IDENTITY-01 requires Chrome/Chromium.');
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

async function waitFor(cdp, expression, timeoutMs = 15000) {
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

function qaStaleTrainingSave() {
  const run = {
    runId: 'self-qa-stale-training',
    mode: 'TRAINING',
    variant: 'STANDARD',
    scenarioId: 'training-ramp-v1',
    eventId: null,
    eventContentVersion: null,
    status: 'RUNNING',
    paused: true,
    speed: 1,
    tick: 1280,
    waveId: 3,
    waveTick: 40,
    intermissionRemaining: 0,
    shield: 20,
    resource: 160,
    towers: [],
    enemies: [],
    spawnedByGroup: [0, 0],
    nextTowerSequence: 1,
    nextEnemySequence: 1,
    supportId: 'COORDINATOR',
    supportCooldownRemaining: 0,
    freezeMovementUntilTick: 0,
    revealAllUntilTick: 0,
    rangeBonusUntilTick: 0,
    completedWaves: 2,
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
    buildVersion: 'self-qa-live-site-entry',
    revision: 2,
    savedAt: '2026-09-28T00:00:00.000Z',
    checksum: fnv1a32(JSON.stringify(payload)),
    payload,
  };
}

function qaDefenseSave(choice) {
  const runId = 'def-gameplay-identity-' + choice.toLowerCase();
  const run = {
    runId,
    mode: 'EVENT',
    variant: 'EVENT_MODIFIED',
    scenarioId: 'event-ramp-reconstruction-v1',
    eventId: 'event-ramp-reconstruction-v1',
    eventContentVersion: 'event-ramp-reconstruction-1.0.0',
    status: 'RUNNING',
    paused: true,
    speed: 1,
    tick: 4120,
    waveId: 8,
    waveTick: 84,
    intermissionRemaining: 0,
    shield: 18,
    resource: 210,
    towers: [],
    enemies: [
      {
        id: 'enemy-11', enemyId: 'SWIFT', hp: 28, distance: 100,
        spawnSequence: 11, revealUntilTick: 0, slowEffects: [],
        bossPhaseTriggered: false, bossArmorFromTick: 0, bossArmorUntilTick: 0,
      },
      {
        id: 'enemy-12', enemyId: 'SWIFT', hp: 28, distance: 20,
        spawnSequence: 12, revealUntilTick: 0, slowEffects: [],
        bossPhaseTriggered: false, bossArmorFromTick: 0, bossArmorUntilTick: 0,
      },
    ],
    spawnedByGroup: [10, 2],
    nextTowerSequence: 1,
    nextEnemySequence: 13,
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
    runId,
    document: {
      namespace: 'defense',
      schemaVersion: 1,
      rulesVersion: 'zero-breach-1.0.0',
      contentVersion: 'prototype-1.0.0',
      buildVersion: 'def-gameplay-identity-qa',
      revision: 1,
      savedAt: '2026-09-28T00:00:00.000Z',
      checksum: fnv1a32(JSON.stringify(payload)),
      payload,
    },
  };
}

const choiceLabels = {
  A: '3분만 통로를 완전히 비우고',
  B: '유도원 한 명 더 붙이고',
  C: '대기 위치를 바꾸죠',
};

const expectedWorld = {
  A: 'HOLD_LINE',
  B: 'REINFORCED_CONTROL',
  C: 'REROUTED_STAGING',
};

const report = {
  schema_version: 1,
  gate: 'DEF-GAMEPLAY-IDENTITY-01',
  source_sha: sourceSha,
  generated_at: new Date().toISOString(),
  entry_path: null,
  runs: [],
  failures: [],
  final: null,
};

const port = await allocateDebugPort();
const profile = fs.mkdtempSync('/tmp/psi-def-gameplay-identity-');
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

let target;
let cdp;

async function setViewport(viewport) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.mobile ? 2.75 : 1,
    mobile: viewport.mobile,
    screenOrientation: viewport.mobile
      ? { type: 'portraitPrimary', angle: 0 }
      : { type: 'landscapePrimary', angle: 90 },
  });
}

async function navigateHome() {
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: baseUrl });
  await loaded;
  await waitFor(cdp, "Boolean(document.querySelector('.commercial-title-home'))");
}

async function rectOf(selector) {
  return evaluate(cdp, `(() => {
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
}

function assertInsideViewport(rect, label) {
  if (!rect) throw new Error('Missing ' + label);
  if (rect.left < -1 || rect.top < -1 || rect.right > rect.innerWidth + 1 || rect.bottom > rect.innerHeight + 1) {
    throw new Error(label + ' escaped viewport: ' + JSON.stringify(rect));
  }
}

async function runLiveSiteEntryPath() {
  await setViewport({ width: 390, height: 844, mobile: true });
  await navigateHome();

  const stale = qaStaleTrainingSave();
  await evaluate(cdp, `(() => {
    localStorage.setItem('psi-zero-day.defense.save.v1', ${JSON.stringify(JSON.stringify(stale))});
    localStorage.setItem('psi-zero-day.defense.tutorial.v1', 'seen');
    return true;
  })()`);

  await clickText(cdp, '대표 시나리오 바로 시작');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"requested-scenario-conflict\"]'))");

  const conflictCopy = await evaluate(cdp, "document.querySelector('[data-defense-screen=\"requested-scenario-conflict\"]')?.textContent || ''");
  if (!conflictCopy.includes('대표 시나리오로 전환할까요?') || !conflictCopy.includes('기존 훈련 이어하기')) {
    throw new Error('LIVE SITE stale-run conflict gate copy missing');
  }
  await screenshot(cdp, 'entry-01-stale-run-conflict.png');

  await clickText(cdp, '대표 시나리오 시작');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\"support-select\"]')?.getAttribute('data-scenario') === 'event-ramp-reconstruction-v1'");

  const preserved = await evaluate(cdp, `(() => {
    const raw = localStorage.getItem('psi-zero-day.defense.save.v1');
    const parsed = raw ? JSON.parse(raw) : null;
    const payload = parsed?.payload ?? null;
    return {
      hasActiveRun: Boolean(payload && Object.prototype.hasOwnProperty.call(payload, 'activeRun')),
      activeRun: payload?.activeRun,
      trainingClears: payload?.records?.find(item => item.scenarioId === 'training-ramp-v1')?.clears ?? -1,
    };
  })()`);
  if (!preserved.hasActiveRun || preserved.activeRun !== null || preserved.trainingClears !== 1) {
    throw new Error('LIVE SITE switch did not preserve records while clearing only activeRun: ' + JSON.stringify(preserved));
  }
  await screenshot(cdp, 'entry-02-event-support-select.png');

  const supportClicked = await evaluate(cdp, `(() => {
    const button = document.querySelector('[data-support="COORDINATOR"]');
    if (!(button instanceof HTMLButtonElement)) return false;
    button.click();
    return true;
  })()`);
  if (!supportClicked) throw new Error('LIVE SITE event support button missing');

  await waitFor(cdp, `(() => {
    const combat = document.querySelector('[data-defense-screen="combat"]');
    return combat?.getAttribute('data-scenario') === 'event-ramp-reconstruction-v1'
      && combat?.getAttribute('data-event') === 'event-ramp-reconstruction-v1';
  })()`);

  const eventLaunch = await evaluate(cdp, `(() => {
    const combat = document.querySelector('[data-defense-screen="combat"]');
    return {
      scenario: combat?.getAttribute('data-scenario') || null,
      event: combat?.getAttribute('data-event') || null,
      wave: combat?.getAttribute('data-wave') || null,
      portrait: window.innerWidth === 390 && window.innerHeight === 844,
    };
  })()`);
  await screenshot(cdp, 'entry-03-event-combat.png');

  return {
    stale_run_conflict_seen: true,
    records_preserved: preserved.trainingClears === 1,
    stale_active_run_cleared: preserved.activeRun === null,
    support_select_scenario: 'event-ramp-reconstruction-v1',
    event_launch: eventLaunch,
    passed: eventLaunch.scenario === 'event-ramp-reconstruction-v1'
      && eventLaunch.event === 'event-ramp-reconstruction-v1',
  };
}

async function runChoice(choice, viewport) {
  await setViewport(viewport);
  await navigateHome();

  const save = qaDefenseSave(choice);
  await evaluate(cdp, `(() => {
    localStorage.setItem('psi-zero-day.defense.save.v1', ${JSON.stringify(JSON.stringify(save.document))});
    localStorage.setItem('psi-zero-day.defense.tutorial.v1', 'seen');
    sessionStorage.setItem(
      ${JSON.stringify('psi-zero-day.def-core-01.')} + ${JSON.stringify(save.runId)},
      JSON.stringify({ phase: 'DECISION', shotIndex: 0, choice: null, choiceTick: null, followup: null })
    );
    return true;
  })()`);

  await clickText(cdp, '현장 디펜스');
  await waitFor(cdp, "Boolean(document.querySelector('[data-defense-screen=\"persistence-gate\"]')) || document.body.textContent.includes('중단한 훈련이 있습니다')");
  await clickText(cdp, '이어서 훈련');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\"combat\"]')?.getAttribute('data-wave') === '8'");
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\"combat\"]')?.getAttribute('data-def-core-phase') === 'DECISION'");

  const before = await evaluate(cdp, `(() => ({
    tick: Number(document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-tick')),
    distances: [...document.querySelectorAll('.zb-enemy-swift')].map(el => Number(el.getAttribute('data-distance'))),
    choices: document.querySelectorAll('.def-core-choice-grid button').length,
  }))()`);
  if (before.choices !== 3) throw new Error(choice + ' DECISION did not expose A/B/C');

  if (viewport.mobile) {
    assertInsideViewport(await rectOf('.def-core-decision-card'), choice + ' mobile DECISION');
  }
  await screenshot(cdp, choice.toLowerCase() + '-01-decision.png');

  await clickText(cdp, choiceLabels[choice]);
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\"combat\"]')?.getAttribute('data-def-core-phase') === 'RETURN'");
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\"combat\"]')?.getAttribute('data-def-core-phase') === 'VERIFY'", 8000);

  const verified = await evaluate(cdp, `(() => {
    const overlay = document.querySelector('.def-core-impact[data-def-core-phase="VERIFY"]');
    const world = document.querySelector('.def-core-world');
    return {
      tick: Number(document.querySelector('[data-defense-screen="combat"]')?.getAttribute('data-tick')),
      verified: overlay?.getAttribute('data-def-core-verified') || null,
      vehicleControlled: overlay?.getAttribute('data-def-core-vehicle-controlled') || null,
      pedestrianSeparated: overlay?.getAttribute('data-def-core-pedestrian-separated') || null,
      choiceCondition: overlay?.getAttribute('data-def-core-choice-condition') || null,
      world: world?.getAttribute('data-def-core-world') || null,
      verification: world?.getAttribute('data-def-core-verification') || null,
      distances: [...document.querySelectorAll('.zb-enemy-swift')].map(el => Number(el.getAttribute('data-distance'))),
      marshals: document.querySelectorAll('.def-core-marshal').length,
      barriers: document.querySelectorAll('.def-core-barrier').length,
      pedestrianRoutes: document.querySelectorAll('.def-core-ped-route').length,
      paused: document.querySelector('.zb-hud-button')?.getAttribute('aria-pressed') === 'true',
    };
  })()`);

  if (verified.verified !== 'true'
    || verified.vehicleControlled !== 'true'
    || verified.pedestrianSeparated !== 'true'
    || verified.choiceCondition !== 'true'
    || verified.verification !== 'SAFE'
    || verified.barriers < 1
    || verified.pedestrianRoutes < 1) {
    throw new Error(choice + ' VERIFY did not close from field conditions: ' + JSON.stringify(verified));
  }
  if (verified.world !== expectedWorld[choice]) {
    throw new Error(choice + ' world result mismatch: ' + JSON.stringify(verified));
  }
  if (choice === 'A' && verified.distances.some((distance, index) => Math.abs(distance - before.distances[index]) > 1)) {
    throw new Error('A failed to hold vehicles at the control line: ' + JSON.stringify({ before, verified }));
  }
  if (choice === 'B') {
    if (verified.marshals < 2) throw new Error('B did not retain the additional marshal');
    if (!(verified.distances[1] <= before.distances[1] + 1)) {
      throw new Error('B trailing vehicle was not held for sequential passage: ' + JSON.stringify({ before, verified }));
    }
  }
  if (choice === 'C') {
    if (!(verified.distances[0] < before.distances[0] - 50)) {
      throw new Error('C lead vehicle did not return toward staging: ' + JSON.stringify({ before, verified }));
    }
    if (!(verified.distances[1] > before.distances[1] - 10)) {
      throw new Error('C incorrectly rerouted the following vehicle instead of keeping it on the safer approach: ' + JSON.stringify({ before, verified }));
    }
  }

  if (viewport.mobile) {
    assertInsideViewport(await rectOf('.def-core-impact'), choice + ' mobile VERIFY');
    const board = await rectOf('.zb-board-wrap');
    if (!board || board.width < 260 || board.height < 150) {
      throw new Error(choice + ' mobile board is not readable during VERIFY: ' + JSON.stringify(board));
    }
  }
  await screenshot(cdp, choice.toLowerCase() + '-02-verify.png');

  await waitFor(cdp, "document.querySelector('[data-defense-screen=\"combat\"]')?.getAttribute('data-def-core-phase') === 'HOOK'", 5000);
  const hook = await evaluate(cdp, `(() => ({
    actions: document.querySelectorAll('.def-core-hook-actions button').length,
    copy: document.querySelector('.def-core-hook-card')?.textContent || '',
    world: document.querySelector('.def-core-world')?.getAttribute('data-def-core-world') || null,
  }))()`);
  if (hook.actions !== 3 || !hook.copy.includes('어제도 한번 비슷했습니다')) {
    throw new Error(choice + ' HOOK contract failed: ' + JSON.stringify(hook));
  }
  if (viewport.mobile) assertInsideViewport(await rectOf('.def-core-hook-card'), choice + ' mobile HOOK');
  await screenshot(cdp, choice.toLowerCase() + '-03-hook.png');

  await clickText(cdp, '기록하기');
  await waitFor(cdp, "document.querySelector('[data-defense-screen=\"combat\"]')?.getAttribute('data-def-core-phase') === 'DONE'");

  return {
    choice,
    viewport: viewport.mobile ? '390x844' : '1280x720',
    before,
    verified,
    hook: { actions: hook.actions, world: hook.world },
    done: true,
  };
}

try {
  await waitForJson('http://127.0.0.1:' + port + '/json/version');
  const response = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' });
  if (!response.ok) throw new Error('Unable to create browser target');
  target = await response.json();
  cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  report.entry_path = await runLiveSiteEntryPath();
  report.runs.push(await runChoice('A', { width: 1280, height: 720, mobile: false }));
  report.runs.push(await runChoice('B', { width: 1280, height: 720, mobile: false }));
  report.runs.push(await runChoice('C', { width: 390, height: 844, mobile: true }));

  report.final = {
    live_site_entry_verified: report.entry_path?.passed === true,
    abc_replayed: report.runs.map(run => run.choice).join('') === 'ABC',
    all_verified: report.runs.every(run => run.verified.verified === 'true'),
    mobile_c_verified: report.runs.some(run => run.choice === 'C' && run.viewport === '390x844'),
  };
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

fs.writeFileSync(path.join(outputDir, 'def-gameplay-identity-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('DEF_GAMEPLAY_IDENTITY=' + JSON.stringify(report));
if (report.failures.length) {
  console.error('DEF-GAMEPLAY-IDENTITY-01 browser QA failed.');
  for (const failure of report.failures) console.error('  - ' + failure);
  if (browserStderr.trim()) console.error(browserStderr.slice(-2500));
  process.exit(1);
}
console.log('DEF-GAMEPLAY-IDENTITY-01 browser QA passed.');
