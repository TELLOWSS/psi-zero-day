import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const artifactsDir = 'C:/Users/user/.gemini/antigravity-ide/brain/68452ce6-c6ab-4220-904c-e2bed70d60c5';

const conversions = [
  {
    srcPattern: 'slab_formwork_edge',
    dest: 'public/assets/episode01/scene-elements/slab-formwork-edge.webp',
    key: 'slab_formwork_edge',
    label: '슬래브 판개 단부',
    tolerance: 18,
  },
  {
    srcPattern: 'slab_opening_cover',
    dest: 'public/assets/episode01/scene-elements/slab-opening-cover.webp',
    key: 'slab_opening_cover',
    label: '슬래브 개구부 덮개',
    tolerance: 18,
  },
  {
    srcPattern: 'temporary_stair',
    dest: 'public/assets/episode01/scene-elements/temporary-stair.webp',
    key: 'temporary_stair',
    label: '임시 계단·승강통로',
    tolerance: 18,
  },
  {
    srcPattern: 'shoring_deformation_watch',
    dest: 'public/assets/episode01/scene-elements/shoring-deformation-watch.webp',
    key: 'shoring_deformation_watch',
    label: '타설 중 동바리 감시',
    tolerance: 18,
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

  // Push border pixels
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

  await sharp(data, { raw: { width, height, channels } })
    .resize(768, 768, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(destPath);

  console.log(`Saved: ${destPath}`);
}

async function run() {
  const files = fs.readdirSync(artifactsDir);
  for (const conv of conversions) {
    const matched = files.find(f => f.startsWith(conv.srcPattern) && (f.endsWith('.jpg') || f.endsWith('.png')));
    if (!matched) {
      console.warn(`Could not find artifact matching: ${conv.srcPattern}`);
      continue;
    }
    const srcPath = path.join(artifactsDir, matched);
    fs.mkdirSync(path.dirname(conv.dest), { recursive: true });
    await removeWhiteBgAndSave(srcPath, conv.dest, conv.tolerance);
  }
}

run().catch(console.error);
