import { describe, expect, it } from 'vitest';
import target from '../content/episode01/commercial-visual-target.json';

describe('Episode 01 commercial visual target', () => {
  it('locks the strategy map to a production WebP slot above prototype resolution', () => {
    expect(target.architecture.background_asset_id).toBe('ep01.background.foundation.map');
    expect(target.architecture.final_path).toBe('assets/episode01/backgrounds/foundation-map.webp');
    expect(target.strategy_map.minimum_resolution.width).toBeGreaterThanOrEqual(2560);
    expect(target.strategy_map.minimum_resolution.height).toBeGreaterThanOrEqual(1440);
    expect(target.strategy_map.preferred_resolution).toEqual({ width: 3072, height: 1728 });
  });

  it('keeps gameplay UI out of the generated map art', () => {
    expect(target.architecture.ui_rule).toContain('runtime DOM/UI');
    expect(target.strategy_map.reject.some(item => item.includes('baked Korean text'))).toBe(true);
    expect(target.strategy_map.runtime_layers).toContain('risk signals');
    expect(target.strategy_map.runtime_layers).toContain('named character map cutouts');
  });

  it('defines stable physical anchors for an interactive high-detail map plate', () => {
    const anchors = Object.entries(target.map_anchor_contract).filter(([key]) => key !== 'note');
    expect(anchors).toHaveLength(8);
    for (const [, value] of anchors) {
      if (typeof value === 'string') continue;
      expect(value.x).toBeGreaterThan(0);
      expect(value.x).toBeLessThan(1);
      expect(value.y).toBeGreaterThan(0);
      expect(value.y).toBeLessThan(1);
    }
  });

  it('covers the supplied reference families without requiring a new gameplay engine', () => {
    expect(target.architecture.preserve_engine).toBe(true);
    expect(Object.keys(target.cinematic_surfaces).sort()).toEqual(['day_result', 'office_dialogue', 'stop_work']);
    expect(target.production_order[0]).toContain('foundation-map.webp');
  });
});
