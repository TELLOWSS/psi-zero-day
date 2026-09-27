import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifest = JSON.parse(await readFile(path.join(root, 'content/episode01/voice-media.json'), 'utf8'));

let materialized = 0;
let pending = 0;

for (const asset of manifest.assets) {
  const existingChunks = asset.chunks.filter(chunkPath => existsSync(path.join(root, chunkPath)));
  if (existingChunks.length === 0) {
    pending += 1;
    continue;
  }
  if (existingChunks.length !== asset.chunks.length) {
    throw new Error(`voice materialization has partial chunk set: ${asset.source}: ${existingChunks.length}/${asset.chunks.length}`);
  }
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
  materialized += 1;
}

console.log(`Episode 01 voice materialized: ${materialized}; pending embedded sources: ${pending}.`);
