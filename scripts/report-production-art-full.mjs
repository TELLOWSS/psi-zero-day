import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const planPath = path.join(root, 'content/episode01/visuals.json');
const plan = JSON.parse(await readFile(planPath, 'utf8'));

const planned = [];
for (const [characterId, character] of Object.entries(plan.characters ?? {})) {
  planned.push({
    source: `${characterId}:portrait`,
    assetId: character.portrait_asset_id,
    uri: character.portrait_path,
    minimum: { width: 1024, height: 1024 },
    alphaRequired: true,
  });
  planned.push({
    source: `${characterId}:map`,
    assetId: character.map_asset_id,
    uri: character.map_path,
    minimum: { width: 768, height: 1024 },
    alphaRequired: true,
  });
}
for (const [backgroundId, background] of Object.entries(plan.backgrounds ?? {})) {
  planned.push({
    source: `${backgroundId}:background`,
    assetId: background.map_asset_id,
    uri: background.path,
    minimum: { width: 1920, height: 1080 },
    alphaRequired: false,
  });
}

async function inspect(item) {
  const absolute = path.join(root, 'public', item.uri);
  let bytes;
  try {
    bytes = await readFile(absolute);
  } catch (error) {
    if (error?.code === 'ENOENT') return { item, status: 'MISSING', detail: `public/${item.uri}` };
    throw error;
  }

  if (!isWebP(bytes)) return { item, status: 'INVALID', detail: 'not a WebP file' };
  const dimensions = webPDimensions(bytes);
  if (!dimensions) return { item, status: 'INVALID', detail: 'unreadable WebP dimensions' };
  if (dimensions.width < item.minimum.width || dimensions.height < item.minimum.height) {
    return {
      item,
      status: 'TOO_SMALL',
      detail: `${dimensions.width}x${dimensions.height}; requires >= ${item.minimum.width}x${item.minimum.height}`,
    };
  }

  if (item.alphaRequired && webPHasAlpha(bytes) !== true) {
    return {
      item,
      status: 'NO_ALPHA',
      detail: `${dimensions.width}x${dimensions.height}; transparent character background required`,
    };
  }

  return {
    item,
    status: 'READY',
    detail: `${dimensions.width}x${dimensions.height}${item.alphaRequired ? ', alpha' : ''}, ${bytes.length.toLocaleString('en-US')} bytes`,
  };
}

const results = [];
for (const item of planned) results.push(await inspect(item));

console.log('PSI : ZERO DAY — Episode 01 final production-art status');
console.log('Visual target: commercial adult-friendly 2.5D casual-strategy construction diorama');
console.log('');

for (const result of results) {
  const label = result.item.source.padEnd(24, ' ');
  console.log(`${result.status.padEnd(10, ' ')} ${label} ${result.detail}`);
}

const ready = results.filter(result => result.status === 'READY');
const pending = results.filter(result => result.status !== 'READY');
const characterReady = ready.filter(result => !result.item.source.endsWith(':background')).length;
const backgroundReady = ready.filter(result => result.item.source.endsWith(':background')).length;

console.log('');
console.log(`Ready ${ready.length}/${results.length}; pending ${pending.length}.`);
console.log(`Backgrounds: ${backgroundReady}/1 final. Characters: ${characterReady}/16 final.`);

if (results.length !== 17) {
  console.log(`WARNING: expected 17 production slots but found ${results.length}.`);
}

if (pending.length) {
  console.log('Next incomplete slots:');
  for (const result of pending.slice(0, 5)) console.log(`- ${result.item.source} -> public/${result.item.uri}`);
  if (pending.length > 5) console.log(`- ...and ${pending.length - 5} more`);
  console.log('RC/fallback media remains valid for pending slots; do not relabel it as final production art.');
} else {
  console.log('All final visual slots are present. Run: npm run assets:production-check');
}
