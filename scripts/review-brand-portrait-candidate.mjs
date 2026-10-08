import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const url = process.env.PSI_PREVIEW_URL;
if (!url) throw new Error('Set PSI_PREVIEW_URL');
const record = JSON.parse(fs.readFileSync('docs/branding/candidates/BR-ART-01-player-portrait-r1.json', 'utf8'));
const bytes = fs.readFileSync(record.file);
if (createHash('sha256').update(bytes).digest('hex') !== record.sha256) throw new Error('Candidate hash mismatch');
if (record.runtimeConnected || record.directorFileApproval) throw new Error('This review requires an unconnected candidate');
const output = 'artifacts/brand-portrait-candidate';
fs.mkdirSync(output, { recursive: true });
const rows = [];
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
try {
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390], [1024, 768]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    // Browser-only substitution tests the real slot crop without touching runtime delivery files.
    await page.route('**/assets/episode01/hires/night-pour-hero.webp', route =>
      route.fulfill({ status: 200, contentType: 'image/png', body: bytes }));
    await page.goto(url);
    const image = page.locator('.commercial-title-backdrop');
    await image.waitFor({ state: 'attached' });
    await image.evaluate(async element => { if (!element.complete) await element.decode(); });
    await page.evaluate(() => document.fonts.ready);
    const crop = await image.evaluate(element => {
      const box = element.getBoundingClientRect(), style = getComputedStyle(element);
      return { naturalWidth: element.naturalWidth, naturalHeight: element.naturalHeight,
        box: { x: box.x, y: box.y, width: box.width, height: box.height },
        fit: style.objectFit, position: style.objectPosition };
    });
    await page.screenshot({ path: `${output}/${width}x${height}-candidate-in-existing-slot.png`, fullPage: true });
    rows.push({ width, height, crop, errors,
      captureComplete: crop.naturalWidth === record.width && crop.naturalHeight === record.height && !errors.length });
    await page.close();
  }
  fs.writeFileSync(`${output}/report.json`, JSON.stringify({ url, candidate: record.id,
    scope: 'BROWSER_ONLY_CANDIDATE_SUBSTITUTION_NOT_RUNTIME_DEPLOYMENT_OR_VISUAL_APPROVAL', rows }, null, 2));
  console.log(JSON.stringify(rows));
  if (rows.some(row => !row.captureComplete)) process.exitCode = 1;
} finally { await browser.close(); }
