import { describe, expect, it } from 'vitest';
import policy from '../content/defense/final-art-policy.json';
import legal from '../content/defense/korea-legal-visual-standard-v1.json';
import brief from '../content/defense/g8a-bottom-up-high-end-raster-brief.json';
import maps from '../content/defense/production-map-family-v1.json';

describe('Korea-law high-end visual production standard', () => {
  it('requires law grounding and rejects invented legal numbers', () => {
    expect(legal.status).toBe('KOREA_LEGAL_VISUAL_STANDARD_LOCKED');
    expect(legal.jurisdiction).toBe('대한민국');
    expect(policy.rules.koreaLawGroundingRequired).toBe(true);
    expect(policy.rules.legalFactsMustBeVerifiedBeforeRender).toBe(true);
    expect(policy.rules.legalNumbersMayNotBeInvented).toBe(true);
    expect(legal.globalRules.legalNumbers).toContain('임의 생성 금지');
  });

  it('covers common construction visual law families', () => {
    const ids = new Set(legal.sourceRegistry.map(source => source.id));
    for (const id of [
      'KR-OSH-22','KR-OSH-32','KR-OSH-38','KR-OSH-42-44','KR-OSH-199-200',
      'KR-OSH-301-318','KR-OSH-338-341','KR-BMA-30','KR-BMA-R12',
      'KR-HOUSING-2-25','KR-KALIS-REMODEL','KR-KOSHA-CONSTRUCTION',
    ]) expect(ids.has(id)).toBe(true);
  });

  it('defines legal visual profiles for bottom-up, top-down, remodeling and data-center work', () => {
    const ids = legal.visualProfiles.map(profile => profile.id);
    expect(ids).toContain('KR-CONSTRUCTION-BOTTOM-UP-EXCAVATION-01');
    expect(ids).toContain('KR-CONSTRUCTION-TOP-DOWN-01');
    expect(ids).toContain('KR-CONSTRUCTION-REMODEL-01');
    expect(ids).toContain('KR-CONSTRUCTION-DATACENTER-01');
  });

  it('binds G8-A to the bottom-up legal profile and blocks lock while final raster asset is missing', () => {
    const map = maps.maps[0]!;
    expect(map.legalVisualProfileId).toBe('KR-CONSTRUCTION-BOTTOM-UP-EXCAVATION-01');
    expect(map.legalCompliance.status).toBe('BRIEF_READY_ASSET_PENDING');
    expect(map.legalCompliance.productionLockAllowed).toBe(false);
    expect(map.finalArtPolicy.productionLockAllowed).toBe(false);
  });

  it('sets a 4K-class 5:3 raster brief with no SVG, baked UI, real company branding or fake Korean text', () => {
    expect(brief.output.masterWidth).toBeGreaterThanOrEqual(4000);
    expect(brief.output.masterHeight).toBeGreaterThanOrEqual(2400);
    expect(brief.output.finalFormats).toEqual(['webp','png']);
    expect(brief.negativePrompt).toContain('SVG');
    expect(brief.negativePrompt).toContain('flat vector art');
    expect(brief.negativePrompt).toContain('readable fake Korean text');
    expect(brief.negativePrompt).toContain('real company logo');
    expect(brief.acceptance).toContain('no SVG final asset in the representative slice');
  });

  it('requires explicit scene intent when a visual contains an unsafe condition', () => {
    expect(legal.renderIntent.map(intent => intent.id)).toEqual([
      'COMPLIANT','HAZARD_SIGNAL','TRANSITION','AFTERMATH',
    ]);
    expect(policy.rules.unsafeSceneRequiresRenderIntent).toBe(true);
  });
});
