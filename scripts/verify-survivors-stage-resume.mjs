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
  const cases = [[1440, 900], [390, 844], [844, 390], [1024, 768]]
    .flatMap(([width, height]) => [false, true].map(completed => ({ width, height, completed })));
  for (const { width, height, completed } of cases) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    console.log(`Checking ${width}x${height}, completed=${completed}`);
    await page.addInitScript(completed => {
      localStorage.setItem('psi.survivors.unlocked_stages', JSON.stringify(['stage_01', 'stage_14']));
      localStorage.setItem('psi.survivors.last_played_stage', 'stage_14');
      if (completed) localStorage.setItem('psi.survivors.stage_stars', JSON.stringify({ stage_14: [true, false, false] }));
    }, completed);
    await page.goto(process.env.PSI_PREVIEW_URL||'http://127.0.0.1:5196', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /시그널 워치.*SURVIVORS/ }).click();
    await page.waitForSelector('.survivors-stage-preview');
    const preview = await page.locator('.survivors-stage-preview').getAttribute('src');
    const uniqueMaps = JSON.parse(fs.readFileSync('content/design/survivors-stage-backgrounds-v1.json', 'utf8'));
    const expectedMap = completed ? '/assets/survivors/maps/scaffold-v1.png' : uniqueMaps.stage_14;
    if (preview !== expectedMap) throw new Error(`Wrong restored map: ${preview}`);
    await page.screenshot({ path: path.join(output, `${width}x${height}-${completed ? 'completed' : 'unfinished'}.png`) });
    // Use the localized primary launch control rather than mutating the engine.
    const launchButton = page.locator('.survivors-ready-launch .survivors-btn-primary');
    await launchButton.click();
    await page.keyboard.press('KeyP');
    await page.getByRole('button', { name: '메인으로 나가기', exact: true }).click();
    await page.getByRole('button', { name: /시그널 워치.*SURVIVORS/ }).click();
    if (await page.locator('.survivors-stage-preview').getAttribute('src') !== preview) throw new Error('Exit lost played map');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    results.push({ width, height, completed, scope: 'Explicit saved-progress fixture; real UI launch, exit and reentry, not natural victory', preview, overflow, errors, pass: !overflow && !errors.length });
    await page.close();
  }
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
  if (results.some(result => !result.pass)) process.exitCode = 1;
} finally { await browser.close(); }
