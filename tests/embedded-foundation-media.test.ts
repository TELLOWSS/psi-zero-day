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
    expect(bytes.length).toBe(1253340);
    expect(isWebP(bytes)).toBe(true);
    expect(webPDimensions(bytes)).toEqual({ width: 3072, height: 1728 });
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(
      'f9273c464f4e194dd50b379be5614c9afed3eb061835ec8be9763eeb6f32a01b',
    );
  });
});
