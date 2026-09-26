import { describe, expect, it } from 'vitest';
import review from '../content/defense/g8a-generation-review-20260926.json';
import world from '../content/defense/g8a-world-final-art.json';
import swift from '../content/defense/g8a-swift-final-art.json';

describe('G8-A generation review lock', () => {
  it('closes generation after approved WORLD and SWIFT assets without granting Production Lock early', () => {
    expect(review.currentState.worldFinalApproved).toBe(true);
    expect(review.currentState.swiftFinalApproved).toBe(true);
    expect(review.currentState.productionLockAllowed).toBe(false);
    expect(world.status).toBe('PRODUCTION_APPROVED');
    expect(swift.status).toBe('PRODUCTION_APPROVED');
  });

  it('keeps the earlier rejected generation attempts as audit history', () => {
    const worldRejected = review.attempts.find(item => item.id === 'WORLD-CANDIDATE-01');
    const swiftRejected = review.attempts.find(item => item.id === 'SWIFT-CANDIDATE-01');
    expect(worldRejected?.verdict).toBe('REJECT_AS_FINAL_SOURCE_RESOLUTION');
    expect(swiftRejected?.verdict).toBe('REJECT_ISOLATION_CONTRACT');
  });

  it('forbids further asset generation unless a regression is found', () => {
    expect(review.nextGeneration.order).toEqual([]);
    expect(review.nextGeneration.swift.mode).toBe('LOCKED_APPROVED_ASSET');
    expect(review.nextGeneration.world.mode).toBe('LOCKED_APPROVED_ASSET');
    expect(review.nextGeneration.swift.required).toContain('do not regenerate unless a regression is found');
    expect(review.nextGeneration.world.required).toContain('do not regenerate unless a regression is found');
  });
});
