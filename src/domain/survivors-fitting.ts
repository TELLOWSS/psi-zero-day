import { STORE_ITEMS, sanitizeInventory, type StoreInventory } from './survivors-store';

/** Hypothetical ownership exists only in this returned snapshot, never in the wallet. */
export function fittingInventory(inventory: StoreInventory, itemId: string | null): StoreInventory {
  const current = sanitizeInventory(inventory);
  const item = STORE_ITEMS.find(candidate => candidate.id === itemId);
  if (!item) return current;
  return sanitizeInventory({
    owned: [...new Set([...current.owned, item.id])],
    equipped: [...current.equipped.filter(id => STORE_ITEMS.find(other => other.id === id)?.category !== item.category), item.id],
  });
}
export function fittingLoadout(inventory:StoreInventory,ids:readonly string[]):StoreInventory {
  return sanitizeInventory({owned:[...new Set([...inventory.owned,...ids])],equipped:[...ids],durability:Object.fromEntries([...inventory.owned,...ids].map(id=>[id,100]))});
}
