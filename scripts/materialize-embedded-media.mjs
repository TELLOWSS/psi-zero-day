import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions } from './webp-dimensions.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const sourceDir = path.join(root, 'content/episode01/embedded-media');
const prefix = 'foundation-map.webp.b64.';
const target = path.join(root, 'public/assets/episode01/backgrounds/foundation-map.webp');

const EXPECTED = Object.freeze({
  parts: 16,
  encodedLength: 150248,
  bytes: 112686,
  width: 1920,
  height: 1080,
  sha256: 'ee9aefea829ddbdcd5883fab68144ae85759538f83b3ec5bfe4af43c7ad2d74d',
});

const files = (await readdir(sourceDir))
  .filter(name => name.startsWith(prefix) && /^\d{2}$/.test(name.slice(prefix.length)))
  .sort((a, b) => a.localeCompare(b));

if (files.length !== EXPECTED.parts) {
  throw new Error(`Foundation embedded media requires ${EXPECTED.parts} parts; found ${files.length}.`);
}

const chunks = [];
for (const [index, file] of files.entries()) {
  const text = (await readFile(path.join(sourceDir, file), 'utf8')).trim();
  const expectedPartLength = index === EXPECTED.parts - 1 ? 248 : 10000;
  if (text.length !== expectedPartLength) {
    throw new Error(`${file} has ${text.length} chars; expected ${expectedPartLength}.`);
  }
  if (!/^[A-Za-z0-9+/=]+$/.test(text)) {
    throw new Error(`${file} contains non-base64 characters.`);
  }
  chunks.push(text);
}

const encoded = chunks.join('');
if (encoded.length !== EXPECTED.encodedLength) {
  throw new Error(`Foundation base64 length ${encoded.length}; expected ${EXPECTED.encodedLength}.`);
}

const bytes = Buffer.from(encoded, 'base64');
if (bytes.length !== EXPECTED.bytes) {
  throw new Error(`Foundation WebP size ${bytes.length}; expected ${EXPECTED.bytes}.`);
}
if (!isWebP(bytes)) throw new Error('Materialized Foundation asset is not a WebP file.');

const dimensions = webPDimensions(bytes);
if (!dimensions || dimensions.width !== EXPECTED.width || dimensions.height !== EXPECTED.height) {
  throw new Error(
    `Foundation dimensions ${dimensions ? `${dimensions.width}x${dimensions.height}` : 'unreadable'}; `
    + `expected ${EXPECTED.width}x${EXPECTED.height}.`,
  );
}

const hash = createHash('sha256').update(bytes).digest('hex');
if (hash !== EXPECTED.sha256) {
  throw new Error(`Foundation SHA-256 mismatch: ${hash}.`);
}

if (!checkOnly) {
  await mkdir(path.dirname(target), { recursive: true });
  let unchanged = false;
  try {
    const current = await readFile(target);
    unchanged = current.length === bytes.length && current.equals(bytes);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  if (!unchanged) await writeFile(target, bytes);
  console.log(
    `${unchanged ? 'Verified' : 'Materialized'} Foundation final WebP `
    + `(${EXPECTED.width}x${EXPECTED.height}, ${EXPECTED.bytes.toLocaleString('en-US')} bytes).`,
  );
} else {
  console.log(`Foundation embedded media source verified (sha256 ${hash}).`);
}
