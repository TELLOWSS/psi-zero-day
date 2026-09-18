import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'content/episode01/character-art-production.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const chars = data.characters ?? [];
const errors = [];
const warnings = [];

const required = ['id','age_band','presentation','silhouette','face_key','face_geometry','helmet_key','wardrobe_key','signature_prop','signature_pose','regeneration_prompt','negative_prompt'];
for (const c of chars) {
  for (const key of required) {
    if (c[key] === undefined || c[key] === null || c[key] === '') errors.push(`${c.id}: missing ${key}`);
  }
  const face = c.face_geometry ?? {};
  for (const key of ['shape','jaw','eyes','brows','nose']) {
    if (!face[key]) errors.push(`${c.id}: face_geometry.${key} is required`);
  }
}

function duplicates(field, selector = c => c[field]) {
  const seen = new Map();
  for (const c of chars) {
    const value = selector(c);
    if (!value) continue;
    const list = seen.get(value) ?? [];
    list.push(c.id);
    seen.set(value, list);
  }
  return [...seen.entries()].filter(([, ids]) => ids.length > 1);
}

for (const [value, ids] of duplicates('face_key')) errors.push(`duplicate face_key "${value}": ${ids.join(', ')}`);
for (const [value, ids] of duplicates('silhouette')) warnings.push(`shared silhouette "${value}": ${ids.join(', ')}`);
for (const [value, ids] of duplicates('combo', c => `${c.helmet_key}::${c.wardrobe_key}`)) {
  errors.push(`duplicate helmet+wardrobe identity "${value}": ${ids.join(', ')}`);
}

const byId = new Map(chars.map(c => [c.id, c]));
for (const c of chars) {
  for (const otherId of c.must_not_resemble ?? []) {
    const other = byId.get(otherId);
    if (!other) {
      warnings.push(`${c.id}: must_not_resemble references unknown id ${otherId}`);
      continue;
    }
    let same = 0;
    if (c.presentation === other.presentation) same++;
    if (c.age_band === other.age_band) same++;
    if (c.face_geometry?.shape === other.face_geometry?.shape) same++;
    if (c.face_geometry?.eyes === other.face_geometry?.eyes) same++;
    if (c.silhouette === other.silhouette) same++;
    if (c.helmet_key === other.helmet_key) same++;
    if (c.wardrobe_key === other.wardrobe_key) same++;
    if (c.signature_prop === other.signature_prop) same++;
    if (same >= 5) errors.push(`${c.id} too similar to ${otherId}: ${same}/8 identity axes match`);
  }
}

const cast = data.visual_uniqueness?.main_title_cast ?? [];
if (cast.length !== 3) errors.push('main_title_cast must contain exactly 3 characters');
const castChars = cast.map(id => byId.get(id)).filter(Boolean);
if (new Set(castChars.map(c => c.silhouette)).size < castChars.length) errors.push('main_title_cast silhouettes must be unique');
if (new Set(castChars.map(c => c.helmet_key)).size < 2) errors.push('main_title_cast needs at least two helmet identities');
if (new Set(castChars.map(c => c.presentation)).size < 2) warnings.push('main_title_cast has limited gender-presentation contrast');
if (new Set(castChars.map(c => c.age_band)).size < 3) warnings.push('main_title_cast should span three age bands');

if (warnings.length) {
  console.warn('Character identity warnings:');
  warnings.forEach(item => console.warn(' -', item));
}
if (errors.length) {
  console.error('Character identity contract failed:');
  errors.forEach(item => console.error(' -', item));
  process.exit(1);
}
console.log(`Character identity contract OK: ${chars.length} characters, title cast ${cast.join(' / ')}`);
