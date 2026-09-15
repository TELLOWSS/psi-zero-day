import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const briefPath = path.join(root, 'content/episode01/production-art-batch-a.json');
const brief = JSON.parse(await readFile(briefPath, 'utf8'));

async function inspect(asset) {
  const absolutePath = path.join(root, 'public', asset.path);
  let bytes;
  try {
    bytes = await readFile(absolutePath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { asset, status: 'MISSING', detail: `public/${asset.path}` };
    }
    throw error;
  }

  if (!isWebP(bytes)) {
    return { asset, status: 'INVALID', detail: 'not a WebP file' };
  }

  const dimensions = webPDimensions(bytes);
  if (!dimensions) {
    return { asset, status: 'INVALID', detail: 'unreadable WebP dimensions' };
  }

  const minimum = asset.minimum_size;
  if (dimensions.width < minimum.width || dimensions.height < minimum.height) {
    return {
      asset,
      status: 'TOO_SMALL',
      detail: `${dimensions.width}x${dimensions.height}; requires at least ${minimum.width}x${minimum.height}`,
    };
  }

  const hasAlpha = webPHasAlpha(bytes);
  if (asset.transparent_background === true && hasAlpha !== true) {
    return {
      asset,
      status: 'NO_ALPHA',
      detail: `${dimensions.width}x${dimensions.height}; transparent character background required`,
    };
  }

  const alphaDetail = asset.transparent_background === true ? ', alpha' : '';
  return {
    asset,
    status: 'READY',
    detail: `${dimensions.width}x${dimensions.height}${alphaDetail}, ${bytes.length.toLocaleString('en-US')} bytes`,
  };
}

const results = [];
for (const asset of brief.assets) results.push(await inspect(asset));

console.log(`PSI : ZERO DAY ${brief.task} — Batch ${brief.batch} production-art intake`);
console.log(`Purpose: ${brief.purpose}`);
console.log('');

for (const result of results) {
  const label = result.asset.source.padEnd(24, ' ');
  console.log(`${result.status.padEnd(10, ' ')} ${label} ${result.detail}`);
}

const readyCount = results.filter(result => result.status === 'READY').length;
const pending = results.length - readyCount;
console.log('');
console.log(`Ready ${readyCount}/${results.length}; pending ${pending}.`);

if (pending === 0) {
  console.log('Batch A binary intake is complete. Run: npm run assets:production-batch-a-check');
} else {
  console.log('RC/fallback media remains active for missing or invalid final slots.');
}
