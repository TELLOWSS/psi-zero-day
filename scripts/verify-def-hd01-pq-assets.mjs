import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import benchmark from '../content/defense/def-hd01-pq-benchmark.json' with { type: 'json' };

const root = process.cwd();

function fail(message) {
  console.error(`[DEF-HD01-PQ] FAIL: ${message}`);
  process.exitCode = 1;
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function readWebpMeta(relativePath) {
  const absolute = path.resolve(root, 'public', relativePath);
  const bytes = fs.readFileSync(absolute);
  if (bytes.length < 30 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`${relativePath} is not a valid RIFF WEBP`);
  }

  let offset = 12;
  let width = null;
  let height = null;
  let hasAlpha = false;

  while (offset + 8 <= bytes.length) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;

    if (type === 'VP8X' && size >= 10 && data + 10 <= bytes.length) {
      const flags = bytes[data];
      hasAlpha ||= Boolean(flags & 0x10);
      width = 1 + bytes[data + 4] + (bytes[data + 5] << 8) + (bytes[data + 6] << 16);
      height = 1 + bytes[data + 7] + (bytes[data + 8] << 8) + (bytes[data + 9] << 16);
    } else if (type === 'ALPH') {
      hasAlpha = true;
    }

    offset = data + size + (size % 2);
  }

  if (width == null || height == null) {
    throw new Error(`${relativePath} must use VP8X extended WEBP so dimensions/alpha can be locked deterministically`);
  }

  return {
    relativePath,
    bytes: bytes.length,
    width,
    height,
    hasAlpha,
    sha256: sha256(bytes),
  };
}

const entries = [
  ['CONTROL', benchmark.benchmark.response],
  ['SWIFT', benchmark.benchmark.risk],
];

const present = entries.map(([name, entry]) => {
  const absolute = path.resolve(root, 'public', entry.productionAsset);
  return [name, entry, fs.existsSync(absolute)];
});

const presentCount = present.filter(([, , exists]) => exists).length;
if (presentCount === 0) {
  console.log('[DEF-HD01-PQ] PQ01 binaries are not committed yet; candidate production remains pending.');
  process.exit(0);
}
if (presentCount !== present.length) {
  fail('PQ01 candidate set is incomplete: CONTROL and SWIFT must be committed together for benchmark QA.');
  process.exit(1);
}

const report = {};
for (const [name, entry] of entries) {
  try {
    const meta = readWebpMeta(entry.productionAsset);
    report[name] = meta;
    if (meta.width !== entry.target.width || meta.height !== entry.target.height) {
      fail(`${name} dimensions drifted: expected ${entry.target.width}x${entry.target.height}, got ${meta.width}x${meta.height}`);
    }
    if (entry.target.transparent && !meta.hasAlpha) {
      fail(`${name} must contain transparency/alpha`);
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

if (!process.exitCode) {
  console.log('[DEF-HD01-PQ] candidate binary QA PASS');
  console.log(JSON.stringify(report, null, 2));
}
