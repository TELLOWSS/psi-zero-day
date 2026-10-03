import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const artifactsDir = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\af7f9d09-98df-4971-991b-a0350f665db6';
const targetDir = path.join(process.cwd(), 'public/assets/episode01/hires');

const images = [
  {
    src: 'kang_taesik_portrait_1790989374946.jpg',
    dest: 'kang-taesik-portrait.webp',
    width: 1024,
    height: 1024,
  },
  {
    src: 'yoon_sungho_portrait_1790989391690.jpg',
    dest: 'yoon-sungho-portrait.webp',
    width: 1024,
    height: 1024,
  },
  {
    src: 'lim_junho_portrait_1790989409411.jpg',
    dest: 'lim-junho-portrait.webp',
    width: 1024,
    height: 1024,
  },
  {
    src: 'episode01_night_pour_1790989426813.jpg',
    dest: 'night-pour-hero.webp',
    width: 1920,
    height: 1080,
  },
];

async function convert() {
  await mkdir(targetDir, { recursive: true });

  for (const item of images) {
    const srcPath = path.join(artifactsDir, item.src);
    const destPath = path.join(targetDir, item.dest);

    console.log(`Converting ${item.src} -> ${item.dest}...`);
    await sharp(srcPath)
      .resize(item.width, item.height, { fit: 'cover' })
      .webp({ quality: 90, effort: 6 })
      .toFile(destPath);
    console.log(`Saved ${destPath}`);
  }
}

convert().catch(err => {
  console.error(err);
  process.exit(1);
});
