import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const planPath = path.join(root, 'content/episode01/visuals.json');
const outputPath = path.join(root, 'content/episode01/assets.json');
const checkOnly = process.argv.includes('--check');
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

async function readPlannedAsset(uri) {
  const diskPath = path.join(root, 'public', uri);
  try {
    return { uri, bytes: await readFile(diskPath) };
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  // TASK-010D production fallback. visuals.json keeps the final WebP target,
  // while the repository can generate a deterministic SVG pass until final painted art lands.
  const extension = path.extname(uri).toLowerCase();
  if (extension !== '.webp') return undefined;
  const fallbackUri = uri.replace(/\.webp$/i, '.svg');
  try {
    return { uri: fallbackUri, bytes: await readFile(path.join(root, 'public', fallbackUri)) };
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

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
