import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

export async function processAsset(inputPath, outputPath, options = {}) {
  const { size = 768, tolerance = 18, ramp = 20 } = options;
  const image = sharp(inputPath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Sample corner background color
  const samplePixels = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [5, 5], [width - 6, 5], [5, height - 6], [width - 6, height - 6]
  ];
  let bgR = 0, bgG = 0, bgB = 0;
  for (const [x, y] of samplePixels) {
    const idx = (y * width + x) * channels;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
  }
  bgR /= samplePixels.length;
  bgG /= samplePixels.length;
  bgB /= samplePixels.length;

  const rgbaBuffer = Buffer.alloc(width * height * 4);

  // Flood fill from border to prevent keying internal pixels that happen to match bg color
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Seed borders
  for (let x = 0; x < width; x++) {
    queue.push(x, 0);
    queue.push(x, height - 1);
    visited[x] = 1;
    visited[(height - 1) * width + x] = 1;
  }
  for (let y = 1; y < height - 1; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
    visited[y * width] = 1;
    visited[y * width + (width - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const idx = (cy * width + cx) * channels;
    const r = data[idx], g = data[idx + 1], b = data[idx + 2];
    const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

    if (dist <= tolerance + ramp) {
      // Check 4 neighbors
      const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nPos = ny * width + nx;
          if (!visited[nPos]) {
            visited[nPos] = 1;
            const nIdx = (ny * width + nx) * channels;
            const nr = data[nIdx], ng = data[nIdx + 1], nb = data[nIdx + 2];
            const nDist = Math.sqrt((nr - bgR) ** 2 + (ng - bgG) ** 2 + (nb - bgB) ** 2);
            if (nDist <= tolerance + ramp) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      const inIdx = pos * channels;
      const outIdx = pos * 4;

      const r = data[inIdx];
      const g = data[inIdx + 1];
      const b = data[inIdx + 2];

      rgbaBuffer[outIdx] = r;
      rgbaBuffer[outIdx + 1] = g;
      rgbaBuffer[outIdx + 2] = b;

      if (visited[pos]) {
        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
        if (dist <= tolerance) {
          rgbaBuffer[outIdx + 3] = 0;
        } else if (dist <= tolerance + ramp) {
          rgbaBuffer[outIdx + 3] = Math.round(((dist - tolerance) / ramp) * 255);
        } else {
          rgbaBuffer[outIdx + 3] = 255;
        }
      } else {
        rgbaBuffer[outIdx + 3] = 255;
      }
    }
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await sharp(rgbaBuffer, { raw: { width, height, channels: 4 } })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 92, alphaQuality: 92 })
    .toFile(outputPath);

  console.log(`Processed: ${outputPath} (${size}x${size} WebP)`);
}
