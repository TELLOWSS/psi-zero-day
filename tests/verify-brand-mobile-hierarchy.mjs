import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const url = process.env.PSI_PREVIEW_URL;
if (!url) throw new Error('Set PSI_PREVIEW_URL');
const output = 'artifacts/brand-mobile-hierarchy';
fs.mkdirSync(output, { recursive: true });
const rows = [];
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN });
try {
  for (const [width, height] of [[1440, 900], [1024, 768], [390, 844], [360, 640], [320, 568], [430, 932], [844, 390], [740, 360]]) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
      const errors = [];
      page.on('pageerror', error => errors.push(String(error)));
      await page.goto(url);
      await page.locator('.commercial-title-home').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.commercial-title-worker[data-character="player"] img').evaluate(async image => { if (!image.complete) await image.decode(); });
      await page.waitForTimeout(1300);
      const portrait = width <= 600 && width < height;
      const result = await page.evaluate(portrait => {
        const box = element => { const b = element.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height }; };
        const intersects = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const image = document.querySelector(portrait ? '.commercial-title-mobile-player' : '.commercial-title-worker[data-character="player"] img');
        const imageBox = box(image), loaded = image.complete && image.naturalWidth > 0;
        const primary = box(document.querySelector('.is-survivors-entry'));
        const dashboard = box(document.querySelector('.commercial-triad-dashboard'));
        const actions = [...document.querySelectorAll('.commercial-title-actions button')].map(element => ({ text: element.textContent, ...box(element) }));
        let alphaBounds = null;
        if (portrait && loaded && imageBox.width > 0) {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          let left = canvas.width, top = canvas.height, right = 0, bottom = 0;
          for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
            if (pixels[(y * canvas.width + x) * 4 + 3] < 32) continue;
            left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x + 1); bottom = Math.max(bottom, y + 1);
          }
          const scale = Math.min(imageBox.width / canvas.width, imageBox.height / canvas.height);
          const x = imageBox.left + (imageBox.width - canvas.width * scale) / 2;
          const y = imageBox.top + imageBox.height - canvas.height * scale;
          alphaBounds = { left: x + left * scale, top: y + top * scale, right: x + right * scale, bottom: y + bottom * scale };
        }
        const texts = [...document.querySelectorAll('.commercial-title-wordmark img,.commercial-title-copy h1,.commercial-title-english')].filter(element => element.getBoundingClientRect().height > 0).map(box);
        const actorClear = !portrait || alphaBounds && alphaBounds.left >= 0 && alphaBounds.top >= 0 && alphaBounds.right <= innerWidth && alphaBounds.bottom <= innerHeight && !texts.some(b => intersects(alphaBounds, b)) && !actions.some(b => intersects(alphaBounds, b));
        const readyFit = primary.top >= 0 && primary.bottom <= innerHeight && primary.height >= 44;
        const actionFit = actions.every(b => b.left >= 0 && b.right <= innerWidth && b.height >= 44);
        const summaryVisible = dashboard.height > 0;
        const dashboardAfterActions = summaryVisible ? dashboard.top >= actions.at(-1).bottom :
          Boolean(document.querySelector('.commercial-title-actions').compareDocumentPosition(document.querySelector('.commercial-triad-dashboard')) & Node.DOCUMENT_POSITION_FOLLOWING);
        return { loaded, identity: new URL(image.currentSrc).pathname, imageBox, alphaBounds, actorClear, primary, readyFit, actionFit, summaryVisible, dashboardAfterActions,
          overflow: document.documentElement.scrollWidth > innerWidth };
      }, portrait);
      await page.screenshot({ path: `${output}/${width}x${height}-${reducedMotion}.png` });
      await page.locator('.is-defense-entry').click();
      await page.locator('.mode-preview-dialog').waitFor();
      const defenseLocked = await page.locator('[data-defense-screen],.zb-shell').count() === 0;
      await page.getByRole('button', { name: '프리뷰 닫기' }).click();
      await page.locator('.is-story-entry').click();
      await page.locator('.mode-preview-dialog.is-story').waitFor();
      const storyLocked = await page.locator('.title-screen-commercial').count() === 0;
      await page.getByRole('button', { name: '프리뷰 닫기' }).click();
      // A fresh navigation also checks the actual playable route without mutating an engine state.
      await page.goto(url);
      await page.getByRole('button', { name: /시그널 워치.*SURVIVORS/ }).click();
      await page.locator('.survivors-ready-dialog').waitFor();
      const playableReady = await page.locator('.survivors-ready-launch .survivors-btn-primary').isVisible();
      rows.push({ width, height, reducedMotion, ...result, defenseLocked, storyLocked, playableReady, errors,
        pass: Boolean(result.loaded && result.identity === '/assets/episode01/characters/player-map.webp' && result.actorClear && result.readyFit && result.actionFit && result.dashboardAfterActions && !result.overflow && defenseLocked && storyLocked && playableReady && !errors.length) });
      await page.close();
    }
  }
  fs.writeFileSync(`${output}/report.json`, JSON.stringify({ url, scope: 'FRESH_SAVE_ACTUAL_UI_ALPHA_BOUNDS_NOT_DIRECTOR_ART_APPROVAL_OR_DEVICE_TEST', rows }, null, 2));
  console.log(JSON.stringify(rows));
  if (rows.some(row => !row.pass)) process.exitCode = 1;
} finally { await browser.close(); }
