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
      'exclusion_zone',
      'wet_floor',
      'open_edge',
    ]));
    expect(new Set(elements.map(item => item.element_id)).size).toBe(elements.length);
    expect(new Set(elements.map(item => item.planned_asset_id)).size).toBe(elements.length);
  });

  it('projects the material stack only where Episode 01 text already establishes it', () => {
    expect(projectEpisode01SceneElements('e01_03_plan_breaks')).toEqual([
      expect.objectContaining({ catalog_key: 'material_stack', anchor: 'entry', label: '통로 인접 적재 자재' }),
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
    expect(catalog.elements.exclusion_zone.production_status).toBe('planned');
  });

  it('ignores unknown future events without creating a visual hazard', () => {
    expect(projectEpisode01SceneElements('e01_unknown_future_event')).toEqual([]);
  });
});
