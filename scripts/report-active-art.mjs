import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, 'content/episode01/assets.json'), 'utf8'));

function tier(uri) {
  const clean = String(uri ?? '').split(/[?#]/, 1)[0].toLowerCase();
  if (clean.endsWith('.webp')) return 'FINAL';
  if (clean.endsWith('-rc.svg')) return 'RC';
  if (clean.endsWith('.svg')) return 'FALLBACK';
  return 'OTHER';
}

const imageAssets = [...(manifest.assets ?? [])]
  .filter(asset => asset.type === 'image')
  .sort((a, b) => a.asset_id.localeCompare(b.asset_id));

const counts = { FINAL: 0, RC: 0, FALLBACK: 0, OTHER: 0 };
console.log('PSI : ZERO DAY — active Episode 01 visual assets');
console.log('');
for (const asset of imageAssets) {
  const uri = asset.variants?.[0]?.uri ?? '';
  const activeTier = tier(uri);
  counts[activeTier] += 1;
  console.log(`${activeTier.padEnd(8)} ${asset.asset_id.padEnd(38)} ${uri}`);
}
console.log('');
console.log(`Summary: FINAL ${counts.FINAL} · RC ${counts.RC} · FALLBACK ${counts.FALLBACK} · OTHER ${counts.OTHER}`);
