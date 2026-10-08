import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const url = process.env.PSI_PREVIEW_URL;
if (!url) throw Error('Set PSI_PREVIEW_URL');
const output = 'artifacts/shield-combat'; fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN }), rows = [];
try {
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390]]) for (const mode of ['normal', 'busy', 'reduced']) {
    const page = await browser.newPage({ viewport: { width, height } }), errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.emulateMedia({ reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
    await page.addInitScript(() => localStorage.setItem('psi.survivors.store_wallet', JSON.stringify({ credits: 1260, inventory: { owned: ['shock_mantle'], equipped: ['shock_mantle'], durability: { shock_mantle: 100 } } })));
    await page.route('**/assets/PatrolSurvivorsGame-*.js', async route => {
      const response = await route.fetch(); let body = await response.text();
      const capture = /update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
      if ([...body.matchAll(capture)].length !== 1) throw Error('Engine capture unavailable');
      body = body.replace(capture, match => `${match}window.shieldEngine=this;`);
      const find = marker => {
        const index = body.indexOf(marker), start = body.lastIndexOf('function ', index);
        const header = /^function (\w+)\(/.exec(body.slice(start));
        if (index < 0 || !header) throw Error(`Actual engine function unavailable: ${marker}`);
        return header[1];
      };
      const absorb = find('feedback=.45'), tick = find('feedback=.6');
      const marker = body.indexOf('impactRatio'), start = body.lastIndexOf('sample(', marker);
      const header = /^sample\(([^)]+)\)\{/.exec(body.slice(start));
      if (!header || header[1].split(',').length !== 3) throw Error('Actual shield tracker unavailable');
      const [state, reduced, busy] = header[1].split(',');
      body = body.slice(0, start) + body.slice(start).replace(header[0], header[0] + `window.shieldProbe={tracker:this,state:${state},reduced:${reduced},busy:${busy}};`);
      const draw = /(\w+)\((\w+),(\w+)\.vfxAtlas,3,(\w+),(\w+)-30,(\w+)\.width,\6\.height,\6\.alpha\)/g;
      if ([...body.matchAll(draw)].length !== 1) throw Error('Shield VFX draw call unavailable');
      body = body.replace(draw, (match, fn, ctx, actor, x, y, visual) => `(window.shieldDraw={...${visual},assetReady:${actor}.vfxAtlas.naturalWidth>0},${match})`);
      body += `;window.shieldAbsorb=${absorb};window.shieldTick=${tick};`;
      await route.fulfill({ response, body });
    });
    await page.goto(url);
    await page.getByRole('button', { name: /시그널 워치.*SURVIVORS/ }).click();
    await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
    await page.waitForFunction(() => window.shieldEngine?.state.phase === 'playing' && window.shieldProbe);
    await page.keyboard.press('KeyP');
    await page.evaluate(busy => {
      const s = window.shieldEngine.state, p = s.player;
      s.hazards = Array.from({ length: busy ? 46 : 4 }, (_, i) => {
        const angle = i * Math.PI * 2 / (busy ? 12 : 4), radius = 160 + Math.floor(i / 12) * 90;
        return { id: `shield-review-${i}`, type: 'RUNAWAY_CART', x: p.x + Math.cos(angle) * radius, y: p.y + Math.sin(angle) * radius, hp: 100, maxHp: 100, speed: 0, radius: 18, damage: 0, expValue: 0, motion: { phase: 'warning', timer: 1, directionX: -Math.cos(angle), directionY: -Math.sin(angle) } };
      });
    }, mode === 'busy');
    await page.addStyleTag({ content: '.survivors-modal-backdrop{visibility:hidden!important}' });
    for (const phase of ['absorb', 'depleted', 'recharge']) {
      const event = await page.evaluate(phase => {
        const s = window.shieldEngine.state, before = s.premiumGear.shield;
        window.shieldDraw = null;
        let overflow;
        if (phase === 'recharge') { s.gameTime += 18.01; s.phase = 'playing'; window.shieldTick(s, 18.01); s.phase = 'paused'; }
        else { s.gameTime += .1; overflow = window.shieldAbsorb(s, 30); }
        const p = window.shieldProbe, visual = p.tracker.sample(s, p.reduced, p.busy);
        return { before, after: s.premiumGear.shield, overflow, visual, clock: s.gameTime };
      }, phase);
      await page.waitForTimeout(350);
      const sample = () => page.evaluate(() => {
        const c = document.querySelector('.survivors-canvas'), data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let hash = 2166136261, min = 255, max = 0;
        for (let i = 0; i < data.length; i += 4) { hash = Math.imul(hash ^ data[i], 16777619); min = Math.min(min, data[i]); max = Math.max(max, data[i]); }
        const p = window.shieldProbe;
        return { hash: hash >>> 0, nonblank: max - min > 20, draw: window.shieldDraw, time: window.shieldEngine.state.gameTime, reduced: p.reduced, busy: p.busy, phase: window.shieldEngine.state.phase, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      const a = await sample(); await page.waitForTimeout(250); const b = await sample();
      const expected = mode === 'reduced' ? phase === 'depleted' ? undefined : 'charged' : phase;
      const rendered = event.visual ? b.draw?.assetReady && b.draw.phase === expected && b.draw.alpha === event.visual.alpha : b.draw === null;
      const pass = rendered && a.hash === b.hash && a.time === b.time && b.nonblank && !b.overflow && b.phase === 'paused' && Boolean(b.reduced) === (mode === 'reduced') && Boolean(b.busy) === (mode === 'busy') && event.visual?.phase === expected && !errors.length;
      await page.screenshot({ path: `${output}/${width}x${height}-${mode}-${phase}.png` });
      rows.push({ width, height, mode, phase, event, samples: [a, b], errors: [...errors], pass });
    }
    await page.close();
  }
  fs.writeFileSync(`${output}/report.json`, JSON.stringify({ url, scope: 'ACTUAL_BUILD_RENDERER_AND_ENGINE_FUNCTION_CALLS_PAUSED_WARNING_FIXTURE_NOT_NATURAL_COMBAT_OR_DIRECTOR_APPROVAL', rows }, null, 2));
  console.log(JSON.stringify(rows)); if (rows.some(row => !row.pass)) process.exitCode = 1;
} finally { await browser.close(); }
