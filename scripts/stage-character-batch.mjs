import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const productionPath = path.join(root, 'content/episode01/character-art-production.json');
const manifestPath = path.join(root, 'content/episode01/embedded-media/character-media.json');

const { values } = parseArgs({
  options: {
    dir: { type: 'string' },
    scope: { type: 'string', default: 'batch-a' },
    'dry-run': { type: 'boolean', default: false },
    'require-all': { type: 'boolean', default: false },
  },
  strict: true,
});

const scopeCharacterIds = Object.freeze({
  'batch-a': ['player', 'lim_junho', 'lee_jaehoon', 'seo_jeongmin'],
  'batch-b': ['kang_taesik', 'yoon_sungho', 'choi_minseok', 'oh_seungjae'],
  all: ['player', 'kang_taesik', 'lim_junho', 'yoon_sungho', 'lee_jaehoon', 'choi_minseok', 'seo_jeongmin', 'oh_seungjae'],
});

function die(message) {
  console.error(`Character batch staging failed: ${message}`);
  process.exit(1);
}

function assetId(characterId, kind) {
  return `${characterId.replaceAll('_', '-')}-${kind}`;
}

function minimum(kind) {
  return kind === 'portrait'
    ? { width: 1024, height: 1024 }
    : { width: 768, height: 1024 };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

if (!values.dir) die('usage: node scripts/stage-character-batch.mjs --dir <source-directory> [--scope batch-a|batch-b|all] [--require-all] [--dry-run]');
if (!scopeCharacterIds[values.scope]) die(`unknown scope: ${values.scope}`);

const sourceDir = path.resolve(root, values.dir);
const production = JSON.parse(await readFile(productionPath, 'utf8'));
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!Number.isInteger(production.schema_version) || production.schema_version < 1 || !Array.isArray(production.characters)) die('character-art-production.json is invalid.');
if (manifest.schema_version !== 1 || !Array.isArray(manifest.assets)) die('character-media.json is invalid.');

const registered = new Set(manifest.assets.map(asset => asset.id));
const byId = new Map(production.characters.map(character => [character.id, character]));
const queue = [];
const alreadyRegistered = [];
const problems = [];

for (const characterId of scopeCharacterIds[values.scope]) {
  const character = byId.get(characterId);
  if (!character) {
    problems.push(`${characterId}: missing production character definition.`);
    continue;
  }

  for (const kind of ['portrait', 'map']) {
    const id = assetId(characterId, kind);
    const filePath = path.join(sourceDir, `${id}.webp`);
    if (!(await exists(filePath))) {
      if (values['require-all']) {
        problems.push(`${id}: replacement batch requires source file ${filePath}`);
        continue;
      }
      if (registered.has(id)) {
        alreadyRegistered.push(id);
        continue;
      }
      problems.push(`${id}: missing source file ${filePath}`);
      continue;
    }

    const bytes = await readFile(filePath);
    if (!isWebP(bytes)) {
      problems.push(`${id}: not a valid WebP container.`);
      continue;
    }
    const dimensions = webPDimensions(bytes);
    if (!dimensions) {
      problems.push(`${id}: unreadable WebP dimensions.`);
      continue;
    }
    const min = minimum(kind);
    if (dimensions.width < min.width || dimensions.height < min.height) {
      problems.push(`${id}: ${dimensions.width}x${dimensions.height} is below ${min.width}x${min.height}.`);
    }
    if (webPHasAlpha(bytes) !== true) {
      problems.push(`${id}: alpha transparency is required.`);
    }
    if (kind === 'map' && dimensions.height <= dimensions.width) {
      problems.push(`${id}: map art must use a portrait canvas (height > width).`);
    }

    queue.push({ id, filePath, dimensions });
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  die(`${problems.length} preflight problem(s); nothing was staged.`);
}

console.log(`Batch preflight passed for scope ${values.scope}.`);
for (const id of alreadyRegistered) console.log(`Already registered: ${id}`);
for (const item of queue) console.log(`Ready to stage: ${item.id} (${item.dimensions.width}x${item.dimensions.height})`);

if (values['dry-run']) {
  console.log(`Dry run complete: ${queue.length} new/replacement asset(s), ${alreadyRegistered.length} already registered.`);
  process.exit(0);
}

for (const item of queue) {
  const result = spawnSync(
    process.execPath,
    ['scripts/stage-character-media.mjs', '--id', item.id, '--file', item.filePath],
    { cwd: root, stdio: 'inherit' },
  );
  if (result.status !== 0) die(`staging failed for ${item.id}.`);
}

const materialize = spawnSync(process.execPath, ['scripts/materialize-character-media.mjs'], {
  cwd: root,
  stdio: 'inherit',
});
if (materialize.status !== 0) die('materialization failed after batch staging.');

const verify = spawnSync(process.execPath, ['scripts/materialize-character-media.mjs', '--check'], {
  cwd: root,
  stdio: 'inherit',
});
if (verify.status !== 0) die('post-stage verification failed.');

console.log(`Batch staging complete: ${queue.length} staged, ${alreadyRegistered.length} already registered.`);
