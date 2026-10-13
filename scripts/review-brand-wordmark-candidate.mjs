import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const record = JSON.parse(fs.readFileSync('docs/branding/candidates/BR-LOGO-01-wordmark-r1.json', 'utf8'));
const bytes = fs.readFileSync(record.file);
if (createHash('sha256').update(bytes).digest('hex') !== record.sha256) throw new Error('Candidate hash mismatch');
if (record.runtimeConnected || record.directorFileApproval) throw new Error('Requires unconnected unapproved candidate');
const output = 'artifacts/brand-wordmark-candidate';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 950 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const imageUri = `data:image/png;base64,${bytes.toString('base64')}`;
  await page.setContent(`<style>body{margin:0;font:14px Arial;background:#d9e4e6;color:#161a1d}section{padding:20px;display:grid;gap:18px}section.dark{background:#161a1d;color:#eaf2f1}figure{margin:0}img{display:block;max-width:100%;height:auto}figcaption{margin-top:4px}</style>${['light','dark'].map(theme => `<section class="${theme}">${[640,320,240].map(width => `<figure><img src="${imageUri}" width="${width}" alt="Unapproved wordmark candidate"><figcaption>${width}px / ${theme} surround / white plate</figcaption></figure>`).join('')}</section>`).join('')}`);
  await page.locator('img').first().evaluate(image => image.decode());
  const measured = await page.locator('img').first().evaluate(image => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0, ink = 0, left = canvas.width, top = canvas.height, right = 0, bottom = 0;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (pixels[i + 3] < 255) transparent++;
      if (pixels[i + 3] >= 128 && Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) < 80) {
        ink++; left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
      }
    }
    return { width: canvas.width, height: canvas.height, transparent, ink, inkBounds: { left, top, right, bottom } };
  });
  await page.screenshot({ path: `${output}/size-and-surround.png`, fullPage: true });
  const report = { candidate: record.id, scope: 'MEASUREMENT_AND_CAPTURE_NOT_FILE_APPROVAL', measured, errors,
    captureComplete: measured.ink > 0 && !errors.length, productionEligible: false,
    transparentDelivery: measured.transparent > 0, independentIconReview: 'NOT_RUN_NO_DELIVERY_FILE', assessment: record.assessment };
  fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (!report.captureComplete) process.exitCode = 1;
} finally { await browser.close(); }
