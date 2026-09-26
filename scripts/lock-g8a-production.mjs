import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const reportRel = process.env.PSI_G8A_REPORT || 'artifacts/g8a-bottom-up-map/g8a-bottom-up-map-report.json';
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const writeJson = (rel, value) => fs.writeFileSync(path.join(root, rel), JSON.stringify(value, null, 2) + '\n');

const finalCheck = spawnSync(process.execPath, ['scripts/check-g8a-final-assets.mjs', '--require-final'], {
  cwd: root,
  stdio: 'inherit',
});
if (finalCheck.status !== 0) throw new Error('Final G8-A asset validation failed.');

if (!fs.existsSync(path.join(root, reportRel))) {
  throw new Error('G8-A actual-play QA report missing: ' + reportRel);
}
const report = readJson(reportRel);
if (report.failures?.length) throw new Error('G8-A QA report contains failures: ' + JSON.stringify(report.failures));
if (report.gate_state !== 'READY_FOR_PRODUCTION_REVIEW') {
  throw new Error('G8-A is not READY_FOR_PRODUCTION_REVIEW: ' + report.gate_state);
}

for (const [name, state] of [['desktop', report.desktop], ['mobile', report.mobile]]) {
  if (!state) throw new Error(name + ' QA state missing');
  if (state.worldFinal !== true) throw new Error(name + ': final world raster is not active');
  if (state.swiftFinal !== 1) throw new Error(name + ': final SWIFT raster is not active exactly once');
  if (state.prototypeBoardItems !== 0) throw new Error(name + ': prototype visuals remain');
  if ((state.activeSvgVisuals?.length ?? 0) !== 0) throw new Error(name + ': SVG visual leakage remains');
  if (state.overflow) throw new Error(name + ': horizontal overflow remains');
}

const familyPath = 'content/defense/production-map-family-v1.json';
const policyPath = 'content/defense/final-art-policy.json';
const family = readJson(familyPath);
const policy = readJson(policyPath);
const map = family.maps?.find(item => item.mapId === 'map-apt-bottom-up-excavation-01');
if (!map) throw new Error('G8-A production map entry is missing.');

family.status = 'G8A_PRODUCTION_LOCKED';
map.status = 'PRODUCTION_LOCKED';
map.finalArtPolicy.productionLockAllowed = true;
map.finalArtPolicy.blockingReason = '';
map.legalCompliance.status = 'PRODUCTION_LOCKED';
map.legalCompliance.productionLockAllowed = true;
map.representativeSlice.riskState = 'FINAL_RASTER_LOCKED';
map.representativeSlice.worldPlate.state = 'FINAL_RASTER_LOCKED';
map.representativeSlice.browserQa = {
  sourceSha: report.source_sha ?? null,
  map: report.desktop.map,
  wave: 8,
  controlPqCount: report.desktop.controlPq,
  swiftCount: report.desktop.swift,
  swiftFinalCount: report.desktop.swiftFinal,
  worldFinal: report.desktop.worldFinal,
  activeSvgVisuals: report.desktop.activeSvgVisuals,
  prototypeBoardItems: report.desktop.prototypeBoardItems,
  desktopOverflow: report.desktop.overflow,
  mobileOverflow: report.mobile.overflow,
  result: 'PRODUCTION_LOCK_PASS',
};

policy.enforcement.g8aState = 'PRODUCTION_LOCKED';
policy.enforcement.reason = 'WORLD and SWIFT final rasters passed binary intake plus desktop/mobile actual-play QA with zero prototype/SVG leakage.';
policy.enforcement.next = 'Proceed to the next representative production slice without reopening G8-A topology or art contracts.';

writeJson(familyPath, family);
writeJson(policyPath, policy);
console.log('G8A_PRODUCTION_LOCK=PASS');
