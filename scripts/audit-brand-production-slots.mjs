import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const url = process.env.PSI_PREVIEW_URL;
if (!url) throw new Error('Set PSI_PREVIEW_URL');
const output = 'artifacts/brand-production-slots';
fs.mkdirSync(output, { recursive: true });
const rows = [];
const contract = JSON.parse(fs.readFileSync('content/branding/production-slots-v1.json', 'utf8'));
const approval = JSON.parse(fs.readFileSync(contract.approvedBrandFiles, 'utf8'));
if (approval.decision !== 'DESIGN_AND_FILES_APPROVED_APPLY_AFTER_VERIFICATION') throw new Error('Brand file approval is missing');
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
try {
  const views = [[1440, 900], [390, 844], [844, 390], [1024, 768]].flatMap(([width, height]) => ['light', 'dark'].map(colorScheme => ({ width, height, colorScheme })));
  for (const { width, height, colorScheme } of views) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce', colorScheme });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(url);
    await page.locator('.commercial-title-home').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const images = [];
    for (const { id, selector, uri, width: expectedWidth, height: expectedHeight, fit } of contract.slots) {
      const locator = page.locator(selector);
      await locator.waitFor({ state: 'attached' });
      await locator.evaluate(async image => { if (!image.complete) await image.decode(); });
      const metadata = await locator.evaluate(image => {
        const rect = image.getBoundingClientRect(), style = getComputedStyle(image);
        return {
          uri: new URL(image.currentSrc).pathname,
          naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
          box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          objectFit: style.objectFit, objectPosition: style.objectPosition,
          transform: style.transform, opacity: style.opacity,
          loaded: image.complete && image.naturalWidth > 0,
        };
      });
      const file = path.resolve('public', metadata.uri.replace(/^\//, ''));
      const publicRoot = path.resolve('public') + path.sep;
      if (!file.startsWith(publicRoot)) throw new Error(`Asset escapes public directory: ${id}`);
      if (!fs.existsSync(file)) throw new Error(`No local delivery file for ${id}: ${metadata.uri}`);
      const matchesContract = metadata.uri === uri && metadata.naturalWidth === expectedWidth &&
        metadata.naturalHeight === expectedHeight && metadata.objectFit === fit;
      images.push({ id, ...metadata, matchesContract, visible: await locator.isVisible(),
        bytes: fs.statSync(file).size, sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
    }
    await page.locator('.commercial-title-wordmark img').evaluate(image => image.decode());
    const wordmark = await page.locator('.commercial-title-logo').evaluate(element => {
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
      const image = element.querySelector('img');
      return { type: 'DIRECTOR_APPROVED_FILE_REQUIRES_RUNTIME_VERIFICATION', uri: new URL(image.currentSrc).pathname,
        naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
        accessibleName: element.getAttribute('aria-label'), fontFamily: style.fontFamily,
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
    });
    const icon = await page.locator('link[rel="icon"]').evaluateAll(elements => elements.map(element => ({ uri: new URL(element.href).pathname, media: element.media, matches: matchMedia(element.media).matches })));
    const brandFiles = [];
    for (const uri of [wordmark.uri, ...icon.map(item => item.uri)]) {
      const expected = approval.approvedRuntimeFiles.find(file => file.uri === uri);
      if (!expected) throw new Error(`Unapproved brand delivery: ${uri}`);
      const response = await page.request.get(new URL(uri, url).href);
      const bytes = await response.body();
      const sha256 = createHash('sha256').update(bytes).digest('hex');
      brandFiles.push({ uri, sha256, matchesApproval: response.ok() && sha256 === expected.sha256 });
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    await page.screenshot({ path: `${output}/${width}x${height}-${colorScheme}-title.png`, fullPage: true });
    const expectedWordmark = approval.approvedRuntimeFiles.find(file => file.uri === wordmark.uri);
    const pass = images.every(image => image.loaded && image.matchesContract) && brandFiles.every(file => file.matchesApproval) &&
      wordmark.accessibleName === 'NEW PSI : ZERO DAY' && wordmark.naturalWidth === expectedWordmark.width && wordmark.naturalHeight === expectedWordmark.height &&
      icon.length === 2 && icon.filter(item => item.matches).length === 1 && !overflow && !errors.length;
    rows.push({ width, height, colorScheme, images, wordmark, icon, brandFiles, overflow, errors, pass });
    await page.close();
  }
  const identities = new Map();
  for (const row of rows) for (const image of row.images) {
    const key = `${image.uri}:${image.sha256}`;
    if (identities.has(image.id) && identities.get(image.id) !== key) throw new Error(`Viewport asset identity drift: ${image.id}`);
    identities.set(image.id, key);
  }
  fs.writeFileSync(`${output}/report.json`, JSON.stringify({
    url, scope: 'ACTUAL_DOM_SLOT_AND_LOCAL_BINARY_AUDIT_NOT_ART_OR_RIGHTS_APPROVAL', rows,
  }, null, 2));
  console.log(JSON.stringify(rows.map(({ width, height, pass, images, wordmark, icon }) => ({
    width, height, pass, wordmark, icon,
    images: images.map(({ id, uri, naturalWidth, naturalHeight, box, visible, objectFit, objectPosition }) =>
      ({ id, uri, naturalWidth, naturalHeight, box, visible, objectFit, objectPosition })),
  }))));
  if (rows.some(row => !row.pass)) process.exitCode = 1;
} finally { await browser.close(); }
