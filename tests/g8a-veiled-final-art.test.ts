import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8a-veiled-final-art.json';
import { defenseG8aVeiledFinalAsset } from '../src/app/defense-visual-assets';

describe('G8-A Full Visual V-01 VEILED final-art slot', () => {
  it('exposes only the reviewed non-SVG raster after explicit promotion', () => {
    expect(manifest.status).toBe('PRODUCTION_APPROVED');
    expect(manifest.promotion.productionApproved).toBe(true);
    expect(manifest.runtimeUri).toBe('assets/defense/enemies/veiled-final-g8a.webp');
    expect(manifest.runtimeUri.toLowerCase()).not.toContain('.svg');
    expect(defenseG8aVeiledFinalAsset()?.uri).toBe('assets/defense/enemies/veiled-final-g8a.webp');
    expect(existsSync('public/assets/defense/enemies/veiled-final-g8a.webp')).toBe(true);
  });

  it('keeps the production acceptance contract after asset intake', () => {
    expect(manifest.sourceMaster.minimumWidth).toBeGreaterThanOrEqual(1440);
    expect(manifest.sourceMaster.minimumHeight).toBeGreaterThanOrEqual(1024);
    expect(manifest.sourceMaster.transparentBackground).toBe(true);
    expect(manifest.sourceMaster.nativeUpscaleUsed).toBe(false);
    expect(manifest.forbidden).toContain('svg');
    expect(manifest.forbidden).toContain('legacy veiled.svg rasterization');
    expect(manifest.forbidden).toContain('fantasy ghost or monster silhouette');
    expect(manifest.promotion.requires).toContain('DESKTOP_WAVE8_VEILED_SWIFT_QA');
    expect(manifest.promotion.requires).toContain('MOBILE_390x844_VEILED_SWIFT_QA');
    expect(manifest.promotion.requires).toContain('PROTOTYPE_BOARD_ITEMS_0');
    expect(manifest.sourceReview.status).toBe('PASS');
    expect(manifest.sourceReview.sourceCanvas).toEqual({ width: 1536, height: 1024 });
  });
});
