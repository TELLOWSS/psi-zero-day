import sharp from 'sharp';
import path from 'node:path';
const source = process.argv[2];
if (!source) throw new Error('Provide the selected generated RGBA atlas path');
const rectangles = [
  { left: 0, top: 0, width: 512, height: 512 },
  { left: 512, top: 0, width: 544, height: 512 },
  { left: 1056, top: 0, width: 480, height: 512 },
  { left: 0, top: 512, width: 534, height: 512 },
  { left: 534, top: 512, width: 522, height: 512 },
];
const sprites = [];
for (const [index, rectangle] of rectangles.entries()) {
  const input = await sharp(source).extract(rectangle).toBuffer();
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] < 32) transparent++;
  if (transparent / (info.width * info.height) < .3) throw new Error(`Nontransparent sprite ${index}`);
  sprites.push({ input: await sharp(input).resize(216, 216, { fit: 'inside' }).png().toBuffer(), left: index % 3 * 256 + 20, top: Math.floor(index / 3) * 256 + 20 });
}
const target = path.resolve('public/assets/survivors/equipment-evolution-v1.webp');
await sharp({ create: { width: 768, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(sprites).webp({ lossless: true }).toFile(target);
console.log(target);
