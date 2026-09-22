import { describe, expect, it } from 'vitest';
import assets from '../content/episode01/assets.json';
import catalog from '../content/episode01/scene-element-catalog.json';
import section2 from '../content/episode01/field-guide-section2-production.json';

const expected = {
  euroform_wall_panel: ['c9f082661d04dd721e7e159df9b3548595a51dd5b291d8d4f2b091289b259ece', 184348],
  formwork_tie: ['c3163eefe18069e2ec4b28a49a196de08515e731376c738dbd05d9bba8f0ac8a', 187422],
  formwork_brace: ['5351208782aa81147a12bdb63ff6c705a6598ee9bf0c30f3222d84a8da3e2fa7', 172766],
  formwork_work_platform: ['b4a574c6b6b9d947173b9acb5a27d427a5fc3ba6643a2a84f20b8cb8621620d2', 172792],
} as const;

describe('Field Guide S2-A realistic-v2 production lock', () => {
  it('locks FG024-FG027 to final realistic-v2 assets', () => {
    for (const [key, [hash, bytes]] of Object.entries(expected)) {
      const entry = catalog.elements[key as keyof typeof catalog.elements];
      expect(entry.production_status).toBe('final');
      expect(entry.art.style_profile).toBe('field-guide-production-realistic-v2');
      expect(entry.art.render_intent).toBe('realistic_isometric_construction_asset');
      expect(entry.production?.width).toBe(768);
      expect(entry.production?.height).toBe(768);
      expect(entry.production?.sha256).toBe(hash);
      expect(entry.production?.bytes).toBe(bytes);
    }
  });

  it('keeps manifest hashes synchronized with the catalog', () => {
    for (const [key, [hash, bytes]] of Object.entries(expected)) {
      const entry = catalog.elements[key as keyof typeof catalog.elements];
      const asset = assets.assets.find(candidate => candidate.asset_id === entry.planned_asset_id);
      expect(asset).toBeDefined();
      expect(asset?.version).toBe('2');
      expect(asset?.variants[0]?.hash).toBe(hash);
      expect(asset?.variants[0]?.bytes).toBe(bytes);
      expect(asset?.variants[0]?.uri).toBe(entry.art.path);
    }
  });

  it('advances Section 2 production to S2-B only after S2-A is final', () => {
    const batch = section2.batches.find(candidate => candidate.batch_id === 'S2-A');
    expect(batch?.status).toBe('final');
    expect(batch?.items.every(item => item.status === 'final' && item.visual_acceptance === 'approved_realistic_v2')).toBe(true);
    expect(section2.current_batch).toBe('S2-B');
  });
});
