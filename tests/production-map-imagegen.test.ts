import { describe, expect, it } from 'vitest';
import commercial from '../content/episode01/commercial-visual-target.json';
import imagegen from '../content/episode01/production-map-imagegen.json';

describe('Production Map image generation brief', () => {
  it('targets the exact runtime background asset and preferred commercial resolution', () => {
    expect(imagegen.asset_id).toBe(commercial.architecture.background_asset_id);
    expect(imagegen.output.final_path).toBe(commercial.architecture.final_path);
    expect(imagegen.output.width).toBe(commercial.strategy_map.preferred_resolution.width);
    expect(imagegen.output.height).toBe(commercial.strategy_map.preferred_resolution.height);
    expect(imagegen.output.minimum_width).toBe(commercial.strategy_map.minimum_resolution.width);
    expect(imagegen.output.minimum_height).toBe(commercial.strategy_map.minimum_resolution.height);
  });

  it('keeps all production art anchors synchronized with the runtime contract', () => {
    const commercialAnchors = commercial.map_anchor_contract;
    for (const [anchor, definition] of Object.entries(imagegen.normalized_anchors)) {
      const target = commercialAnchors[anchor as keyof typeof commercialAnchors];
      expect(typeof target).toBe('object');
      if (typeof target !== 'object') continue;
      expect(definition.x).toBe(target.x);
      expect(definition.y).toBe(target.y);
    }
    expect(Object.keys(imagegen.normalized_anchors)).toHaveLength(8);
  });

  it('keeps interactive information out of generated background art', () => {
    expect(imagegen.runtime_contract.anchors_are_runtime_overlays).toBe(true);
    expect(imagegen.runtime_contract.characters_are_runtime_overlays).toBe(true);
    expect(imagegen.runtime_contract.risk_signals_are_runtime_overlays).toBe(true);
    expect(imagegen.runtime_contract.minimap_uses_same_anchor_geometry).toBe(true);
    expect(imagegen.art_direction.ui_rule).toContain('no readable interface text');
  });
});
