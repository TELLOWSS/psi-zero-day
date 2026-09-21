import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173';
const outputDir = path.resolve(process.env.PSI_RESPONSIVE_ARTIFACT_DIR || 'artifacts/responsive');
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
  console.error('Responsive QA requires Chrome/Chromium. Set CHROME_BIN or install a browser on the runner.');
  process.exit(1);
}

const port = Number(process.env.PSI_CHROME_DEBUG_PORT || 9222);
const profile = fs.mkdtempSync('/tmp/psi-zero-day-chrome-');
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
      const listeners = this.events.get(message.method) || [];
      for (const listener of listeners) listener(message.params);
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
        const list = this.events.get(method) || [];
        this.events.set(method, list.filter(item => item !== listener));
        resolve(params);
      };
      const timer = setTimeout(() => {
        const list = this.events.get(method) || [];
        this.events.set(method, list.filter(item => item !== listener));
        reject(new Error('Timed out waiting for CDP event ' + method));
      }, timeoutMs);
      this.events.set(method, [...(this.events.get(method) || []), listener]);
    });
  }

  close() {
    this.socket.close();
  }
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed');
  return result.result?.value;
}

async function waitFor(cdp, expression, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await sleep(100);
  }
  throw new Error('Timed out waiting for condition: ' + expression);
}

async function screenshot(cdp, filename) {
  const result = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(result.data, 'base64'));
}

async function driveEpisodeToEvent(cdp, targetEventId, targetNodeId = null, timeoutMs = 24000) {
  const started = Date.now();
  let lastEvent = null;
  let stagnant = 0;

  while (Date.now() - started < timeoutMs) {
    const state = await evaluate(cdp, `(() => {
      const scene = document.querySelector('.episode-immersive-scene');
      const coldOpen = document.querySelector('.episode-cold-open-cta');
      const observe = document.querySelector('.strategy-observe-card button:not(:disabled)');
      const outcome = document.querySelector('.strategy-outcome-card button:not(:disabled)');
      const choice = document.querySelector('.choice-panel button:not(:disabled)');
      const next = document.querySelector('.continue-button');
      return {
        event: scene?.getAttribute('data-event') || null,
        node: scene?.getAttribute('data-node') || null,
        coldOpen: Boolean(coldOpen),
        observe: Boolean(observe),
        outcome: Boolean(outcome),
        choice: Boolean(choice),
        next: Boolean(next),
      };
    })()`);

    if (state.event === targetEventId && (!targetNodeId || state.node === targetNodeId)) return state;

    stagnant = state.event === lastEvent ? stagnant + 1 : 0;
    lastEvent = state.event;

    const advanced = await evaluate(cdp, `(() => {
      const click = selector => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return false;
        element.click();
        return true;
      };
      if (click('.episode-cold-open-cta')) return 'cold-open';
      if (click('.strategy-observe-card button:not(:disabled)')) return 'strategy-observe';
      if (click('.strategy-outcome-card > .strategy-execute-button:not(:disabled)')) return 'outcome';
      if (click('.strategy-action-confirm .strategy-execute-button:not(:disabled)')) return 'strategy-execute';
      if (click('.strategy-action-list button:not(:disabled)')) return 'strategy-action';
      if (click('.strategy-map-worker.has-actions, .strategy-risk-signal.has-actions, .strategy-zone-target.has-actions, .strategy-rail button.has-actions')) return 'strategy-target';
      if (click('.choice-panel button:not(:disabled)')) return 'choice';
      if (click('.continue-button')) return 'continue';
      return '';
    })()`);

    await sleep(advanced ? 105 : 180);
    if (stagnant > 45) throw new Error('Episode 01 QA stalled at ' + JSON.stringify(state));
  }

  throw new Error('Timed out driving Episode 01 to ' + targetEventId + (targetNodeId ? '/' + targetNodeId : '') + '; last event=' + lastEvent);
}

function collectMetrics(stage, touchMode) {
  const visible = element => {
    if (!(element instanceof HTMLElement)) return false;
    const closedDetails = element.closest('details:not([open])');
    if (closedDetails && element.tagName !== 'SUMMARY') return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
  };
  const errorOverlay = document.querySelector('.vite-error-overlay, #webpack-dev-server-client-overlay, [data-nextjs-dialog]');
  const coldOpen = document.querySelector('.episode-cold-open');
  const activeInteractionRoot = coldOpen && visible(coldOpen) ? coldOpen : document;
  const buttons = [...activeInteractionRoot.querySelectorAll('button')].filter(element => visible(element) && getComputedStyle(element).pointerEvents !== 'none');
  const smallTargets = touchMode
    ? buttons.map(button => {
        const rect = button.getBoundingClientRect();
        return {
          text: (button.textContent || '').trim().slice(0, 80),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      }).filter(item => item.width < 44 || item.height < 44)
    : [];
  const frame = document.querySelector('.commercial-title-home, .game-frame, .game-hub, .cinematic-loading');
  const gameFrame = document.querySelector('.game-frame');
  const frameRect = frame?.getBoundingClientRect();
  const playPanelElement = gameFrame?.querySelector('.play-panel');
  const playPanelRect = playPanelElement && visible(playPanelElement) ? playPanelElement.getBoundingClientRect() : null;
  const immersive = document.querySelector('.episode-immersive-scene');
  const images = [...document.images].filter(visible);
  const brokenImages = images.filter(image => image.complete && image.naturalWidth === 0).map(image => image.getAttribute('src'));
  const loadingCrew = [...document.querySelectorAll('.cinematic-loading-team [data-art-surface="loading"]')].filter(visible);
  const primarySelector = [
    '.continue-button',
    '.choice-panel button:not(:disabled)',
    '.strategy-observe-card button:not(:disabled)',
    '.strategy-action-tray button:not(:disabled)',
    '.strategy-outcome-card button:not(:disabled)',
    '.strategy-map-worker.has-actions',
    '.strategy-risk-signal.has-actions',
    '.strategy-zone-target.has-actions',
    '.strategy-rail button.has-actions',
    '.primary-button:not(:disabled)',
  ].join(',');
  const primaryTargets = [...activeInteractionRoot.querySelectorAll(primarySelector)].filter(element => visible(element) && getComputedStyle(element).pointerEvents !== 'none').map(element => {
    const rect = element.getBoundingClientRect();
    const centerX = Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2));
    const centerY = Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2));
    const top = document.elementFromPoint(centerX, centerY);
    const withinViewport = rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1;
    const occluded = withinViewport && Boolean(top) && !(top === element || element.contains(top));
    return {
      text: (element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 100),
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
      withinViewport,
      occluded,
      topElement: top instanceof Element ? (top.className || top.tagName) : null,
    };
  });
  const choiceSurfaceCandidate = activeInteractionRoot === document
    ? document.querySelector('.presentation-area[data-presentation="SHOW_CHOICE"]')
    : null;
  const choiceSurface = choiceSurfaceCandidate && visible(choiceSurfaceCandidate) ? choiceSurfaceCandidate : null;
  const visibleEnabledChoices = choiceSurface
    ? [...choiceSurface.querySelectorAll('.choice-panel button:not(:disabled)')].filter(visible).length
    : 0;
  return {
    stage,
    viewport: { width: innerWidth, height: innerHeight },
    bodyTextLength: document.body.innerText.trim().length,
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 2,
    errorOverlay: Boolean(errorOverlay),
    frame: frameRect ? {
      left: Math.round(frameRect.left),
      top: Math.round(frameRect.top),
      right: Math.round(frameRect.right),
      bottom: Math.round(frameRect.bottom),
      width: Math.round(frameRect.width),
      height: Math.round(frameRect.height),
    } : null,
    playPanel: playPanelRect ? {
      left: Math.round(playPanelRect.left),
      top: Math.round(playPanelRect.top),
      right: Math.round(playPanelRect.right),
      bottom: Math.round(playPanelRect.bottom),
      width: Math.round(playPanelRect.width),
      height: Math.round(playPanelRect.height),
    } : null,
    smallTargets,
    brokenImages,
    loadingCrewCount: loadingCrew.length,
    loadingCrewIds: loadingCrew.map(element => element.getAttribute('data-character')).filter(Boolean),
    primaryTargets,
    choiceSurface: Boolean(choiceSurface),
    visibleEnabledChoices,
    activeBackground: immersive?.getAttribute('data-background-source') || null,
    immersiveBackgroundLoaded: Boolean(immersive?.querySelector('.episode-immersive-background[data-loaded="true"]')),
    activeEvent: immersive?.getAttribute('data-event') || null,
    activeNode: immersive?.getAttribute('data-node') || null,
    productionScene: gameFrame?.getAttribute('data-production-scene') || null,
    interactionMode: gameFrame?.getAttribute('data-interaction-mode') || null,
    hudDensity: gameFrame?.getAttribute('data-hud-density') || null,
    visualRebaseline: immersive?.getAttribute('data-visual-rebaseline') || null,
    fieldPhase: immersive?.getAttribute('data-field-phase') || null,
    fieldCamera: immersive?.getAttribute('data-field-camera') || null,
    fieldDepth: immersive?.getAttribute('data-field-depth') || null,
    fieldLighting: immersive?.getAttribute('data-field-lighting') || null,
    fieldUi: immersive?.getAttribute('data-field-ui') || null,
    fieldCast: immersive?.getAttribute('data-field-cast') || null,
    tbmPhase: immersive?.getAttribute('data-tbm-phase') || null,
    tbmCamera: immersive?.getAttribute('data-tbm-camera') || null,
    tbmDepth: immersive?.getAttribute('data-tbm-depth') || null,
    tbmLighting: immersive?.getAttribute('data-tbm-lighting') || null,
    tbmUi: immersive?.getAttribute('data-tbm-ui') || null,
    tbmCast: immersive?.getAttribute('data-tbm-cast') || null,
    tbmLayer: Boolean(document.querySelector('.tbm-production-layer')),
    tbmBoard: Boolean(document.querySelector('.tbm-briefing-board[data-board="work-sequence"]')),
    tbmBackgroundCrew: Boolean(document.querySelector('.tbm-background-crew')),
    officePhase: immersive?.getAttribute('data-office-phase') || null,
    officeCamera: immersive?.getAttribute('data-office-camera') || null,
    officeDepth: immersive?.getAttribute('data-office-depth') || null,
    officeLighting: immersive?.getAttribute('data-office-lighting') || null,
    officeUi: immersive?.getAttribute('data-office-ui') || null,
    officeCast: immersive?.getAttribute('data-office-cast') || null,
    officeEvidence: immersive?.getAttribute('data-office-evidence') || null,
    officeLayer: Boolean(document.querySelector('.office-production-layer')),
    dayResultPhase: immersive?.getAttribute('data-dayresult-phase') || gameFrame?.getAttribute('data-dayresult-phase') || null,
    dayResultCamera: immersive?.getAttribute('data-dayresult-camera') || gameFrame?.getAttribute('data-dayresult-camera') || null,
    dayResultDepth: immersive?.getAttribute('data-dayresult-depth') || gameFrame?.getAttribute('data-dayresult-depth') || null,
    dayResultLighting: immersive?.getAttribute('data-dayresult-lighting') || gameFrame?.getAttribute('data-dayresult-lighting') || null,
    dayResultUi: immersive?.getAttribute('data-dayresult-ui') || gameFrame?.getAttribute('data-dayresult-ui') || null,
    dayResultCarryover: immersive?.getAttribute('data-dayresult-carryover') || gameFrame?.getAttribute('data-dayresult-carryover') || null,
    dayResultLayer: Boolean(document.querySelector('.day-result-production-layer')),
    memoryStrip: Boolean(document.querySelector('.episode-immersive-memory-strip')),
    strategy: Boolean(document.querySelector('.game-frame.strategy-active')),
    strategyPhase: gameFrame?.getAttribute('data-strategy-phase') || null,
    strategyCamera: gameFrame?.getAttribute('data-strategy-camera') || null,
    strategyDepth: gameFrame?.getAttribute('data-strategy-depth') || null,
    strategyLighting: gameFrame?.getAttribute('data-strategy-lighting') || null,
    strategyUi: gameFrame?.getAttribute('data-strategy-ui') || null,
    strategyFocus: gameFrame?.getAttribute('data-strategy-focus') || null,
    strategyLayer: Boolean(document.querySelector('.strategy-production-layer')),
    coldOpen: Boolean(coldOpen && visible(coldOpen)),
    stopWorkPhase: immersive?.getAttribute('data-stopwork-phase') || null,
    stopWorkCamera: immersive?.getAttribute('data-stopwork-camera') || null,
    stopWorkDepth: immersive?.getAttribute('data-stopwork-depth') || null,
    stopWorkLighting: immersive?.getAttribute('data-stopwork-lighting') || null,
    stopWorkUi: immersive?.getAttribute('data-stopwork-ui') || null,
    stopWorkCast: immersive?.getAttribute('data-stopwork-cast') || null,
    stopWorkLayer: Boolean(document.querySelector('.stop-work-production-layer')),
  };
}

async function metrics(cdp, stage, touchMode) {
  const expression = '(' + collectMetrics.toString() + ')(' + JSON.stringify(stage) + ',' + JSON.stringify(touchMode) + ')';
  return evaluate(cdp, expression);
}

function validate(row, viewport) {
  const failures = [];
  if (row.bodyTextLength < 20) failures.push('page body is effectively blank');
  if (row.errorOverlay) failures.push('framework error overlay is visible');
  if (row.horizontalOverflow) failures.push('horizontal overflow: document ' + row.scrollWidth + 'px > viewport ' + row.viewport.width + 'px');
  if (!row.frame) failures.push('no primary game/title surface rendered');
  if (row.frame && (row.frame.left < -2 || row.frame.right > row.viewport.width + 2)) {
    failures.push('primary surface escapes viewport horizontally: ' + JSON.stringify(row.frame));
  }
  if (row.brokenImages.length) failures.push('broken visible images: ' + row.brokenImages.join(', '));
  if (row.stage === 'cinematic-loading') {
    const expectedCrew = ['lim_junho','player','lee_jaehoon','seo_jeongmin'];
    if (row.loadingCrewCount !== 4) failures.push('cinematic loading must show all four D-1 title-cast identities; visible=' + row.loadingCrewCount);
    if (JSON.stringify(row.loadingCrewIds) !== JSON.stringify(expectedCrew)) failures.push('cinematic loading cast order/identity drift: ' + JSON.stringify(row.loadingCrewIds));
  }
  if (row.stage.startsWith('episode01')) {
    if (!row.primaryTargets?.length) failures.push('no visible primary interaction target in Episode 01');
    const blocked = (row.primaryTargets || []).filter(item => !item.withinViewport || item.occluded);
    if (blocked.length) failures.push('primary interaction target clipped or occluded: ' + JSON.stringify(blocked.slice(0, 4)));
    if (row.choiceSurface && row.visibleEnabledChoices < 1) failures.push('choice surface is active but no enabled choice is visibly reachable');
  }
  if (row.stage.startsWith('episode01') && row.activeBackground === 'final' && !row.immersiveBackgroundLoaded) {
    failures.push('final immersive background did not finish loading before capture');
  }
  const phaseCSceneByStage = {
    'episode01-field-signal': 'FIELD',
    'episode01-strategy': 'STRATEGY',
    'episode01-stop-work': 'STOP_WORK',
    'episode01-office': 'OFFICE',
    'episode01-tbm-first': 'TBM',
    'episode01-tbm': 'TBM',
    'episode01-day-result': 'DAY_RESULT',
    'episode01-day02-bridge': 'FIELD',
  };
  const expectedProductionScene = phaseCSceneByStage[row.stage];
  if (expectedProductionScene && row.productionScene !== expectedProductionScene) {
    failures.push('Phase C scene-family continuity mismatch: expected ' + expectedProductionScene + ', got ' + row.productionScene);
  }
  if ((expectedProductionScene === 'TBM' || expectedProductionScene === 'FIELD') && row.visualRebaseline !== 'world-first-v1') {
    failures.push('Phase D world-first visual rebaseline marker is missing for ' + expectedProductionScene);
  }
  if (viewport.width <= 620 && viewport.height > viewport.width && expectedProductionScene === 'FIELD' && row.choiceSurface) {
    const narrow = row.primaryTargets.filter(target => (target.right - target.left) < viewport.width * 0.78);
    if (narrow.length) failures.push('portrait FIELD choices must use the full-width action dock; narrow choices=' + narrow.length);
  }
  if (row.stage === 'episode01-field-signal') {
    if (row.activeEvent !== 'e01_04_junho_signal') failures.push('FIELD QA did not reach the Junho signal event');
    if (row.activeNode !== 'listen') failures.push('FIELD QA did not reach the judgment node');
    if (row.fieldPhase !== 'signal-judgment') failures.push('FIELD signal judgment production phase is missing');
    if (row.fieldCamera !== 'decision-context') failures.push('FIELD decision camera profile is missing');
    if (row.fieldDepth !== 'decision-layered') failures.push('FIELD decision depth profile is missing');
    if (row.fieldLighting !== 'decision-focus') failures.push('FIELD decision lighting profile is missing');
    if (row.fieldUi !== 'judgment') failures.push('FIELD judgment UI profile is missing');
    if (row.fieldCast !== 'junho-player-balance') failures.push('FIELD balanced cast profile is missing');
  }
  if (row.stage === 'episode01-strategy') {
    if (row.activeEvent !== 'e01_05_command') failures.push('STRATEGY QA did not reach coordination pressure');
    if (row.activeNode !== 'entrance') failures.push('STRATEGY QA did not reach the entrance judgment node');
    if (row.strategyPhase !== 'tactical-judgment') failures.push('STRATEGY tactical-judgment production phase is missing');
    if (row.strategyCamera !== 'decision-zone') failures.push('STRATEGY decision-zone camera profile is missing');
    if (row.strategyDepth !== 'decision-layered') failures.push('STRATEGY decision-layered depth profile is missing');
    if (row.strategyLighting !== 'decision-contrast') failures.push('STRATEGY decision lighting profile is missing');
    if (row.strategyUi !== 'judgment') failures.push('STRATEGY judgment UI profile is missing');
    if (row.strategyFocus !== 'entry') failures.push('STRATEGY entry focus is missing');
    if (!row.strategyLayer) failures.push('STRATEGY production map layer did not render');
  }
  if (viewport.mobile && viewport.width > viewport.height && row.frame && row.frame.height > viewport.height + 2) {
    failures.push('Landscape game frame exceeds physical viewport: ' + row.frame.height + 'px > ' + viewport.height + 'px');
  }
  if (row.stage === 'episode01-tbm-first') {
    if (row.activeEvent !== 'e01_02_meet_kang') failures.push('First TBM QA did not reach the 06:40 Kang Taesik briefing');
    if (row.tbmPhase !== 'first-briefing') failures.push('First TBM production phase is missing');
    if (row.tbmCamera !== 'briefing-circle') failures.push('First TBM briefing-circle camera profile is missing');
    if (row.tbmDepth !== 'circle-open') failures.push('First TBM circle-open depth profile is missing');
    if (row.tbmLighting !== 'morning-neutral') failures.push('First TBM morning-neutral lighting profile is missing');
    if (row.tbmUi !== 'briefing') failures.push('First TBM briefing UI profile is missing');
    if (row.tbmCast !== 'mentor-pair') failures.push('First TBM mentor-pair cast profile is missing');
    if (!row.tbmLayer) failures.push('First TBM production layer did not render');
    if (!row.tbmBoard) failures.push('First TBM work-sequence briefing board did not render');
    if (!row.tbmBackgroundCrew) failures.push('First TBM background crew did not render');
  }
  if ((row.stage === 'episode01-tbm-first' || row.stage === 'episode01-tbm') && viewport.mobile && row.playPanel) {
    const landscapePhone = viewport.width > viewport.height && viewport.height <= 460;
    const portraitPhone = viewport.height > viewport.width && viewport.width <= 420;
    if (landscapePhone && row.playPanel.height > viewport.height * 0.32) {
      failures.push('TBM landscape interaction dock is too tall for world-first composition: ' + row.playPanel.height + 'px');
    }
    if (portraitPhone && row.stage === 'episode01-tbm' && row.playPanel.height > viewport.height * 0.32) {
      failures.push('TBM portrait judgment sheet is too tall for world-first composition: ' + row.playPanel.height + 'px');
    }
  }
  if (row.stage === 'episode01-tbm') {
    if (row.activeEvent !== 'e01_08g_tbm_field_gap') failures.push('TBM QA did not reach the changed-work briefing');
    if (row.activeNode !== 'tbm_action') failures.push('TBM QA did not reach the group judgment node');
    if (row.tbmPhase !== 'group-judgment') failures.push('TBM group-judgment production phase is missing');
    if (row.tbmCamera !== 'decision-circle') failures.push('TBM decision-circle camera profile is missing');
    if (row.tbmDepth !== 'decision-ring') failures.push('TBM decision-ring depth profile is missing');
    if (row.tbmLighting !== 'decision-amber') failures.push('TBM decision lighting profile is missing');
    if (row.tbmUi !== 'judgment') failures.push('TBM judgment UI profile is missing');
    if (row.tbmCast !== 'decision-circle') failures.push('TBM decision-circle cast profile is missing');
    if (!row.tbmLayer) failures.push('TBM production layer did not render');
  }
  if (row.stage === 'episode01-day-result') {
    if (row.activeEvent !== 'e01_09_evening') failures.push('DAY RESULT QA did not reach the evening reflection');
    if (row.activeNode !== 'evening') failures.push('DAY RESULT QA did not reach the evening choice node');
    if (row.dayResultPhase !== 'day-reflection') failures.push('DAY RESULT reflection production phase is missing');
    if (row.dayResultCamera !== 'sunset-memory-wide') failures.push('DAY RESULT sunset-memory camera profile is missing');
    if (row.dayResultDepth !== 'memory-tableau') failures.push('DAY RESULT memory-tableau depth profile is missing');
    if (row.dayResultLighting !== 'home-night-warm') failures.push('DAY RESULT home-night lighting profile is missing');
    if (row.dayResultUi !== 'reflect') failures.push('DAY RESULT reflect UI profile is missing');
    if (!['people','instruction','record','stable'].includes(row.dayResultCarryover)) failures.push('DAY RESULT carryover priority is missing');
    if (!row.dayResultLayer) failures.push('DAY RESULT production layer did not render');
    if (!row.memoryStrip) failures.push('DAY RESULT played-memory strip did not render');
  }
  if (row.stage === 'episode01-day02-bridge') {
    if (row.activeEvent !== 'e01_10_next_day_tease') failures.push('DAY 02 bridge did not reach the next-day teaser');
    if (row.fieldPhase !== 'next-day-tease') failures.push('DAY 02 bridge is missing the FIELD next-day-tease production phase');
    if (row.interactionMode !== 'continue') failures.push('DAY 02 bridge should return to continue-mode pacing');
    if (row.hudDensity !== 'minimal') failures.push('DAY 02 bridge should keep minimal HUD density');
  }
  if (row.stage === 'episode01-office') {
    if (row.activeEvent !== 'e01_08e_responsibility_clash') failures.push('OFFICE QA did not reach the responsibility clash');
    if (row.activeNode !== 'report') failures.push('OFFICE QA did not reach the report judgment node');
    if (row.officePhase !== 'responsibility-judgment') failures.push('OFFICE responsibility-judgment production phase is missing');
    if (row.officeCamera !== 'judgment-table') failures.push('OFFICE judgment-table camera profile is missing');
    if (row.officeDepth !== 'evidence-table') failures.push('OFFICE evidence-table depth profile is missing');
    if (row.officeLighting !== 'decision-amber') failures.push('OFFICE decision lighting profile is missing');
    if (row.officeUi !== 'judgment') failures.push('OFFICE judgment UI profile is missing');
    if (row.officeCast !== 'balanced-table') failures.push('OFFICE balanced-table cast profile is missing');
    if (row.officeEvidence !== 'responsibility') failures.push('OFFICE responsibility evidence focus is missing');
    if (!row.officeLayer) failures.push('OFFICE production evidence-table layer did not render');
  }
  if (row.stage === 'episode01-stop-work') {
    if (row.activeEvent !== 'e01_08c_site_pushback') failures.push('STOP WORK QA did not reach the zero-moment event');
    if (row.stopWorkPhase !== 'zero-moment') failures.push('STOP WORK zero-moment production phase is missing');
    if (row.stopWorkCamera !== 'decision-compressed') failures.push('STOP WORK decision camera profile is missing');
    if (row.stopWorkDepth !== 'compressed-pressure') failures.push('STOP WORK pressure depth profile is missing');
    if (row.stopWorkLighting !== 'stop-red') failures.push('STOP WORK lighting profile is missing');
    if (row.stopWorkUi !== 'judgment') failures.push('STOP WORK judgment UI profile is missing');
    if (row.stopWorkCast !== 'player-hero') failures.push('STOP WORK hero cast profile is missing');
    if (!row.stopWorkLayer) failures.push('STOP WORK production layer did not render');
  }
  if (viewport.mobile && row.smallTargets.length) {
    const relevant = row.smallTargets.filter(item => !['SOUNDON', 'SOUNDOFF'].includes(item.text.replace(/\s/g, '')));
    if (relevant.length) failures.push('touch targets below 44px: ' + JSON.stringify(relevant.slice(0, 6)));
  }
  return failures;
}

const viewports = [
  { name: 'desktop-1440x900', width: 1440, height: 900, mobile: false },
  { name: 'desktop-1920x1080', width: 1920, height: 1080, mobile: false },
  { name: 'phone-portrait-390x844', width: 390, height: 844, mobile: true },
  { name: 'phone-landscape-844x390', width: 844, height: 390, mobile: true },
  { name: 'tablet-portrait-820x1180', width: 820, height: 1180, mobile: true },
];

const report = [];
let failed = false;

try {
  await waitForJson('http://127.0.0.1:' + port + '/json/version');

  for (const viewport of viewports) {
    const targetResponse = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' });
    if (!targetResponse.ok) throw new Error('Unable to create Chrome target for ' + viewport.name);
    const target = await targetResponse.json();
    const cdp = new Cdp(target.webSocketDebuggerUrl);

    try {
      await cdp.send('Page.enable');
      await cdp.send('Runtime.enable');
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.mobile ? 2 : 1,
        mobile: viewport.mobile,
        screenOrientation: viewport.width > viewport.height
          ? { type: 'landscapePrimary', angle: 90 }
          : { type: 'portraitPrimary', angle: 0 },
      });
      const loaded = cdp.once('Page.loadEventFired', 12000);
      await cdp.send('Page.navigate', { url: baseUrl });
      await loaded;
      await waitFor(cdp, "Boolean(document.body.innerText.includes('ZERO DAY') && document.querySelector('.commercial-title-home'))", 12000);
      await sleep(350);

      const homeMetrics = await metrics(cdp, 'home', viewport.mobile);
      const homeFailures = validate(homeMetrics, viewport);
      report.push({ viewportName: viewport.name, ...homeMetrics, failures: homeFailures });
      if (homeFailures.length) failed = true;
      await screenshot(cdp, viewport.name + '-home.png');

      await evaluate(cdp, "document.querySelector('.commercial-title-action.is-primary')?.click(); true");
      await sleep(120);
      const confirmNewGame = await evaluate(cdp, "Boolean(document.querySelector('.commercial-title-dialog .is-danger'))");
      if (confirmNewGame) {
        await evaluate(cdp, "document.querySelector('.commercial-title-dialog .is-danger')?.click(); true");
      }
      await waitFor(cdp, "Boolean(document.querySelector('.cinematic-loading, .game-frame'))", 5000);
      const hasLoadingSurface = await evaluate(cdp, "Boolean(document.querySelector('.cinematic-loading'))");
      if (hasLoadingSurface) {
        const loadingMetrics = await metrics(cdp, 'cinematic-loading', viewport.mobile);
        const loadingFailures = validate(loadingMetrics, viewport);
        report.push({ viewportName: viewport.name, ...loadingMetrics, failures: loadingFailures });
        if (loadingFailures.length) failed = true;
        await screenshot(cdp, viewport.name + '-cinematic-loading.png');
      }
      await waitFor(cdp, "Boolean(document.querySelector('.game-frame'))", 9000);
      await waitFor(
        cdp,
        "Boolean(document.querySelector('.episode-immersive-scene .episode-immersive-background[data-loaded=\"true\"]'))",
        12000,
      );
      await sleep(180);

      const hasColdOpen = await evaluate(cdp, "Boolean(document.querySelector('.episode-cold-open'))");
      if (hasColdOpen) {
        const coldOpenMetrics = await metrics(cdp, 'episode01-cold-open', viewport.mobile);
        const coldOpenFailures = validate(coldOpenMetrics, viewport);
        if (!coldOpenMetrics.activeEvent) coldOpenFailures.push('Episode 01 immersive scene did not render beneath the cold open');
        report.push({ viewportName: viewport.name, ...coldOpenMetrics, failures: coldOpenFailures });
        if (coldOpenFailures.length) failed = true;
        await screenshot(cdp, viewport.name + '-episode01-cold-open.png');

        await evaluate(cdp, "document.querySelector('.episode-cold-open-cta')?.click(); true");
        await waitFor(cdp, "Boolean(!document.querySelector('.episode-cold-open'))", 3000);
        await sleep(180);
      }

      const episodeMetrics = await metrics(cdp, 'episode01', viewport.mobile);
      const episodeFailures = validate(episodeMetrics, viewport);
      if (!episodeMetrics.activeEvent) episodeFailures.push('Episode 01 immersive scene did not render an active event');
      report.push({ viewportName: viewport.name, ...episodeMetrics, failures: episodeFailures });
      if (episodeFailures.length) failed = true;
      await screenshot(cdp, viewport.name + '-episode01.png');

      await driveEpisodeToEvent(cdp, 'e01_02_meet_kang');
      await sleep(240);
      const firstTbmMetrics = await metrics(cdp, 'episode01-tbm-first', viewport.mobile);
      const firstTbmFailures = validate(firstTbmMetrics, viewport);
      report.push({ viewportName: viewport.name, ...firstTbmMetrics, failures: firstTbmFailures });
      if (firstTbmFailures.length) failed = true;
      await screenshot(cdp, viewport.name + '-episode01-tbm-first.png');

      await driveEpisodeToEvent(cdp, 'e01_04_junho_signal', 'listen');
      await sleep(220);
      const fieldMetrics = await metrics(cdp, 'episode01-field-signal', viewport.mobile);
      const fieldFailures = validate(fieldMetrics, viewport);
      report.push({ viewportName: viewport.name, ...fieldMetrics, failures: fieldFailures });
      if (fieldFailures.length) failed = true;
      await screenshot(cdp, viewport.name + '-episode01-field-signal.png');

      await driveEpisodeToEvent(cdp, 'e01_05_command', 'entrance', 30000);
      await sleep(240);
      const strategyMetrics = await metrics(cdp, 'episode01-strategy', viewport.mobile);
      const strategyFailures = validate(strategyMetrics, viewport);
      report.push({ viewportName: viewport.name, ...strategyMetrics, failures: strategyFailures });
      if (strategyFailures.length) failed = true;
      await screenshot(cdp, viewport.name + '-episode01-strategy.png');

      await driveEpisodeToEvent(cdp, 'e01_08c_site_pushback');
      await sleep(240);
      const stopWorkMetrics = await metrics(cdp, 'episode01-stop-work', viewport.mobile);
      const stopWorkFailures = validate(stopWorkMetrics, viewport);
      report.push({ viewportName: viewport.name, ...stopWorkMetrics, failures: stopWorkFailures });
      if (stopWorkFailures.length) failed = true;
      await screenshot(cdp, viewport.name + '-episode01-stop-work.png');

      await driveEpisodeToEvent(cdp, 'e01_08e_responsibility_clash', 'report', 36000);
      await sleep(240);
      const officeMetrics = await metrics(cdp, 'episode01-office', viewport.mobile);
      const officeFailures = validate(officeMetrics, viewport);
      report.push({ viewportName: viewport.name, ...officeMetrics, failures: officeFailures });
      if (officeFailures.length) failed = true;
      await screenshot(cdp, viewport.name + '-episode01-office.png');

      await driveEpisodeToEvent(cdp, 'e01_08g_tbm_field_gap', 'tbm_action', 36000);
      await sleep(240);
      const tbmMetrics = await metrics(cdp, 'episode01-tbm', viewport.mobile);
      const tbmFailures = validate(tbmMetrics, viewport);
      report.push({ viewportName: viewport.name, ...tbmMetrics, failures: tbmFailures });
      if (tbmFailures.length) failed = true;
      await screenshot(cdp, viewport.name + '-episode01-tbm.png');

      await driveEpisodeToEvent(cdp, 'e01_09_evening', 'evening', 65000);
      await sleep(260);
      const dayResultMetrics = await metrics(cdp, 'episode01-day-result', viewport.mobile);
      const dayResultFailures = validate(dayResultMetrics, viewport);
      report.push({ viewportName: viewport.name, ...dayResultMetrics, failures: dayResultFailures });
      if (dayResultFailures.length) failed = true;
      await screenshot(cdp, viewport.name + '-episode01-day-result.png');

      await driveEpisodeToEvent(cdp, 'e01_10_next_day_tease', null, 24000);
      await sleep(280);
      const day02BridgeMetrics = await metrics(cdp, 'episode01-day02-bridge', viewport.mobile);
      const day02BridgeFailures = validate(day02BridgeMetrics, viewport);
      report.push({ viewportName: viewport.name, ...day02BridgeMetrics, failures: day02BridgeFailures });
      if (day02BridgeFailures.length) failed = true;
      await screenshot(cdp, viewport.name + '-episode01-day02-bridge.png');
    } catch (error) {
      failed = true;
      report.push({ viewportName: viewport.name, viewport: { width: viewport.width, height: viewport.height }, stage: 'runner', failures: [error.message] });
      try { await screenshot(cdp, viewport.name + '-error.png'); } catch {}
    } finally {
      cdp.close();
      await fetch('http://127.0.0.1:' + port + '/json/close/' + target.id);
    }
  }
} finally {
  browser.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => browser.once('exit', resolve)),
    sleep(1200),
  ]);
  try {
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 100 });
  } catch (error) {
    console.warn('Chrome profile cleanup skipped:', error.message);
  }
}

const reportPath = path.join(outputDir, 'responsive-report.json');
fs.writeFileSync(reportPath, JSON.stringify({
  schema_version: 1,
  generated_at: new Date().toISOString(),
  base_url: baseUrl,
  browser: chrome,
  results: report,
}, null, 2) + '\n');

for (const row of report) {
  const status = row.failures?.length ? 'FAIL' : 'PASS';
  console.log(status.padEnd(4) + ' ' + String(row.viewportName || (row.viewport?.width + 'x' + row.viewport?.height)).padEnd(28) + ' ' + String(row.stage).padEnd(10)
    + ' overflow=' + (row.horizontalOverflow ?? '?')
    + ' bg=' + (row.activeBackground ?? '-')
    + ' event=' + (row.activeEvent ?? '-'));
  for (const failure of row.failures || []) console.error('  - ' + failure);
}

if (failed) {
  console.error('Episode 01 responsive QA failed. See ' + reportPath + ' and screenshots.');
  if (browserStderr.trim()) console.error(browserStderr.slice(-4000));
  process.exit(1);
}

console.log('Episode 01 responsive QA passed across ' + viewports.length + ' viewport profiles.');
