const sharp = require('sharp');
const path = require('path');

const frameSrc = 'C:/Users/user/.gemini/antigravity-ide/brain/632f4e88-0068-41ea-99e8-5923754369c9/industrial_console_frame_v1_1791863428710.jpg';
const deckSrc = 'C:/Users/user/.gemini/antigravity-ide/brain/632f4e88-0068-41ea-99e8-5923754369c9/industrial_console_deck_v1_1791863484038.jpg';
const outDir = path.resolve(__dirname, '../public/signal-breaker-dev/art');

async function build() {
  // 1. Cockpit Frame with punched-out transparent center window
  // Window area: left: 242, top: 104, width: 892, height: 520, radius: 26
  const maskSvg = `<svg width="1376" height="768" xmlns="http://www.w3.org/2000/svg">
    <rect width="1376" height="768" fill="#fff"/>
    <rect x="242" y="104" width="892" height="520" rx="28" ry="28" fill="#000"/>
  </svg>`;

  await sharp(frameSrc)
    .ensureAlpha()
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .webp({ quality: 92 })
    .toFile(path.join(outDir, 'industrial-cockpit-frame-v1.webp'));
  console.log('Saved: industrial-cockpit-frame-v1.webp');

  // 2. Console Deck Surface
  await sharp(deckSrc)
    .webp({ quality: 92 })
    .toFile(path.join(outDir, 'industrial-console-deck-v1.webp'));
  console.log('Saved: industrial-console-deck-v1.webp');

  // 3. Full Cockpit Station Background (For full-screen immerse backdrop behind the whole game card)
  await sharp(frameSrc)
    .webp({ quality: 90 })
    .toFile(path.join(outDir, 'industrial-cockpit-backdrop-v1.webp'));
  console.log('Saved: industrial-cockpit-backdrop-v1.webp');

  console.log('Cockpit immersive assets generated successfully!');
}

build().catch(console.error);
