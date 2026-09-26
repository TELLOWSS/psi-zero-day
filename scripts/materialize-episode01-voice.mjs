import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, 'content/episode01/voice-media.json'), 'utf8'));

for (const asset of manifest.assets) {
  const encoded = (await Promise.all(asset.chunks.map(async chunkPath =>
    (await readFile(path.join(root, chunkPath), 'utf8')).trim(),
  ))).join('');
  const bytes = Buffer.from(encoded, 'base64');
  const hash = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== asset.bytes) {
    throw new Error(`voice materialization byte mismatch: ${asset.source}: ${bytes.length} !== ${asset.bytes}`);
  }
  if (hash !== asset.sha256) {
    throw new Error(`voice materialization hash mismatch: ${asset.source}: ${hash} !== ${asset.sha256}`);
  }
  if (bytes.subarray(0, 4).toString('ascii') !== 'OggS') {
    throw new Error(`voice materialization is not Ogg: ${asset.source}`);
  }
  const target = path.join(root, asset.target);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
}

console.log(`Episode 01 voice materialized: ${manifest.assets.length} reviewed masters.`);
