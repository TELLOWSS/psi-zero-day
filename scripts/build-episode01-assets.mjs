import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions } from './webp-dimensions.mjs';

const root = process.cwd();
const planPath = path.join(root, 'content/episode01/visuals.json');
const outputPath = path.join(root, 'content/episode01/assets.json');
const checkOnly = process.argv.includes('--check');
const fullProductionCheck = process.argv.includes('--production-check');
const batchAProductionCheck = process.argv.includes('--production-batch-a-check');
const productionCheck = fullProductionCheck || batchAProductionCheck;
const plan = JSON.parse(await readFile(planPath, 'utf8'));

const planned = [];
for (const [characterId, character] of Object.entries(plan.characters ?? {})) {
  planned.push({
    asset_id: character.portrait_asset_id,
    uri: character.portrait_path,
    group_id: 'ep01.characters',
    preload_policy: 'on_demand',
    source: `${characterId}:portrait`,
  });
  planned.push({
    asset_id: character.map_asset_id,
    uri: character.map_path,
    group_id: 'ep01.characters',
    preload_policy: 'next_scene',
    source: `${characterId}:map`,
  });
}
for (const [backgroundId, background] of Object.entries(plan.backgrounds ?? {})) {
  planned.push({
    asset_id: background.map_asset_id,
    uri: background.path,
    group_id: 'ep01.backgrounds',
    preload_policy: 'required',
    source: `${backgroundId}:background`,
  });
}

const batchASources = new Set([
  'foundation:background',
  'player:portrait',
  'player:map',
  'kang_taesik:portrait',
  'kang_taesik:map',
  'lim_junho:portrait',
  'lim_junho:map',
]);

async function tryRead(uri) {
  try {
    return { uri, bytes: await readFile(path.join(root, 'public', uri)) };
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

function minimumDimensions(item) {
  if (item.source.endsWith(':portrait')) return { width: 1024, height: 1024 };
  if (item.source.endsWith(':map')) return { width: 768, height: 1024 };
  if (item.source.endsWith(':background')) return { width: 1920, height: 1080 };
  return undefined;
}

async function readPlannedAsset(uri) {
  // Final commercial art always wins when present.
  const exact = await tryRead(uri);
  if (exact) return exact;

  // TASK-014A release-candidate art: a hand-authored visual slice used before final WebP lands.
  // Example: player-portrait.webp -> player-portrait-rc.svg.
  const extension = path.extname(uri).toLowerCase();
  if (extension === '.webp') {
    const rcUri = uri.replace(/\.webp$/i, '-rc.svg');
    const rc = await tryRead(rcUri);
    if (rc) return rc;

    // TASK-010D deterministic generated fallback remains the last-resort art path.
    const fallbackUri = uri.replace(/\.webp$/i, '.svg');
    const fallback = await tryRead(fallbackUri);
    if (fallback) return fallback;
  }

  return undefined;
}

if (productionCheck) {
  const productionItems = batchAProductionCheck
    ? planned.filter(item => batchASources.has(item.source))
    : planned;
  const expectedCount = batchAProductionCheck ? 7 : 17;
  const scopeLabel = batchAProductionCheck ? 'Batch A production art' : 'Episode 01 production art';
  const missing = [];
  const invalid = [];

  for (const item of productionItems) {
    if (!item.asset_id || !item.uri) continue;
    if (path.extname(item.uri).toLowerCase() !== '.webp') {
      invalid.push(`${item.asset_id}: planned production path must be .webp (${item.uri})`);
      continue;
    }

    const exact = await tryRead(item.uri);
    if (!exact) {
      missing.push(`${item.asset_id}: public/${item.uri}`);
      continue;
    }
    if (!isWebP(exact.bytes)) {
      invalid.push(`${item.asset_id}: invalid WebP header (${item.uri})`);
      continue;
    }

    const dimensions = webPDimensions(exact.bytes);
    if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
      invalid.push(`${item.asset_id}: unreadable WebP dimensions (${item.uri})`);
      continue;
    }

    const minimum = minimumDimensions(item);
    if (minimum && (dimensions.width < minimum.width || dimensions.height < minimum.height)) {
      invalid.push(
        `${item.asset_id}: ${dimensions.width}x${dimensions.height} is below minimum `
        + `${minimum.width}x${minimum.height} (${item.uri})`,
      );
    }
  }

  if (productionItems.length !== expectedCount) {
    invalid.push(`expected ${expectedCount} production image slots, found ${productionItems.length}`);
  }

  if (missing.length || invalid.length) {
    console.error(`${scopeLabel} is NOT ready.`);
    if (missing.length) console.error(`Missing final WebP files (${missing.length}):\n- ${missing.join('\n- ')}`);
    if (invalid.length) console.error(`Invalid production art entries (${invalid.length}):\n- ${invalid.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    console.log(`${scopeLabel} is ready (${productionItems.length} final WebP assets).`);
  }
} else {
  const assets = [];
  for (const item of planned) {
    if (!item.asset_id || !item.uri) continue;
    const resolved = await readPlannedAsset(item.uri);
    if (!resolved) continue;
    const extension = path.extname(resolved.uri).slice(1).toLowerCase();
    assets.push({
      asset_id: item.asset_id,
      type: 'image',
      group_id: item.group_id,
      variants: [{
        uri: resolved.uri,
        format: extension,
        bytes: resolved.bytes.length,
        hash: createHash('sha256').update(resolved.bytes).digest('hex'),
      }],
      dependencies: [],
      preload_policy: item.preload_policy,
      version: '1',
    });
  }
  assets.sort((a, b) => a.asset_id.localeCompare(b.asset_id));

  const generated = `${JSON.stringify({ schema_version: 1, assets }, null, 2)}\n`;
  if (checkOnly) {
    const current = await readFile(outputPath, 'utf8');
    if (current !== generated) {
      console.error('Episode 01 asset manifest is out of date. Run: npm run assets:manifest');
      process.exitCode = 1;
    } else {
      console.log(`Episode 01 asset manifest is current (${assets.length} assets).`);
    }
  } else {
    await writeFile(outputPath, generated, 'utf8');
    console.log(`Wrote ${assets.length} Episode 01 assets to content/episode01/assets.json.`);
  }
}
