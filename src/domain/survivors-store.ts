import type {PatrolDifficulty} from './survivors-challenge';
import type { PerkId } from './patrol-survivors';
export type StoreCategory = 'communication' | 'tempo' | 'logistics' | 'protection' | 'companion' | 'tactics';
export interface StoreEffects { damage?: number; cooldown?: number; crit?: number; pickup?: number; speed?: number; hp?: number; regen?: number; shield?: number; shieldPeriod?: number; suppression?: number; ultimate?: number; support?: number; lines?: number }
export interface StoreItem { id: string; category: StoreCategory; price: number; icon: PerkId; effects: StoreEffects; art: number; rarity: 'advanced' | 'elite' | 'legendary' }
export const STORE_ITEMS: readonly StoreItem[] = [
  {
    "id": "voice_lens",
    "category": "communication",
    "price": 800,
    "icon": "radio_boost",
    "effects": {
      "damage": 0.15
    },
    "art": 0,
    "rarity": "advanced"
  },
  {
    "id": "command_array",
    "category": "communication",
    "price": 2400,
    "icon": "satellite_broadcast",
    "effects": {
      "damage": 0.22,
      "ultimate": 0.08
    },
    "art": 1,
    "rarity": "elite"
  },
  {
    "id": "relay_core",
    "category": "tempo",
    "price": 1000,
    "icon": "data_chip",
    "effects": {
      "cooldown": 0.06
    },
    "art": 2,
    "rarity": "advanced"
  },
  {
    "id": "precision_link",
    "category": "tempo",
    "price": 2600,
    "icon": "quick_reflexes",
    "effects": {
      "crit": 0.12
    },
    "art": 3,
    "rarity": "elite"
  },
  {
    "id": "recovery_mesh",
    "category": "logistics",
    "price": 700,
    "icon": "magnet_beacon",
    "effects": {
      "pickup": 45
    },
    "art": 4,
    "rarity": "advanced"
  },
  {
    "id": "dispatch_drive",
    "category": "logistics",
    "price": 1800,
    "icon": "steel_boots",
    "effects": {
      "speed": 30,
      "pickup": 20
    },
    "art": 5,
    "rarity": "elite"
  },
  {
    "id": "rescue_shell",
    "category": "protection",
    "price": 900,
    "icon": "safety_harness",
    "effects": {
      "hp": 30
    },
    "art": 6,
    "rarity": "advanced"
  },
  {
    "id": "recovery_cell",
    "category": "protection",
    "price": 2800,
    "icon": "safety_harness",
    "effects": {
      "regen": 0.6
    },
    "art": 7,
    "rarity": "elite"
  },
  {
    "id": "broadcast_crown",
    "category": "communication",
    "price": 4800,
    "icon": "satellite_broadcast",
    "effects": {
      "damage": 0.32,
      "cooldown": 0.03,
      "ultimate": 0.16
    },
    "art": 8,
    "rarity": "legendary"
  },
  {
    "id": "sync_gauntlet",
    "category": "tempo",
    "price": 4200,
    "icon": "data_chip",
    "effects": {
      "cooldown": 0.16,
      "crit": 0.06
    },
    "art": 9,
    "rarity": "legendary"
  },
  {
    "id": "extraction_pack",
    "category": "logistics",
    "price": 3800,
    "icon": "magnet_beacon",
    "effects": {
      "speed": 50,
      "pickup": 65
    },
    "art": 10,
    "rarity": "legendary"
  },
  {
    "id": "shock_mantle",
    "category": "protection",
    "price": 5200,
    "icon": "safety_harness",
    "effects": {
      "hp": 20,
      "shield": 45,
      "shieldPeriod": 18
    },
    "art": 11,
    "rarity": "legendary"
  },
  {
    "id": "inspection_wing",
    "category": "companion",
    "price": 3600,
    "icon": "safety_drone",
    "effects": {
      "suppression": 0.2
    },
    "art": 12,
    "rarity": "elite"
  },
  {
    "id": "barrier_forge",
    "category": "tactics",
    "price": 2200,
    "icon": "cone_trap",
    "effects": {
      "lines": 3
    },
    "art": 13,
    "rarity": "elite"
  },
  {
    "id": "rescue_wing",
    "category": "companion",
    "price": 4600,
    "icon": "safety_drone",
    "effects": {
      "regen": 0.8,
      "shield": 15,
      "shieldPeriod": 24
    },
    "art": 14,
    "rarity": "elite"
  },
  {
    "id": "predictive_watch",
    "category": "tactics",
    "price": 3400,
    "icon": "quick_reflexes",
    "effects": {
      "ultimate": 0.35,
      "support": 2
    },
    "art": 15,
    "rarity": "elite"
  }
];
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
  const total = {damage:0,cooldown:0,crit:0,pickup:0,speed:0,hp:0,regen:0,shield:0,shieldPeriod:0,suppression:0,ultimate:0,support:0,lines:0};
  for (const id of sanitizeInventory(inventory).equipped) {
    const effects = STORE_ITEMS.find(i => i.id === id)!.effects;
    for (const key of Object.keys(total) as (keyof StoreEffects)[]) {
      if (key === 'shieldPeriod') { if (effects[key]) total[key] = total[key] ? Math.min(total[key], effects[key]!) : effects[key]!; }
      else total[key] += effects[key] ?? 0;
    }
  }
  return total;
}

/** A useful owned item in an empty slot comes first; no purchase or automatic replacement. */
export function recommendedStoreItem(inventory:StoreInventory,difficulty:PatrolDifficulty):StoreItem {
  const safe=sanitizeInventory(inventory);
  const priorities=difficulty==='hard'||difficulty==='extreme'
    ? ['shock_mantle','inspection_wing','predictive_watch','relay_core','recovery_mesh']
    : ['relay_core','rescue_shell','recovery_mesh','inspection_wing','barrier_forge'];
  const slots=new Set(safe.equipped.map(id=>STORE_ITEMS.find(i=>i.id===id)!.category));
  const candidates=priorities.map(id=>STORE_ITEMS.find(i=>i.id===id)!);
  return candidates.find(item=>safe.owned.includes(item.id)&&!slots.has(item.category))
    ?? candidates.find(item=>!slots.has(item.category))
    ?? STORE_ITEMS.find(item=>safe.equipped.includes(item.id))!;
}
