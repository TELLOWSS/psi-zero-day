import { describe, expect, it } from 'vitest';
import doctrine from '../content/defense/dual-orientation-map-doctrine.json';
import { defenseMapFrame, defenseMapPointPercent, defenseMapViewBox } from '../src/app/defense-map-framing';

describe('Dual-orientation map doctrine', () => {
  it('keeps G8-A landscape topology unchanged', () => {
    const frame = defenseMapFrame('map-apt-bottom-up-excavation-01', false, 1000, 600);
    expect(frame).toEqual({ x: 0, y: 0, width: 1000, height: 600, mode: 'LANDSCAPE_STRATEGY' });
    expect(defenseMapViewBox(frame)).toBe('0 0 1000 600');
  });

  it('uses a dedicated close portrait frame instead of shrinking the entire map', () => {
    const frame = defenseMapFrame('map-apt-bottom-up-excavation-01', true, 1000, 600);
    expect(frame).toEqual({ x: 0, y: 80, width: 330, height: 520, mode: 'PORTRAIT_IMMERSION' });
    expect(frame.width).toBeLessThan(1000);
    expect(frame.height).toBeLessThanOrEqual(600);
    expect(doctrine.portraitDoctrine.worldViewportTarget.minimumScreenShare).toBeGreaterThanOrEqual(0.72);
  });

  it('keeps the representative conflict actors inside the portrait frame', () => {
    const frame = defenseMapFrame('map-apt-bottom-up-excavation-01', true, 1000, 600);
    for (const point of [
      { x: 42, y: 500, id: 'SWIFT representative approach' },
      { x: 76, y: 500, id: 'VEILED representative approach' },
      { x: 300, y: 315, id: 'CONTROL representative pad' },
      { x: 150, y: 430, id: 'ramp intervention anchor' },
    ]) {
      expect(defenseMapPointPercent(frame, point.x, point.y).visible, point.id).toBe(true);
    }
  });

  it('never changes route/pad topology or balance by orientation', () => {
    expect(doctrine.sharedRules.singleTopology).toBe(true);
    expect(doctrine.sharedRules.routeCoordinatesImmutableAcrossOrientation).toBe(true);
    expect(doctrine.sharedRules.padCoordinatesImmutableAcrossOrientation).toBe(true);
    expect(doctrine.sharedRules.orientationMayChangeCameraOnly).toBe(true);
    expect(doctrine.sharedRules.orientationMayNotChangeBalance).toBe(true);
    expect(doctrine.g8a.lockedWorldReopen).toBe(false);
  });
});
