import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const lock = read('content/episode01/character-master-lock.json');
const production = read('content/episode01/character-art-production.json');
const spec = read('content/episode01/character-art-spec.json');
const visuals = read('content/episode01/visuals.json');
const performance = read('content/episode01/character-performance-production.json');
const localizationFiles = [
  'content/episode01/ko.json',
  'content/episode01/inspection-ko.json',
  'content/episode01/responsibility-ko.json',
].map(read);
const messages = Object.assign({}, ...localizationFiles.map(file => file.messages ?? {}));
const runtimeFiles = [
  'content/episode01/characters.json',
  'content/episode01/inspection-characters.json',
  'content/episode01/responsibility-characters.json',
];
const runtime = runtimeFiles.flatMap(rel => read(rel).map(c => ({ ...c, __source: rel })));

const errors = [];
const eq = (actual, expected, label) => {
  if (actual !== expected) errors.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
};
const byId = items => new Map(items.map(item => [item.id, item]));
const runtimeById = byId(runtime);
const productionById = byId(production.characters ?? []);
const lockedIds = lock.characters.map(c => c.id);

if (new Set(lockedIds).size !== lockedIds.length) errors.push('character-master-lock: duplicate character id');
if (new Set(runtime.map(c => c.id)).size !== runtime.length) errors.push('runtime: duplicate character id');
eq([...runtimeById.keys()].sort().join('|'), [...lockedIds].sort().join('|'), 'runtime cast');

for (const c of lock.characters) {
  const runtimeChar = runtimeById.get(c.id);
  const art = productionById.get(c.id);
  const visual = visuals.characters?.[c.id];
  const perf = performance.characters?.[c.id];
  const artSpec = spec.characters?.[c.id];

  if (!runtimeChar) { errors.push(`${c.id}: missing runtime character`); continue; }
  if (!art) errors.push(`${c.id}: missing production art contract`);
  if (!visual) errors.push(`${c.id}: missing visuals mapping`);
  if (!perf) errors.push(`${c.id}: missing performance mapping`);
  if (!artSpec) errors.push(`${c.id}: missing art spec`);

  eq(runtimeChar.__source, c.runtime_source, `${c.id}.runtime_source`);
  eq(runtimeChar.name_text_id, c.name_text_id, `${c.id}.name_text_id`);
  eq(runtimeChar.role_text_id, c.role_text_id, `${c.id}.role_text_id`);
  eq(runtimeChar.age_group_text_id, c.age_text_id, `${c.id}.age_text_id`);
  eq(messages[c.name_text_id], c.name_ko, `${c.id}.name_ko`);
  eq(messages[c.role_text_id], c.role_ko, `${c.id}.role_ko`);
  eq(messages[c.age_text_id], c.age_ko, `${c.id}.age_ko`);

  if (art) {
    eq(art.age_band, c.age_band, `${c.id}.age_band`);
    eq(art.portrait_path, c.portrait_path, `${c.id}.portrait_path`);
    eq(art.map_path, c.map_path, `${c.id}.map_path`);
  }
  if (visual) {
    eq(visual.portrait_asset_id, c.portrait_asset_id, `${c.id}.portrait_asset_id`);
    eq(visual.map_asset_id, c.map_asset_id, `${c.id}.map_asset_id`);
    eq(visual.portrait_path, c.portrait_path, `${c.id}.visual portrait_path`);
    eq(visual.map_path, c.map_path, `${c.id}.visual map_path`);
  }
  if (perf) {
    eq(perf.asset_id_prefix, c.performance_asset_id_prefix, `${c.id}.performance_asset_id_prefix`);
    eq(perf.path_prefix, c.performance_path_prefix, `${c.id}.performance_path_prefix`);
  }
  if (artSpec) {
    eq(artSpec.role, c.role_ko, `${c.id}.art spec role`);
  }
}

eq((production.expression_set ?? []).join('|'), lock.expression_contract.join('|'), 'production expression contract');
eq((performance.expression_set ?? []).join('|'), lock.expression_contract.join('|'), 'performance expression contract');

if (errors.length) {
  console.error('Character Master Lock failed:');
  errors.forEach(error => console.error(' -', error));
  process.exit(1);
}

console.log(`Character Master Lock OK: ${lockedIds.length} identities, portrait/map/performance routing consistent.`);
console.log('Performance expression coverage remains intentionally partial; missing variants must not be reported as Visual Production Locked.');
