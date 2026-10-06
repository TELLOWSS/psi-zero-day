import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const output = path.resolve('artifacts/stage-resume');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
const results = [];
try {
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    console.log(`Checking ${width}x${height}`);
    await page.goto('http://127.0.0.1:5196', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('psi.survivors.unlocked_stages', JSON.stringify(['stage_01', 'stage_14']));
      localStorage.setItem('psi.survivors.last_played_stage', 'stage_14');
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /야간 긴급 순찰/ }).click();
    await page.waitForSelector('.survivors-stage-preview');
    const preview = await page.locator('.survivors-stage-preview').getAttribute('src');
    if (!preview.includes('14')) throw new Error(`Wrong restored map: ${preview}`);
    await page.screenshot({ path: path.join(output, `${width}x${height}.png`) });
    // Use the localized primary launch control rather than mutating the engine.
    const launchButton = page.locator('.survivors-ready-launch .survivors-btn-primary');
    await launchButton.click();
    await page.keyboard.press('KeyP');
    await page.getByRole('button', { name: '메인으로 나가기', exact: true }).click();
    await page.getByRole('button', { name: /야간 긴급 순찰/ }).click();
    if (await page.locator('.survivors-stage-preview').getAttribute('src') !== preview) throw new Error('Exit lost played map');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    results.push({ width, height, preview, overflow, errors, pass: !overflow && !errors.length });
    await page.close();
  }
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
  if (results.some(result => !result.pass)) process.exitCode = 1;
} finally { await browser.close(); }
