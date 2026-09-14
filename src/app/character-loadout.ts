import growth from '../../content/episode01/character-growth.json';
import items from '../../content/episode01/items.json';
import type { FlagMap, Id } from '../domain';
import { projectCharacterGrowth } from './character-growth';

export type EquipmentSlot = 'primary_tool' | 'secondary_tool' | 'communication' | 'document' | 'ppe';

export interface InventoryItemView {
  readonly item_id: Id;
  readonly name: string;
  readonly category: string;
  readonly equip_slot: EquipmentSlot;
  readonly source: 'starter' | 'growth' | 'reward';
}

export interface EquippedItemView extends InventoryItemView {
  readonly slot: EquipmentSlot;
}

export interface CharacterLoadoutView {
  readonly character_id: Id;
  readonly inventory: readonly InventoryItemView[];
  readonly equipped: readonly EquippedItemView[];
}

type ItemConfig = { readonly item_id: string; readonly name: string; readonly category: string; readonly equip_slot: EquipmentSlot };
const itemById = new Map((items.items as readonly ItemConfig[]).map(item => [item.item_id, item] as const));

function rewardItemIds(flags: FlagMap): readonly string[] {
  return Object.entries(flags)
    .filter(([key, value]) => key.startsWith('inventory.') && value === true)
    .map(([key]) => key.slice('inventory.'.length));
}

function sourceFor(itemId: string, growthItems: readonly string[], rewardIds: readonly string[]): InventoryItemView['source'] {
  if (rewardIds.includes(itemId)) return 'reward';
  return growthItems[0] === itemId ? 'starter' : 'growth';
}

/** Presentation projection only. Ownership/equipment are authored flags; there is no hidden item formula. */
export function projectCharacterLoadout(flags: FlagMap, characterId: Id): CharacterLoadoutView | undefined {
  const growthView = projectCharacterGrowth(flags, characterId);
  if (!growthView) return undefined;
  const growthConfig = (growth.characters as Record<string, { stages: Record<string, { items: readonly string[] }> }>)[characterId];
  const growthItems = growthConfig?.stages[growthView.stage]?.items ?? [];
  const rewardIds = rewardItemIds(flags);
  const ownedIds = [...new Set([...growthItems, ...rewardIds])];

  const inventory = Object.freeze(ownedIds.map(itemId => {
    const item = itemById.get(itemId);
    if (!item) throw new Error(`Unknown inventory item: ${itemId}`);
    return Object.freeze({ ...item, source: sourceFor(itemId, growthItems, rewardIds) });
  }));

  const equippedBySlot = new Map<EquipmentSlot, string>();
  for (const itemId of growthItems) {
    const item = itemById.get(itemId);
    if (item) equippedBySlot.set(item.equip_slot, itemId);
  }
  for (const slot of ['primary_tool', 'secondary_tool', 'communication', 'document', 'ppe'] as const) {
    const explicit = flags[`equipment.${characterId}.${slot}`];
    if (typeof explicit === 'string' && itemById.has(explicit)) equippedBySlot.set(slot, explicit);
  }

  const equipped = Object.freeze([...equippedBySlot.entries()].map(([slot, itemId]) => {
    const base = inventory.find(item => item.item_id === itemId) ?? (() => {
      const item = itemById.get(itemId)!;
      return { ...item, source: 'reward' as const };
    })();
    return Object.freeze({ ...base, slot });
  }));

  return Object.freeze({ character_id: characterId, inventory, equipped });
}
