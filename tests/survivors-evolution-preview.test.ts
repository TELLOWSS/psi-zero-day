import { describe, expect, it } from 'vitest';
import { evolutionPreview } from '../src/engine/survivors-evolution-preview';
import { EVOLUTION_RECIPES } from '../src/engine/patrol-survivors-engine';
import type { EvolutionPerkId } from '../src/domain/patrol-survivors';

describe('evolution choice preview', () => {
  it('caps support progress and preserves acquired evolution status', () => {
    expect(evolutionPreview('magnet_beacon', 3, {radio_boost: 5})?.supportLevel).toBe(1);
    expect(evolutionPreview('radio_boost', 5, {satellite_broadcast: 1})?.status).toBe('evolved');
  });
  for (const [id, recipe] of Object.entries(EVOLUTION_RECIPES)) {
    it(`previews ${id} without granting it`, () => {
      const active = Object.freeze({[recipe.weapon]: 4, [recipe.support]: 1});
      expect(evolutionPreview(recipe.weapon, 5, active)?.status).toBe('ready');
      expect(active[recipe.weapon]).toBe(4);
      expect(evolutionPreview(recipe.weapon, 4, active)?.status).toBe('building');
      expect(evolutionPreview(recipe.support, 1, {[recipe.weapon]: 5})?.status).toBe('ready');
      expect(evolutionPreview(id as EvolutionPerkId, 1, active)?.status).toBe('evolved');
      expect(evolutionPreview(recipe.weapon, 5, {})?.status).toBe('building');
    });
  }
});
