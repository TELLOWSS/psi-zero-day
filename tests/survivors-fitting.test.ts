import { expect, it } from 'vitest';
import { fittingInventory } from '../src/domain/survivors-fitting';
import { createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';

it('previews unowned equipment without changing ownership or the original slot', () => {
  const inventory = { owned: ['voice_lens', 'rescue_shell'], equipped: ['voice_lens', 'rescue_shell'] };
  const before = structuredClone(inventory);
  const fitting = fittingInventory(inventory, 'broadcast_crown');
  expect(fitting.equipped).toEqual(['rescue_shell', 'broadcast_crown']);
  expect(inventory).toEqual(before);
  expect(fittingInventory(inventory, null)).toEqual(before);
  const baseline = createInitialSurvivorsState('safety_monitor', undefined, undefined, undefined, inventory);
  const preview = createInitialSurvivorsState('safety_monitor', undefined, undefined, undefined, fitting);
  expect(preview.player.damageMultiplier - baseline.player.damageMultiplier).toBeCloseTo(.23);
});

it('rejects unknown preview ids and does not duplicate owned items', () => {
  const inventory = { owned: ['voice_lens'], equipped: ['voice_lens'] };
  expect(fittingInventory(inventory, 'unknown')).toEqual(inventory);
  expect(fittingInventory(inventory, 'voice_lens')).toEqual(inventory);
});
