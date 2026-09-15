import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const planPath = path.join(root, 'content/episode01/visuals.json');
const outputPath = path.join(root, 'content/episode01/assets.json');
const checkOnly = process.argv.includes('--check');
const productionCheck = process.argv.includes('--production-check');
const plan = JSON.parse(await readFile(planPath, 'utf8'));

const planned = [];
for (const [characterId, character] of Object.entries(plan.characters ?? {})) {
  planned.push({
    asset_id: character.portrait_asset_id,
    uri: character.portrait_path,
    group_id: 'ep01.characters',
    preload_policy: 'on_demand',
    source: `${characterId}:portrait`,
  });
  planned.push({
    asset_id: character.map_asset_id,
    uri: character.map_path,
    group_id: 'ep01.characters',
    preload_policy: 'next_scene',
    source: `${characterId}:map`,
  });
}
for (const [backgroundId, background] of Object.entries(plan.backgrounds ?? {})) {
  planned.push({
    asset_id: background.map_asset_id,
    uri: background.path,
    group_id: 'ep01.backgrounds',
    preload_policy: 'required',
    source: `${backgroundId}:background`,
  });
}

async function tryRead(uri) {
  try {
    return { uri, bytes: await readFile(path.join(root, 'public', uri)) };
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

function isWebP(bytes) {
  return bytes.length >= 12
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
}

function readUint24LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function webPDimensions(bytes) {
  if (!isWebP(bytes)) return undefined;

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkType = bytes.subarray(offset, offset + 4).toString('ascii');
    const chunkSize = bytes.readUInt32LE(offset + 4);
    const dataOffset = offset + 8;
    if (dataOffset + chunkSize > bytes.length) return undefined;

    if (chunkType === 'VP8X' && chunkSize >= 10) {
      return {
        width: readUint24LE(bytes, dataOffset + 4) + 1,
        height: readUint24LE(bytes, dataOffset + 7) + 1,
      };
    }

    if (chunkType === 'VP8 ' && chunkSize >= 10
      && bytes[dataOffset + 3] === 0x9d
      && bytes[dataOffset + 4] === 0x01
      && bytes[dataOffset + 5] === 0x2a) {
      return {
        width: bytes.readUInt16LE(dataOffset + 6) & 0x3fff,
        height: bytes.readUInt16LE(dataOffset + 8) & 0x3fff,
      };
    }

    if (chunkType === 'VP8L' && chunkSize >= 5 && bytes[dataOffset] === 0x2f) {
      const packed = bytes.readUInt32LE(dataOffset + 1);
      return {
        width: (packed & 0x3fff) + 1,
        height: ((packed >>> 14) & 0x3fff) + 1,
      };
    }

    offset = dataOffset + chunkSize + (chunkSize % 2);
  }

  return undefined;
}

function minimumDimensions(item) {
  if (item.source.endsWith(':portrait')) return { width: 1024, height: 1024 };
  if (item.source.endsWith(':map')) return { width: 768, height: 1024 };
  return undefined;
}

async function readPlannedAsset(uri) {
  // Final commercial art always wins when present.
  const exact = await tryRead(uri);
  if (exact) return exact;

  // TASK-014A release-candidate art: a hand-authored visual slice used before final WebP lands.
  // Example: player-portrait.webp -> player-portrait-rc.svg.
  const extension = path.extname(uri).toLowerCase();
  if (extension === '.webp') {
    const rcUri = uri.replace(/\.webp$/i, '-rc.svg');
    const rc = await tryRead(rcUri);
    if (rc) return rc;

    // TASK-010D deterministic generated fallback remains the last-resort art path.
    const fallbackUri = uri.replace(/\.webp$/i, '.svg');
    const fallback = await tryRead(fallbackUri);
    if (fallback) return fallback;
  }

  return undefined;
}

if (productionCheck) {
  const missing = [];
  const invalid = [];

  for (const item of planned) {
    if (!item.asset_id || !item.uri) continue;
    if (path.extname(item.uri).toLowerCase() !== '.webp') {
      invalid.push(`${item.asset_id}: planned production path must be .webp (${item.uri})`);
      continue;
    }

    const exact = await tryRead(item.uri);
    if (!exact) {
      missing.push(`${item.asset_id}: public/${item.uri}`);
      continue;
    }
    if (!isWebP(exact.bytes)) {
      invalid.push(`${item.asset_id}: invalid WebP header (${item.uri})`);
      continue;
    }

    const dimensions = webPDimensions(exact.bytes);
    if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
      invalid.push(`${item.asset_id}: unreadable WebP dimensions (${item.uri})`);
      continue;
    }

    const minimum = minimumDimensions(item);
    if (minimum && (dimensions.width < minimum.width || dimensions.height < minimum.height)) {
      invalid.push(
        `${item.asset_id}: ${dimensions.width}x${dimensions.height} is below minimum `
        + `${minimum.width}x${minimum.height} (${item.uri})`,
      );
    }
  }

  if (planned.length !== 17) invalid.push(`expected 17 production image slots, found ${planned.length}`);

  if (missing.length || invalid.length) {
    console.error('Episode 01 production art is NOT release-ready.');
    if (missing.length) console.error(`Missing final WebP files (${missing.length}):\n- ${missing.join('\n- ')}`);
    if (invalid.length) console.error(`Invalid production art entries (${invalid.length}):\n- ${invalid.join('\n- ')}`);
    process.exitCode = 1;
  } else {
    console.log(`Episode 01 production art is release-ready (${planned.length} final WebP assets).`);
  }
} else {
  const assets = [];
  for (const item of planned) {
    if (!item.asset_id || !item.uri) continue;
    const resolved = await readPlannedAsset(item.uri);
    if (!resolved) continue;
    const extension = path.extname(resolved.uri).slice(1).toLowerCase();
    assets.push({
      asset_id: item.asset_id,
      type: 'image',
      group_id: item.group_id,
      variants: [{
        uri: resolved.uri,
        format: extension,
        bytes: resolved.bytes.length,
        hash: createHash('sha256').update(resolved.bytes).digest('hex'),
      }],
      dependencies: [],
      preload_policy: item.preload_policy,
      version: '1',
    });
  }
  assets.sort((a, b) => a.asset_id.localeCompare(b.asset_id));

  const generated = `${JSON.stringify({ schema_version: 1, assets }, null, 2)}\n`;
  if (checkOnly) {
    const current = await readFile(outputPath, 'utf8');
    if (current !== generated) {
      console.error('Episode 01 asset manifest is out of date. Run: npm run assets:manifest');
      process.exitCode = 1;
    } else {
      console.log(`Episode 01 asset manifest is current (${assets.length} assets).`);
    }
  } else {
    await writeFile(outputPath, generated, 'utf8');
    console.log(`Wrote ${assets.length} Episode 01 assets to content/episode01/assets.json.`);
  }
}
