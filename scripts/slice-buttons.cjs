const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = 'C:/Users/user/.gemini/antigravity-ide/brain/632f4e88-0068-41ea-99e8-5923754369c9/industrial_ui_buttons_atlas_1791862809894.jpg';
const outDir = path.resolve(__dirname, '../public/signal-breaker-dev/art');

function createRoundedMask(width, height, radius) {
  const svg = `<svg width="${width}" height="${height}">
    <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="#fff"/>
  </svg>`;
  return Buffer.from(svg);
}

function createCircleMask(size) {
  const r = size / 2;
  const svg = `<svg width="${size}" height="${size}">
    <circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/>
  </svg>`;
  return Buffer.from(svg);
}

async function extractSprite(crop, maskBuffer, outputPath) {
  const cropped = await sharp(inputPath)
    .extract(crop)
    .toBuffer();

  await sharp(cropped)
    .composite([{ input: maskBuffer, blend: 'dest-in' }])
    .webp({ quality: 95 })
    .toFile(outputPath);

  console.log(`Saved: ${outputPath}`);
}

async function run() {
  // 1. E-STOP Fire Button
  // x: 42, y: 44, width: 436, height: 436
  await extractSprite(
    { left: 42, top: 44, width: 436, height: 436 },
    createRoundedMask(436, 436, 68),
    path.join(outDir, 'btn-fire-estop-v1.webp')
  );

  // 1-B. E-STOP Center Core Only (Round for inner push button effect if needed)
  await extractSprite(
    { left: 112, top: 114, width: 296, height: 296 },
    createCircleMask(296),
    path.join(outDir, 'btn-fire-core-v1.webp')
  );

  // 2. Move Left
  // x: 528, y: 56, width: 212, height: 224
  await extractSprite(
    { left: 528, top: 56, width: 212, height: 224 },
    createRoundedMask(212, 224, 38),
    path.join(outDir, 'btn-move-left-v1.webp')
  );

  // 3. Move Right
  // x: 752, y: 56, width: 212, height: 224
  await extractSprite(
    { left: 752, top: 56, width: 212, height: 224 },
    createRoundedMask(212, 224, 38),
    path.join(outDir, 'btn-move-right-v1.webp')
  );

  // 4. Rocker Switches
  // Conveyor: left: 46, top: 616, width: 140, height: 314
  await extractSprite(
    { left: 46, top: 616, width: 140, height: 314 },
    createRoundedMask(140, 314, 24),
    path.join(outDir, 'btn-switch-conveyor-v1.webp')
  );

  // Shield: left: 194, top: 616, width: 140, height: 314
  await extractSprite(
    { left: 194, top: 616, width: 140, height: 314 },
    createRoundedMask(140, 314, 24),
    path.join(outDir, 'btn-switch-shield-v1.webp')
  );

  // Magnet: left: 338, top: 616, width: 140, height: 314
  await extractSprite(
    { left: 338, top: 616, width: 140, height: 314 },
    createRoundedMask(140, 314, 24),
    path.join(outDir, 'btn-switch-magnet-v1.webp')
  );

  // 5. Gimbal Frame
  // left: 554, top: 536, width: 424, height: 424
  await extractSprite(
    { left: 554, top: 536, width: 424, height: 424 },
    createCircleMask(424),
    path.join(outDir, 'btn-gimbal-ring-v1.webp')
  );

  // Auxiliary buttons from second atlas
  const auxPath = 'C:/Users/user/.gemini/antigravity-ide/brain/632f4e88-0068-41ea-99e8-5923754369c9/industrial_aux_buttons_atlas_1791862876569.jpg';
  
  // A. Source Observation Lens Button (Top-Left)
  const sourceCropped = await sharp(auxPath).extract({ left: 34, top: 34, width: 440, height: 440 }).toBuffer();
  await sharp(sourceCropped)
    .composite([{ input: createCircleMask(440), blend: 'dest-in' }])
    .webp({ quality: 95 })
    .toFile(path.join(outDir, 'btn-source-lens-v1.webp'));
  console.log('Saved: btn-source-lens-v1.webp');

  // B. Tactical Specs / Talent Chip (Top-Right)
  const talentCropped = await sharp(auxPath).extract({ left: 540, top: 46, width: 420, height: 420 }).toBuffer();
  await sharp(talentCropped)
    .composite([{ input: createRoundedMask(420, 420, 60), blend: 'dest-in' }])
    .webp({ quality: 95 })
    .toFile(path.join(outDir, 'btn-talent-chip-v1.webp'));
  console.log('Saved: btn-talent-chip-v1.webp');

  // C. Industrial Pause II Button (Bottom-Right)
  const pauseCropped = await sharp(auxPath).extract({ left: 546, top: 536, width: 410, height: 410 }).toBuffer();
  await sharp(pauseCropped)
    .composite([{ input: createCircleMask(410), blend: 'dest-in' }])
    .webp({ quality: 95 })
    .toFile(path.join(outDir, 'btn-pause-switch-v1.webp'));
  console.log('Saved: btn-pause-switch-v1.webp');

  console.log('All industrial UI button sprites extracted successfully!');
}

run().catch(console.error);
