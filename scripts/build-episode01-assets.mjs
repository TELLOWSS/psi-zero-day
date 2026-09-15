import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const planPath = path.join(root, 'content/episode01/visuals.json');
const audioPlanPath = path.join(root, 'content/episode01/audio.json');
const outputPath = path.join(root, 'content/episode01/assets.json');
const checkOnly = process.argv.includes('--check');
const productionCheck = process.argv.includes('--production-check');
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const audioPlan = JSON.parse(await readFile(audioPlanPath, 'utf8'));

const imagePlanned = [];
for (const [characterId, character] of Object.entries(plan.characters ?? {})) {
  imagePlanned.push({
    asset_id: character.portrait_asset_id,
    uri: character.portrait_path,
    type: 'image',
    group_id: 'ep01.characters',
    preload_policy: 'on_demand',
    source: `${characterId}:portrait`,
  });
  imagePlanned.push({
    asset_id: character.map_asset_id,
    uri: character.map_path,
    type: 'image',
    group_id: 'ep01.characters',
    preload_policy: 'next_scene',
    source: `${characterId}:map`,
  });
}
for (const [backgroundId, background] of Object.entries(plan.backgrounds ?? {})) {
  imagePlanned.push({
    asset_id: background.map_asset_id,
    uri: background.path,
    type: 'image',
    group_id: 'ep01.backgrounds',
    preload_policy: 'required',
    source: `${backgroundId}:background`,
  });
}

const audioPlanned = (audioPlan.assets ?? []).map(item => ({
  asset_id: item.asset_id,
  uri: item.uri,
  type: 'audio',
  group_id: item.group_id,
  preload_policy: item.preload_policy,
  source: item.generator,
}));
const allPlanned = [...imagePlanned, ...audioPlanned];

async function tryRead(uri) {
  try {
    return { uri, bytes: await readFile(path.join(root, 'public', uri)) };
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

function isWebP(bytes) {
  return bytes.length >= 12
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
}

function isWav(bytes) {
  return bytes.length >= 44
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WAVE'
    && bytes.subarray(12, 16).toString('ascii') === 'fmt '
    && bytes.subarray(36, 40).toString('ascii') === 'data';
}

async function readPlannedImage(uri) {
  // Final commercial art always wins when present.
  const exact = await tryRead(uri);
  if (exact) return exact;

  // TASK-014A release-candidate art remains a safe fallback if a final WebP is absent.
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
  const missing = [];
  const invalid = [];

  for (const item of imagePlanned) {
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
    if (!isWebP(exact.bytes)) invalid.push(`${item.asset_id}: invalid WebP header (${item.uri})`);
  }

  for (const item of audioPlanned) {
    if (!item.asset_id || !item.uri) continue;
    if (path.extname(item.uri).toLowerCase() !== '.wav') {
      invalid.push(`${item.asset_id}: planned production audio path must be .wav (${item.uri})`);
      continue;
    }
    const exact = await tryRead(item.uri);
    if (!exact) {
      missing.push(`${item.asset_id}: public/${item.uri}`);
      continue;
    }
    if (!isWav(exact.bytes)) invalid.push(`${item.asset_id}: invalid PCM WAV header (${item.uri})`);
  }

  if (imagePlanned.length !== 17) invalid.push(`expected 17 production image slots, found ${imagePlanned.length}`);
  if (audioPlanned.length !== 7) invalid.push(`expected 7 production audio slots, found ${audioPlanned.length}`);

  if (missing.length || invalid.length) {
    console.error('Episode 01 production assets are NOT release-ready.');
    if (missing.length) console.error(`Missing final assets (${missing.length}):\n- ${missing.join('\n- ')}`);
    if (invalid.length) console.error(`Invalid production asset entries (${invalid.length}):\n- ${invalid.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    console.log(`Episode 01 production assets are release-ready (${imagePlanned.length} WebP + ${audioPlanned.length} WAV assets).`);
  }
} else {
  const assets = [];
  for (const item of allPlanned) {
    if (!item.asset_id || !item.uri) continue;
    const resolved = item.type === 'image' ? await readPlannedImage(item.uri) : await tryRead(item.uri);
    if (!resolved) continue;
    const extension = path.extname(resolved.uri).slice(1).toLowerCase();
    assets.push({
      asset_id: item.asset_id,
      type: item.type,
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
