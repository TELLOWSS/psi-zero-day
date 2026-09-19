import { describe, expect, it } from 'vitest';
import artProduction from '../content/episode01/character-art-production.json';
import performanceProduction from '../content/episode01/character-performance-production.json';
import {
  EPISODE01_CHARACTER_PERFORMANCE_EXPRESSIONS,
  episode01CharacterPerformanceAsset,
  episode01CharacterPerformanceAssetId,
} from '../src/app/episode01-character-performance-assets';

describe('Episode 01 character performance asset contract', () => {
  it('uses the same approved expression vocabulary as character art production', () => {
    expect(EPISODE01_CHARACTER_PERFORMANCE_EXPRESSIONS).toEqual(artProduction.expression_set);
    expect(performanceProduction.expression_set).toEqual(artProduction.expression_set);
  });

  it('builds stable asset IDs and expected WebP paths', () => {
    expect(episode01CharacterPerformanceAssetId('lim_junho', 'concern'))
      .toBe('ep01.character.lim_junho.performance.concern');

    const asset = episode01CharacterPerformanceAsset('lim_junho', 'concern', () => undefined);
    expect(asset).toMatchObject({
      asset_id: 'ep01.character.lim_junho.performance.concern',
      expected_path: 'assets/episode01/characters/performance/lim-junho-concern.webp',
      using_expression_asset: false,
    });
  });

  it('uses expression art immediately when the resolver can supply it', () => {
    const asset = episode01CharacterPerformanceAsset(
      'seo_jeongmin',
      'resolve',
      assetId => assetId === 'ep01.character.seo_jeongmin.performance.resolve'
        ? '/assets/episode01/characters/performance/seo-jeongmin-resolve.webp'
        : undefined,
    );
    expect(asset?.using_expression_asset).toBe(true);
    expect(asset?.uri).toContain('seo-jeongmin-resolve.webp');
  });

  it('keeps unknown characters outside the production contract', () => {
    expect(episode01CharacterPerformanceAssetId('unknown', 'neutral')).toBeUndefined();
    expect(episode01CharacterPerformanceAsset('unknown', 'neutral', () => undefined)).toBeUndefined();
  });
  it('reuses the existing Junho concerned WebP as the concern-state compatibility asset', () => {
    const asset = episode01CharacterPerformanceAsset(
      'lim_junho',
      'concern',
      assetId => assetId === 'ep01.character.lim_junho.concerned'
        ? 'assets/episode01/characters/lim-junho-concerned.webp'
        : undefined,
    );

    expect(asset?.using_expression_asset).toBe(true);
    expect(asset?.resolved_asset_id).toBe('ep01.character.lim_junho.concerned');
    expect(asset?.uri).toBe('assets/episode01/characters/lim-junho-concerned.webp');
    expect(asset?.asset_id).toBe('ep01.character.lim_junho.performance.concern');
  });

});
