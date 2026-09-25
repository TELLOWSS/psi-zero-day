import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const benchmarkPath = path.resolve(root, 'content/defense/def-hd01-pq-benchmark.json');
const reportPath = path.resolve(root, 'qa/def-hd01-pq/step4-browser-report.json');
const apply = process.argv.includes('--apply');
const errors = [];

function fail(message) {
  errors.push(message);
}

function sha256(relative) {
  const absolute = path.resolve(root, 'public', relative);
  if (!fs.existsSync(absolute)) {
    fail(`Missing production asset: ${relative}`);
    return null;
  }
  return crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
}

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

const benchmark = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
if (!fs.existsSync(reportPath)) {
  fail('Fresh G2 browser report is missing.');
}

const report = fs.existsSync(reportPath)
  ? JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  : null;

if (benchmark.gate !== 'DEF-HD01-PQ') fail('Unexpected benchmark gate.');
if (benchmark.runtimePromotion?.approved === true) fail('G2 is already approved.');
if (benchmark.runtimePromotion?.previewCandidateOnGateBranch !== true) {
  fail('G2 must still be in preview-candidate state before promotion.');
}

if (report) {
  if (report.schema_version !== 2) fail('Fresh G2 report schema_version must be 2.');
  if (!report.generated_at || Number.isNaN(Date.parse(report.generated_at))) {
    fail('Fresh G2 report generated_at is missing or invalid.');
  } else {
    const ageMs = Date.now() - Date.parse(report.generated_at);
    if (ageMs < 0 || ageMs > 72 * 60 * 60 * 1000) {
      fail('Fresh G2 report must be no older than 72 hours.');
    }
  }

  if (!/^[0-9a-f]{40}$/.test(report.source_sha || '')) {
    fail('Fresh G2 report source_sha is missing or invalid.');
  }

  if (!Array.isArray(report.failures) || report.failures.length !== 0) {
    fail('Fresh G2 report contains browser QA failures.');
  }

  if (report.result?.status !== 'WON' || report.result?.wave !== 10) {
    fail('Fresh G2 report must complete a WON 10-wave run.');
  }
  if ((report.result?.stars ?? 0) < 1) {
    fail('Fresh G2 report must produce at least one star.');
  }

  if (report.visual?.boardHref !== 'assets/defense/board/ramp-01-hd01.webp') {
    fail('Fresh G2 report did not use the locked MASTER WORLD.');
  }

  if (
    report.pq?.enabled !== true
    || report.pq?.swift !== true
    || report.pq?.swiftAsset !== 'assets/defense/enemies/swift-pq01.svg'
  ) {
    fail('Fresh G2 report did not verify the dedicated SWIFT asset.');
  }

  if (report.pq?.control !== true || report.pq?.controlCount !== 1) {
    fail('Fresh G2 report did not verify exactly one CONTROL L1 candidate.');
  }

  for (const relative of [
    'qa/def-hd01-pq/05a-pq-swift-wave8.jpg',
    'qa/def-hd01-pq/06a-pq-control-l1.jpg',
  ]) {
    if (!fs.existsSync(path.resolve(root, relative))) {
      fail(`Fresh G2 screenshot is missing: ${relative}`);
    }
  }

  if (/^[0-9a-f]{40}$/.test(report.source_sha || '')) {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', report.source_sha, 'HEAD'], { cwd: root, stdio: 'ignore' });
      const changed = git(['diff', '--name-only', `${report.source_sha}..HEAD`])
        .split('\n')
        .filter(Boolean);
      const forbidden = changed.filter(name => !name.startsWith('qa/def-hd01-pq/'));
      if (forbidden.length) {
        fail('Code/assets changed after browser QA: ' + forbidden.join(', '));
      }
    } catch {
      fail('Fresh G2 report source_sha is not an ancestor of current HEAD.');
    }
  }
}

const integrity = benchmark.assetIntegrity;
for (const [label, entry] of Object.entries({
  masterWorld: integrity?.masterWorld,
  controlMarshal: integrity?.controlMarshal,
  controlBarrier: integrity?.controlBarrier,
  swift: integrity?.swift,
})) {
  if (!entry?.uri || !entry?.sha256) {
    fail(`Missing asset integrity metadata: ${label}`);
    continue;
  }
  const actual = sha256(entry.uri);
  if (actual && actual !== entry.sha256) {
    fail(`Asset SHA256 drifted for ${label}: expected ${entry.sha256}, got ${actual}`);
  }
}

if (benchmark.runtimeGate?.noGameplayCoordinateChange !== true) {
  fail('Gameplay coordinate lock is not active.');
}
if (benchmark.runtimeGate?.noBalanceChange !== true) {
  fail('Balance lock is not active.');
}

if (errors.length) {
  console.error('[DEF-HD01-PQ PROMOTION] BLOCKED');
  for (const error of errors) console.error(' - ' + error);
  process.exit(1);
}

const sourceSha = report.source_sha;
console.log('[DEF-HD01-PQ PROMOTION] READY');
console.log(' QA source SHA:', sourceSha);
console.log(' Current HEAD:', git(['rev-parse', 'HEAD']));
console.log(' SWIFT:', report.pq.swiftAsset);
console.log(' CONTROL count:', report.pq.controlCount);
console.log(' Result:', report.result.status, report.result.wave + '/10', 'stars=' + report.result.stars);

if (!apply) {
  console.log('Dry run only. Re-run with --apply to write the Production Lock.');
  process.exit(0);
}

benchmark.status = 'G2_PRODUCTION_LOCKED';
benchmark.next = 'MERGE_PR_48_THEN_BEGIN_DEF_CORE_01';
benchmark.runtimePromotion.approved = true;
benchmark.runtimePromotion.status = 'PRODUCTION_LOCKED';
benchmark.runtimePromotion.previewCandidateOnGateBranch = false;
benchmark.runtimePromotion.approvedAssets = {
  control: {
    kind: 'RUNTIME_COMPOSITE',
    sources: benchmark.benchmark.response.target.sources,
    marshalSha256: benchmark.assetIntegrity.controlMarshal.sha256,
    barrierSha256: benchmark.assetIntegrity.controlBarrier.sha256,
  },
  swift: {
    kind: 'STATIC_TRANSPARENT_SVG',
    asset: benchmark.benchmark.risk.target.asset,
    sha256: benchmark.assetIntegrity.swift.sha256,
    dimensions: benchmark.assetIntegrity.swift.dimensions,
    selfContained: true,
  },
};
benchmark.runtimePromotion.g2BrowserQa = {
  passed: true,
  evidence: {
    report: 'qa/def-hd01-pq/step4-browser-report.json',
    swift: 'qa/def-hd01-pq/05a-pq-swift-wave8.jpg',
    control: 'qa/def-hd01-pq/06a-pq-control-l1.jpg',
  },
  sourceSha,
  generatedAt: report.generated_at,
  result: {
    status: report.result.status,
    waves: '10/10',
    stars: report.result.stars,
    shield: report.result.shield,
  },
  note: 'Fresh schema-v2 browser evidence verified the self-contained dedicated SWIFT asset and exactly one CONTROL L1 candidate on the locked MASTER WORLD.',
};

benchmark.staticQa.productionApproval = true;
benchmark.manualReview.control.assessment = 'PRODUCTION_LOCKED';
benchmark.manualReview.swift.assessment = 'PRODUCTION_LOCKED';
benchmark.externalQaBlockers = [];
benchmark.repositorySync.finalG2Qa = {
  sourceSha,
  generatedAt: report.generated_at,
  promotionAppliedAt: new Date().toISOString(),
};
benchmark.runtimeGate.switchCondition = 'G2 Production Lock approved; main may render the locked CONTROL/SWIFT production benchmark.';

fs.writeFileSync(benchmarkPath, JSON.stringify(benchmark, null, 2) + '\n');
console.log('[DEF-HD01-PQ PROMOTION] APPLIED');
