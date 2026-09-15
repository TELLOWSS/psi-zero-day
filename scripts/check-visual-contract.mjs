import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const visuals = JSON.parse(
  await readFile(path.join(root, 'content/episode01/visuals.json'), 'utf8'),
);
const production = JSON.parse(
  await readFile(path.join(root, 'content/episode01/character-art-production.json'), 'utf8'),
);

const errors = [];
const warnings = [];

const visualCharacters = visuals.characters ?? {};
const productionCharacters = production.characters ?? [];
const productionById = new Map(productionCharacters.map(character => [character.id, character]));

const expectedCharacterIds = [
  'player',
  'kang_taesik',
  'yoon_sungho',
  'lee_jaehoon',
  'lim_junho',
  'choi_minseok',
  'seo_jeongmin',
  'oh_seungjae',
];

function normalizeAssetPath(value) {
  return String(value ?? '').replace(/^\/?public\//, '').replace(/^\//, '');
}

function requireTruthy(value, label) {
  if (!value) errors.push(`${label} is missing.`);
}

function collectDuplicates(items, keySelector) {
  const grouped = new Map();
  for (const item of items) {
    const key = keySelector(item);
    if (!key) continue;
    const bucket = grouped.get(key) ?? [];
    bucket.push(item.id);
    grouped.set(key, bucket);
  }
  return [...grouped.entries()].filter(([, ids]) => ids.length > 1);
}

for (const id of expectedCharacterIds) {
  const visual = visualCharacters[id];
  const prod = productionById.get(id);

  if (!visual) {
    errors.push(`visuals.json is missing character '${id}'.`);
    continue;
  }
  if (!prod) {
    errors.push(`character-art-production.json is missing character '${id}'.`);
    continue;
  }

  const identity = visual.identity ?? {};
  requireTruthy(identity.visual_role, `${id}.identity.visual_role`);
  requireTruthy(identity.age_read, `${id}.identity.age_read`);
  requireTruthy(identity.silhouette, `${id}.identity.silhouette`);
  requireTruthy(identity.face, `${id}.identity.face`);
  requireTruthy(identity.helmet, `${id}.identity.helmet`);
  requireTruthy(identity.outfit, `${id}.identity.outfit`);
  requireTruthy(identity.signature_prop, `${id}.identity.signature_prop`);
  requireTruthy(identity.default_pose, `${id}.identity.default_pose`);

  const portraitPath = normalizeAssetPath(visual.portrait_path);
  const mapPath = normalizeAssetPath(visual.map_path);
  const productionPortraitPath = normalizeAssetPath(prod.portrait_path);
  const productionMapPath = normalizeAssetPath(prod.map_path);

  if (portraitPath !== productionPortraitPath) {
    errors.push(`${id}: portrait path drift: '${portraitPath}' != '${productionPortraitPath}'.`);
  }
  if (mapPath !== productionMapPath) {
    errors.push(`${id}: map path drift: '${mapPath}' != '${productionMapPath}'.`);
  }

  if (!portraitPath.endsWith('-portrait.webp')) {
    errors.push(`${id}: production portrait path must end in -portrait.webp.`);
  }
  if (!mapPath.endsWith('-map.webp')) {
    errors.push(`${id}: production map path must end in -map.webp.`);
  }

  requireTruthy(prod.silhouette, `${id}.production.silhouette`);
  requireTruthy(prod.face_key, `${id}.production.face_key`);
  requireTruthy(prod.helmet_key, `${id}.production.helmet_key`);
  requireTruthy(prod.wardrobe_key, `${id}.production.wardrobe_key`);
  requireTruthy(prod.signature_prop, `${id}.production.signature_prop`);
  requireTruthy(prod.signature_pose, `${id}.production.signature_pose`);

  if (!Array.isArray(prod.must_not_resemble) || prod.must_not_resemble.length === 0) {
    warnings.push(`${id}: must_not_resemble is empty; identity collision review has no explicit peer.`);
  }
}

for (const id of Object.keys(visualCharacters)) {
  if (!expectedCharacterIds.includes(id)) {
    errors.push(`Unexpected Episode 01 visual character '${id}'. Update the locked cast contract intentionally before adding it.`);
  }
}

for (const id of productionById.keys()) {
  if (!expectedCharacterIds.includes(id)) {
    errors.push(`Unexpected production character '${id}'. Update the locked cast contract intentionally before adding it.`);
  }
}

if (productionCharacters.length !== expectedCharacterIds.length) {
  errors.push(`Expected ${expectedCharacterIds.length} production characters; found ${productionCharacters.length}.`);
}

for (const [field, label] of [
  ['silhouette', 'silhouette'],
  ['face_key', 'face key'],
  ['wardrobe_key', 'wardrobe key'],
  ['signature_prop', 'signature prop'],
  ['signature_pose', 'signature pose'],
]) {
  for (const [value, ids] of collectDuplicates(productionCharacters, item => item[field])) {
    errors.push(`Duplicate ${label} '${value}' across: ${ids.join(', ')}.`);
  }
}

for (const character of productionCharacters) {
  for (const peerId of character.must_not_resemble ?? []) {
    if (!productionById.has(peerId)) {
      errors.push(`${character.id}: must_not_resemble references unknown character '${peerId}'.`);
      continue;
    }

    const peer = productionById.get(peerId);
    const dimensions = [
      ['silhouette', character.silhouette, peer.silhouette],
      ['face_key', character.face_key, peer.face_key],
      ['wardrobe_key', character.wardrobe_key, peer.wardrobe_key],
      ['signature_prop', character.signature_prop, peer.signature_prop],
      ['signature_pose', character.signature_pose, peer.signature_pose],
    ];
    const same = dimensions.filter(([, a, b]) => a && b && a === b).map(([name]) => name);
    if (same.length > 0) {
      errors.push(`${character.id} collides with must-not-resemble peer ${peerId}: ${same.join(', ')}.`);
    }
  }
}

const foundation = visuals.backgrounds?.foundation;
if (!foundation) {
  errors.push('visuals.json is missing the locked Foundation background.');
} else {
  const foundationPath = normalizeAssetPath(foundation.path);
  if (foundationPath !== 'assets/episode01/backgrounds/foundation-map.webp') {
    errors.push(`Foundation path drift: '${foundationPath}'.`);
  }
  if (foundation.map_asset_id !== 'ep01.background.foundation.map') {
    errors.push(`Foundation asset id drift: '${foundation.map_asset_id}'.`);
  }
}

const direction = String(visuals.visual_direction?.style ?? '').toLowerCase();
if (!direction.includes('2.5d') || !direction.includes('casual-strategy')) {
  errors.push(`visual_direction.style must preserve the locked 2.5D casual-strategy direction; found '${visuals.visual_direction?.style ?? ''}'.`);
}

console.log('PSI : ZERO DAY — visual identity contract gate');
console.log(`Cast: ${productionCharacters.length}/${expectedCharacterIds.length}`);
console.log(`Visual direction: ${visuals.visual_direction?.style ?? 'MISSING'}`);

if (warnings.length) {
  console.log('');
  console.log(`Warnings (${warnings.length}):`);
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length) {
  console.error('');
  console.error(`Visual contract FAILED (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Visual contract PASSED: cast identity, asset paths, and Foundation map lock are internally consistent.');
}
