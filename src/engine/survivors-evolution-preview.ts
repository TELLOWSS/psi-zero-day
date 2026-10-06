import type { EvolutionPerkId, PerkId } from '../domain/patrol-survivors';
import { EVOLUTION_RECIPES, PERK_CATALOG } from './patrol-survivors-engine';

// Preview the offered choice without mutating the run or granting an evolution.
export function evolutionPreview(id: PerkId, level: number, active: Partial<Record<PerkId, number>>) {
  const entries = (Object.entries(EVOLUTION_RECIPES) as [EvolutionPerkId, typeof EVOLUTION_RECIPES[EvolutionPerkId]][])
    .filter(([evo, recipe]) => evo === id || recipe.weapon === id || recipe.support === id);
  if (!entries.length) return null;
  const entry = entries.find(([, recipe]) => (active[recipe.weapon] ?? 0) > 0) ?? entries[0]!;
  const [evolution, recipe] = entry;
  const weaponLevel = Math.min(PERK_CATALOG[recipe.weapon].maxLevel, id === recipe.weapon ? level : active[recipe.weapon] ?? 0);
  const supportLevel = Math.min(1, id === recipe.support ? level : active[recipe.support] ?? 0);
  return { evolution, weapon: recipe.weapon, support: recipe.support, weaponLevel, supportLevel,
    status: id === evolution || (active[evolution] ?? 0)>0 ? 'evolved' : weaponLevel >= 5 && supportLevel >= 1 ? 'ready' : 'building' } as const;
}
