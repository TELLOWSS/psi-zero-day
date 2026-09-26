import type { FlagMap } from '../domain';

export type FieldSupportCategory = 'facility' | 'equipment';

export interface FieldSupportItemDefinition {
  readonly item_id: string;
  readonly category: FieldSupportCategory;
  readonly name_text_id: string;
  readonly active_flag_id: string;
  readonly effect_text_id: string;
  readonly effect_visual_uri?: string;
}

/**
 * Deployable support items only. Price and numerical time/schedule/safety effects remain intentionally undefined.
 * These flags record that a player has deliberately placed/committed the support item in the current run.
 */
export const FIELD_SUPPORT_ITEMS = [
  {
    item_id: 'facility.access_lane',
    category: 'facility',
    name_text_id: 'ui.paid_item.facility.access_lane',
    active_flag_id: 'support.facility.access_lane.active',
    effect_text_id: 'ui.paid_item.effect.access_lane',
    effect_visual_uri: '/assets/episode01/scene-elements/vehicle-pedestrian-separation.webp',
  },
  {
    item_id: 'facility.lighting_pack',
    category: 'facility',
    name_text_id: 'ui.paid_item.facility.lighting_pack',
    active_flag_id: 'support.facility.lighting_pack.active',
    effect_text_id: 'ui.paid_item.effect.lighting_pack',
    effect_visual_uri: '/assets/episode01/scene-elements/temporary-lighting-pack.webp',
  },
  {
    item_id: 'facility.logistics_zone',
    category: 'facility',
    name_text_id: 'ui.paid_item.facility.logistics_zone',
    active_flag_id: 'support.facility.logistics_zone.active',
    effect_text_id: 'ui.paid_item.effect.logistics_zone',
    effect_visual_uri: '/assets/episode01/scene-elements/material-yard.webp',
  },
  {
    item_id: 'equipment.radio_pack',
    category: 'equipment',
    name_text_id: 'ui.paid_item.equipment.radio_pack',
    active_flag_id: 'support.equipment.radio_pack.active',
    effect_text_id: 'ui.paid_item.effect.radio_pack',
  },
  {
    item_id: 'equipment.inspection_kit',
    category: 'equipment',
    name_text_id: 'ui.paid_item.equipment.inspection_kit',
    active_flag_id: 'support.equipment.inspection_kit.active',
    effect_text_id: 'ui.paid_item.effect.inspection_kit',
    effect_visual_uri: '/assets/episode01/cg/inspection-zone.webp',
  },
  {
    item_id: 'equipment.traffic_control_pack',
    category: 'equipment',
    name_text_id: 'ui.paid_item.equipment.traffic_control_pack',
    active_flag_id: 'support.equipment.traffic_control_pack.active',
    effect_text_id: 'ui.paid_item.effect.traffic_control_pack',
    effect_visual_uri: '/assets/episode01/scene-elements/access-barrier.webp',
  },
] as const satisfies readonly FieldSupportItemDefinition[];

export type FieldSupportItemId = typeof FIELD_SUPPORT_ITEMS[number]['item_id'];

export function fieldSupportItem(itemId: string): FieldSupportItemDefinition | undefined {
  return FIELD_SUPPORT_ITEMS.find(item => item.item_id === itemId);
}

export function isFieldSupportItemActive(flags: FlagMap, itemId: string): boolean {
  const definition = fieldSupportItem(itemId);
  return definition ? flags[definition.active_flag_id] === true : false;
}
