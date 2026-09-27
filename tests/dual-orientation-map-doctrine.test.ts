import { describe, expect, it } from 'vitest';
import doctrine from '../content/defense/dual-orientation-map-doctrine.json';
import { defenseMapFrame, defenseMapPointPercent, defenseMapViewBox } from '../src/app/defense-map-framing';
import { g8aVisualProjection } from '../src/app/defense-visual-projection';

describe('Dual-orientation map doctrine', () => {
  it('keeps G8-A landscape topology unchanged', () => {
    const frame = defenseMapFrame('map-apt-bottom-up-excavation-01', false, 1000, 600);
    expect(frame).toEqual({ x: 0, y: 60, width: 1000, height: 480, mode: 'LANDSCAPE_STRATEGY' });
    expect(defenseMapViewBox(frame)).toBe('0 60 1000 480');
  });

  it('keeps all reviewed G8-A route and pad projection inside the physical-phone landscape frame', () => {
    const frame = defenseMapFrame('map-apt-bottom-up-excavation-01', false, 1000, 600);
    for (const point of [
      ...g8aVisualProjection.route.map(([x, y], index) => ({ x, y, id: `route-${index}` })),
      ...Object.entries(g8aVisualProjection.pads).map(([id, point]) => ({ ...point, id })),
    ]) {
      expect(defenseMapPointPercent(frame, point.x, point.y).visible, point.id).toBe(true);
    }
    expect(doctrine.landscapeDoctrine.physicalPhoneWorldViewportTarget.minimumWidthShare).toBeGreaterThanOrEqual(0.94);
    expect(doctrine.landscapeDoctrine.physicalPhoneWorldViewportTarget.minimumHeightShare).toBeGreaterThanOrEqual(0.94);
  });

  it('uses a dedicated close portrait frame instead of shrinking the entire map', () => {
    const frame = defenseMapFrame('map-apt-bottom-up-excavation-01', true, 1000, 600);
    expect(frame).toEqual({ x: 430, y: 80, width: 330, height: 520, mode: 'PORTRAIT_IMMERSION' });
    expect(frame.width).toBeLessThan(1000);
    expect(frame.height).toBeLessThanOrEqual(600);
    expect(doctrine.portraitDoctrine.worldViewportTarget.minimumScreenShare).toBeGreaterThanOrEqual(0.72);
  });

  it('keeps the representative visual conflict on the reviewed haul road inside the portrait frame', () => {
    const frame = defenseMapFrame('map-apt-bottom-up-excavation-01', true, 1000, 600);
    const points = [
      { x: g8aVisualProjection.route[0][0], y: g8aVisualProjection.route[0][1], id: 'SWIFT/VEILED approach' },
      { x: g8aVisualProjection.route[1][0], y: g8aVisualProjection.route[1][1], id: 'approach continuation' },
      { x: g8aVisualProjection.route[2][0], y: g8aVisualProjection.route[2][1], id: 'conflict approach' },
      { x: g8aVisualProjection.pads['BU-P3']!.x, y: g8aVisualProjection.pads['BU-P3']!.y, id: 'CONTROL representative pad' },
    ];
    for (const point of points) {
      expect(defenseMapPointPercent(frame, point.x, point.y).visible, point.id).toBe(true);
    }
  });

  it('never changes route/pad topology or balance by orientation', () => {
    expect(doctrine.sharedRules.singleTopology).toBe(true);
    expect(doctrine.sharedRules.routeCoordinatesImmutableAcrossOrientation).toBe(true);
    expect(doctrine.sharedRules.padCoordinatesImmutableAcrossOrientation).toBe(true);
    expect(doctrine.sharedRules.orientationMayChangeCameraOnly).toBe(true);
    expect(doctrine.sharedRules.orientationMayNotChangeBalance).toBe(true);
    expect(doctrine.sharedRules.simulationTopologyRemainsAuthoritative).toBe(true);
    expect(doctrine.sharedRules.visualProjectionMayAlignToReviewedWorldArt).toBe(true);
    expect(doctrine.sharedRules.visualProjectionMustBeSharedAcrossOrientations).toBe(true);
    expect(g8aVisualProjection.preservesSimulationTopology).toBe(true);
    expect(doctrine.g8a.lockedWorldReopen).toBe(false);
  });
});
