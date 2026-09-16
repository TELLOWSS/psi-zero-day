import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const sourceDir = path.join(root, 'content/episode01/embedded-media');
const manifestPath = path.join(sourceDir, 'character-media.json');

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { schema_version: 1, assets: [] };
    }
    throw error;
  }
}

async function readEmbeddedAsset(asset) {
  if (!Array.isArray(asset.parts) || asset.parts.length === 0) {
    throw new Error(`${asset.id}: embedded character asset must declare at least one base64 part.`);
  }

  const chunks = [];
  for (const part of asset.parts) {
    const filePath = path.join(sourceDir, part.file);
    const text = (await readFile(filePath, 'utf8')).trim();
    if (!/^[A-Za-z0-9+/=]+$/.test(text)) {
      throw new Error(`${asset.id}: ${part.file} contains non-base64 characters.`);
    }
    if (text.length !== part.length) {
      throw new Error(`${asset.id}: ${part.file} length ${text.length}; expected ${part.length}.`);
    }
    const actualPartSha = sha256(text);
    if (actualPartSha !== part.sha256) {
      throw new Error(`${asset.id}: ${part.file} SHA-256 mismatch: ${actualPartSha}.`);
    }
    chunks.push(text);
  }

  const encoded = chunks.join('');
  if (encoded.length !== asset.encoded_length) {
    throw new Error(`${asset.id}: encoded length ${encoded.length}; expected ${asset.encoded_length}.`);
  }
  const encodedSha = sha256(encoded);
  if (encodedSha !== asset.encoded_sha256) {
    throw new Error(`${asset.id}: encoded SHA-256 mismatch: ${encodedSha}.`);
  }

  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length !== asset.bytes) {
    throw new Error(`${asset.id}: WebP bytes ${bytes.length}; expected ${asset.bytes}.`);
  }
  if (!isWebP(bytes)) {
    throw new Error(`${asset.id}: materialized character asset is not WebP.`);
  }

  const dimensions = webPDimensions(bytes);
  if (!dimensions || dimensions.width !== asset.width || dimensions.height !== asset.height) {
    throw new Error(`${asset.id}: dimensions ${dimensions ? `${dimensions.width}x${dimensions.height}` : 'unreadable'}; expected ${asset.width}x${asset.height}.`);
  }
  if (asset.alpha === true && webPHasAlpha(bytes) !== true) {
    throw new Error(`${asset.id}: final character WebP must include alpha transparency.`);
  }

  const actualSha = sha256(bytes);
  if (actualSha !== asset.sha256) {
    throw new Error(`${asset.id}: WebP SHA-256 mismatch: ${actualSha}.`);
  }

  return bytes;
}

async function writeIfChanged(target, bytes) {
  await mkdir(path.dirname(target), { recursive: true });
  try {
    const current = await readFile(target);
    if (current.length === bytes.length && current.equals(bytes)) return true;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  await writeFile(target, bytes);
  return false;
}

const manifest = await readManifest();
if (manifest.schema_version !== 1 || !Array.isArray(manifest.assets)) {
  throw new Error('Embedded character media manifest must use schema_version 1 with an assets array.');
}

for (const asset of manifest.assets) {
  if (!asset?.id || !asset?.target) throw new Error('Embedded character media entry requires id and target.');
  if (!/^assets\/episode01\/characters\/[a-z0-9-]+\.webp$/.test(asset.target)) {
    throw new Error(`${asset.id}: target must be an Episode 01 character WebP path.`);
  }

  const bytes = await readEmbeddedAsset(asset);
  const target = path.join(root, 'public', asset.target);

  if (checkOnly) {
    let current;
    try {
      current = await readFile(target);
    } catch (error) {
      if (error?.code === 'ENOENT') throw new Error(`${asset.id}: final target is missing: public/${asset.target}`);
      throw error;
    }
    const currentSha = sha256(current);
    if (currentSha !== asset.sha256) {
      throw new Error(`${asset.id}: public target SHA-256 mismatch: ${currentSha}.`);
    }
    console.log(`Verified ${asset.id} (${asset.width}x${asset.height}, ${asset.bytes.toLocaleString('en-US')} bytes).`);
  } else {
    const unchanged = await writeIfChanged(target, bytes);
    console.log(`${unchanged ? 'Verified' : 'Materialized'} ${asset.id} (${asset.width}x${asset.height}, ${asset.bytes.toLocaleString('en-US')} bytes).`);
  }
}

if (manifest.assets.length === 0) {
  console.log('Embedded character media manifest is ready; no final character WebP sources are registered yet.');
}
