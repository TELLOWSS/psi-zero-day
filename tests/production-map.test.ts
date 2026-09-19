import { describe, expect, it } from 'vitest';
import target from '../content/episode01/commercial-visual-target.json';
import {
  PRODUCTION_MAP_ANCHOR_IDS,
  productionMapPoint,
  productionMapPurpose,
  productionMapStyle,
} from '../src/app/production-map';

describe('Production Map anchor contract', () => {
  it('covers every commercial target anchor with normalized coordinates', () => {
    expect(PRODUCTION_MAP_ANCHOR_IDS).toEqual([
      'gate', 'entry', 'yard', 'ramp', 'inspection', 'core', 'office', 'overview',
    ]);

    for (const anchor of PRODUCTION_MAP_ANCHOR_IDS) {
      const point = productionMapPoint(anchor);
      expect(point.x).toBeGreaterThan(0);
      expect(point.x).toBeLessThan(1);
      expect(point.y).toBeGreaterThan(0);
      expect(point.y).toBeLessThan(1);
      expect(productionMapPurpose(anchor)).toBe(target.map_anchor_contract[anchor].purpose);
    }
  });

  it('keeps the minimap on the exact same normalized geometry as the production plate', () => {
    for (const anchor of PRODUCTION_MAP_ANCHOR_IDS) {
      expect(productionMapPoint(anchor, 'minimap')).toEqual(productionMapPoint(anchor, 'zone'));
    }
  });

  it('derives character and risk-signal placement from anchors instead of CSS classes', () => {
    expect(productionMapStyle('ramp', 'zone')).toEqual({ left: '49%', top: '31%' });
    expect(productionMapStyle('ramp', 'character')).toEqual({ left: '49%', top: '34.5%' });
    expect(productionMapStyle('ramp', 'signal')).toEqual({ left: '52.5%', top: '27.5%' });
    expect(productionMapStyle('office', 'character')).toEqual({ left: '83%', top: '71.5%' });
  });
});
