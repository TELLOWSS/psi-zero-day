import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const out = 'artifacts/signal-watch-stage50';
fs.mkdirSync(out, { recursive: true });
const copy = JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json', 'utf8'));
const allIds = Array.from({ length: 50 }, (_, i) => `stage_${String(i + 1).padStart(2, '0')}`);
const ids = process.env.PSI_CROWD ? ['stage_03', 'stage_05', 'stage_50'] : process.env.PSI_LOW ? ['stage_01', 'stage_03', 'stage_05', 'stage_50'] : allIds;
const suffix = process.env.PSI_CROWD ? '-crowd' : process.env.PSI_LOW ? '-low' : '';
const viewports = process.env.PSI_VIEWPORT ? [process.env.PSI_VIEWPORT.split('x').map(Number)] : [[1440, 900], [390, 844], [844, 390], [1024, 768]];
const rows = [];
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  for (const [width, height] of viewports) for (const id of ids) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.addInitScript(({ id, ids, low }) => {
      let seed = 17;
      Math.random = () => ((seed = Math.imul(1664525, seed) + 1013904223 >>> 0) / 4294967296);
      localStorage.setItem('psi.survivors.unlocked_stages', JSON.stringify(ids));
      localStorage.setItem('psi.survivors.last_played_stage', id);
      localStorage.setItem('psi.survivors.credits', '1234');
      localStorage.setItem('psi.survivors.rd_upgrades', JSON.stringify({ vitality: 2, mobility: 1, intelligence: 1, firstAid: 0, reroll: 0 }));
      localStorage.setItem('psi.survivors.stage_stars', JSON.stringify({ stage_01: [false, true, false] }));
      localStorage.setItem('psi.survivors.display.v1', JSON.stringify({ quality: low ? 'low' : 'balanced', lighting: true }));
      window.floorDraws = new Set();
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function(source, ...args) {
        if (source instanceof HTMLImageElement && source.naturalWidth > 0) window.floorDraws.add(new URL(source.src).pathname);
        return draw.call(this, source, ...args);
      };
    }, { id, ids: allIds, low: Boolean(process.env.PSI_LOW) });
    try {
      await page.goto(process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4174', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /시그널 워치.*SURVIVORS/ }).click();
      await page.getByRole('button', { name: copy.briefBrowse, exact: true }).click();
      await page.getByRole('button', { name: copy.close, exact: true }).click();
      const expected = await page.evaluate(async () => {
        const { stageArtProfile } = await import('/src/ui/survivors-stage-art.ts');
        const { stageActorLight } = await import('/src/ui/survivors-stage-light.ts');
        const { SurvivorsEngine } = await import('/src/engine/patrol-survivors-engine.ts');
        const update = SurvivorsEngine.prototype.update;
        SurvivorsEngine.prototype.update = function(dt, input) { window.visualEngine = this; return update.call(this, dt, input); };
        const id = localStorage.getItem('psi.survivors.last_played_stage');
        window.savedBefore = Object.fromEntries(['psi.survivors.credits', 'psi.survivors.rd_upgrades', 'psi.survivors.stage_stars', 'psi.survivors.unlocked_stages'].map(key => [key, localStorage.getItem(key)]));
        return { ground: stageArtProfile(id).ground, color: stageActorLight(id).color };
      });
      await page.getByRole('button', { name: '시그널 워치 시작', exact: true }).click();
      await page.waitForFunction(({ id, low }) => window.visualEngine?.state.stageId === id && document.querySelector('.survivors-canvas')?.dataset.heroCastShadow === (low ? 'none' : 'authored-pose'), { id, low: Boolean(process.env.PSI_LOW) });
      await page.evaluate(() => {
        const e = window.visualEngine;
        e.state.player.invincibleTime = 0; e.state.player.x = 700; e.state.player.y = 450;
        e.state.gameTime = 8; e.state.playerMotionTime = 8; e.state.hazards = []; e.state.projectiles = []; e.state.drops = [];
        e.setPaused(true);
      });
      await page.addStyleTag({ content: '.survivors-modal-backdrop{visibility:hidden!important}' });
      for (const reduced of process.env.PSI_CROWD ? [false] : [false, true]) {
        await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
        await page.waitForTimeout(120);
        const snapshot = await page.evaluate(() => {
          const e = window.visualEngine, c = document.querySelector('.survivors-canvas');
          return { stage: e.state.stageId, light: c.dataset.stageLight, color: c.dataset.stageLightColor, shadow: c.dataset.heroCastShadow, contact: c.dataset.contactArt, stretch: Number(c.dataset.contactLegStretch), floorDraws: [...window.floorDraws], overflow: document.documentElement.scrollWidth > innerWidth + 1,
            saved: Object.entries(window.savedBefore).every(([key, value]) => localStorage.getItem(key) === value) };
        });
        if (snapshot.stage !== id || snapshot.light !== id || snapshot.color !== expected.color || snapshot.shadow !== (process.env.PSI_LOW ? 'none' : 'authored-pose') || snapshot.contact !== 'true' || snapshot.stretch > 1.080001 || !snapshot.floorDraws.includes(expected.ground) || snapshot.overflow || !snapshot.saved || errors.length) throw Error(JSON.stringify({ id, width, height, reduced, expected, snapshot, errors }));
        if (process.env.PSI_CROWD) {
          await page.evaluate(() => {
            const e = window.visualEngine; e.setPaused(false); e.state.player.invincibleTime = 999; e.state.nextLevelExp = 1e9;
            for (let i = 0; i < 65; i++) e.spawnHazard(['RUNAWAY_CART', 'GAS_LEAK', 'FALLING_DEBRIS'][i % 3], 10000);
            for (const id of ['radio_boost', 'extinguisher', 'floodlight', 'safety_drone', 'grouting_gun', 'emp_generator']) e.state.activePerks[id] = 5;
            window.projectilePeak = 0; window.hazardPeak = 0;
            const sample = () => { window.projectilePeak = Math.max(window.projectilePeak, e.state.projectiles.length); window.hazardPeak = Math.max(window.hazardPeak, e.state.hazards.length); if (e.state.phase === 'playing') requestAnimationFrame(sample); };
            requestAnimationFrame(sample);
          });
          await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1000); await page.keyboard.up('ArrowRight'); await page.waitForTimeout(2000);
          snapshot.crowd = await page.evaluate(() => ({ phase: window.visualEngine.state.phase, hazards: window.visualEngine.state.hazards.length, peakHazards: window.hazardPeak, x: window.visualEngine.state.player.x, projectiles: window.projectilePeak }));
          if (snapshot.crowd.phase !== 'playing' || snapshot.crowd.peakHazards < 60 || snapshot.crowd.projectiles < 1 || Math.abs(snapshot.crowd.x - 700) < 20 || errors.length) throw Error(JSON.stringify({ id, width, height, crowd: snapshot.crowd, errors }));
        }
        await page.screenshot({ path: `${out}/${id}-${width}x${height}${reduced ? '-reduced' : ''}${suffix}.png` });
        rows.push({ id, width, height, reduced, ground: expected.ground, ...snapshot, errors: [...errors], pass: true });
      }
      console.log(`${id} ${width}x${height}: normal + reduced PASS`);
    } finally {
      await page.close();
      fs.writeFileSync(`${out}/report-${width}x${height}${suffix}.json`, JSON.stringify(rows.filter(row => row.width === width && row.height === height), null, 2));
    }
  }
} finally { await browser.close(); }
