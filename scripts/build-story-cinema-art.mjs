// Deterministic delivery transcode of reviewed generated paintings, not new art.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
sharp.concurrency(1);
sharp.cache(false);
const ingestPath = path.join(root, 'content/episode01/final-art-ingest-manifest.json');
const ingest = JSON.parse(await readFile(ingestPath, 'utf8'));
for (const name of ['ramp-entry', 'work-yard', 'site-office', 'home-night']) {
  const source = path.join(root, 'art-source/story-cinema-v1', `${name}.png`);
  const target = path.join(root, 'public/assets/episode01/cg', `${name}-cinema.webp`);
  const metadata = await sharp(source).metadata();
  await sharp(source).resize(1920, 1080, {fit: 'cover'}).webp({quality: 92, effort: 5}).toFile(target);
  const bytes = await readFile(target);
  const row = ingest.assets.find(asset => asset.filename === `${name}.webp` || asset.filename === `${name}-cinema.webp`);
  if (!row) throw new Error(`Missing production ingest slot: ${name}`);
  Object.assign(row, {filename: `${name}-cinema.webp`, target_path: `public/assets/episode01/cg/${name}-cinema.webp`, source_generated_file: `art-source/story-cinema-v1/${name}.png`, width: 1920, height: 1080, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')});
  console.log(`${name}: ${metadata.width}x${metadata.height} source → 1920x1080 delivery WebP (upscaled)`);
}
ingest.batch_id = 'episode01-versioned-cinema-candidates-2026-10-17';
ingest.status = 'versioned_cinema_candidates_ingested';
ingest.source = 'Four retained baseline plates plus four built-in image_gen successors; archived ZIP metadata below describes the historical baseline only, not the active successor binaries.';
ingest.verification = {verified_at: '2026-10-17', exact_asset_count: 8, rule: 'All eight active files must match their recorded dimensions and SHA-256; visual lock requires separate composited-screen review.'};
await writeFile(ingestPath, JSON.stringify(ingest, null, 2) + '\n');
