import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('M-03 G8-A worker motion overlay', () => {
  it('uses existing raster character art instead of prototype worker glyphs', () => {
    const source = readFileSync('src/ui/G8AActivityOverlay.tsx', 'utf8');
    expect(source).toContain('lim-junho-map.webp');
    expect(source).toContain('yoon-sungho-map.webp');
    expect(source).not.toContain("id: 'choi_minseok'");
    expect(source).toContain('kang-taesik-map.webp');
    expect(source).toContain('lee-jaehoon-map.webp');
    expect(source).toContain('seo-jeongmin-map.webp');
    expect(source).not.toContain('<circle r="');
    expect(source).toContain('data-motion-worker');
  });

  it('keeps five readable workers plus an early-wave construction vehicle in the live world', () => {
    const source = readFileSync('src/ui/G8AActivityOverlay.tsx', 'utf8');
    expect((source.match(/data-motion-worker=/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(source).toContain('width: 31');
    expect(source).toContain('width: 33');
    expect(source).toContain('data-motion-vehicle="AMBIENT_DUMP"');
    expect(source).toContain('data-vehicle-state="SITE_CIRCULATION"');
    expect(source).toContain('showAmbientDump');
  });

  it('supports an impact reaction state without changing defense simulation state', () => {
    const source = readFileSync('src/ui/G8AActivityOverlay.tsx', 'utf8');
    expect(source).toContain("cameraMode === 'IMPACT_CLOSE_UP'");
    expect(source).toContain("cameraMode === 'RETURN_RECOVER'");
    expect(source).toContain("data-worker-group-state");
    expect(source).toContain("'EVADE'");
    expect(source).toContain("'SAFE_RETURN'");
    expect(source).not.toContain('dispatch(');
    expect(source).not.toContain('advanceDefense(');
  });
});
