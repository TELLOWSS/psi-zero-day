import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8a-swift-final-art.json';
import sourceReview from '../content/defense/g8a-swift-source-review.json';
import { defenseSwiftPqAsset } from '../src/app/defense-visual-assets';

describe('G8-A SWIFT final-art promotion slot', () => {
  it('activates the approved non-SVG SWIFT runtime raster', () => {
    expect(manifest.status).toBe('PRODUCTION_APPROVED');
    expect(manifest.promotion.productionApproved).toBe(true);
    expect(manifest.format).toBe('webp');
    expect(manifest.runtimeUri).toBe('assets/defense/enemies/swift-final-g8a.webp');
    expect(manifest.runtimeUri.toLowerCase()).not.toContain('.svg');
    expect(defenseSwiftPqAsset()).toEqual({
      uri: 'assets/defense/enemies/swift-final-g8a.webp',
      width: 78,
      height: 58,
    });
    expect(existsSync('public/assets/defense/enemies/swift-final-g8a.webp')).toBe(true);
    expect(statSync('public/assets/defense/enemies/swift-final-g8a.webp').size).toBeGreaterThan(4_000);
  });

  it('accepts only a reviewed native transparent source without upscaling', () => {
    expect(manifest.forbidden).toContain('legacy swift-pq01.svg rasterization');
    expect(manifest.forbidden).toContain('upscaled low-resolution crop');
    expect(manifest.sourceMaster.minimumWidth).toBeGreaterThanOrEqual(1440);
    expect(manifest.sourceMaster.minimumHeight).toBeGreaterThanOrEqual(1024);
    expect(manifest.sourceMaster.transparentBackground).toBe(true);
    expect(manifest.sourceMaster.nativeUpscaleUsed).toBe(false);
    expect(sourceReview.reviewState).toBe('SOURCE_REVIEW_PASS');
    expect(sourceReview.acceptance.result).toBe('PASS');
    expect(sourceReview.observed.width).toBe(1536);
    expect(sourceReview.observed.height).toBe(1024);
    expect(sourceReview.observed.transparentBackground).toBe(true);
  });

  it('still requires zero prototype/SVG leakage in actual play before G8-A Production Lock', () => {
    expect(manifest.promotion.requires).toContain('ACTIVE_SVG_VISUALS_0');
    expect(manifest.promotion.requires).toContain('PROTOTYPE_BOARD_ITEMS_0');
    expect(manifest.promotion.requires).toContain('DESKTOP_WAVE8_CONTROL_SWIFT_QA');
    expect(manifest.promotion.requires).toContain('MOBILE_390x844_CONTROL_SWIFT_QA');
  });
});
