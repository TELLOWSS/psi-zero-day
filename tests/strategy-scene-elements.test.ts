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
    expect(elements).toHaveLength(10);
    expect(new Set(elements.map(item => item.element_id)).size).toBe(elements.length);
    expect(new Set(elements.map(item => item.planned_asset_id)).size).toBe(elements.length);
  });

  it('promotes the approved material stack and locks same-spec central binding', () => {
    expect(catalog.elements.material_stack.production_status).toBe('final');
    expect(catalog.elements.material_stack.storage_profile).toMatchObject({
      dimension_grouping: 'same_spec_only',
      mixed_dimensions_allowed: false,
      binding_method: 'center_ratchet_or_equivalent',
      binding_position: 'center',
    });
    expect(catalog.elements.material_stack.art.path).toBe(
      'assets/episode01/scene-elements/material-stack.webp',
    );
    expect(catalog.elements.material_stack.storage_profile.safety_evaluation_note)
      .toContain('결속 형상만으로 안전을 판정하지 않고');
  });

  it('projects the final material stack only where Episode 01 text already establishes it', () => {
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

  it('keeps future scaffold/lifting hazards planned instead of pretending they are current Episode 01 assets', () => {
    expect(catalog.elements.harness_unclipped.production_status).toBe('planned');
    expect(catalog.elements.platform_cut_edge.production_status).toBe('planned');
    expect(catalog.elements.suspended_load.production_status).toBe('planned');
    expect(catalog.elements.gangform_lift_wire22.production_status).toBe('planned');
    expect(catalog.elements.exclusion_zone.production_status).toBe('planned');
  });

  it('locks the fall-protection visual to a brand-neutral twin-Y full-body harness', () => {
    expect(catalog.elements.harness_unclipped.fall_protection_profile).toMatchObject({
      harness_type: 'full_body',
      lanyard_configuration: 'twin_y',
      lanyard_count: 2,
      hook_count: 2,
      connection_intent: 'continuous_attachment_during_transfer',
      branding_policy: 'no_logo_no_trademark',
    });
    expect(catalog.elements.harness_unclipped.fall_protection_profile.design_reference).toContain('SWELOCK');
    expect(catalog.elements.harness_unclipped.art.path).toBe(
      'assets/episode01/scene-elements/harness-twin-lanyard-unclipped.webp',
    );
    expect(catalog.elements.harness_unclipped.fall_protection_profile.safety_evaluation_note)
      .toContain('두 줄 자체만으로 안전을 판정하지 않고');
  });

  it('locks general lifting to round-sling choker hitch while keeping gangform hitch site-defined', () => {
    expect(catalog.elements.suspended_load.lifting_profile).toMatchObject({
      load_family: 'general_material',
      rigging_method: 'round_sling',
      hitch_method: 'choker',
      capacity_basis: 'manufacturer_choker_wll',
      wire_rope_diameter_mm: null,
    });
    expect(catalog.elements.suspended_load.art.path).toBe(
      'assets/episode01/scene-elements/suspended-load-round-sling-choker.webp',
    );

    expect(catalog.elements.gangform_lift_wire22.lifting_profile).toMatchObject({
      load_family: 'gangform',
      rigging_method: 'wire_rope',
      hitch_method: 'site_defined',
      capacity_basis: 'work_plan_and_rated_capacity',
      wire_rope_diameter_mm: 22,
    });
    expect(catalog.elements.gangform_lift_wire22.art.path).toBe(
      'assets/episode01/scene-elements/gangform-lift-wire22.webp',
    );
  });

  it('keeps rigging method separate from the final safety evaluation', () => {
    expect(catalog.elements.suspended_load.lifting_profile.safety_evaluation_note)
      .toContain('Choker WLL');
    expect(catalog.elements.suspended_load.lifting_profile.safety_evaluation_note)
      .toContain('초크각');
    expect(catalog.elements.gangform_lift_wire22.lifting_profile.safety_evaluation_note)
      .toContain('직경만으로 안전을 판정하지 않고');
  });

  it('ignores unknown future events without creating a visual hazard', () => {
    expect(projectEpisode01SceneElements('e01_unknown_future_event')).toEqual([]);
  });
});
