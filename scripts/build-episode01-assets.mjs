import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const planPath = path.join(root, 'content/episode01/visuals.json');
const elementCatalogPath = path.join(root, 'content/episode01/scene-element-catalog.json');
const sceneBackgroundCatalogPath = path.join(root, 'content/episode01/scene-background-catalog.json');
const audioProductionPath = path.join(root, 'content/episode01/audio-production.json');
const outputPath = path.join(root, 'content/episode01/assets.json');
const checkOnly = process.argv.includes('--check');
const fullProductionCheck = process.argv.includes('--production-check');
const batchAProductionCheck = process.argv.includes('--production-batch-a-check');
const playerProductionCheck = process.argv.includes('--production-player-check');
const productionCheck = fullProductionCheck || batchAProductionCheck || playerProductionCheck;
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const elementCatalog = JSON.parse(await readFile(elementCatalogPath, 'utf8'));
const sceneBackgroundCatalog = JSON.parse(await readFile(sceneBackgroundCatalogPath, 'utf8'));
const audioProduction = JSON.parse(await readFile(audioProductionPath, 'utf8'));

const planned = [];
const dialogueArt = JSON.parse(await readFile(path.join(root, 'content/episode01/dialogue-art.json'), 'utf8'));
for (const variant of dialogueArt.variants) {
  planned.push({ asset_id: variant.asset_id, uri: variant.uri, group_id: 'ep01.characters',
    preload_policy: 'on_demand', source: `${variant.character_id}:${variant.expression}`,
    production_scope: 'expression', allow_rc_fallback: false });
}
for (const [characterId, character] of Object.entries(plan.characters ?? {})) {
  planned.push({
    asset_id: character.portrait_asset_id,
    uri: character.portrait_path,
    group_id: 'ep01.characters',
    preload_policy: 'on_demand',
    source: `${characterId}:portrait`,
    production_scope: 'core',
    allow_rc_fallback: true,
  });
  planned.push({
    asset_id: character.map_asset_id,
    uri: character.map_path,
    group_id: 'ep01.characters',
    preload_policy: 'next_scene',
    source: `${characterId}:map`,
    production_scope: 'core',
    allow_rc_fallback: true,
  });
}
for (const [backgroundId, background] of Object.entries(plan.backgrounds ?? {})) {
  planned.push({
    asset_id: background.map_asset_id,
    uri: background.path,
    group_id: 'ep01.backgrounds',
    preload_policy: 'required',
    source: `${backgroundId}:background`,
    production_scope: 'core',
    allow_rc_fallback: true,
  });
}
for (const [backgroundKey, definition] of Object.entries(sceneBackgroundCatalog.backgrounds ?? {})) {
  if (!definition?.asset_id || !definition?.final_path) continue;
  planned.push({
    asset_id: definition.asset_id,
    uri: definition.final_path,
    group_id: 'ep01.scene_backgrounds',
    preload_policy: 'next_scene',
    source: `scene_background:${backgroundKey}`,
    production_scope: 'scene-background',
    allow_rc_fallback: true,
  });
}
for (const [elementKey, definition] of Object.entries(elementCatalog.elements ?? {})) {
  if (!definition?.planned_asset_id || !definition?.art?.path) continue;
  planned.push({
    asset_id: definition.planned_asset_id,
    uri: definition.art.path,
    group_id: 'ep01.scene_elements',
    preload_policy: 'next_scene',
    source: `scene_element:${elementKey}`,
    production_scope: 'scene-element',
    allow_rc_fallback: false,
  });
}
for (const definition of audioProduction.assets ?? []) {
  if (!definition?.asset_id || !definition?.target_uri) continue;
  planned.push({
    asset_id: definition.asset_id,
    uri: definition.target_uri,
    type: 'audio',
    group_id: 'ep01.audio',
    preload_policy: definition.loop_candidate ? 'next_scene' : 'on_demand',
    source: `audio:${definition.key}`,
    production_scope: 'audio',
    allow_rc_fallback: false,
  });
}

const batchASources = new Set([
  'foundation:background',
  'player:portrait',
  'player:map',
  'lim_junho:portrait',
  'lim_junho:map',
  'lee_jaehoon:portrait',
  'lee_jaehoon:map',
  'seo_jeongmin:portrait',
  'seo_jeongmin:map',
]);
const playerSources = new Set(['player:portrait', 'player:map']);

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
  if (item.source.endsWith(':background')) return { width: 3072, height: 1728 };
  return undefined;
}

function requiresTransparentBackground(item) {
  return item.source.endsWith(':portrait') || item.source.endsWith(':map');
}

async function readPlannedAsset(item) {
  // Final commercial art always wins when present.
  const exact = await tryRead(item.uri);
  if (exact) return exact;

  // Scene elements intentionally have no RC image layer: final WebP -> CSS placeholder.
  if (item.allow_rc_fallback === false) return undefined;

  // TASK-014A release-candidate art: a hand-authored visual slice used before final WebP lands.
  // Example: player-portrait.webp -> player-portrait-rc.svg.
  const extension = path.extname(item.uri).toLowerCase();
  if (extension === '.webp') {
    const rcUri = item.uri.replace(/\.webp$/i, '-rc.svg');
    const rc = await tryRead(rcUri);
    if (rc) return rc;

    // TASK-010D deterministic generated fallback remains the last-resort art path.
    const fallbackUri = item.uri.replace(/\.webp$/i, '.svg');
    const fallback = await tryRead(fallbackUri);
    if (fallback) return fallback;
  }

  return undefined;
}

if (productionCheck) {
  const coreProductionItems = planned.filter(item => item.production_scope === 'core');
  const productionItems = playerProductionCheck
    ? coreProductionItems.filter(item => playerSources.has(item.source))
    : batchAProductionCheck
      ? coreProductionItems.filter(item => batchASources.has(item.source))
      : coreProductionItems;
  const expectedCount = playerProductionCheck ? 2 : batchAProductionCheck ? 9 : 17;
  const scopeLabel = playerProductionCheck
    ? 'Player production art'
    : batchAProductionCheck
      ? 'Batch A production art'
      : 'Episode 01 production art';
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

    if (requiresTransparentBackground(item)) {
      const hasAlpha = webPHasAlpha(exact.bytes);
      if (hasAlpha !== true) {
        invalid.push(`${item.asset_id}: character production art must include WebP alpha transparency (${item.uri})`);
      }
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
    const resolved = await readPlannedAsset(item);
    if (!resolved) continue;
    const extension = path.extname(resolved.uri).slice(1).toLowerCase();
    assets.push({
      asset_id: item.asset_id,
      type: item.type ?? 'image',
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
