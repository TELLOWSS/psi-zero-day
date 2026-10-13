import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';

const [file, columnsArg, rowsArg, marginArg = '0.1'] = process.argv.slice(2);
const columns = Number(columnsArg), rows = Number(rowsArg), margin = Number(marginArg);
if (!file || !Number.isInteger(columns) || columns < 1 || !Number.isInteger(rows) || rows < 1 || !Number.isFinite(margin) || margin < 0 || margin >= 0.5) {
  throw new Error('Usage: node scripts/verify-survivors-animation-candidate.mjs IMAGE COLUMNS ROWS [MARGIN]');
}
const require = createRequire(import.meta.url);
const {chromium} = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
const browser = await chromium.launch({headless: true, executablePath: process.env.CHROME_BIN});
try {
  const page = await browser.newPage();
  const report = await page.evaluate(async ({src, columns, rows, margin}) => {
    const image = new Image(); image.src = src; await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const cells = [], cw = canvas.width / columns, ch = canvas.height / rows;
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const x0 = Math.round(column * cw), y0 = Math.round(row * ch);
      const width = Math.round((column + 1) * cw) - x0, height = Math.round((row + 1) * ch) - y0;
      const pixels = ctx.getImageData(x0, y0, width, height).data;
      let visible = 0, edgePixels = 0, minX = width, minY = height, maxX = -1, maxY = -1;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        // Ignore negligible glow, but reject visible material crossing the cell safety margin.
        if (pixels[(y * width + x) * 4 + 3] <= 16) continue;
        visible++; minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        if (x < width * margin || x >= width * (1 - margin) || y < height * margin || y >= height * (1 - margin)) edgePixels++;
      }
      let fingerprint = 2166136261;
      for (const value of pixels) fingerprint = Math.imul(fingerprint ^ value, 16777619) >>> 0;
      const hash = fingerprint.toString(16).padStart(8, '0');
      cells.push({row, column, visible, edgePixels, bounds: [minX, minY, maxX, maxY], hash, pass: visible > 20 && edgePixels === 0});
    }
    const distinct = new Set(cells.map(c => c.hash)).size;
    return {width: canvas.width, height: canvas.height, columns, rows, margin, cells, distinct,
      technicalPass: cells.every(c => c.pass) && distinct === cells.length,
      visualApproval: false, note: 'Distinct pixel hashes do not prove correct gait, consistent anchors, or natural animation. Human visual review remains required.'};
  }, {src: `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`, columns, rows, margin});
  const destination = path.resolve(`${file}.qa.json`);
  fs.writeFileSync(destination, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({file, destination, ...report}));
  if (!report.technicalPass) process.exitCode = 1;
} finally { await browser.close(); }
