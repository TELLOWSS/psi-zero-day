import { createHash } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const requireFinal = process.argv.includes('--require-final');
const checkOnly = process.argv.includes('--check') || requireFinal;

const productionPath = path.join(root, 'content/episode01/character-performance-production.json');
const assetsPath = path.join(root, 'content/episode01/assets.json');

const production = JSON.parse(await readFile(productionPath, 'utf8'));
const assetManifest = JSON.parse(await readFile(assetsPath, 'utf8'));
const wave = production.generated_wave_01;

if (!wave?.assets?.length) {
  throw new Error('character performance generated_wave_01 contract is missing');
}

async function inspectAsset(asset) {
  const diskPath = path.join(root, 'public', asset.path);
  try {
    const [bytes, meta] = await Promise.all([readFile(diskPath), stat(diskPath)]);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    return {
      ...asset,
      disk_path: diskPath,
      exists: true,
      actual_bytes: meta.size,
      actual_sha256: sha256,
      valid: meta.size === asset.bytes && sha256 === asset.sha256,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return { ...asset, disk_path: diskPath, exists: false, valid: false };
    }
    throw error;
  }
}

const inspected = await Promise.all(wave.assets.map(inspectAsset));
const missing = inspected.filter(asset => !asset.exists);
const invalid = inspected.filter(asset => asset.exists && !asset.valid);

for (const asset of inspected) {
  const state = !asset.exists ? 'MISSING' : asset.valid ? 'VERIFIED' : 'MISMATCH';
  console.log(`[${state}] ${asset.asset_id} -> ${asset.path}`);
  if (asset.exists && !asset.valid) {
    console.log(`  expected bytes/hash: ${asset.bytes} / ${asset.sha256}`);
    console.log(`  actual   bytes/hash: ${asset.actual_bytes} / ${asset.actual_sha256}`);
  }
}

if (invalid.length) {
  process.exitCode = 1;
  throw new Error(`character performance wave has ${invalid.length} invalid file(s)`);
}

if (missing.length) {
  console.log(`[PENDING] ${missing.length}/${inspected.length} generated performance WebP file(s) are not ingested yet.`);
  if (requireFinal) {
    process.exitCode = 1;
    throw new Error('final character performance wave is required but binary files are missing');
  }
  process.exit(0);
}

const manifestAssets = assetManifest.assets;
if (!Array.isArray(manifestAssets)) throw new Error('content/episode01/assets.json assets array is missing');

function registryEntry(asset) {
  return {
    asset_id: asset.asset_id,
    type: 'image',
    group_id: 'ep01.character_performance',
    variants: [{
      uri: asset.path,
      format: 'webp',
      bytes: asset.bytes,
      hash: asset.sha256,
    }],
    dependencies: [],
    preload_policy: 'next_scene',
    version: '1',
  };
}

const expectedById = new Map(wave.assets.map(asset => [asset.asset_id, registryEntry(asset)]));
const registeredById = new Map(manifestAssets.map(asset => [asset.asset_id, asset]));
const registryMismatch = [];

for (const [assetId, expected] of expectedById) {
  const actual = registeredById.get(assetId);
  if (!actual || JSON.stringify(actual) !== JSON.stringify(expected)) registryMismatch.push(assetId);
}

if (checkOnly) {
  if (registryMismatch.length) {
    console.log(`[PENDING] registry entries need ingest for: ${registryMismatch.join(', ')}`);
    if (requireFinal) {
      process.exitCode = 1;
      throw new Error('performance WebPs exist but asset registry is not finalized');
    }
  } else {
    console.log('[READY] generated character performance wave 01 files and registry are verified.');
  }
  process.exit(0);
}

assetManifest.assets = manifestAssets.filter(asset => !expectedById.has(asset.asset_id));
for (const asset of wave.assets) assetManifest.assets.push(registryEntry(asset));
assetManifest.assets.sort((a, b) => a.asset_id.localeCompare(b.asset_id));

production.production_status = 'generated_wave_01_ingested';
production.generated_wave_01.status = 'verified_github_binary_ingest';

await Promise.all([
  writeFile(assetsPath, JSON.stringify(assetManifest, null, 2) + '\n'),
  writeFile(productionPath, JSON.stringify(production, null, 2) + '\n'),
]);

console.log('[INGESTED] character performance wave 01 registry and production status updated.');
