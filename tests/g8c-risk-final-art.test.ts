import { existsSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from '../content/defense/g8c-risk-final-art.json';
import sceneCatalog from '../content/episode01/scene-element-catalog.json';
import { defenseG8cRiskFinalAsset } from '../src/app/defense-visual-assets';
import type { DefenseEnemyId } from '../src/domain/defense';

describe('G8-C construction-risk final-art candidate', () => {
  it('reinterprets every non-SWIFT enemy as a construction-site risk or combined work condition', () => {
    expect(manifest.status).toBe('PRODUCTION_CANDIDATE');
    expect(manifest.promotion.runtimeCandidate).toBe(true);
    expect(manifest.promotion.productionApproved).toBe(false);
    expect(manifest.assets.map(asset => asset.enemyId)).toEqual(['NORMAL','ARMORED','SWARM','VEILED','BOSS']);
    for (const asset of manifest.assets) {
      expect(asset.displayName.toLowerCase()).not.toContain('monster');
      expect(asset.role.length).toBeGreaterThan(10);
      expect(defenseG8cRiskFinalAsset(asset.enemyId as DefenseEnemyId)).not.toBeNull();
    }
    expect(defenseG8cRiskFinalAsset('SWIFT')).toBeNull();
  });

  it('uses only raster runtime parts and repository assets', () => {
    for (const asset of manifest.assets) {
      for (const part of asset.parts) {
        expect(part.uri.toLowerCase()).not.toContain('.svg');
        expect(['.webp','.png','.jpg','.jpeg','.avif'].some(ext => part.uri.toLowerCase().endsWith(ext))).toBe(true);
        expect(existsSync('public/' + part.uri)).toBe(true);
        expect(statSync('public/' + part.uri).size).toBeGreaterThan(5_000);
      }
    }
  });

  it('uses only scene-element sources already approved as final where catalog sources are declared', () => {
    const sources = sceneCatalog.elements as Record<string, {
      production_status: string;
      art: { path: string; style_profile?: string; requires_alpha?: boolean };
      production?: { legal_visual_gate?: string };
    }>;
    for (const asset of manifest.assets) {
      for (const key of asset.sourceCatalogKeys) {
        const source = sources[key];
        expect(source).toBeDefined();
        expect(source?.production_status).toBe('final');
        expect(source?.art.style_profile).toBe('field-guide-production-realistic-v2');
        expect(source?.art.requires_alpha).toBe(true);
        expect(source?.production?.legal_visual_gate).toBe('field-guide-kr-legal-basis-v1');
      }
    }
  });

  it('locks BOSS as a composite work situation instead of a monster body', () => {
    const boss = manifest.assets.find(asset => asset.enemyId === 'BOSS')!;
    expect(boss.render).toBe('COMPOSITE');
    expect(boss.parts.length).toBeGreaterThanOrEqual(3);
    expect(boss.role).toContain('복합');
    expect(manifest.sourceRule.reinterpretation.BOSS).toContain('몬스터가 아니라');
  });

  it('requires desktop/mobile actual-play evidence before Production Approved', () => {
    expect(manifest.promotion.requires).toContain('DESKTOP_ALL_RISK_ACTUAL_PLAY_QA_PASS');
    expect(manifest.promotion.requires).toContain('MOBILE_390x844_ALL_RISK_ACTUAL_PLAY_QA_PASS');
    expect(manifest.promotion.requires).toContain('NORMAL_ARMORED_SWARM_VEILED_BOSS_PROTOTYPE_GLYPHS_0');
    expect(manifest.promotion.requires).toContain('ACTIVE_SVG_G8C_RISK_VISUALS_0');
  });
});
