import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8b-world-final-art.json';
import { defenseG8bWorldFinalAsset } from '../src/app/defense-visual-assets';

describe('G8-B top-down WORLD final-art slot', () => {
  it('keeps WORLD blocked until a reviewed non-SVG final raster exists', () => {
    expect(manifest.status).toBe('ASSET_PENDING');
    expect(manifest.promotion.productionApproved).toBe(false);
    expect(manifest.runtimeUri).toBe('assets/defense/board/g8b-top-down-under-slab-final.webp');
    expect(manifest.runtimeUri).not.toMatch(/\.svg(?:$|\?)/i);
    expect(defenseG8bWorldFinalAsset()).toBeNull();
  });

  it('requires a native 5:3 under-slab source without artificial upscaling', () => {
    expect(manifest.sourceMaster.minimumWidth).toBeGreaterThanOrEqual(1600);
    expect(manifest.sourceMaster.minimumHeight).toBeGreaterThanOrEqual(960);
    expect(manifest.sourceMaster.aspectRatio).toBe('5:3');
    expect(manifest.sourceMaster.nativeUpscaleForbidden).toBe(true);
    expect(manifest.forbidden).toContain('reuse of the G8-A bottom-up world plate');
  });

  it('keeps gameplay coordinates and UI outside the generated WORLD image', () => {
    expect(manifest.required).toContain('no UI, HUD, risk icon, route, pad, text or logo baked into the image');
    expect(manifest.forbidden).toContain('baked gameplay route');
    expect(manifest.forbidden).toContain('baked tower pad');
    expect(manifest.promotion.requires).toContain('MOBILE_390x844_QA_PASS');
  });
});
