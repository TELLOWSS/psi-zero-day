import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const record = JSON.parse(fs.readFileSync('docs/branding/candidates/BR-LOGO-02.json', 'utf8'));
if (record.runtimeConnected || record.directorFileApproval) throw new Error('Requires unapproved candidate');
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const output = 'artifacts/brand-vector-candidate';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  let html = '<style>body{margin:0;font:14px Arial}section{padding:24px;display:grid;gap:24px}section.ink{background:#f4f7f6;color:#161a1d}section.chalk{background:#161a1d;color:#eaf2f1}figure{margin:0}img{display:block}figcaption{margin-top:8px}</style>';
  for (const tone of ['ink', 'chalk']) {
    html += `<section class="${tone}">`;
    for (const kind of ['wordmark', 'wordmark-wide', 'symbol']) {
      const file = record.files.find(file => file.kind === kind && file.tone === tone);
      const bytes = fs.readFileSync(file.svg);
      if (createHash('sha256').update(bytes).digest('hex') !== file.svgSha256) throw new Error('File hash mismatch');
      for (const width of kind.startsWith('wordmark') ? [640, 320, 240] : [48, 24, 16]) {
        html += `<figure><img data-kind="${kind}" data-tone="${tone}" width="${width}" alt="Unapproved ${kind}" src="data:image/svg+xml;base64,${bytes.toString('base64')}"><figcaption>${kind} ${width}px / ${tone}</figcaption></figure>`;
      }
    }
    html += '</section>';
  }
  await page.setContent(html);
  const rows = await page.locator('img').evaluateAll(async images => {
    const rows = [];
    for (const image of images) {
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0, transparent = 0, edgeInk = 0, textInk = 0;
      for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
        const a = pixels[(y * canvas.width + x) * 4 + 3];
        if (a === 0) transparent++;
        if (a >= 128) {
          ink++;
          if (!x || !y || x === canvas.width - 1 || y === canvas.height - 1) edgeInk++;
          if (x > canvas.width * 112 / 460) textInk++;
        }
      }
      rows.push({ kind: image.dataset.kind, tone: image.dataset.tone, width: image.width, height: image.height, ink, transparent, edgeInk, textInk,
        pass: ink > 0 && transparent > ink && edgeInk === 0 && (!image.dataset.kind.startsWith('wordmark') || textInk > ink / 2) });
    }
    return rows;
  });
  await page.screenshot({ path: `${output}/sizes-and-tones.png`, fullPage: true });
  const slotRows = [];
  if (process.env.PSI_PREVIEW_URL) {
    for (const [width, height] of [[1440, 900], [390, 844], [844, 390], [1024, 768]]) {
      const landscapePhone = width > height && height <= 460;
      const file = record.files.find(file => file.kind === (landscapePhone ? 'wordmark-wide' : 'wordmark') && file.tone === 'chalk');
      const imageUri = `data:image/svg+xml;base64,${fs.readFileSync(file.svg).toString('base64')}`;
      const slotPage = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const slotErrors = [];
      slotPage.on('pageerror', error => slotErrors.push(String(error)));
      await slotPage.goto(process.env.PSI_PREVIEW_URL);
      await slotPage.locator('.commercial-title-logo').waitFor();
      await slotPage.evaluate(() => document.fonts.ready);
      await slotPage.waitForTimeout(1300);
      await slotPage.screenshot({ path: `${output}/${width}x${height}-existing.png`, fullPage: true });
      const baseline = await slotPage.locator('.commercial-title-logo').boundingBox();
      await slotPage.locator('.commercial-title-logo').evaluate(async (element, uri) => {
        const image = document.createElement('img');
        image.src = uri; image.alt = ''; image.setAttribute('aria-hidden', 'true');
        const portraitPhone = innerWidth <= 600 && innerWidth < innerHeight;
        const landscapePhone = innerWidth > innerHeight && innerHeight <= 460;
        image.style.cssText = `display:block;width:${portraitPhone ? 'calc(100% - 144px)' : '100%'};max-width:${landscapePhone ? 420 : 460}px;height:auto;object-fit:contain`;
        element.replaceChildren(image);
        await image.decode();
      }, imageUri);
      const metrics = await slotPage.evaluate(() => {
        const box = selector => { const b = document.querySelector(selector).getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height }; };
        const candidate = box('.commercial-title-logo img');
        const primary = box('.is-survivors-entry');
        const actor = box('.commercial-title-mobile-player');
        const intersects = (a, b) => a.width > 0 && b.width > 0 && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        return { candidate, primary, actor,
          candidateWithinViewport: candidate.left >= 0 && candidate.top >= 0 && candidate.right <= innerWidth && candidate.bottom <= innerHeight,
          primaryWithinViewport: primary.top >= 0 && primary.bottom <= innerHeight,
          candidateActorElementOverlap: intersects(candidate, actor),
          candidateActionOverlap: intersects(candidate, primary),
          accessibleName: document.querySelector('.commercial-title-logo').getAttribute('aria-label'),
          overflow: document.documentElement.scrollWidth > innerWidth };
      });
      await slotPage.screenshot({ path: `${output}/${width}x${height}-candidate-browser-only.png`, fullPage: true });
      const layoutPass = metrics.candidateWithinViewport && metrics.primaryWithinViewport && !metrics.candidateActorElementOverlap && !metrics.candidateActionOverlap && !metrics.overflow && metrics.accessibleName === 'NEW PSI : ZERO DAY' && !slotErrors.length;
      slotRows.push({ width, height, candidateFile: file.svg, baseline, ...metrics, layoutPass, errors: slotErrors, scope: 'BROWSER_ONLY_DOM_SUBSTITUTION_NOT_RUNTIME_CHANGE_OR_ART_APPROVAL' });
      await slotPage.close();
    }
  }
  fs.writeFileSync(`${output}/report.json`, JSON.stringify({ candidate: record.id, scope: 'RENDER_AND_PIXEL_VALIDATION_NOT_DIRECTOR_VISUAL_APPROVAL', rows, errors, slotRows, productionApproved: false }, null, 2));
  console.log(JSON.stringify(rows));
  if (errors.length || rows.some(row => !row.pass) || slotRows.some(row => !row.layoutPass)) process.exitCode = 1;
} finally { await browser.close(); }
