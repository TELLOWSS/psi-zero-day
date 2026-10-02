import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const brainDir = 'C:/Users/user/.gemini/antigravity-ide/brain/a693fb40-4c60-44f6-9c12-425316ab1e91';
const catalogPath = path.resolve('content/episode01/scene-element-catalog.json');

export const batch3Items = [
  {
    key: 'wet_floor',
    filename: 'wet_floor',
    dest: 'public/assets/episode01/scene-elements/wet-floor.webp',
    assetPath: 'assets/episode01/scene-elements/wet-floor.webp',
  },
  {
    key: 'foundation_blinding_edge',
    filename: 'foundation_blinding_edge',
    dest: 'public/assets/episode01/scene-elements/foundation-blinding-edge.webp',
    assetPath: 'assets/episode01/scene-elements/foundation-blinding-edge.webp',
  },
  {
    key: 'foundation_rebar_mat',
    filename: 'foundation_rebar_mat',
    dest: 'public/assets/episode01/scene-elements/foundation-rebar-mat.webp',
    assetPath: 'assets/episode01/scene-elements/foundation-rebar-mat.webp',
  },
  {
    key: 'concrete_pour_zone',
    filename: 'concrete_pour_zone',
    dest: 'public/assets/episode01/scene-elements/concrete-pour-zone.webp',
    assetPath: 'assets/episode01/scene-elements/concrete-pour-zone.webp',
  },
  {
    key: 'dismantle_drop_zone',
    filename: 'dismantle_drop_zone',
    dest: 'public/assets/episode01/scene-elements/dismantle-drop-zone.webp',
    assetPath: 'assets/episode01/scene-elements/dismantle-drop-zone.webp',
  },
  {
    key: 'dismantled_formwork_stack',
    filename: 'dismantled_formwork_stack',
    dest: 'public/assets/episode01/scene-elements/dismantled-formwork-stack.webp',
    assetPath: 'assets/episode01/scene-elements/dismantled-formwork-stack.webp',
  },
  {
    key: 'confined_space_meter',
    filename: 'confined_space_meter',
    dest: 'public/assets/episode01/scene-elements/confined-space-meter.webp',
    assetPath: 'assets/episode01/scene-elements/confined-space-meter.webp',
  },
  {
    key: 'ventilation_fan_duct',
    filename: 'ventilation_fan_duct',
    dest: 'public/assets/episode01/scene-elements/ventilation-fan-duct.webp',
    assetPath: 'assets/episode01/scene-elements/ventilation-fan-duct.webp',
  },
  {
    key: 'confined_space_attendant',
    filename: 'confined_space_attendant',
    dest: 'public/assets/episode01/scene-elements/confined-space-attendant.webp',
    assetPath: 'assets/episode01/scene-elements/confined-space-attendant.webp',
  },
  {
    key: 'temporary_electric_wet',
    filename: 'temporary_electric_wet',
    dest: 'public/assets/episode01/scene-elements/temporary-electric-wet.webp',
    assetPath: 'assets/episode01/scene-elements/temporary-electric-wet.webp',
  },
];

async function removeWhiteBgAndSave(srcPath, destPath, tolerance = 18) {
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];

  function isWhite(x, y) {
    const idx = (y * width + x) * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
  }

  for (let x = 0; x < width; x++) {
    if (isWhite(x, 0)) { queue.push(x, 0); visited[x] = 1; }
    if (isWhite(x, height - 1)) { queue.push(x, height - 1); visited[(height - 1) * width + x] = 1; }
  }
  for (let y = 0; y < height; y++) {
    if (isWhite(0, y) && !visited[y * width]) { queue.push(0, y); visited[y * width] = 1; }
    if (isWhite(width - 1, y) && !visited[y * width + width - 1]) { queue.push(width - 1, y); visited[y * width + width - 1] = 1; }
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const pIdx = (y * width + x) * channels;
    data[pIdx + 3] = 0;

    const neighbors = [
      [x + 1, y], [x - 1, y],
      [x, y + 1], [x, y - 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const vIdx = ny * width + nx;
        if (!visited[vIdx]) {
          visited[vIdx] = 1;
          if (isWhite(nx, ny)) {
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  await sharp(data, { raw: { width, height, channels } })
    .resize(768, 768, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(destPath);

  console.log(`Saved transparent WebP: ${destPath}`);
}

export async function convertBatch3(searchDir = brainDir) {
  if (!fs.existsSync(searchDir)) {
    console.warn(`Search directory does not exist: ${searchDir}`);
    return;
  }
  const files = fs.readdirSync(searchDir);
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  let updatedCount = 0;

  for (const item of batch3Items) {
    const matched = files.find(f => f.startsWith(item.filename) && (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.webp')));
    if (!matched) continue;

    const srcPath = path.join(searchDir, matched);
    await removeWhiteBgAndSave(srcPath, item.dest);

    if (catalog.elements[item.key]) {
      catalog.elements[item.key].field_guide_visual = {
        status: 'ready',
        presentation: 'generated_item_art',
        asset_path: item.assetPath,
      };
      updatedCount++;
    }
  }

  if (updatedCount > 0) {
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
    console.log(`Updated ${updatedCount} catalog definitions in scene-element-catalog.json`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('convert-batch3.mjs')) {
  convertBatch3().catch(console.error);
}
