import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    dir: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
  strict: true,
});

function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: process.cwd(), stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!values.dir) {
  console.error('usage: npm run assets:character-replacement-stage -- --dir <directory> [--dry-run]');
  process.exit(1);
}

const batchArgs = [
  'scripts/stage-character-batch.mjs',
  '--dir', values.dir,
  '--scope', 'batch-a',
  '--require-all',
  ...(values['dry-run'] ? ['--dry-run'] : []),
];

run(batchArgs);
if (values['dry-run']) {
  console.log('Replacement preflight complete. No repository files were changed.');
  process.exit(0);
}

run(['scripts/check-character-replacement.mjs', '--require-new']);
run(['scripts/check-character-final-art-shape.mjs', '--batch-a']);
run(['scripts/check-character-identity.mjs']);
run(['scripts/check-visual-contract.mjs']);
run(['scripts/build-episode01-assets.mjs']);
run(['scripts/build-episode01-assets.mjs', '--production-batch-a-check']);

console.log('Four-character replacement intake passed binary, shape, identity and Batch A production gates.');
console.log('Next required step: visual QA on Main → Loading → MAP before marking the replacement integrated.');
