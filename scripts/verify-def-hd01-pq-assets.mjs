import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import benchmark from '../content/defense/def-hd01-pq-benchmark.json' with { type: 'json' };

const root = process.cwd();
const publicPath = relative => path.resolve(root, 'public', relative);

function sha256File(relative) {
  const bytes = fs.readFileSync(publicPath(relative));
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function requireIntegrity(relative, expected, label) {
  requireFile(relative, label);
  if (!expected) {
    fail(`${label} integrity metadata missing`);
    return;
  }
  const actual = sha256File(relative);
  if (actual !== expected.sha256) {
    fail(`${label} SHA256 drifted: expected ${expected.sha256}, got ${actual}`);
  } else {
    console.log(`[DEF-HD01-PQ] ${label} SHA256 locked: ${actual}`);
  }
}

function fail(message) {
  console.error(`[DEF-HD01-PQ] FAIL: ${message}`);
  process.exitCode = 1;
}

function requireFile(relative, label) {
  const absolute = publicPath(relative);
  if (!fs.existsSync(absolute)) {
    fail(`${label} missing: ${relative}`);
    return;
  }
  const bytes = fs.statSync(absolute).size;
  if (bytes <= 0) fail(`${label} is empty: ${relative}`);
  else console.log(`[DEF-HD01-PQ] ${label}: ${relative} (${bytes} bytes)`);
}

const control = benchmark.benchmark.response.target;
if (control.kind !== 'RUNTIME_COMPOSITE') {
  fail('CONTROL benchmark must use RUNTIME_COMPOSITE');
} else {
  if (!Array.isArray(control.sources) || control.sources.length !== 2) {
    fail('CONTROL runtime composite must declare exactly two source assets');
  } else {
    requireFile(control.sources[0], 'CONTROL marshal');
    requireFile(control.sources[1], 'CONTROL barrier');
  }
}

const swift = benchmark.benchmark.risk.target;
if (swift.kind !== 'STATIC_TRANSPARENT_SVG') {
  fail('SWIFT benchmark must use STATIC_TRANSPARENT_SVG');
} else {
  requireFile(swift.asset, 'SWIFT dedicated transparent asset');
  if (swift.transparent !== true) fail('SWIFT dedicated asset must be declared transparent');
  if (swift.width !== 384 || swift.height !== 268) {
    fail('SWIFT dedicated asset dimensions must stay locked at 384x268');
  }
  const source = swift.sourceLineage;
  if (source?.masterWorld !== 'assets/defense/board/ramp-01-hd01.webp') {
    fail('SWIFT asset must retain MASTER WORLD lineage');
  } else {
    requireFile(source.masterWorld, 'SWIFT master-world lineage');
  }
  if (source?.sourceLogicalSize?.width !== 1000 || source?.sourceLogicalSize?.height !== 600) {
    fail('SWIFT source lineage must stay aligned to the locked 1000x600 DefenseGame world');
  }
  if (!Array.isArray(source?.clipPolygon) || source.clipPolygon.length < 6) {
    fail('SWIFT source-lineage clip polygon is missing or too coarse');
  }
}


const integrity = benchmark.assetIntegrity;
if (!integrity) {
  fail('assetIntegrity block is missing');
} else {
  requireIntegrity(integrity.masterWorld.uri, integrity.masterWorld, 'MASTER WORLD');
  requireIntegrity(integrity.controlMarshal.uri, integrity.controlMarshal, 'CONTROL marshal');
  requireIntegrity(integrity.controlBarrier.uri, integrity.controlBarrier, 'CONTROL barrier');
  requireIntegrity(integrity.swift.uri, integrity.swift, 'SWIFT dedicated asset');

  if (integrity.swift.dimensions?.width !== 384 || integrity.swift.dimensions?.height !== 268) {
    fail('SWIFT integrity dimensions must remain 384x268');
  }
  if (integrity.swift.transparent !== true) {
    fail('SWIFT integrity metadata must keep transparency locked');
  }
  if (integrity.swift.selfContained !== true) {
    fail('SWIFT integrity metadata must keep the sprite self-contained');
  }
  const swiftSvg = fs.readFileSync(publicPath(integrity.swift.uri), 'utf8');
  if (!swiftSvg.includes('data-self-contained="true"')) {
    fail('SWIFT sprite must declare data-self-contained="true"');
  }
  if (!swiftSvg.includes('data:image/webp;base64,')) {
    fail('SWIFT sprite must embed its MASTER WORLD source bytes');
  }
  if (swiftSvg.includes('../board/') || swiftSvg.includes('href="/assets/')) {
    fail('SWIFT sprite must not depend on an external board image reference');
  }
}

if (benchmark.runtimePromotion.previewCandidateOnGateBranch !== true) {
  fail('G2 branch must explicitly enable candidate preview for browser QA');
}
if (benchmark.runtimePromotion.approved !== false) {
  fail('Production approval must remain false until browser visual QA passes');
}
if (benchmark.runtimeGate.noGameplayCoordinateChange !== true || benchmark.runtimeGate.noBalanceChange !== true) {
  fail('G2 may not change gameplay coordinates or balance');
}

if (!process.exitCode) {
  console.log('[DEF-HD01-PQ] CONTROL composite + dedicated SWIFT asset QA PASS');
}
