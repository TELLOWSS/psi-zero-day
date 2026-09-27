import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('M-03 G8-A worker motion overlay', () => {
  it('uses existing raster character art instead of prototype worker glyphs', () => {
    const source = readFileSync('src/ui/G8AActivityOverlay.tsx', 'utf8');
    expect(source).toContain('lim-junho-map.webp');
    expect(source).toContain('choi-minseok-map.webp');
    expect(source).toContain('kang-taesik-map.webp');
    expect(source).not.toContain('<circle r="');
    expect(source).toContain('data-motion-worker');
  });

  it('supports an impact reaction state without changing defense simulation state', () => {
    const source = readFileSync('src/ui/G8AActivityOverlay.tsx', 'utf8');
    expect(source).toContain("cameraMode === 'IMPACT_CLOSE_UP'");
    expect(source).not.toContain('dispatch(');
    expect(source).not.toContain('advanceDefense(');
  });
});
