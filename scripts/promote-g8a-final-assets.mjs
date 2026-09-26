import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const writeJson = (rel, value) => fs.writeFileSync(path.join(root, rel), JSON.stringify(value, null, 2) + '\n');

const check = spawnSync(process.execPath, ['scripts/check-g8a-final-assets.mjs', '--candidate'], {
  cwd: root,
  stdio: 'inherit',
});
if (check.status !== 0) {
  throw new Error('G8-A candidate asset validation failed; promotion aborted.');
}

const worldPath = 'content/defense/g8a-world-final-art.json';
const swiftPath = 'content/defense/g8a-swift-final-art.json';
const familyPath = 'content/defense/production-map-family-v1.json';

const world = readJson(worldPath);
const swift = readJson(swiftPath);
const family = readJson(familyPath);
const map = family.maps?.find(item => item.mapId === 'map-apt-bottom-up-excavation-01');
if (!map) throw new Error('G8-A production map entry is missing.');

if (world.status !== 'ASSET_PENDING' || world.promotion?.productionApproved !== false) {
  throw new Error('WORLD is not in ASSET_PENDING state.');
}
if (swift.status !== 'ASSET_PENDING' || swift.promotion?.productionApproved !== false) {
  throw new Error('SWIFT is not in ASSET_PENDING state.');
}

world.status = 'PRODUCTION_APPROVED';
world.promotion.productionApproved = true;
swift.status = 'PRODUCTION_APPROVED';
swift.promotion.productionApproved = true;

family.status = 'G8A_FINAL_ASSETS_APPROVED_QA_REQUIRED';
map.runtimeUri = world.runtimeUri;
map.format = world.format;
map.width = world.runtime.width;
map.height = world.runtime.height;
map.status = 'PRODUCTION_CANDIDATE';
map.source = world.sourceMaster.repositoryUri;
map.sourceRole = 'PROCESS_SPECIFIC_FINAL_RASTER_CANDIDATE';
map.visualFit = [
  'process-specific bottom-up open-excavation final raster candidate',
  'no baked HUD, text, logo, route or pad',
  'awaiting desktop/mobile actual-play Production Review',
];
map.finalArtPolicy.productionLockAllowed = false;
map.finalArtPolicy.blockingReason = 'Final WORLD and SWIFT rasters passed binary intake. Actual-play legal/visual/browser QA is still required before Production Lock.';
map.legalCompliance.status = 'FINAL_ASSETS_APPROVED_QA_PENDING';
map.legalCompliance.productionLockAllowed = false;
map.representativeSlice.riskState = 'FINAL_RASTER_APPROVED_QA_PENDING';
map.representativeSlice.worldPlate.state = 'FINAL_RASTER_APPROVED_QA_PENDING';
map.representativeSlice.worldPlate.currentRuntime = world.runtimeUri;
map.representativeSlice.worldPlate.currentRole = 'PROCESS_SPECIFIC_FINAL_RASTER_CANDIDATE';

writeJson(worldPath, world);
writeJson(swiftPath, swift);
writeJson(familyPath, family);

console.log('G8A_PROMOTION=FINAL_ASSETS_APPROVED_QA_REQUIRED');
