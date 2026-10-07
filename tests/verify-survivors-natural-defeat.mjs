import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const url = process.env.PSI_PREVIEW_URL;
if (!url) throw new Error('Set PSI_PREVIEW_URL');
const copy = JSON.parse(fs.readFileSync('content/localization/survivors-result-ko.json', 'utf8'));
const output = 'artifacts/natural-defeat';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN, args: ['--renderer-process-limit=1'] });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(url);
  const initialStorage = await page.evaluate(() => ({ ...localStorage }));
  const enter = () => page.getByRole('button', { name: /시그널 워치.*SURVIVORS/ }).click();
  await enter();
  await page.locator('.survivors-ready-launch .survivors-btn-primary').click();
  const started = Date.now(), defeat = page.locator('.survivors-result-dialog[data-outcome="defeat"]');
  while (Date.now() - started < 90000 && !await defeat.isVisible()) {
    const option = page.locator('.survivors-perk-card').first();
    if (await option.isVisible()) await option.click();
    await page.waitForTimeout(250);
  }
  if (!await defeat.isVisible()) throw new Error('Stationary UI play did not reach defeat within 90 seconds');
  if (await defeat.locator('#survivors-result-title').textContent() !== copy.dangerTitle) throw new Error('Defeat title differs from approved copy');
  if (!(await defeat.textContent()).includes(copy.defeat_description)) throw new Error('Defeat description missing');
  await page.waitForTimeout(250);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('psi.survivors.store_wallet')));
  if (!saved || !Number.isFinite(saved.credits)) throw new Error('Defeat did not save credits');
  const reward = await defeat.locator('.survivors-result-reward strong').textContent();
  if (reward !== `+${saved.credits.toLocaleString('en-US')} PSI`) throw new Error('Defeat reward and new wallet differ');
  await page.screenshot({ path: `${output}/defeat.png` });
  await defeat.getByRole('button', { name: copy.retry_ready, exact: true }).click();
  const preview = page.locator('.survivors-stage-preview');
  const expected = '/assets/survivors/stage-01-ground-v2.webp';
  if (await preview.getAttribute('src') !== expected) throw new Error('Retry did not prepare the failed stage');
  await page.reload();
  await enter();
  await preview.waitFor();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('psi.survivors.store_wallet')));
  if (JSON.stringify(restored) !== JSON.stringify(saved) || await preview.getAttribute('src') !== expected) throw new Error('Reload changed credits or failed stage');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  const report = { scope: 'Fresh browser storage; stationary actual UI play and level-up clicks only, no engine mutation', url, initialStorage, elapsedMs: Date.now() - started, credits: saved.credits, reward, retryStage: 'stage_01', restored: true, overflow, errors, pass: !overflow && !errors.length };
  fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (!report.pass) process.exitCode = 1;
} finally { await browser.close(); }
