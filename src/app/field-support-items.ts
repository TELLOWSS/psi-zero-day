import type { FlagMap } from '../domain';

export type FieldSupportCategory = 'facility' | 'equipment';

export interface FieldSupportItemDefinition {
  readonly item_id: string;
  readonly category: FieldSupportCategory;
  readonly name_text_id: string;
  readonly active_flag_id: string;
  readonly visual_asset_path?: string;
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
    visual_asset_path: 'assets/episode01/items/access-lane.webp',
  },
  {
    item_id: 'facility.lighting_pack',
    category: 'facility',
    name_text_id: 'ui.paid_item.facility.lighting_pack',
    active_flag_id: 'support.facility.lighting_pack.active',
    visual_asset_path: 'assets/episode01/scene-elements/temporary-lighting-pack.webp',
  },
  {
    item_id: 'facility.logistics_zone',
    category: 'facility',
    name_text_id: 'ui.paid_item.facility.logistics_zone',
    active_flag_id: 'support.facility.logistics_zone.active',
    visual_asset_path: 'assets/episode01/scene-elements/material-yard.webp',
  },
  {
    item_id: 'equipment.radio_pack',
    category: 'equipment',
    name_text_id: 'ui.paid_item.equipment.radio_pack',
    active_flag_id: 'support.equipment.radio_pack.active',
    visual_asset_path: 'assets/episode01/items/radio-pack.webp',
  },
  {
    item_id: 'equipment.inspection_kit',
    category: 'equipment',
    name_text_id: 'ui.paid_item.equipment.inspection_kit',
    active_flag_id: 'support.equipment.inspection_kit.active',
    visual_asset_path: 'assets/episode01/items/inspection-kit.webp',
  },
  {
    item_id: 'equipment.traffic_control_pack',
    category: 'equipment',
    name_text_id: 'ui.paid_item.equipment.traffic_control_pack',
    active_flag_id: 'support.equipment.traffic_control_pack.active',
    visual_asset_path: 'assets/episode01/items/traffic-control-pack.webp',
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
