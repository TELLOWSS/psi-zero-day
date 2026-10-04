import type { PerkId, PlayerStats } from '../domain/patrol-survivors';

export interface EquipmentTuning {
  damage: number;
  interval: number;
  count: number;
  radius: number;
  pierce: number;
  duration: number;
  continuousDamage?: number;
  secondaryDamage?: number;
}

// Shared by simulation and comparison cards: these are existing rules, not
// display-only estimates or new balance values.
const tuningCache = new Map<string, EquipmentTuning>();
export function equipmentTuning(id: PerkId, level: number): EquipmentTuning | undefined {
  if (level <= 0) return undefined;
  const key = `${id}:${level}`;
  const cached = tuningCache.get(key);
  if (cached) return cached;
  const tuning = buildTuning(id, level);
  if (tuning) { Object.freeze(tuning); tuningCache.set(key, tuning); }
  return tuning;
}
function buildTuning(id: PerkId, level: number): EquipmentTuning | undefined {
  if (level <= 0) return undefined;
  switch (id) {
    case 'radio_boost': return { damage: 22 + level * 8, interval: Math.max(.4, 1.2 - level * .15), count: level >= 4 ? 3 : level >= 2 ? 2 : 1, radius: 10, pierce: level >= 3 ? 2 : 1, duration: 1.4 };
    case 'extinguisher': return { damage: 14 + level * 6, interval: Math.max(.6, 2 - level * .25), count: 4 + level * 2, radius: 12 + level * 2, pierce: 3, duration: .65 };
    case 'floodlight': return { damage: 0, continuousDamage: 18 + level * 9, interval: 0, count: 1, radius: 90 + level * 22, pierce: 0, duration: 0 };
    case 'cone_trap': return { damage: 50 + level * 25, interval: Math.max(1.8, 3.5 - level * .4), count: 1, radius: 16 + level * 2, pierce: 1 + Math.floor(level / 2), duration: 12 };
    case 'safety_drone': return { damage: 16 + level * 8, interval: Math.max(.3, .9 - level * .12), count: 1, radius: 7, pierce: 1, duration: 1 };
    case 'satellite_broadcast': return { damage: 95, interval: 1.1, count: 8, radius: 28, pierce: 99, duration: 2.2 };
    case 'cryo_blizzard': return { damage: 60, interval: 1.6, count: 16, radius: 20, pierce: 99, duration: .8 };
    case 'tesla_dome': return { damage: 80, secondaryDamage: 40, continuousDamage: 90, interval: .5, count: 4, radius: 220, pierce: 99, duration: .3 };
    case 'emf_barricade': return { damage: 180, interval: 1.2, count: 1, radius: 36, pierce: 99, duration: 15 };
    case 'hunter_swarm': return { damage: 48, interval: .22, count: 3, radius: 9, pierce: 4, duration: 1.2 };
    default: return undefined;
  }
}

type SupportStats = Pick<PlayerStats, 'speed' | 'pickupRadius' | 'maxHp' | 'regenRate' | 'cooldownReduction' | 'critRate' | 'damageMultiplier'>;
export const SUPPORT_EFFECTS: Partial<Record<PerkId, Partial<SupportStats>>> = {
  steel_boots: { speed: 30 },
  magnet_beacon: { pickupRadius: 35 },
  safety_harness: { maxHp: 18, regenRate: .45 },
  quick_reflexes: { cooldownReduction: .08 },
  data_chip: { critRate: .08, damageMultiplier: .10 },
};

export interface UpgradeStat { key: keyof EquipmentTuning | keyof SupportStats; before: number | null; after: number; }
export function upgradeComparison(id: PerkId, nextLevel: number, previousId: PerkId, previousLevel: number, player: PlayerStats, inFloodlight: boolean): UpgradeStat[] {
  const support = SUPPORT_EFFECTS[id];
  if (support) return (Object.entries(support) as [keyof SupportStats, number][]).map(([key, delta]) => ({ key, before: key === 'cooldownReduction' ? Math.min(.45, player[key]) : player[key], after: key === 'cooldownReduction' ? Math.min(.45, player[key] + delta) : player[key] + delta }));
  const before = equipmentTuning(previousId, previousLevel);
  const after = equipmentTuning(id, nextLevel);
  if (!after) return [];
  const damageScale = player.damageMultiplier * (inFloodlight ? 1.3 : 1);
  const intervalScale = 1 - Math.min(.45, player.cooldownReduction);
  return (['damage', 'continuousDamage', 'secondaryDamage', 'count', 'interval', 'radius', 'pierce', 'duration'] as const)
    .filter(key => (after[key] ?? 0) > 0)
    .map(key => {
      const scale = key === 'interval' ? intervalScale : key === 'damage' || key === 'continuousDamage' || key === 'secondaryDamage' ? damageScale : 1;
      return { key, before: before && (before[key] ?? 0) > 0 ? before[key]! * scale : null, after: after[key]! * scale };
    });
}
