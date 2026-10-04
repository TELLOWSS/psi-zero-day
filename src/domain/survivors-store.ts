import type { PerkId } from './patrol-survivors';
export type StoreCategory = 'communication' | 'tempo' | 'logistics' | 'protection';
export interface StoreEffects { damage?: number; cooldown?: number; crit?: number; pickup?: number; speed?: number; hp?: number; regen?: number }
export interface StoreItem { id: string; category: StoreCategory; price: number; icon: PerkId; effects: StoreEffects }
export const STORE_ITEMS: readonly StoreItem[] = [{"id": "voice_lens", "category": "communication", "price": 800, "icon": "radio_boost", "effects": {"damage": 0.15}}, {"id": "command_array", "category": "communication", "price": 2400, "icon": "satellite_broadcast", "effects": {"damage": 0.25}}, {"id": "relay_core", "category": "tempo", "price": 1000, "icon": "data_chip", "effects": {"cooldown": 0.06}}, {"id": "precision_link", "category": "tempo", "price": 2600, "icon": "quick_reflexes", "effects": {"crit": 0.12}}, {"id": "recovery_mesh", "category": "logistics", "price": 700, "icon": "magnet_beacon", "effects": {"pickup": 45}}, {"id": "dispatch_drive", "category": "logistics", "price": 1800, "icon": "steel_boots", "effects": {"speed": 30, "pickup": 20}}, {"id": "rescue_shell", "category": "protection", "price": 900, "icon": "safety_harness", "effects": {"hp": 30}}, {"id": "recovery_cell", "category": "protection", "price": 2800, "icon": "safety_harness", "effects": {"regen": 0.6}}];
export interface StoreInventory { owned: string[]; equipped: string[] }
export function sanitizeInventory(value: unknown): StoreInventory {
  const raw = value as Partial<StoreInventory> | null;
  const owned = Array.isArray(raw?.owned) ? [...new Set(raw.owned.filter(id => STORE_ITEMS.some(i => i.id === id)))] : [];
  const equipped: string[] = [];
  if (Array.isArray(raw?.equipped)) for (const id of raw.equipped) {
    const item = STORE_ITEMS.find(i => i.id === id);
    if (item && owned.includes(id) && !equipped.some(e => STORE_ITEMS.find(i => i.id === e)?.category === item.category)) equipped.push(id);
  }
  return { owned, equipped };
}
export function buyStoreItem(inventory: StoreInventory, credits: number, id: string): {inventory: StoreInventory; credits: number} | null {
  const item = STORE_ITEMS.find(i => i.id === id);
  if (!item || !Number.isFinite(credits) || credits < item.price || inventory.owned.includes(id)) return null;
  return {inventory: {...inventory, owned: [...inventory.owned, id]}, credits: credits - item.price};
}
export function equipStoreItem(inventory: StoreInventory, id: string): StoreInventory {
  const item = STORE_ITEMS.find(i => i.id === id);
  if (!item || !inventory.owned.includes(id)) return inventory;
  const equipped = inventory.equipped.filter(e => STORE_ITEMS.find(i => i.id === e)?.category !== item.category);
  if (!inventory.equipped.includes(id)) equipped.push(id);
  return {...inventory, equipped};
}
export function storeEffects(inventory: StoreInventory): Required<StoreEffects> {
  const total = {damage:0,cooldown:0,crit:0,pickup:0,speed:0,hp:0,regen:0};
  for (const id of sanitizeInventory(inventory).equipped) {
    const effects = STORE_ITEMS.find(i => i.id === id)!.effects;
    for (const key of Object.keys(total) as (keyof StoreEffects)[]) total[key] += effects[key] ?? 0;
  }
  return total;
}
