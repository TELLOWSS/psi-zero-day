import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8a-world-final-art.json';
import { defenseG8aWorldFinalAsset } from '../src/app/defense-visual-assets';

describe('G8-A final world-plate promotion slot', () => {
  it('keeps the bottom-up excavation world blocked until a reviewed non-SVG final plate exists', () => {
    expect(manifest.status).toBe('ASSET_PENDING');
    expect(manifest.promotion.productionApproved).toBe(false);
    expect(manifest.format).toBe('webp');
    expect(manifest.runtimeUri.endsWith('.webp')).toBe(true);
    expect(manifest.runtimeUri.toLowerCase()).not.toContain('.svg');
    expect(defenseG8aWorldFinalAsset()).toBeNull();
  });

  it('requires a true 4000x2400+ source master rather than an upscaled reference image', () => {
    expect(manifest.sourceMaster.minimumWidth).toBeGreaterThanOrEqual(4000);
    expect(manifest.sourceMaster.minimumHeight).toBeGreaterThanOrEqual(2400);
    expect(manifest.sourceMaster.aspectRatio).toBe('5:3');
    expect(manifest.forbidden).toContain('upscaled low-resolution crop');
    expect(manifest.forbidden).toContain('generic construction-site photo reused as final art');
  });

  it('keeps gameplay geometry outside the image model output', () => {
    expect(manifest.required).toContain('no UI, HUD, risk icon, route, pad, text or logo baked into the image');
    expect(manifest.forbidden).toContain('baked gameplay route');
    expect(manifest.forbidden).toContain('baked tower pad');
    expect(manifest.promotion.requires).toContain('PROCESS_SPECIFIC_BOTTOM_UP_EXCAVATION_REVIEW');
    expect(manifest.promotion.requires).toContain('MOBILE_390x844_QA_PASS');
  });
});
