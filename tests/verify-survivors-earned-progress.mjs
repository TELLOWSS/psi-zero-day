import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const source = JSON.parse(fs.readFileSync(process.env.PSI_EARNED_REPORT ?? 'artifacts/natural-progression/brand-b0-extended/report.json', 'utf8'));
if (source.outcome !== 'victory' || !source.last.bossNeutralized || !source.technicalPass) {
  throw new Error('A genuine UI-input victory report is required');
}
const wallet = JSON.parse(source.finalStorage['psi.survivors.store_wallet']);
const copy = JSON.parse(fs.readFileSync('content/localization/survivors-store-ko.json', 'utf8'));
const url = process.env.PSI_PREVIEW_URL;
if (!url) throw new Error('Set PSI_PREVIEW_URL');
const output = 'artifacts/earned-progress';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN, args: ['--renderer-process-limit=1'] });
const rows = [];
try {
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390], [1024, 768]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.addInitScript(saved => {
      if (!localStorage.getItem('qa.earned-progress')) {
        for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value);
        localStorage.setItem('qa.earned-progress', 'restored');
      }
    }, source.finalStorage);
    await page.goto(url);
    const enter = () => page.getByRole('button', { name: /시그널 워치.*SURVIVORS/ }).click();
    await enter();
    const preview = page.locator('.survivors-stage-preview');
    await preview.waitFor();
    const expected = '/assets/survivors/excavation-ground-v3.webp';
    if (await preview.getAttribute('src') !== expected) throw new Error('Earned next stage was not prepared');
    await page.getByRole('button', { name: copy.shopEntry, exact: true }).click();
    const balance = page.locator('.survivors-toolbar-wallet');
    if (!(await balance.textContent()).includes(`${wallet.credits.toLocaleString('en-US')} PSI`)) throw new Error('Earned wallet mismatch');
    await page.screenshot({ path: `${output}/${width}x${height}.png` });
    await page.reload();
    await enter();
    await preview.waitFor();
    if (await preview.getAttribute('src') !== expected) throw new Error('Reload lost next stage');
    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('psi.survivors.store_wallet')));
    if (JSON.stringify(restored) !== JSON.stringify(wallet)) throw new Error('Reload changed earned wallet');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    rows.push({ width, height, credits: restored.credits, nextStage: 'stage_02', overflow, errors, pass: !overflow && !errors.length });
    await page.close();
  }
  const report = { scope: 'Restored exported storage from genuine UI-input victory; new browser contexts, not continuous original session', url, rows };
  fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (rows.some(row => !row.pass)) process.exitCode = 1;
} finally {
  await browser.close();
}
