import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8a-world-final-art.json';
import sourceReview from '../content/defense/g8a-world-source-review.json';
import { defenseG8aWorldFinalAsset } from '../src/app/defense-visual-assets';

describe('G8-A final world-plate promotion slot', () => {
  it('activates the approved process-specific non-SVG world raster', () => {
    expect(manifest.status).toBe('PRODUCTION_APPROVED');
    expect(manifest.promotion.productionApproved).toBe(true);
    expect(manifest.runtimeUri).toBe('assets/defense/board/g8a-bottom-up-excavation-final.webp');
    expect(manifest.runtimeUri.toLowerCase()).not.toContain('.svg');
    expect(defenseG8aWorldFinalAsset()).toEqual({
      uri: 'assets/defense/board/g8a-bottom-up-excavation-final.webp',
      width: 1000,
      height: 600,
    });
    expect(existsSync('public/assets/defense/board/g8a-bottom-up-excavation-final.webp')).toBe(true);
    expect(statSync('public/assets/defense/board/g8a-bottom-up-excavation-final.webp').size).toBeGreaterThan(80_000);
  });

  it('uses a reviewed native source without upscaling and preserves the 5:3 world contract', () => {
    expect(sourceReview.reviewState).toBe('SOURCE_REVIEW_PASS');
    expect(sourceReview.acceptance.result).toBe('PASS');
    expect(sourceReview.observed.width).toBe(1619);
    expect(sourceReview.observed.height).toBe(971);
    expect(sourceReview.generation.nativeUpscaleUsed).toBe(false);
    expect(manifest.sourceMaster.nativeUpscaleUsed).toBe(false);
    expect(manifest.sourceMaster.minimumWidth).toBeGreaterThanOrEqual(1600);
    expect(manifest.sourceMaster.minimumHeight).toBeGreaterThanOrEqual(960);
    expect(manifest.sourceMaster.aspectRatio).toBe('5:3');
  });

  it('keeps gameplay geometry outside the image and leaves Production Lock to actual-play QA', () => {
    expect(manifest.required).toContain('no UI, HUD, risk icon, route, pad, text or logo baked into the image');
    expect(manifest.forbidden).toContain('baked gameplay route');
    expect(manifest.forbidden).toContain('baked tower pad');
    expect(manifest.promotion.requires).toContain('DESKTOP_ACTUAL_PLAY_QA_PASS');
    expect(manifest.promotion.requires).toContain('MOBILE_390x844_QA_PASS');
    expect(manifest.promotion.requires).toContain('PROTOTYPE_BOARD_ITEMS_0');
  });
});
