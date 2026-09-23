import { describe, expect, it } from 'vitest';
import catalog from '../content/episode01/scene-element-catalog.json';
import { projectEpisode01SceneElements } from '../src/app/strategy-scene-elements';

describe('Episode 01 reusable scene element catalog', () => {
  it('locks the reusable hazard/prop/control set without duplicate ids', () => {
    const elements = Object.values(catalog.elements);
    expect(Object.keys(catalog.elements)).toEqual(expect.arrayContaining([
      'material_stack',
      'access_barrier',
      'vehicle_overlap_zone',
      'harness_unclipped',
      'platform_cut_edge',
      'suspended_load',
      'gangform_lift_wire22',
      'exclusion_zone',
      'wet_floor',
      'open_edge',
    ]));
    expect(elements.length).toBeGreaterThanOrEqual(10);
    expect(new Set(elements.map(item => item.element_id)).size).toBe(elements.length);
    expect(new Set(elements.map(item => item.planned_asset_id)).size).toBe(elements.length);
  });

  it('locks the Episode 01 material stack to the verified realistic-v2 Euroform final', () => {
    expect(catalog.elements.material_stack.production_status).toBe('final');
    expect(catalog.elements.material_stack.production_note).toContain('verified realistic-v2 Euroform storage cutout');
    expect(catalog.elements.material_stack.storage_profile).toMatchObject({
      dimension_grouping: 'same_spec_only',
      mixed_dimensions_allowed: false,
      binding_method: 'center_ratchet_or_equivalent',
      binding_position: 'center',
    });
    expect(catalog.elements.material_stack.art.path).toBe('assets/episode01/scene-elements/material-yard.webp');
    expect(catalog.elements.material_stack.production.reused_from_asset_id).toBe('ep01.scene_element.material_yard');
    expect(catalog.elements.material_stack.storage_profile.safety_evaluation_note)
      .toContain('결속 형상만으로 안전을 판정하지 않고');
  });

  it('keeps the approved access barrier contract while tracking its realistic-v2 replacement', () => {
    expect(catalog.elements.access_barrier.production_status).toBe('replacement_required');
    expect(catalog.elements.access_barrier.production_note).toContain('realistic-v2 replacement required');
    expect(catalog.elements.access_barrier.access_control_profile).toMatchObject({
      barrier_form: 'korean_banding_movable_screen_fence',
      body_material: 'galvanized_round_tube_with_blue_mesh',
      stabilization: 'two_black_weighted_bases',
      rounded_top_corners: true,
      tube_diameter_mm_options: [25.4, 31.8],
      integrated_text_allowed: false,
      integrated_sign_allowed: false,
      warning_lamps_allowed: false,
    });
    expect(catalog.elements.access_barrier.art).toMatchObject({
      path: 'assets/episode01/scene-elements/access-barrier.webp',
      minimum_width: 768,
      minimum_height: 512,
      pivot: { x: 0.5, y: 0.92 },
      map_max_px: 140,
      requires_alpha: true,
    });
    expect(catalog.elements.access_barrier.access_control_profile.control_evaluation_note)
      .toContain('설치 연속성·전도방지·우회동선·차량동선·유도자 운영은 별도로 평가한다');
  });

  it('keeps vehicle-pedestrian overlap reusable while tracking its realistic-v2 replacement', () => {
    expect(catalog.elements.vehicle_overlap_zone.production_status).toBe('replacement_required');
    expect(catalog.elements.vehicle_overlap_zone.production_note).toContain('realistic-v2 replacement required');
    expect(catalog.elements.vehicle_overlap_zone.traffic_conflict_profile).toMatchObject({
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
    expect(catalog.elements.vehicle_overlap_zone.art).toMatchObject({
      path: 'assets/episode01/scene-elements/vehicle-overlap.webp',
      minimum_width: 768,
      minimum_height: 512,
      pivot: { x: 0.5, y: 0.5 },
      map_max_px: 168,
      requires_alpha: true,
    });
    expect(catalog.elements.vehicle_overlap_zone.traffic_conflict_profile.safety_evaluation_note)
      .toContain('물리적 동선 분리');
    expect(catalog.elements.vehicle_overlap_zone.traffic_conflict_profile.safety_evaluation_note)
      .toContain('사각지대');
  });

  it('projects the tracked material-stack replacement only where Episode 01 text already establishes it', () => {
    expect(projectEpisode01SceneElements('e01_03_plan_breaks')).toEqual([
      expect.objectContaining({
        catalog_key: 'material_stack',
        anchor: 'entry',
        label: '통로 인접 적재 자재',
        production_status: 'final',
        storage_profile: expect.objectContaining({
          dimension_grouping: 'same_spec_only',
          mixed_dimensions_allowed: false,
          binding_method: 'center_ratchet_or_equivalent',
        }),
      }),
    ]);
    expect(projectEpisode01SceneElements('e01_05_command')).toEqual([
      expect.objectContaining({ catalog_key: 'material_stack', anchor: 'yard', label: '통로 인접 적재 자재' }),
    ]);
    expect(projectEpisode01SceneElements('e01_04_junho_signal')).toEqual([]);
  });

  it('keeps material_stack final while the remaining legacy reusable visuals stay tracked for replacement', () => {
    const canonical = [
      'material_stack', 'access_barrier', 'vehicle_overlap_zone', 'harness_unclipped',
      'platform_cut_edge', 'suspended_load', 'gangform_lift_wire22', 'exclusion_zone',
      'wet_floor', 'open_edge',
    ] as const;
    expect(Object.keys(catalog.elements).length).toBeGreaterThanOrEqual(canonical.length);
    expect(catalog.elements.material_stack.production_status).toBe('final');
    expect(canonical.filter(key => key !== 'material_stack')
      .every(key => catalog.elements[key].production_status === 'replacement_required')).toBe(true);
    expect(canonical.filter(key => key !== 'material_stack')
      .every(key => catalog.elements[key].production_note?.includes('replacement required'))).toBe(true);
    const placed = Object.values(catalog.event_elements).flat().map(element => element.element_key);
    expect(placed).toEqual(['material_stack', 'material_stack']);
  });

  it('locks the authored Episode 01 fall-protection scenario to a Korean KCs product family without making twin-Y universal', () => {
    expect(catalog.elements.harness_unclipped.fall_protection_profile).toMatchObject({
      harness_type: 'full_body',
      certification_context: 'KCs safety-certified product family',
      scenario_configuration: 'twin_y_double_lanyard',
      scenario_configuration_is_universal_requirement: false,
      lanyard_count: 2,
      hook_count: 2,
      connection_intent: 'continuous_attachment_during_transfer_when_this_site_method_is_used',
      branding_policy: 'no_logo_no_trademark',
    });
    expect(catalog.elements.harness_unclipped.fall_protection_profile.design_reference).toContain('Korean KCs-certified');
    expect(catalog.elements.harness_unclipped.art.path).toBe('assets/episode01/scene-elements/harness-twin-lanyard-unclipped.webp');
    expect(catalog.elements.harness_unclipped.fall_protection_profile.safety_evaluation_note)
      .toContain('KCs 인증 여부');
  });

  it('locks general lifting to round-sling choker hitch while keeping gangform hitch site-defined', () => {
    expect(catalog.elements.suspended_load.lifting_profile).toMatchObject({
      load_family: 'general_material',
      rigging_method: 'round_sling',
      hitch_method: 'choker',
      capacity_basis: 'manufacturer_choker_wll',
      wire_rope_diameter_mm: null,
    });
    expect(catalog.elements.suspended_load.art.path).toBe('assets/episode01/scene-elements/suspended-load-round-sling-choker.webp');

    expect(catalog.elements.gangform_lift_wire22.lifting_profile).toMatchObject({
      load_family: 'gangform',
      rigging_method: 'wire_rope',
      hitch_method: 'site_defined',
      capacity_basis: 'work_plan_and_rated_capacity',
      wire_rope_diameter_mm: 22,
    });
    expect(catalog.elements.gangform_lift_wire22.art.path).toBe('assets/episode01/scene-elements/gangform-lift-wire22.webp');
  });

  it('keeps rigging method separate from the final safety evaluation', () => {
    expect(catalog.elements.suspended_load.lifting_profile.safety_evaluation_note).toContain('Choker WLL');
    expect(catalog.elements.suspended_load.lifting_profile.safety_evaluation_note).toContain('초크각');
    expect(catalog.elements.gangform_lift_wire22.lifting_profile.safety_evaluation_note)
      .toContain('직경만으로 안전을 판정하지 않고');
  });

  it('ignores unknown future events without creating a visual hazard', () => {
    expect(projectEpisode01SceneElements('e01_unknown_future_event')).toEqual([]);
  });
});
