import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async file => JSON.parse(await readFile(path.join(root, file), 'utf8'));

const [backgrounds, performance, audio] = await Promise.all([
  readJson('content/episode01/final-art-ingest-manifest.json'),
  readJson('content/episode01/character-performance-production.json'),
  readJson('content/episode01/audio-production.json'),
]);

async function inspect(relativePath, expectedBytes, expectedSha256) {
  const absolute = path.join(root, relativePath);
  try {
    const [bytes, meta] = await Promise.all([readFile(absolute), stat(absolute)]);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    return {
      present: true,
      valid: meta.size === expectedBytes && sha256 === expectedSha256,
      actual_bytes: meta.size,
      actual_sha256: sha256,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return { present: false, valid: false };
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
  return {
    id: asset.asset_id,
    ...(await inspect(path.join('public', asset.target_uri), contract.bytes, contract.sha256)),
  };
}));

function summary(label, rows) {
  const valid = rows.filter(row => row.valid).length;
  const present = rows.filter(row => row.present).length;
  const state = valid === rows.length ? 'READY' : present === 0 ? 'PENDING' : 'PARTIAL';
  console.log(`${label.padEnd(28)} ${state.padEnd(8)} ${valid}/${rows.length} exact binaries`);
  for (const row of rows.filter(item => !item.valid)) {
    console.log(`  - ${row.id}: ${row.present ? 'HASH_OR_SIZE_MISMATCH' : 'MISSING'}`);
  }
  return { state, valid, total: rows.length };
}

console.log('PSI : ZERO DAY / Episode 01 Production Readiness');
console.log('------------------------------------------------');
const bg = summary('Immersive final backgrounds', backgroundRows);
const perf = summary('Character performance wave', performanceRows);
const aud = summary('Production-v1 audio', audioRows);

console.log('');
console.log(`Background manifest: ${backgrounds.status}`);
console.log(`Performance manifest: ${performance.production_status} / ${performance.generated_wave_01.status}`);
console.log(`Audio manifest: ${audio.status}`);

const blockers = [];
if (bg.valid !== bg.total) blockers.push(`final backgrounds ${bg.valid}/${bg.total}`);
if (perf.valid !== perf.total) blockers.push(`character performance ${perf.valid}/${perf.total}`);
if (aud.valid !== aud.total) blockers.push(`audio ${aud.valid}/${aud.total}`);

console.log('');
if (blockers.length) {
  console.log(`Release production gate: BLOCKED (${blockers.join(', ')})`);
  console.log('Runtime remains safe because unresolved visual slots keep their approved fallbacks.');
} else {
  console.log('Release production gate: BINARY-READY');
  console.log('Next command: npm run release:production-check');
}
