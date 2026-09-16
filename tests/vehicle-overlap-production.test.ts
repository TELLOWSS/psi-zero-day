import { describe, expect, it } from 'vitest';
import catalog from '../content/episode01/scene-element-catalog.json';

describe('vehicle overlap production contract', () => {
  it('keeps the reusable traffic-conflict overlay final and text/object free', () => {
    const element = catalog.elements.vehicle_overlap_zone;
    expect(element.production_status).toBe('final');
    expect(element.planned_asset_id).toBe('ep01.scene_element.vehicle_overlap');
    expect(element.art).toMatchObject({
      path: 'assets/episode01/scene-elements/vehicle-overlap.webp',
      minimum_width: 768,
      minimum_height: 512,
      requires_alpha: true,
    });
    expect(element.traffic_conflict_profile).toMatchObject({
      render_mode: 'route_overlay',
      vehicle_path_style: 'wide_drive_path',
      pedestrian_path_style: 'narrow_walk_path',
      conflict_marker: 'highlighted_overlap',
      directional_markings: 'chevrons_and_lane_edges',
      vehicle_object_allowed: false,
      pedestrian_object_allowed: false,
      integrated_text_allowed: false,
      branding_allowed: false,
    });
  });
});
