import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const output = 'artifacts/shield-natural-play'; fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, recordVideo: { dir: `${output}/videos`, size: { width: 390, height: 844 } } });
  const errors = [], samples = [], choices = [], held = new Set();
  page.on('pageerror', error => errors.push(String(error)));
  await page.addInitScript(() => {
    localStorage.setItem('psi.survivors.store_wallet', JSON.stringify({ credits: 1260, inventory: { owned: ['shock_mantle'], equipped: ['shock_mantle'], durability: { shock_mantle: 100 } } }));
    window.shieldFrames = [];
    window.playerAlphaFrames = [];
  });
  await page.route('**/assets/PatrolSurvivorsGame-*.js', async route => {
    const response = await route.fetch(); let body = await response.text();
    const engine = /update\([^)]*\)\{(?=if\(this\.state\.phase!==)/g;
    if ([...body.matchAll(engine)].length !== 1) throw Error('Read-only engine capture unavailable');
    body = body.replace(engine, match => `${match}window.shieldNaturalEngine=this;`);
    const marker = body.indexOf('rgba(3,10,18,.14)'), start = body.lastIndexOf('function ', marker);
    const header = /^function \w+\(([^)]+)\)\{/.exec(body.slice(start));
    if (marker < 0 || !header || header[1].split(',').length !== 4) throw Error('Grounded actor alpha probe unavailable');
    const [ctx, image, height, pose] = header[1].split(',');
    body = body.slice(0, start) + body.slice(start).replace(header[0], header[0] + `if(${image}.src.endsWith('/player-map.webp')&&window.playerAlphaFrames.length<10000)window.playerAlphaFrames.push({time:window.shieldNaturalEngine.state.gameTime,alpha:${ctx}.globalAlpha,composite:${ctx}.globalCompositeOperation,filter:${ctx}.filter,height:${height},action:${pose}.action,reaction:${pose}.reaction,invincible:window.shieldNaturalEngine.state.player.invincibleTime});`);
    const draw = /(\w+)\((\w+),(\w+)\.vfxAtlas,3,(\w+),(\w+)-30,(\w+)\.width,\6\.height,\6\.alpha\)/g;
    if ([...body.matchAll(draw)].length !== 1) throw Error('Actual shield draw capture unavailable');
    body = body.replace(draw, (match, fn, ctx, actor, x, y, visual) => `(window.shieldFrames.length<10000&&window.shieldFrames.push({time:window.shieldNaturalEngine.state.gameTime,shield:window.shieldNaturalEngine.state.premiumGear.shield,...${visual}}),${match})`);
    await route.fulfill({ response, body });
  });
  await page.goto(process.env.PSI_PREVIEW_URL);
  await page.getByRole('button', { name: /시그널 워치.*SURVIVORS/ }).click();
  await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
  await page.waitForFunction(() => window.shieldNaturalEngine?.state.phase === 'playing');
  const release = async () => { for (const key of held) await page.keyboard.up(key); held.clear(); };
  const start = Date.now(), seen = new Set();
  let outcome = 'observation-timeout';
  while (Date.now() - start < Number(process.env.PSI_SHIELD_SECONDS ?? 120) * 1000) {
    const sample = await page.evaluate(() => {
      const s = window.shieldNaturalEngine.state, p = s.player, gear = s.premiumGear;
      const threats = s.hazards.filter(h => h.hp > 0 && h.type !== 'UNHELMETED');
      const nearest = threats.reduce((best, h) => !best || Math.hypot(h.x - p.x, h.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? h : best, null);
      let x = Math.cos(s.gameTime * .3), y = Math.sin(s.gameTime * .3);
      if (nearest && gear.shield > 0 && !window.shieldFrames.some(f => f.phase === 'depleted')) { x = nearest.x - p.x; y = nearest.y - p.y; const n = Math.hypot(x, y) || 1; x /= n; y /= n; }
      else for (const h of threats) { const dx = p.x - h.x, dy = p.y - h.y, n = Math.hypot(dx, dy) || 1; if (n < 220) { x += dx / n * (220 - n) / 35; y += dy / n * (220 - n) / 35; } }
      if (p.x < 90) x += 3; if (p.x > 1310) x -= 3; if (p.y < 90) y += 3; if (p.y > 810) y -= 3;
      return { phase: s.phase, time: s.gameTime, hp: p.hp, shield: gear.shield, cooldown: gear.shieldCooldown,
        hud: document.querySelector('.survivors-premium-live')?.textContent, options: s.perkOptions.map(o => o.id), move: { x, y },
        phases: [...new Set(window.shieldFrames.map(f => f.phase))], overflow: document.documentElement.scrollWidth > innerWidth };
    });
    samples.push(sample);
    for (const phase of sample.phases) if (!seen.has(phase)) { seen.add(phase); await page.screenshot({ path: `${output}/${phase}.png` }); }
    if (['absorb', 'depleted', 'recharge'].every(phase => seen.has(phase)) && sample.shield === 45 && sample.hud?.includes('보호막 45/45')) { outcome = 'natural-event-cycle-observed'; break; }
    if (['defeat', 'victory'].includes(sample.phase)) { outcome = sample.phase; break; }
    if (sample.phase !== 'playing') {
      await release();
      if (sample.phase === 'levelup') { await page.locator('.survivors-perk-card').first().click(); choices.push({ time: sample.time, id: sample.options[0] }); }
    } else {
      const desired = new Set();
      if (Math.abs(sample.move.x) > .2) desired.add(sample.move.x > 0 ? 'ArrowRight' : 'ArrowLeft');
      if (Math.abs(sample.move.y) > .2) desired.add(sample.move.y > 0 ? 'ArrowDown' : 'ArrowUp');
      for (const key of [...held]) if (!desired.has(key)) { await page.keyboard.up(key); held.delete(key); }
      for (const key of desired) if (!held.has(key)) { await page.keyboard.down(key); held.add(key); }
    }
    await page.waitForTimeout(200);
  }
  await release(); await page.waitForTimeout(200);
  const frames = await page.evaluate(() => window.shieldFrames);
  const playerAlpha = await page.evaluate(() => window.playerAlphaFrames);
  const final = await page.evaluate(() => ({ shield: window.shieldNaturalEngine.state.premiumGear.shield, hud: document.querySelector('.survivors-premium-live')?.textContent }));
  const matched = s => s.hud?.includes(`보호막 ${Math.ceil(s.shield)}/45`);
  const hudMatches = { total: samples.filter(matched).length, partial: samples.some(s => s.shield > 0 && s.shield < 45 && matched(s)), depleted: samples.some(s => s.shield === 0 && matched(s)), final: matched(final) };
  const pass = outcome === 'natural-event-cycle-observed' && hudMatches.partial && hudMatches.depleted && hudMatches.final && !errors.length && !samples.some(s => s.overflow);
  const video = page.video(); await page.close(); await video.saveAs(`${output}/natural-cycle.webm`);
  fs.writeFileSync(`${output}/report.json`, JSON.stringify({ scope: 'SEEDED_OWNED_GEAR_SAVE_UI_INPUT_BOT_READ_ONLY_ENGINE_NATURAL_COLLISION_NOT_FRESH_PURCHASE_OR_DEVICE_OR_LISTENING_APPROVAL', outcome, samples, frames, playerAlpha, choices, final, hudMatches, errors, pass }, null, 2));
  console.log(JSON.stringify({ outcome, count: samples.length, phases: [...seen], hudMatches, errors, pass }));
  if (!pass) process.exitCode = 1;
} finally { await browser.close(); }
