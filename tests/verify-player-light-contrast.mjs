import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const output = 'artifacts/player-light-contrast'; fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN }), rows = [];
try {
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390]]) for (const pose of ['idle', 'walking']) {
    const page = await browser.newPage({ viewport: { width, height } }), errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.route('**/assets/PatrolSurvivorsGame-*.js', async route => {
      const response = await route.fetch(); let body = await response.text();
      const capture = /update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
      if ([...body.matchAll(capture)].length !== 1) throw Error('Engine capture unavailable');
      body = body.replace(capture, match => `${match}window.lightEngine=this;`);
      const marker = body.indexOf('lightKey!=='), start = body.lastIndexOf('function ', marker);
      const header = /^function \w+\(([^)]+)\)\{/.exec(body.slice(start));
      if (marker < 0 || !header || header[1].split(',').length !== 6) throw Error('Hero light capture unavailable');
      const [ctx, actor, h, p, color, strength] = header[1].split(',');
      const probe = `if(${actor}.src.endsWith('/player-map.webp')){const t=${ctx}.getTransform();window.lightProbe={original:${strength},color:${color},height:${h},scale:t.a,x:t.e,y:t.f,alpha:${ctx}.globalAlpha};if(window.lightMode==='off')${strength}=0;if(window.lightMode==='peak')${strength}=.24;}`;
      body = body.slice(0, start) + body.slice(start).replace(header[0], header[0] + probe);
      await route.fulfill({ response, body });
    });
    await page.goto(process.env.PSI_PREVIEW_URL);
    await page.getByRole('button', { name: /시그널 워치.*SURVIVORS/ }).click();
    await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
    await page.waitForFunction(() => window.lightEngine?.state.phase === 'playing' && window.lightProbe);
    if (pose === 'walking') { await page.keyboard.down('ArrowUp'); await page.waitForTimeout(700); await page.keyboard.up('ArrowUp'); }
    await page.keyboard.press('KeyP');
    await page.addStyleTag({ content: '.survivors-modal-backdrop{visibility:hidden!important}' });
    const captures = {};
    for (const mode of ['original', 'off', 'peak']) {
      await page.evaluate(mode => { window.lightMode = mode; }, mode); await page.waitForTimeout(250);
      captures[mode] = await page.evaluate(() => {
        const c = document.querySelector('.survivors-canvas'), p = window.lightProbe, scale = Math.abs(p.scale);
        const x = Math.max(0, Math.floor(p.x - 24 * scale)), y = Math.max(0, Math.floor(p.y - 78 * scale));
        const w = Math.min(c.width - x, Math.ceil(48 * scale)), h = Math.min(c.height - y, Math.ceil(82 * scale));
        return { probe: p, time: window.lightEngine.state.gameTime, phase: window.lightEngine.state.phase, box: { x, y, w, h }, pixels: [...c.getContext('2d').getImageData(x, y, w, h).data], overflow: document.documentElement.scrollWidth > innerWidth };
      });
      await page.screenshot({ path: `${output}/${width}x${height}-${pose}-${mode}.png` });
    }
    const a = captures.off.pixels, b = captures.peak.pixels;
    let changed = 0, delta = 0, offLuma = 0, peakLuma = 0;
    if (a.length !== b.length) throw Error('Actor ROI shifted');
    for (let i = 0; i < a.length; i += 4) {
      const diff = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      if (diff < 3) continue;
      changed++; delta += diff / 3;
      offLuma += .2126 * a[i] + .7152 * a[i + 1] + .0722 * a[i + 2];
      peakLuma += .2126 * b[i] + .7152 * b[i + 1] + .0722 * b[i + 2];
    }
    const pass = changed > 0 && Object.values(captures).every(c => c.phase === 'paused' && c.time === captures.off.time && !c.overflow) && !errors.length;
    rows.push({ width, height, pose, changedPixels: changed, meanRgbDelta: delta / changed, offLuma: offLuma / changed, peakLuma: peakLuma / changed, captures: Object.fromEntries(Object.entries(captures).map(([key, { pixels, ...value }]) => [key, value])), errors, pass });
    await page.close();
  }
  fs.writeFileSync(`${output}/report.json`, JSON.stringify({ scope: 'EXPLICIT_PRESENTATION_LIGHT_OFF_VS_24_PERCENT_PEAK_DIAGNOSTIC_NOT_PRODUCTION_CHANGE_OR_NATURAL_LIGHT_STRENGTH_OR_DIRECTOR_APPROVAL', rows }, null, 2));
  console.log(JSON.stringify(rows)); if (rows.some(row => !row.pass)) process.exitCode = 1;
} finally { await browser.close(); }
