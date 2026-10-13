import { expect, it } from 'vitest';
import { settlePatrolCredits } from '../src/domain/survivors-credit-settlement';

it('preserves an existing wallet and adds session income once', () => {
  expect(settlePatrolCredits(10000, 630, 0)).toBe(10630);
});
it('does not repay supply credits transferred before settlement', () => {
  expect(settlePatrolCredits(300, 630, 300)).toBe(630);
});
it('preserves purchases made with already transferred supplies', () => {
  expect(settlePatrolCredits(9500, 630, 300)).toBe(9830);
});
it('pays untransferred supplies if an earlier wallet write failed', () => {
  expect(settlePatrolCredits(10000, 630, 120)).toBe(10510);
});
it('never deducts excess transfers or admits invalid balances', () => {
  expect(settlePatrolCredits(50, 20, 100)).toBe(50);
  expect(settlePatrolCredits(Infinity, NaN, -10)).toBe(0);
  expect(settlePatrolCredits(Number.MAX_SAFE_INTEGER, 100, 0)).toBe(Number.MAX_SAFE_INTEGER);
});
