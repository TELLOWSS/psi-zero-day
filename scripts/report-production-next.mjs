import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const statusPath = path.join(root, 'content/episode01/character-production-status.json');
const batchesPath = path.join(root, 'content/episode01/character-production-batches.json');

function fail(message) {
  console.error(`Production tracker error: ${message}`);
  process.exit(1);
}

const status = JSON.parse(await readFile(statusPath, 'utf8'));
const batches = JSON.parse(await readFile(batchesPath, 'utf8'));

if (status.schema_version !== 1) fail('unsupported status schema.');
if (batches.schema_version !== 1) fail('unsupported batch schema.');
if (status.integration_status === 'integrated' && status.next_asset === null) {
  const manifest = JSON.parse(await readFile(path.join(root, 'content/episode01/embedded-media/character-media.json'), 'utf8'));
  const expected = Object.values(status).flatMap(value => value && Array.isArray(value.assets) ? value.assets : []);
  if (expected.length !== 16 || expected.some(asset => !manifest.assets.some(item => item.id === asset.id))) {
    fail('integrated status requires all sixteen character assets in the embedded manifest.');
  }
  console.log('Character production: 16/16 integrated. Do not regenerate the cast.');
  console.log(`Next milestone: ${status.active_milestone}`);
  console.log(status.next_work);
  process.exit(0);
}
if (!status.active_milestone || !status.active_batch || !status.next_asset) {
  fail('active milestone, batch and next_asset are required.');
}

const batch = status[status.active_batch.replace('-', '_')];
if (!batch || !Array.isArray(batch.assets)) fail(`missing asset queue for ${status.active_batch}.`);

const next = batch.assets.find(asset => asset.file === status.next_asset);
if (!next) fail(`next_asset ${status.next_asset} is not present in the active asset queue.`);
if (next.status !== 'next') fail(`next_asset ${status.next_asset} must have status "next".`);

const otherNext = batch.assets.filter(asset => asset.status === 'next');
if (otherNext.length !== 1) fail(`expected exactly one next asset, found ${otherNext.length}.`);

console.log(`Milestone: ${status.active_milestone}`);
console.log(`Batch: ${status.active_batch}`);
console.log(`Next asset: ${next.file}`);
console.log(`Status: ${next.status}`);
console.log('Requirements:');
for (const requirement of next.requirements ?? []) console.log(`- ${requirement}`);

const rejected = batch.rejected_attempts ?? [];
if (rejected.length) {
  console.log('Rejected patterns to avoid:');
  for (const item of rejected) console.log(`- ${item.type}: ${item.reason}`);
}
