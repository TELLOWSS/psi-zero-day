import { describe, expect, it } from 'vitest';
import { FIELD_SUPPORT_ITEMS, fieldSupportItem } from '../src/app/field-support-items';
import { projectSupportAssistedActions, type StrategyAction } from '../src/app/strategy-actions';

function action(overrides: Partial<StrategyAction> & Pick<StrategyAction, 'event_id' | 'node_id' | 'choice_id'>): StrategyAction {
  return {
    event_id: overrides.event_id,
    instance_id: overrides.instance_id ?? `run.${overrides.event_id}`,
    node_id: overrides.node_id,
    choice_id: overrides.choice_id,
    label_text_id: overrides.label_text_id ?? `test.${overrides.choice_id}`,
    enabled: overrides.enabled ?? true,
    intent: overrides.intent ?? 'coordinate',
    target: overrides.target ?? { kind: 'site' },
    actor_character_id: overrides.actor_character_id ?? 'player',
    resource_axes: overrides.resource_axes ?? ['time', 'safety'],
    ...(overrides.execution_choice_id ? { execution_choice_id: overrides.execution_choice_id } : {}),
    ...(overrides.skill ? { skill: overrides.skill } : {}),
  };
}

describe('ITEM / STORY CONNECTION LOCK 2026-09-26', () => {
  it('gives every deployable support item an explicit field-effect description', () => {
    expect(FIELD_SUPPORT_ITEMS).toHaveLength(6);
    for (const item of FIELD_SUPPORT_ITEMS) {
      expect(item.effect_text_id).toMatch(/^ui\.paid_item\.effect\./);
    }
  });

  it('binds production effect visuals only to real existing support concepts', () => {
    expect(fieldSupportItem('facility.access_lane')?.effect_visual_uri)
      .toBe('/assets/episode01/scene-elements/vehicle-pedestrian-separation.webp');
    expect(fieldSupportItem('facility.lighting_pack')?.effect_visual_uri)
      .toBe('/assets/episode01/scene-elements/temporary-lighting-pack.webp');
    expect(fieldSupportItem('facility.logistics_zone')?.effect_visual_uri)
      .toBe('/assets/episode01/scene-elements/material-yard.webp');
    expect(fieldSupportItem('equipment.inspection_kit')?.effect_visual_uri)
      .toBe('/assets/episode01/cg/inspection-zone.webp');
    expect(fieldSupportItem('equipment.traffic_control_pack')?.effect_visual_uri)
      .toBe('/assets/episode01/scene-elements/access-barrier.webp');
    expect(fieldSupportItem('equipment.radio_pack')?.effect_visual_uri).toBeUndefined();
  });

  it('uses the logistics zone as a story shortcut to the existing free coordination choice', () => {
    const base = [
      action({ event_id: 'e01_03_plan_breaks', node_id: 'plan', choice_id: 'delegate_kang' }),
      action({ event_id: 'e01_03_plan_breaks', node_id: 'plan', choice_id: 'coordinate_schedule' }),
    ];
    const projected = projectSupportAssistedActions(base, ['facility.logistics_zone']);
    const shortcut = projected.find(item => item.choice_id === 'support.logistics.resequence_yard');
    expect(shortcut).toMatchObject({
      execution_choice_id: 'coordinate_schedule',
      intent: 'coordinate',
      target: { kind: 'anchor', anchor: 'yard' },
    });
    expect(projected.some(item => item.choice_id === 'coordinate_schedule')).toBe(true);
  });

  it('uses the lighting pack as a visibility-assisted alias of the existing full inspection choice', () => {
    const base = [
      action({ event_id: 'e01_08b_inspection_find', node_id: 'action', choice_id: 'inspection_full_stop', intent: 'control' }),
      action({ event_id: 'e01_08b_inspection_find', node_id: 'action', choice_id: 'inspection_quick_photo', intent: 'record' }),
    ];
    const projected = projectSupportAssistedActions(base, ['facility.lighting_pack']);
    const shortcut = projected.find(item => item.choice_id === 'support.lighting.inspect_access');
    expect(shortcut).toMatchObject({
      execution_choice_id: 'inspection_full_stop',
      intent: 'inspect',
      target: { kind: 'signal', signal_id: 'signal.inspection_access' },
    });
    expect(projected.some(item => item.choice_id === 'inspection_full_stop')).toBe(true);
  });

  it('never creates a support shortcut when the corresponding free authored choice is absent', () => {
    const base = [action({ event_id: 'e01_08b_inspection_find', node_id: 'action', choice_id: 'inspection_quick_photo' })];
    const projected = projectSupportAssistedActions(base, ['facility.lighting_pack']);
    expect(projected).toHaveLength(1);
    expect(projected[0]?.choice_id).toBe('inspection_quick_photo');
  });
});
