import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const sourceDir = path.join(root, 'content/episode01/embedded-media');
const manifestPath = path.join(sourceDir, 'character-media.json');
const chunkSize = 18_000; // divisible by 4 so each base64 boundary is stable

const { values } = parseArgs({
  options: {
    id: { type: 'string' },
    file: { type: 'string' },
    target: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
  strict: true,
});

function fail(message) {
  console.error(`Character media staging failed: ${message}`);
  process.exitCode = 1;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return { schema_version: 1, assets: [] };
    throw error;
  }
}

function minimumDimensions(id) {
  if (id.endsWith('-portrait')) return { width: 1024, height: 1024 };
  if (id.endsWith('-map')) return { width: 768, height: 1024 };
  return undefined;
}

async function writeImmutablePart(filename, text) {
  const filePath = path.join(sourceDir, filename);
  try {
    const current = await readFile(filePath, 'utf8');
    if (current === text) return;
    throw new Error(`${filename} already exists with different content.`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  await writeFile(filePath, text, 'utf8');
}

async function removeSupersededParts(id, keep) {
  const prefix = `${id}.webp.`;
  for (const name of await readdir(sourceDir)) {
    if (!name.startsWith(prefix) || !name.includes('.b64.') || keep.has(name)) continue;
    try {
      await unlink(path.join(sourceDir, name));
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
}

if (!values.id || !values.file) {
  fail('usage: node scripts/stage-character-media.mjs --id <character-map|character-portrait> --file <input.webp> [--target assets/episode01/characters/name.webp] [--dry-run]');
} else if (!/^[a-z0-9-]+$/.test(values.id)) {
  fail(`invalid id: ${values.id}`);
} else if (!values.id.endsWith('-map') && !values.id.endsWith('-portrait')) {
  fail('id must end with -map or -portrait.');
} else {
  const target = values.target ?? `assets/episode01/characters/${values.id}.webp`;
  if (!/^assets\/episode01\/characters\/[a-z0-9-]+\.webp$/.test(target)) {
    fail(`invalid target: ${target}`);
  } else if (path.posix.basename(target) !== `${values.id}.webp`) {
    fail(`target basename must match id (${values.id}.webp).`);
  } else {
    const inputPath = path.resolve(root, values.file);
    const bytes = await readFile(inputPath);
    if (!isWebP(bytes)) {
      fail(`${values.file} is not a valid WebP container.`);
    } else {
      const dimensions = webPDimensions(bytes);
      if (!dimensions) {
        fail(`${values.file} has unreadable WebP dimensions.`);
      } else if (webPHasAlpha(bytes) !== true) {
        fail(`${values.file} must include alpha transparency.`);
      } else {
        const minimum = minimumDimensions(values.id);
        if (minimum && (dimensions.width < minimum.width || dimensions.height < minimum.height)) {
          fail(`${dimensions.width}x${dimensions.height} is below ${minimum.width}x${minimum.height} for ${values.id}.`);
        } else {
          const manifest = await readManifest();
          if (manifest.schema_version !== 1 || !Array.isArray(manifest.assets)) {
            fail('character-media.json must use schema_version 1 with an assets array.');
          } else if (manifest.assets.some(asset => asset.id !== values.id && asset.target === target)) {
            fail(`${target} is already owned by another manifest entry.`);
          } else {
            const binarySha = sha256(bytes);
            const encoded = bytes.toString('base64');
            const encodedSha = sha256(encoded);
            const version = binarySha.slice(0, 12);
            const chunks = [];
            for (let offset = 0; offset < encoded.length; offset += chunkSize) {
              chunks.push(encoded.slice(offset, offset + chunkSize));
            }

            const parts = chunks.map((text, index) => ({
              file: `${values.id}.webp.${version}.b64.${String(index + 1).padStart(2, '0')}`,
              length: text.length,
              sha256: sha256(text),
            }));

            const entry = {
              id: values.id,
              target,
              width: dimensions.width,
              height: dimensions.height,
              alpha: true,
              bytes: bytes.length,
              sha256: binarySha,
              encoded_length: encoded.length,
              encoded_sha256: encodedSha,
              parts,
            };

            const nextManifest = {
              schema_version: 1,
              assets: [...manifest.assets.filter(asset => asset.id !== values.id), entry]
                .sort((a, b) => a.id.localeCompare(b.id)),
            };

            if (values['dry-run']) {
              console.log(JSON.stringify(entry, null, 2));
            } else {
              await mkdir(sourceDir, { recursive: true });

              // New content-addressed chunks are written first. The manifest is replaced last,
              // so an interrupted staging run cannot make the previous valid entry point at
              // partially overwritten chunks.
              for (let index = 0; index < parts.length; index += 1) {
                await writeImmutablePart(parts[index].file, chunks[index]);
              }

              const temporaryManifest = `${manifestPath}.tmp-${process.pid}`;
              await writeFile(temporaryManifest, `${JSON.stringify(nextManifest, null, 2)}\n`, 'utf8');
              await rename(temporaryManifest, manifestPath);

              const keep = new Set(parts.map(part => part.file));
              await removeSupersededParts(values.id, keep);

              console.log(
                `Staged ${values.id}: ${dimensions.width}x${dimensions.height}, `
                + `${bytes.length.toLocaleString('en-US')} bytes, ${parts.length} chunk(s), SHA-256 ${binarySha}.`,
              );
              console.log('Run npm run assets:embedded to materialize and re-verify the staged WebP.');
            }
          }
        }
      }
    }
  }
}
