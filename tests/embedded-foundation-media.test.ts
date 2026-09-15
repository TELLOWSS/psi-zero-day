import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isWebP, webPDimensions } from '../scripts/webp-dimensions.mjs';

const target = path.join(
  process.cwd(),
  'public/assets/episode01/backgrounds/foundation-map.webp',
);

describe('TASK-016B embedded Foundation final art', () => {
  it('materializes the locked production WebP exactly', async () => {
    const bytes = await readFile(target);
    expect(bytes.length).toBe(112686);
    expect(isWebP(bytes)).toBe(true);
    expect(webPDimensions(bytes)).toEqual({ width: 1920, height: 1080 });
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      'ee9aefea829ddbdcd5883fab68144ae85759538f83b3ec5bfe4af43c7ad2d74d',
    );
  });
});
