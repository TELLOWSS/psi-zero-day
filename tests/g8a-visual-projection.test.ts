import { describe, expect, it } from 'vitest';
import { defenseVisualPadPoint, defenseVisualPath, defenseVisualPositionAtDistance, g8aVisualProjection } from '../src/app/defense-visual-projection';

const logical = [[0,500],[180,500],[180,390],[370,390],[370,240],[620,240],[620,120],[1000,120]] as const;

describe('G8-A render-only visual projection', () => {
  it('preserves simulation topology while projecting visuals onto the photographed haul road', () => {
    expect(g8aVisualProjection.preservesSimulationTopology).toBe(true);
    expect(defenseVisualPath('map-apt-bottom-up-excavation-01', logical)).toEqual([
      [470,495],[585,480],[660,445],[735,420],[805,355],[870,300],[930,245],[1000,205],
    ]);
    expect(logical[0]).toEqual([0,500]);
  });

  it('projects the representative CONTROL pad beside the visual road instead of the excavation equipment', () => {
    expect(defenseVisualPadPoint('map-apt-bottom-up-excavation-01', { id:'BU-P3', x:300, y:315 })).toEqual({ x:680, y:480 });
  });

  it('keeps enemy progress monotonic along the projected road', () => {
    const a=defenseVisualPositionAtDistance('map-apt-bottom-up-excavation-01',logical,0);
    const b=defenseVisualPositionAtDistance('map-apt-bottom-up-excavation-01',logical,400);
    const c=defenseVisualPositionAtDistance('map-apt-bottom-up-excavation-01',logical,1200);
    expect(a.x).toBe(470);
    expect(b.x).toBeGreaterThan(a.x);
    expect(c.x).toBeGreaterThan(b.x);
  });

  it('does not alter non-G8A render coordinates', () => {
    expect(defenseVisualPadPoint('other-map',{id:'P1',x:120,y:220})).toEqual({x:120,y:220});
  });
});
