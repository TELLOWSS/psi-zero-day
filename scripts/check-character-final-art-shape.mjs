import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { isWebP, webPDimensions, webPHasAlpha } from './webp-dimensions.mjs';

const root = process.cwd();
const planPath = path.join(root, 'content/episode01/visuals.json');
const plan = JSON.parse(await readFile(planPath, 'utf8'));

const playerOnly = process.argv.includes('--player');
const batchAOnly = process.argv.includes('--batch-a');
const batchACharacters = new Set(['player', 'lim_junho', 'lee_jaehoon', 'seo_jeongmin']);

function selectedCharacter(characterId) {
  if (playerOnly) return characterId === 'player';
  if (batchAOnly) return batchACharacters.has(characterId);
  return true;
}

async function tryReadPublic(uri) {
  try {
    return await readFile(path.join(root, 'public', uri));
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

const invalid = [];
let checked = 0;

for (const [characterId, character] of Object.entries(plan.characters ?? {})) {
  if (!selectedCharacter(characterId)) continue;

  const mapUri = character?.map_path;
  if (!mapUri || path.extname(mapUri).toLowerCase() !== '.webp') continue;

  const bytes = await tryReadPublic(mapUri);
  if (!bytes) continue; // Missing finals are reported by build-episode01-assets.mjs production checks.
  checked += 1;

  if (!isWebP(bytes)) {
    invalid.push(`${characterId}: invalid WebP header (${mapUri})`);
    continue;
  }

  const dimensions = webPDimensions(bytes);
  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
    invalid.push(`${characterId}: unreadable WebP dimensions (${mapUri})`);
    continue;
  }

  if (dimensions.height <= dimensions.width) {
    invalid.push(
      `${characterId}: map production art must use a portrait canvas (height > width); `
      + `got ${dimensions.width}x${dimensions.height} (${mapUri})`,
    );
  }

  const hasAlpha = webPHasAlpha(bytes);
  if (hasAlpha !== true) {
    invalid.push(`${characterId}: map production art must include WebP alpha transparency (${mapUri})`);
  }
}

if (invalid.length) {
  console.error('Character map final-art shape check failed.');
  console.error(`Invalid entries (${invalid.length}):\n- ${invalid.join('\n- ')}`);
  process.exitCode = 1;
} else {
  const scope = playerOnly ? 'Player' : batchAOnly ? 'Batch A characters' : 'Episode 01 characters';
  console.log(`${scope} map final-art shape check passed (${checked} existing final map asset(s) inspected).`);
}
