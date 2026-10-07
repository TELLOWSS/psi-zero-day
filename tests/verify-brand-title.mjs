import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const url = process.env.PSI_PREVIEW_URL;
if (!url) throw new Error('Set PSI_PREVIEW_URL');
const output = 'artifacts/brand-title';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN, args: ['--renderer-process-limit=1'] });
const rows = [];
try {
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390], [1024, 768]]) {
    const page = await browser.newPage({ viewport: { width, height } }), errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2000);
    const descriptor = page.locator('.commercial-title-english');
    await descriptor.waitFor({ state: 'attached' });
    const visible = await descriptor.isVisible();
    if (!visible && !(width > height && height <= 560)) throw new Error('Descriptor unexpectedly hidden');
    if (await descriptor.textContent() !== '오늘도 무사히 · 위험을 읽고 현장을 지킨다') throw new Error('Localized descriptor missing');
    if (await page.locator('.commercial-title-logo').getAttribute('aria-label') !== 'NEW PSI : ZERO DAY') throw new Error('Official title missing');
    const fits = await descriptor.evaluate(element => element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    await page.screenshot({ path: `${output}/${width}x${height}.png` });
    await page.locator('.is-defense-entry').click();
    await page.locator('.mode-preview-dialog').waitFor();
    if (await page.locator('[data-defense-screen],.zb-shell').count()) throw new Error('Unreleased defense launched');
    rows.push({ width, height, visible, fits, overflow, errors, pass: fits && !overflow && !errors.length });
    await page.close();
  }
  fs.writeFileSync(`${output}/report.json`, JSON.stringify({ url, rows }, null, 2));
  console.log(JSON.stringify(rows));
  if (rows.some(row => !row.pass)) process.exitCode = 1;
} finally { await browser.close(); }
