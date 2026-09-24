import { describe, expect, it } from 'vitest';
import { zeroBreachContent } from '../src/content/defense';
import layout from '../content/defense/def-hd01-world-layout.json';

describe('DEF-HD01 master-world layout contract', () => {
  it('inherits the locked DefenseGame board size and route exactly', () => {
    expect(layout.sourceBaseline.mapId).toBe(zeroBreachContent.map.id);
    expect(layout.sourceBaseline.logicalSize).toEqual({
      width: zeroBreachContent.map.width,
      height: zeroBreachContent.map.height,
    });
    expect(layout.routeContract.points).toEqual(zeroBreachContent.map.path);
  });

  it('keeps all eight runtime pad centers unchanged', () => {
    expect(layout.pads.map(({ id, x, y }) => ({ id, x, y }))).toEqual(zeroBreachContent.map.pads);
  });

  it('protects every pad with a non-zero permanent-prop keepout radius', () => {
    expect(layout.padArtRules.keepoutRadius).toBeGreaterThan(0);
    expect(layout.padArtRules.preferredClearRadius).toBeGreaterThan(layout.padArtRules.keepoutRadius);
    expect(layout.padArtRules.allowAnyTowerFamily).toBe(true);
  });

  it('does not bake gameplay UI into the MASTER WORLD art contract', () => {
    expect(layout.artDirection.noBakedText).toBe(true);
    expect(layout.artDirection.noBakedPadLabels).toBe(true);
    expect(layout.artDirection.noBakedHazardIcons).toBe(true);
  });

  it('covers the complete board with construction-site operational zones', () => {
    expect(layout.zones).toHaveLength(8);
    expect(layout.zones.some(zone => zone.id === 'Z1_GATE')).toBe(true);
    expect(layout.zones.some(zone => zone.id === 'Z4_CORE')).toBe(true);
    expect(layout.zones.some(zone => zone.id === 'Z5_SOUTH_SERVICE')).toBe(true);
    expect(layout.zones.some(zone => zone.id === 'Z6_EAST_WORKFACE')).toBe(true);
  });
});
