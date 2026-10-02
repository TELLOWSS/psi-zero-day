import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const artifactsDir = 'C:/Users/user/.gemini/antigravity-ide/brain/68452ce6-c6ab-4220-904c-e2bed70d60c5';

const conversions = [
  {
    srcPattern: 'system_shoring_jackbase',
    dest: 'public/assets/episode01/scene-elements/system-shoring-jackbase.webp',
    key: 'system_shoring_jackbase',
    label: '시스템동바리 잭베이스',
    tolerance: 18,
  },
  {
    srcPattern: 'system_shoring_standard',
    dest: 'public/assets/episode01/scene-elements/system-shoring-standard.webp',
    key: 'system_shoring_standard',
    label: '시스템동바리 수직재',
    tolerance: 18,
  },
  {
    srcPattern: 'system_shoring_ledger',
    dest: 'public/assets/episode01/scene-elements/system-shoring-ledger.webp',
    key: 'system_shoring_ledger',
    label: '시스템동바리 수평재',
    tolerance: 18,
  },
  {
    srcPattern: 'system_shoring_missing_brace',
    dest: 'public/assets/episode01/scene-elements/system-shoring-missing-brace.webp',
    key: 'system_shoring_missing_brace',
    label: '누락된 가새·연결재',
    tolerance: 18,
  },
  {
    srcPattern: 'uhead_beam_alignment',
    dest: 'public/assets/episode01/scene-elements/uhead-beam-alignment.webp',
    key: 'uhead_beam_alignment',
    label: 'U-Head와 멍에 중심',
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
