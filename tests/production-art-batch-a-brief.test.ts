import { describe, expect, it } from 'vitest';
import batchA from '../content/episode01/production-art-batch-a.json';
import visuals from '../content/episode01/visuals.json';

const expectedSources = [
  'foundation:background',
  'player:portrait',
  'player:map',
  'kang_taesik:portrait',
  'kang_taesik:map',
  'lim_junho:portrait',
  'lim_junho:map',
] as const;

const expectedPaths = [
  visuals.backgrounds.foundation.path,
  visuals.characters.player.portrait_path,
  visuals.characters.player.map_path,
  visuals.characters.kang_taesik.portrait_path,
  visuals.characters.kang_taesik.map_path,
  visuals.characters.lim_junho.portrait_path,
  visuals.characters.lim_junho.map_path,
];

describe('TASK-016B Batch A production art brief', () => {
  it('locks exactly the seven title and first-play production assets', () => {
    expect(batchA.task).toBe('TASK-016B');
    expect(batchA.batch).toBe('A');
    expect(batchA.assets).toHaveLength(7);
    expect(batchA.assets.map(asset => asset.source)).toEqual(expectedSources);
    expect(batchA.assets.map(asset => asset.path)).toEqual(expectedPaths);
    expect(new Set(batchA.assets.map(asset => asset.path)).size).toBe(7);
  });

  it('requires commercial-resolution source sizes before Batch A can pass', () => {
    const foundation = batchA.assets.find(asset => asset.source === 'foundation:background');
    expect(foundation?.minimum_size).toEqual({ width: 1920, height: 1080 });

    for (const asset of batchA.assets.filter(asset => asset.kind === 'portrait')) {
      expect(asset.minimum_size.width).toBeGreaterThanOrEqual(1024);
      expect(asset.minimum_size.height).toBeGreaterThanOrEqual(1024);
      expect(asset.transparent_background).toBe(true);
    }

    for (const asset of batchA.assets.filter(asset => asset.kind === 'map')) {
      expect(asset.minimum_size.width).toBeGreaterThanOrEqual(768);
      expect(asset.minimum_size.height).toBeGreaterThanOrEqual(1024);
      expect(asset.transparent_background).toBe(true);
    }
  });

  it('keeps portrait/map identity paired while separating the three lead silhouettes', () => {
    const characterAssets = batchA.assets.filter(asset => 'character_id' in asset);
    const characterIds = ['player', 'kang_taesik', 'lim_junho'] as const;
    const silhouettes = new Set<string>();
    const props = new Set<string>();

    for (const characterId of characterIds) {
      const variants = characterAssets.filter(asset => asset.character_id === characterId);
      expect(variants).toHaveLength(2);
      expect(new Set(variants.map(asset => asset.kind))).toEqual(new Set(['portrait', 'map']));
      expect(new Set(variants.map(asset => asset.silhouette)).size).toBe(1);
      expect(new Set(variants.map(asset => asset.signature_prop)).size).toBe(1);

      const representative = variants[0];
      expect(representative).toBeDefined();
      if (!representative) throw new Error(`Missing Batch A variants for ${characterId}`);

      const silhouette = representative.silhouette;
      const signatureProp = representative.signature_prop;
      expect(silhouette).toBeTruthy();
      expect(signatureProp).toBeTruthy();
      if (!silhouette || !signatureProp) {
        throw new Error(`Incomplete Batch A identity contract for ${characterId}`);
      }

      silhouettes.add(silhouette);
      props.add(signatureProp);
    }

    expect(silhouettes.size).toBe(3);
    expect(props.size).toBe(3);
  });

  it('explicitly rejects known character and generated-mockup defects', () => {
    const rejects = batchA.shared_reject_conditions.join(' | ');
    expect(rejects).toMatch(/same-face cast/i);
    expect(rejects).toMatch(/helmet-color-only differentiation/i);
    expect(rejects).toMatch(/pseudo text/i);
    expect(rejects).toMatch(/childlike body proportions/i);
    expect(rejects).toMatch(/duplicated limbs/i);
    expect(rejects).toMatch(/company, project, apartment, site, or building names/i);
    expect(rejects).toMatch(/baked-in HUD/i);
    expect(rejects).toMatch(/mockup board/i);
    expect(rejects).toMatch(/screenshot collage/i);
  });

  it('keeps the Foundation slot as raw world art instead of a composed game screenshot', () => {
    const foundation = batchA.assets.find(asset => asset.source === 'foundation:background');
    expect(foundation).toBeDefined();
    expect(foundation?.production_brief).toMatch(/Artwork only/i);
    expect(foundation?.production_brief).toMatch(/no baked-in HUD/i);
    expect(foundation?.production_brief).toMatch(/readable company\/project\/site\/building names/i);
  });
});
