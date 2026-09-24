import fs from 'node:fs';
import path from 'node:path';
import benchmark from '../content/defense/def-hd01-pq-benchmark.json' with { type: 'json' };

const root = process.cwd();
const publicPath = relative => path.resolve(root, 'public', relative);

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
if (swift.kind !== 'RUNTIME_WORLD_CROP') {
  fail('SWIFT benchmark must use RUNTIME_WORLD_CROP');
} else {
  requireFile(swift.source, 'SWIFT master-world source');
  if (swift.sourceLogicalSize?.width !== 1000 || swift.sourceLogicalSize?.height !== 600) {
    fail('SWIFT crop source must stay aligned to the locked 1000x600 DefenseGame world');
  }
  const box = swift.cropViewBox;
  if (!box || box.width <= 0 || box.height <= 0) fail('SWIFT cropViewBox must be positive');
  if (!Array.isArray(swift.clipPolygon) || swift.clipPolygon.length < 6) {
    fail('SWIFT clip polygon is too coarse for a production candidate');
  } else if (box) {
    for (const point of swift.clipPolygon) {
      const [x, y] = point;
      if (x < box.x || x > box.x + box.width || y < box.y || y > box.y + box.height) {
        fail(`SWIFT clip point ${x},${y} falls outside cropViewBox`);
      }
    }
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
  console.log('[DEF-HD01-PQ] runtime composite source QA PASS');
}
