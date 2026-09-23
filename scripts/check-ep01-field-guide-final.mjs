import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const expected = {
  'vehicle-pedestrian-separation.webp': ['900bd3b7ca99261d6b5d49476e64b54d8e8670fbddf29e7dd8d89a79612c52e4', 136318],
  'material-yard.webp': ['eb6350820151a983b0d5960218d8a9ac590fab8cad3fede2e514cce00229d142', 169282],
  'temporary-distribution-board.webp': ['deba5fac00af118bdf6dcc3402b2ee9dd1ae16c86b77a00acf5a12f924ebf5b9', 84102],
  'temporary-lighting-pack.webp': ['f1bc58b504229c93d1cff85dd29014643a08f45e435923fa2f0a08523083e4ec', 142140],
  'ppe-issue-station.webp': ['be7211aa94cde3ef9b820b18791b8ac88328b1e1d4cfa7935823573bcb5f9074', 110202],
  'fire-extinguisher-station.webp': ['7c7c0af66c2dd3d982c81d87c79beea81a1f1c0b8fd8da3d0a4ca77ff785b2cf', 84980],
  'first-aid-aed.webp': ['61a588d703059995e74f1b3b091791851a6b8fa1cd92d0ff5a90c20de9a027a1', 86316],
  'site-weather-station.webp': ['a89841289665448279216e2f62e0c5f9537adcd71133e223584082c210996fb7', 115456],
};

const errors = [];
for (const [file, [expectedHash, expectedBytes]] of Object.entries(expected)) {
  const filePath = path.join(process.cwd(), 'public/assets/episode01/scene-elements', file);
  const bytes = await readFile(filePath);
  const hash = createHash('sha256').update(bytes).digest('hex');
  const dimensions = webPDimensions(bytes);
  if (!isWebP(bytes)) errors.push(`${file}: invalid WebP header`);
  if (bytes.length !== expectedBytes) errors.push(`${file}: bytes ${bytes.length} != ${expectedBytes}`);
  if (hash !== expectedHash) errors.push(`${file}: sha256 mismatch`);
  if (dimensions?.width !== 768 || dimensions?.height !== 768) {
    errors.push(`${file}: expected 768x768, got ${dimensions?.width ?? '?'}x${dimensions?.height ?? '?'}`);
  }
  if (webPHasAlpha(bytes) !== true) errors.push(`${file}: alpha transparency missing`);
}

if (errors.length) {
  console.error('Episode 01 Field Guide binary lock FAILED.');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Episode 01 Field Guide binary lock valid: FG003-FG010, 8 realistic-v2 WebP assets.');
}
