import { describe, expect, it } from 'vitest';
import policy from '../content/defense/final-art-policy.json';
import productionMaps from '../content/defense/production-map-family-v1.json';
import visuals from '../content/defense/visual-production.json';
import benchmark from '../content/defense/def-hd01-pq-benchmark.json';
import episodeVisuals from '../content/episode01/visuals.json';
import worldFinal from '../content/defense/g8a-world-final-art.json';
import swiftFinal from '../content/defense/g8a-swift-final-art.json';
import g8bWorld from '../content/defense/g8b-world-final-art.json';
import g8bVeiled from '../content/defense/g8b-veiled-final-art.json';

const FINAL_STATUSES = new Set(['BASELINE_LOCKED','PRODUCTION_CANDIDATE','PRODUCTION_LOCKED']);

describe('absolute final-art policy', () => {
  it('forbids SVG from every visible final-art status', () => {
    expect(policy.rules.svgFinalArtForbidden).toBe(true);
    expect(policy.rules.productionImageFormats).not.toContain('svg');

    const invalidLegacy = visuals.assets.filter(asset =>
      asset.uri.toLowerCase().endsWith('.svg') && FINAL_STATUSES.has(asset.status),
    );
    expect(invalidLegacy).toEqual([]);

    const invalidMaps = productionMaps.maps.filter(map =>
      map.runtimeUri.toLowerCase().endsWith('.svg') || map.format === 'svg',
    );
    expect(invalidMaps).toEqual([]);
  });

  it('keeps legacy Defense SVGs only as geometry/rollback references', () => {
    expect(visuals.status).toBe('LEGACY_GEOMETRY_ONLY');
    expect(visuals.assets.every(asset => asset.uri.endsWith('.svg'))).toBe(true);
    expect(visuals.assets.every(asset => asset.status === 'LEGACY_GEOMETRY_ONLY')).toBe(true);
  });

  it('revokes the old SWIFT SVG production approval', () => {
    expect(benchmark.benchmark.risk.target.kind).toBe('LEGACY_SVG_REFERENCE');
    expect(benchmark.runtimePromotion.swiftApproved).toBe(false);
    expect(benchmark.runtimePromotion.approvedAssets.swift).toBeNull();
    expect(benchmark.manualReview.swift.assessment).toBe('REJECT_AS_FINAL');
  });

  it('keeps Episode 01 final character/background imagery raster-only', () => {
    const paths = [
      episodeVisuals.backgrounds.foundation.path,
      ...Object.values(episodeVisuals.characters).flatMap(character => [
        character.portrait_path,
        character.map_path,
      ]),
    ];
    expect(paths.every(path => /\.(webp|png|jpe?g|avif)$/i.test(path))).toBe(true);
    expect(paths.some(path => /\.svg$/i.test(path))).toBe(false);
  });

  it('locks G8-A only after both final rasters and actual-play QA pass', () => {
    expect(productionMaps.status).toBe('G8A_PRODUCTION_LOCKED');
    expect(productionMaps.maps[0]?.status).toBe('PRODUCTION_LOCKED');
    expect(productionMaps.maps[0]?.representativeSlice.responseState).toBe('RASTER_RUNTIME_COMPOSITE_PASS');
    expect(productionMaps.maps[0]?.representativeSlice.worldPlate.state).toBe('FINAL_RASTER_LOCKED');
    expect(productionMaps.maps[0]?.representativeSlice.riskState).toBe('FINAL_RASTER_LOCKED');
    expect(worldFinal.status).toBe('PRODUCTION_APPROVED');
    expect(worldFinal.promotion.productionApproved).toBe(true);
    expect(swiftFinal.status).toBe('PRODUCTION_APPROVED');
    expect(swiftFinal.promotion.productionApproved).toBe(true);
    expect(policy.enforcement.g8aState).toBe('PRODUCTION_LOCKED');
    expect(productionMaps.maps[0]?.finalArtPolicy.productionLockAllowed).toBe(true);
  });
  it('opens G8-B without reopening G8-A or allowing pending art into production', () => {
    expect(policy.enforcement.currentGate).toBe('G8-B');
    expect(policy.enforcement.g8aState).toBe('PRODUCTION_LOCKED');
    expect(policy.enforcement.g8bState).toBe('SENSOR_PASS_WORLD_AND_VEILED_FINAL_REQUIRED');
    expect(g8bWorld.status).toBe('ASSET_PENDING');
    expect(g8bWorld.promotion.productionApproved).toBe(false);
    expect(g8bVeiled.status).toBe('ASSET_PENDING');
    expect(g8bVeiled.promotion.productionApproved).toBe(false);
  });
});
