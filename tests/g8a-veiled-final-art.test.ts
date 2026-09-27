import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8a-veiled-final-art.json';
import { defenseG8aVeiledFinalAsset } from '../src/app/defense-visual-assets';

describe('G8-A Full Visual V-01 VEILED final-art slot', () => {
  it('stays blocked until a reviewed non-SVG raster is explicitly promoted', () => {
    expect(manifest.status).toBe('ASSET_PENDING');
    expect(manifest.promotion.productionApproved).toBe(false);
    expect(manifest.runtimeUri).toBe('assets/defense/enemies/veiled-final-g8a.webp');
    expect(manifest.runtimeUri.toLowerCase()).not.toContain('.svg');
    expect(defenseG8aVeiledFinalAsset()).toBeNull();
    expect(existsSync('public/assets/defense/enemies/veiled-final-g8a.webp')).toBe(false);
  });

  it('locks the production acceptance contract before asset intake', () => {
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
  });
});
