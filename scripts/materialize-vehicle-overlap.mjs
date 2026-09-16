import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const sourceDir = path.join(root, 'content/episode01/embedded-media');
const target = path.join(root, 'public/assets/episode01/scene-elements/vehicle-overlap.webp');

const PARTS = Object.freeze([
  ['01', 900, '1ccf21764b7c9b5c502d665a588ac2573346e0974cdcff5ab2d4246e6853300d'],
  ['02', 900, '076b4813d89dfd1b06fc839410a19e151e724d42a78923f6641d52baed40a49f'],
  ['03', 900, '89115c0756372645d9625a8e2f5d56920d61409c6a9f7db5418942483d1aa6f7'],
  ['04', 900, '47368f4c990381a93920d723b2de28ec84106bd6a10f9b30894a15b4b1d2b7f0'],
  ['05', 900, '0406aba743390aa2def33d09a70c20fd601c587a30c4661511b093696e6f8000'],
  ['06', 796, '6f683e265de200bb1e1abced86e0b607b944693c685b7a7d4988e32de92822fa'],
]);

const EXPECTED = Object.freeze({
  encodedLength: 5296,
  encodedSha256: '975d8a048345dcebbba2a8ecb645d2e5ad8bebbd48bfb10e48960ad90370affb',
  bytes: 3972,
  width: 768,
  height: 512,
  sha256: '3de85114ac9eee95034d2c39e9f88d7bb6b6f7e8b9c39bdc9669674709a2287f',
});

const chunks = [];
const errors = [];
for (const [suffix, length, sha] of PARTS) {
  const file = `vehicle-overlap-final.webp.b64.${suffix}`;
  const text = (await readFile(path.join(sourceDir, file), 'utf8')).trim();
  const actualSha = createHash('sha256').update(text).digest('hex');
  if (text.length !== length || actualSha !== sha) {
    errors.push(`${file}: length ${text.length}/${length}, sha ${actualSha}/${sha}`);
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(text)) errors.push(`${file}: contains non-base64 characters`);
  chunks.push(text);
}
if (errors.length) throw new Error(`Vehicle overlap embedded source mismatch:\n${errors.join('\n')}`);

const encoded = chunks.join('');
if (encoded.length !== EXPECTED.encodedLength) throw new Error(`Vehicle overlap base64 length ${encoded.length}; expected ${EXPECTED.encodedLength}.`);
const encodedSha = createHash('sha256').update(encoded).digest('hex');
if (encodedSha !== EXPECTED.encodedSha256) throw new Error(`Vehicle overlap base64 SHA-256 mismatch: ${encodedSha}.`);

const bytes = Buffer.from(encoded, 'base64');
if (bytes.length !== EXPECTED.bytes) throw new Error(`Vehicle overlap WebP size ${bytes.length}; expected ${EXPECTED.bytes}.`);
if (!isWebP(bytes)) throw new Error('Materialized vehicle overlap asset is not a WebP file.');
const dimensions = webPDimensions(bytes);
if (!dimensions || dimensions.width !== EXPECTED.width || dimensions.height !== EXPECTED.height) {
  throw new Error(`Vehicle overlap dimensions ${dimensions ? `${dimensions.width}x${dimensions.height}` : 'unreadable'}; expected ${EXPECTED.width}x${EXPECTED.height}.`);
}
if (webPHasAlpha(bytes) !== true) throw new Error('Vehicle overlap final WebP must include alpha transparency.');
const hash = createHash('sha256').update(bytes).digest('hex');
if (hash !== EXPECTED.sha256) throw new Error(`Vehicle overlap SHA-256 mismatch: ${hash}.`);

if (checkOnly) {
  const current = await readFile(target);
  if (!current.equals(bytes)) throw new Error('Vehicle overlap public WebP is not the materialized canonical asset.');
  console.log(`Verified vehicle overlap final WebP (${EXPECTED.width}x${EXPECTED.height}, ${EXPECTED.bytes.toLocaleString('en-US')} bytes).`);
} else {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  console.log(`Materialized vehicle overlap final WebP (${EXPECTED.width}x${EXPECTED.height}, ${EXPECTED.bytes.toLocaleString('en-US')} bytes).`);
}
