import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8b-response-tower-final-art.json';
import sceneCatalog from '../content/episode01/scene-element-catalog.json';
import { defenseG8bTowerFinalAsset, defenseTowerArtUri } from '../src/app/defense-visual-assets';
import type { DefenseLevelId, DefenseTowerId } from '../src/domain/defense';

describe('G8-B response tower final-art candidate', () => {
  it('replaces PULSE/BURST/SENSOR prototype glyphs with non-SVG raster candidates', () => {
    expect(manifest.status).toBe('PRODUCTION_CANDIDATE');
    expect(manifest.promotion.runtimeCandidate).toBe(true);
    expect(manifest.promotion.productionApproved).toBe(false);
    expect(manifest.assets.map(asset => asset.towerId)).toEqual(['PULSE','BURST','SENSOR']);
    for (const asset of manifest.assets) {
      expect(asset.format).toBe('webp');
      expect(asset.runtimeUri.toLowerCase()).not.toContain('.svg');
      expect(asset.levels).toEqual(['L1','L2','L3A','L3B']);
      expect(existsSync('public/' + asset.runtimeUri)).toBe(true);
      expect(statSync('public/' + asset.runtimeUri).size).toBeGreaterThan(50_000);
      for (const levelId of asset.levels) {
        const towerId = asset.towerId as DefenseTowerId;
        const typedLevelId = levelId as DefenseLevelId;
        expect(defenseTowerArtUri(towerId, typedLevelId)).toBe(asset.runtimeUri);
        expect(defenseG8bTowerFinalAsset(towerId, typedLevelId)?.uri).toBe(asset.runtimeUri);
      }
    }
  });

  it('reuses only scene-element sources already reviewed as final realistic production art', () => {
    const sources = sceneCatalog.elements as Record<string, {
      production_status: string;
      art: { style_profile?: string; requires_alpha?: boolean; path: string };
      production?: { legal_visual_gate?: string };
    }>;
    for (const asset of manifest.assets) {
      const source = sources[asset.sourceCatalogKey];
      expect(source).toBeDefined();
      expect(source?.production_status).toBe('final');
      expect(source?.art.style_profile).toBe('field-guide-production-realistic-v2');
      expect(source?.art.requires_alpha).toBe(true);
      expect(source?.production?.legal_visual_gate).toBe('field-guide-kr-legal-basis-v1');
      expect(source?.art.path).toBe(asset.runtimeUri);
    }
  });

  it('keeps CONTROL outside G8-B so the locked G8-A marshal/barrier contract is not reopened', () => {
    expect(manifest.scope.excludes).toContain('CONTROL');
    expect(manifest.assets.some(asset => asset.towerId === 'CONTROL')).toBe(false);
    expect(defenseG8bTowerFinalAsset('CONTROL', 'L1')).toBeNull();
  });

  it('requires actual-play mobile and desktop evidence before promotion', () => {
    expect(manifest.promotion.requires).toContain('DESKTOP_THREE_TOWER_ACTUAL_PLAY_QA_PASS');
    expect(manifest.promotion.requires).toContain('MOBILE_390x844_THREE_TOWER_ACTUAL_PLAY_QA_PASS');
    expect(manifest.promotion.requires).toContain('ACTIVE_SVG_TOWER_VISUALS_0');
    expect(manifest.promotion.requires).toContain('PULSE_BURST_SENSOR_PROTOTYPE_GLYPHS_0');
  });
});
