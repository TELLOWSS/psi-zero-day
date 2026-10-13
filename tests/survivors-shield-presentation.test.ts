import { expect, it } from 'vitest';
import { createInitialSurvivorsState } from '../src/engine/patrol-survivors-engine';
import { absorbPremiumDamage, tickPremiumGear, applyPremiumLoadout } from '../src/engine/survivors-premium-gear';
import { ShieldPresentationTracker } from '../src/ui/survivors-shield-presentation';
const make = () => {
  const state = createInitialSurvivorsState('player', undefined, 'stage_01', 'extreme', { owned: ['shock_mantle'], equipped: ['shock_mantle'] });
  state.phase = 'playing'; return state;
};
it('observes actual absorption and leaves a fading depletion receipt at zero charge', () => {
  const state = make(), tracker = new ShieldPresentationTracker();
  expect(tracker.sample(state, false, false)?.phase).toBe('charged');
  expect(absorbPremiumDamage(state, 30)).toBe(0);
  expect(tracker.sample(state, false, false)?.phase).toBe('absorb');
  state.gameTime += .1;
  expect(absorbPremiumDamage(state, 30)).toBe(15);
  const depleted = tracker.sample(state, false, false)!;
  expect(state.premiumGear!.shield).toBe(0);
  expect(depleted.phase).toBe('depleted'); expect(depleted.alpha).toBeGreaterThan(0);
  state.gameTime += .2; tickPremiumGear(state, .2);
  expect(tracker.sample(state, false, false)!.alpha).toBeLessThan(depleted.alpha);
  state.gameTime += .26; tickPremiumGear(state, .26);
  expect(tracker.sample(state, false, false)).toBeUndefined();
});
it('uses a distinct recharge envelope only after the engine cadence completes', () => {
  const state = make(), tracker = new ShieldPresentationTracker(); tracker.sample(state, false, false);
  absorbPremiumDamage(state, 60); tracker.sample(state, false, false);
  state.gameTime += 17.9; tickPremiumGear(state, 17.9);
  expect(tracker.sample(state, false, false)).toBeUndefined();
  state.gameTime += .11; tickPremiumGear(state, .11);
  const recharge = tracker.sample(state, false, false)!;
  expect(recharge).toMatchObject({ phase: 'recharge', width: 42, height: 58 });
  state.gameTime += .2; tickPremiumGear(state, .2);
  expect(tracker.sample(state, false, false)!.width).toBeGreaterThan(recharge.width);
});
it('freezes on simulation pause, bounds crowd gain and keeps reduced motion static', () => {
  const state = make(), tracker = new ShieldPresentationTracker(); tracker.sample(state, false, false);
  absorbPremiumDamage(state, 20);
  const normal = tracker.sample(state, false, false)!;
  state.phase = 'paused'; tickPremiumGear(state, 10); state.playerMotionTime = 100;
  expect(tracker.sample(state, false, false)).toEqual(normal);
  expect(tracker.sample(state, false, true)!.alpha).toBeLessThan(normal.alpha);
  expect(tracker.sample(state, true, false)).toMatchObject({ phase: 'charged', width: 42, height: 58 });
  absorbPremiumDamage(state, 100);
  expect(tracker.sample(state, true, false)).toBeUndefined();
});
it('does not invent depletion on first observation or activation on loadout replacement', () => {
  const state = make(), tracker = new ShieldPresentationTracker(); absorbPremiumDamage(state, 100);
  expect(tracker.sample(state, false, false)).toBeUndefined();
  state.phase = 'paused'; applyPremiumLoadout(state, { owned: ['shock_mantle'], equipped: [] });
  expect(tracker.sample(state, false, false)).toBeUndefined();
  applyPremiumLoadout(state, { owned: ['shock_mantle'], equipped: ['shock_mantle'] });
  expect(tracker.sample(state, false, false)).toBeUndefined();
});
it('leaves all engine state and receipts unchanged while rendering samples', () => {
  const state = make(), tracker = new ShieldPresentationTracker(); tracker.sample(state, false, false);
  absorbPremiumDamage(state, 20); const before = JSON.stringify(state);
  for (const reduced of [false, true]) for (const busy of [false, true]) tracker.sample(state, reduced, busy);
  expect(JSON.stringify(state)).toBe(before);
});
