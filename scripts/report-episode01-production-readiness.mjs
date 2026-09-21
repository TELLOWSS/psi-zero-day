import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const requirePhaseD = process.argv.includes('--require-phase-d');
const readJson = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));

const [backgrounds, performance, audio, replacementBaseline, characterManifest, sceneElementCatalog] = await Promise.all([
  readJson('content/episode01/final-art-ingest-manifest.json'),
  readJson('content/episode01/character-performance-production.json'),
  readJson('content/episode01/audio-production.json'),
  readJson('content/episode01/character-replacement-baseline.json'),
  readJson('content/episode01/embedded-media/character-media.json'),
  readJson('content/episode01/scene-element-catalog.json'),
]);

async function inspect(relativePath, expectedBytes, expectedSha256) {
  const absolute = path.join(root, relativePath);
  try {
    const [bytes, meta] = await Promise.all([readFile(absolute), stat(absolute)]);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    return { present: true, valid: meta.size === expectedBytes && sha256 === expectedSha256 };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return { present: false, valid: false };
    throw error;
  }
}

async function inspectSceneElement(definition) {
  const art = definition?.art;
  if (!art?.path) return { present: false, binary_valid: false, accepted_final: false };
  try {
    const bytes = await readFile(path.join(root, 'public', art.path));
    const dimensions = webPDimensions(bytes);
    const binaryValid = isWebP(bytes)
      && dimensions
      && dimensions.width >= art.minimum_width
      && dimensions.height >= art.minimum_height
      && (!art.requires_alpha || webPHasAlpha(bytes) === true);
    return {
      present: true,
      binary_valid: Boolean(binaryValid),
      accepted_final: definition.production_status === 'final' && Boolean(binaryValid),
      production_status: definition.production_status,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return { present: false, binary_valid: false, accepted_final: false, production_status: definition.production_status };
    }
    throw error;
  }
}

const backgroundRows = await Promise.all(backgrounds.assets.map(async asset => ({
  id: asset.filename,
  ...(await inspect(asset.target_path, asset.bytes, asset.sha256)),
})));
const performanceRows = await Promise.all(performance.generated_wave_01.assets.map(async asset => ({
  id: asset.asset_id,
  ...(await inspect(path.join('public', asset.path), asset.bytes, asset.sha256)),
})));
const audioByFile = new Map((audio.production_generation?.assets ?? []).map(asset => [asset.file, asset]));
const audioRows = await Promise.all((audio.assets ?? []).map(async asset => {
  const file = asset.target_uri.split('/').at(-1);
  const contract = audioByFile.get(file);
  if (!contract) return { id: asset.asset_id, present: false, valid: false };
  return { id: asset.asset_id, ...(await inspect(path.join('public', asset.target_uri), contract.bytes, contract.sha256)) };
}));

const characterById = new Map((characterManifest.assets ?? []).map(asset => [asset.id, asset]));
const replacementRows = await Promise.all((replacementBaseline.assets ?? []).map(async legacy => {
  const current = characterById.get(legacy.id);
  if (!current) return { id: legacy.id, present: false, valid: false, changed: false };
  const file = await inspect(path.join('public', current.target), current.bytes, current.sha256);
  const changed = current.sha256 !== legacy.sha256;
  const shapeOk = current.width >= legacy.width && current.height >= legacy.height && current.alpha === true;
  return { id: legacy.id, present: file.present, valid: file.valid && changed && shapeOk, changed, shape_ok: shapeOk };
}));

const placedElementKeys = [...new Set(Object.values(sceneElementCatalog.event_elements ?? {}).flat().map(item => item.element_key))];
const runtimeSceneElementRows = await Promise.all(placedElementKeys.map(async key => {
  const definition = sceneElementCatalog.elements?.[key];
  if (!definition) return { id: key, present: false, valid: false, production_status: 'missing_definition' };
  const checked = await inspectSceneElement(definition);
  return {
    id: key,
    present: checked.present,
    valid: checked.accepted_final,
    binary_valid: checked.binary_valid,
    production_status: checked.production_status,
  };
}));

function summary(label, rows, detail = 'exact binaries') {
  const valid = rows.filter(row => row.valid).length;
  const state = valid === rows.length ? 'READY' : valid === 0 ? 'PENDING' : 'PARTIAL';
  console.log(`${label.padEnd(31)} ${state.padEnd(8)} ${valid}/${rows.length} ${detail}`);
  return { state, valid, total: rows.length };
}

console.log('PSI : ZERO DAY / Episode 01 Phase D Production Readiness');
console.log('--------------------------------------------------------');
const bg = summary('Immersive final backgrounds', backgroundRows);
const perf = summary('Character performance wave', performanceRows);
const aud = summary('Production-v1 audio', audioRows);
const cast = summary('Title-cast identity refresh', replacementRows, 'new verified binaries');
const scene = summary('Episode 01 runtime elements', runtimeSceneElementRows, 'accepted final assets');

for (const row of replacementRows.filter(item => !item.valid)) {
  console.log(`  - cast/${row.id}: ${row.changed ? (row.shape_ok ? 'BINARY_OR_MANIFEST_INVALID' : 'INVALID_SHAPE') : 'LEGACY_BASELINE'}`);
}
for (const row of runtimeSceneElementRows.filter(item => !item.valid)) {
  const detail = row.present && row.binary_valid
    ? `BINARY_PRESENT_BUT_STATUS_${String(row.production_status).toUpperCase()}`
    : row.present ? 'INVALID_BINARY' : 'MISSING';
  console.log(`  - scene/${row.id}: ${detail}`);
}

console.log('');
console.log(`Background manifest: ${backgrounds.status}`);
console.log(`Performance manifest: ${performance.production_status} / ${performance.generated_wave_01.status}`);
console.log(`Audio manifest: ${audio.status}`);
console.log(`Runtime scene-element scope: ${placedElementKeys.length}/${Object.keys(sceneElementCatalog.elements ?? {}).length} catalog definitions are placed by Episode 01 events.`);
console.log('Field Guide/future-campaign-only scene elements do not block the Episode 01 cinematic lock.');

const blockers = [];
if (bg.valid !== bg.total) blockers.push(`final backgrounds ${bg.valid}/${bg.total}`);
if (perf.valid !== perf.total) blockers.push(`character performance ${perf.valid}/${perf.total}`);
if (aud.valid !== aud.total) blockers.push(`audio ${aud.valid}/${aud.total}`);
if (cast.valid !== cast.total) blockers.push(`title-cast identity refresh ${cast.valid}/${cast.total}`);
if (scene.valid !== scene.total) blockers.push(`Episode 01 runtime scene elements ${scene.valid}/${scene.total}`);

console.log('');
if (blockers.length) {
  console.log(`Phase D production lock: BLOCKED (${blockers.join(', ')})`);
  console.log('Already-locked backgrounds/performance/audio remain active; unresolved replacement slots keep their safe current runtime assets.');
  console.log('Next: close only the listed Phase D blockers, then run npm run phase-d:check.');
  if (requirePhaseD) process.exitCode = 1;
} else {
  console.log('Phase D production lock: BINARY-READY');
  console.log('Next command: npm run phase-d:check');
}
