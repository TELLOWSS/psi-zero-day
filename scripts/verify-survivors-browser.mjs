import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const out = path.resolve(process.env.PSI_SURVIVORS_QA_DIR || 'artifacts/survivors-browser');
fs.mkdirSync(out, {recursive: true});
const report = {status: 'NOT_RUN', baseUrl: process.env.PSI_PREVIEW_URL || 'http://127.0.0.1:4173', rows: [], errors: []};
let browser;
try {
  let playwright;
  try { playwright = require('playwright'); }
  catch {
    const modules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
    if (!modules) throw new Error('Playwright module unavailable; install playwright or set CODEX_PRIMARY_RUNTIME_NODE_MODULES.');
    playwright = require(path.join(modules, 'playwright'));
  }
  browser = await playwright.chromium.launch({headless: true, ...(process.env.CHROME_BIN ? {executablePath: process.env.CHROME_BIN} : {})});
  report.status = 'RUNNING';
  for (const viewport of [{width:360,height:800},{width:390,height:844},{width:844,height:390},{width:1440,height:900}]) {
    const page = await browser.newPage({viewport, hasTouch: true});
    const row = {viewport, status: 'RUNNING', checks: {}, errors: []};
    report.rows.push(row);
    page.on('pageerror', e => row.errors.push(String(e)));
    await page.goto(report.baseUrl, {waitUntil: 'networkidle'});
    await page.getByRole('button', {name:/야간 긴급 순찰/}).click({timeout:30000});
    await page.getByRole('button', {name:'순찰 시작하기', exact:true}).click();
    await page.waitForTimeout(1000);
    row.checks.nonblank = await page.locator('canvas').evaluate(c => {
      const ctx = c.getContext('2d'); const data = ctx.getImageData(0,0,c.width,c.height).data;
      const colors = new Set(); for(let i=0;i<data.length;i+=Math.max(4,Math.floor(data.length/400/4)*4)) colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
      return colors.size > 4;
    });
    await page.keyboard.down('d'); await page.waitForTimeout(800); await page.keyboard.up('d');
    await page.keyboard.press('p');
    row.checks.pause = await page.getByRole('button',{name:'순찰 재개',exact:true}).isVisible();
    await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    row.checks.focusPause = await page.getByRole('button',{name:'순찰 재개',exact:true}).isVisible();
    await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:40,y:viewport.height-110,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:90,y:viewport.height-110,id:1}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    row.checks.touchCancelPause = await page.getByRole('button',{name:'순찰 재개',exact:true}).isVisible();
    await page.getByRole('button',{name:'순찰 재개',exact:true}).click();
    const name = `${viewport.width}x${viewport.height}`;
    await page.screenshot({path:path.join(out,`${name}-playing.png`)});
    row.checks.alertLane = await page.evaluate(() => {
      const hud = document.querySelector('.survivors-hud-top').getBoundingClientRect();
      return [...document.querySelectorAll('.survivors-combo-banner,.survivors-boss-alert,.survivors-evo-banner')].every(e => e.getBoundingClientRect().top >= hud.bottom);
    });
    // No synthetic engine state is injected. These captures document actual visible gameplay.
    row.checks.errorOverlay = await page.locator('vite-error-overlay').count() === 0;
    row.checks.fullGrowthUltimateResult = 'NOT_RUN';
    row.status = Object.values(row.checks).some(v => v === false) || row.errors.length ? 'FAIL' : 'SMOKE_PASS';
    await page.close();
  }
  report.status = report.rows.some(r=>r.status==='FAIL') ? 'FAIL' : 'SMOKE_PASS';
} catch (err) {
  report.errors.push(String(err));
  if (report.status !== 'NOT_RUN') report.status = 'FAIL';
} finally {
  await browser?.close();
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
process.exitCode = report.status === 'SMOKE_PASS' ? 0 : report.status === 'NOT_RUN' ? 2 : 1;
