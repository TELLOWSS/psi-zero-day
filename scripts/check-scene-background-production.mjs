import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions } from './webp-dimensions.mjs';

const root = process.cwd();
const catalog = JSON.parse(await readFile(path.join(root, 'content/episode01/scene-background-catalog.json'), 'utf8'));
const requireFinal = process.argv.includes('--require-final');
const errors = [];
const rows = [];

async function exists(uri) {
  try {
    const bytes = await readFile(path.join(root, 'public', uri));
    return bytes;
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

for (const [key, item] of Object.entries(catalog.backgrounds ?? {})) {
  const rc = await exists(item.rc_path);
  if (!rc) errors.push(`${key}: missing RC fallback public/${item.rc_path}`);

  const final = await exists(item.final_path);
  if (!final) {
    rows.push({ key, status: 'RC', detail: item.rc_path });
    if (requireFinal) errors.push(`${key}: missing final WebP public/${item.final_path}`);
    continue;
  }

  if (!isWebP(final)) {
    errors.push(`${key}: final file is not valid WebP (${item.final_path})`);
    continue;
  }
  const dimensions = webPDimensions(final);
  if (!dimensions || dimensions.width < 1920 || dimensions.height < 1080) {
    errors.push(`${key}: final WebP must be at least 1920x1080 (${item.final_path})`);
    continue;
  }
  rows.push({ key, status: 'FINAL', detail: `${dimensions.width}x${dimensions.height}` });
}

for (const row of rows) console.log(`${row.status.padEnd(5)} ${row.key.padEnd(18)} ${row.detail}`);
const finalCount = rows.filter(row => row.status === 'FINAL').length;
console.log(`Episode 01 immersive backgrounds: ${finalCount}/${rows.length} final WebP; ${rows.length - finalCount} RC fallback.`);

if (errors.length) {
  console.error('- ' + errors.join('\n- '));
  process.exitCode = 1;
}
