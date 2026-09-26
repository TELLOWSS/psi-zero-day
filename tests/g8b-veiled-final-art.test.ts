import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8b-veiled-final-art.json';
import { defenseG8bVeiledFinalAsset } from '../src/app/defense-visual-assets';

describe('G8-B VEILED final-art slot', () => {
  it('keeps VEILED blocked until a transparent non-SVG final raster exists', () => {
    expect(manifest.status).toBe('ASSET_PENDING');
    expect(manifest.promotion.productionApproved).toBe(false);
    expect(manifest.runtimeUri).toBe('assets/defense/enemies/veiled-final-g8b.webp');
    expect(manifest.runtimeUri).not.toMatch(/\.svg(?:$|\?)/i);
    expect(defenseG8bVeiledFinalAsset()).toBeNull();
  });

  it('requires a native transparent source and forbids fantasy hidden-risk styling', () => {
    expect(manifest.sourceMaster.minimumWidth).toBeGreaterThanOrEqual(1440);
    expect(manifest.sourceMaster.minimumHeight).toBeGreaterThanOrEqual(1024);
    expect(manifest.sourceMaster.transparentBackground).toBe(true);
    expect(manifest.sourceMaster.nativeUpscaleForbidden).toBe(true);
    expect(manifest.forbidden).toContain('fantasy glow');
    expect(manifest.required).toContain('hidden/reveal behavior must come from runtime visibility logic, not fantasy art');
  });

  it('locks the phone-scale runtime target', () => {
    expect(manifest.runtime.width).toBe(78);
    expect(manifest.runtime.height).toBe(58);
    expect(manifest.promotion.requires).toContain('DESKTOP_SENSOR_VEILED_QA');
    expect(manifest.promotion.requires).toContain('MOBILE_390x844_SENSOR_VEILED_QA');
  });
});
