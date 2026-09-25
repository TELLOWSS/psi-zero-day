import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8a-swift-final-art.json';
import { defenseSwiftPqAsset } from '../src/app/defense-visual-assets';

describe('G8-A SWIFT final-art promotion slot', () => {
  it('keeps SWIFT blocked until an approved non-SVG final raster exists', () => {
    expect(manifest.status).toBe('ASSET_PENDING');
    expect(manifest.promotion.productionApproved).toBe(false);
    expect(manifest.format).toBe('webp');
    expect(manifest.runtimeUri.endsWith('.webp')).toBe(true);
    expect(manifest.runtimeUri.toLowerCase()).not.toContain('.svg');
    expect(defenseSwiftPqAsset()).toBeNull();
  });

  it('forbids rasterized legacy SVG and low-resolution upscales as the final source', () => {
    expect(manifest.forbidden).toContain('legacy swift-pq01.svg rasterization');
    expect(manifest.forbidden).toContain('upscaled low-resolution crop');
    expect(manifest.sourceMaster.minimumWidth).toBeGreaterThanOrEqual(2048);
    expect(manifest.sourceMaster.minimumHeight).toBeGreaterThanOrEqual(1536);
    expect(manifest.sourceMaster.transparentBackground).toBe(true);
  });

  it('requires zero runtime prototype/SVG leakage before promotion', () => {
    expect(manifest.promotion.requires).toContain('ACTIVE_SVG_VISUALS_0');
    expect(manifest.promotion.requires).toContain('PROTOTYPE_BOARD_ITEMS_0');
    expect(manifest.promotion.requires).toContain('DESKTOP_WAVE8_CONTROL_SWIFT_QA');
    expect(manifest.promotion.requires).toContain('MOBILE_390x844_CONTROL_SWIFT_QA');
  });
});
