// Deterministic delivery transcode of reviewed generated paintings, not new art.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
sharp.concurrency(1);
sharp.cache(false);
for (const name of ['ramp-entry', 'work-yard', 'site-office', 'home-night']) {
  const source = path.join(root, 'art-source/story-cinema-v1', `${name}.png`);
  const target = path.join(root, 'public/assets/episode01/cg', `${name}-cinema.webp`);
  const metadata = await sharp(source).metadata();
  await sharp(source).resize(1920, 1080, {fit: 'cover'}).webp({quality: 92, effort: 5}).toFile(target);
  console.log(`${name}: ${metadata.width}x${metadata.height} source → 1920x1080 delivery WebP (upscaled)`);
}
