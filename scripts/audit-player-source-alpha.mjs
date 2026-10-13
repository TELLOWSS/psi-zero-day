import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const sharp = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'sharp'));
const sources = [
  ['public/assets/episode01/characters/player-map.webp', 1, 1],
  ['public/assets/survivors/player-walk-eight-v1.png', 8, 8],
  ['public/assets/survivors/player-walk-passing-v1.png', 2, 8],
  ['public/assets/survivors/player-command-eight-v1.png', 2, 4],
  ['public/assets/survivors/player-equipment-check-eight-v1.png', 2, 4],
];
const rows = [];
for (const [file, columns, rowsCount] of sources) {
  const bytes = fs.readFileSync(file), { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cells = [];
  for (let row = 0; row < rowsCount; row++) for (let column = 0; column < columns; column++) {
    const hist = new Array(256).fill(0); let visible = 0, solid = 0, luma = 0;
    for (let y = Math.floor(row * info.height / rowsCount); y < Math.floor((row + 1) * info.height / rowsCount); y++) {
      for (let x = Math.floor(column * info.width / columns); x < Math.floor((column + 1) * info.width / columns); x++) {
        const index = (y * info.width + x) * info.channels, alpha = data[index + 3];
        if (alpha < 32) continue;
        visible++; hist[alpha]++;
        if (alpha >= 192) { solid++; luma += .2126 * data[index] + .7152 * data[index + 1] + .0722 * data[index + 2]; }
      }
    }
    const percentile = fraction => { let count = 0; for (let alpha = 32; alpha < 256; alpha++) { count += hist[alpha]; if (count >= visible * fraction) return alpha; } return null; };
    cells.push({ row, column, visible, solidFraction: solid / visible, alphaP10: percentile(.1), alphaMedian: percentile(.5), alphaP90: percentile(.9), solidMeanLuma: luma / solid });
  }
  rows.push({ file, sha256: createHash('sha256').update(bytes).digest('hex'), width: info.width, height: info.height, cells });
}
fs.mkdirSync('artifacts/player-source-alpha', { recursive: true });
fs.writeFileSync('artifacts/player-source-alpha/report.json', JSON.stringify({ scope: 'READ_ONLY_SOURCE_PIXEL_STATISTICS_NOT_RUNTIME_ALPHA_OR_VISUAL_APPROVAL', rows }, null, 2));
console.log(JSON.stringify(rows.map(row => ({ file: row.file, cells: row.cells.length, medianAlphaMin: Math.min(...row.cells.map(c => c.alphaMedian)), solidFractionMin: Math.min(...row.cells.map(c => c.solidFraction)), solidMeanLumaMin: Math.min(...row.cells.map(c => c.solidMeanLuma)), solidMeanLumaMax: Math.max(...row.cells.map(c => c.solidMeanLuma)) }))));
if (rows.some(row => row.cells.some(cell => !cell.visible))) process.exitCode = 1;
