import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const catalogPath = path.join(root, 'content/episode01/scene-element-catalog.json');
const productionCheck = process.argv.includes('--production-check');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const definitions = Object.entries(catalog.elements ?? {});
const expectedCount = 9;
const errors = [];
const assetIds = new Set();
const paths = new Set();

async function tryRead(uri) {
  try {
    return await readFile(path.join(root, 'public', uri));
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

function validNormalized(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

for (const [key, definition] of definitions) {
  const art = definition.art;
  const assetId = definition.planned_asset_id;

  if (!assetId || typeof assetId !== 'string') errors.push(`${key}: planned_asset_id is required`);
  else if (assetIds.has(assetId)) errors.push(`${key}: duplicate planned_asset_id ${assetId}`);
  else assetIds.add(assetId);

  if (!art || typeof art !== 'object') {
    errors.push(`${key}: art production spec is required`);
    continue;
  }

  if (!art.path || typeof art.path !== 'string') errors.push(`${key}: art.path is required`);
  else {
    if (paths.has(art.path)) errors.push(`${key}: duplicate art.path ${art.path}`);
    paths.add(art.path);
    if (!art.path.startsWith('assets/episode01/scene-elements/')) {
      errors.push(`${key}: art.path must live under assets/episode01/scene-elements/`);
    }
    if (path.extname(art.path).toLowerCase() !== '.webp') {
      errors.push(`${key}: production art path must end in .webp (${art.path})`);
    }
  }

  if (!Number.isInteger(art.minimum_width) || art.minimum_width < 256) {
    errors.push(`${key}: minimum_width must be an integer >= 256`);
  }
  if (!Number.isInteger(art.minimum_height) || art.minimum_height < 256) {
    errors.push(`${key}: minimum_height must be an integer >= 256`);
  }
  if (!validNormalized(art.pivot?.x) || !validNormalized(art.pivot?.y)) {
    errors.push(`${key}: pivot.x and pivot.y must be normalized numbers from 0 to 1`);
  }
  if (!Number.isInteger(art.map_max_px) || art.map_max_px < 72 || art.map_max_px > 220) {
    errors.push(`${key}: map_max_px must be an integer from 72 to 220`);
  }
  if (art.requires_alpha !== true) {
    errors.push(`${key}: requires_alpha must be true for transparent scene cutouts`);
  }

  if (!productionCheck || !art.path) continue;
  const bytes = await tryRead(art.path);
  if (!bytes) {
    errors.push(`${key}: missing final WebP public/${art.path}`);
    continue;
  }
  if (!isWebP(bytes)) {
    errors.push(`${key}: invalid WebP header (${art.path})`);
    continue;
  }
  const dimensions = webPDimensions(bytes);
  if (!dimensions) {
    errors.push(`${key}: unreadable WebP dimensions (${art.path})`);
    continue;
  }
  if (dimensions.width < art.minimum_width || dimensions.height < art.minimum_height) {
    errors.push(
      `${key}: ${dimensions.width}x${dimensions.height} is below minimum `
      + `${art.minimum_width}x${art.minimum_height} (${art.path})`,
    );
  }
  if (art.requires_alpha && webPHasAlpha(bytes) !== true) {
    errors.push(`${key}: production scene element must include WebP alpha transparency (${art.path})`);
  }
}

if (definitions.length !== expectedCount) {
  errors.push(`expected ${expectedCount} reusable scene element slots, found ${definitions.length}`);
}

if (errors.length) {
  console.error(`Scene element ${productionCheck ? 'production art' : 'art contract'} is NOT ready.`);
  console.error(`- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else if (productionCheck) {
  console.log(`Scene element production art is ready (${definitions.length} transparent WebP assets).`);
} else {
  console.log(`Scene element art contract is valid (${definitions.length} reusable slots).`);
}
