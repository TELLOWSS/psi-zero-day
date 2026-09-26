import { describe, expect, it } from 'vitest';
import review from '../content/defense/g8a-generation-review-20260926.json';
import world from '../content/defense/g8a-world-final-art.json';
import swift from '../content/defense/g8a-swift-final-art.json';

describe('G8-A generation review lock', () => {
  it('keeps rejected generation attempts rejected while allowing the later approved SWIFT asset', () => {
    expect(review.currentState.worldFinalApproved).toBe(false);
    expect(review.currentState.swiftFinalApproved).toBe(true);
    expect(review.currentState.productionLockAllowed).toBe(false);
    expect(world.status).toBe('ASSET_PENDING');
    expect(world.promotion.productionApproved).toBe(false);
    expect(swift.status).toBe('PRODUCTION_APPROVED');
    expect(swift.promotion.productionApproved).toBe(true);
  });

  it('still rejects the low-resolution world attempt instead of upscaling it', () => {
    const attempt = review.attempts.find(item => item.id === 'WORLD-CANDIDATE-01');
    expect(attempt?.verdict).toBe('REJECT_AS_FINAL_SOURCE_RESOLUTION');
    expect(attempt?.observed.width).toBeLessThan(world.sourceMaster.minimumWidth);
    expect(attempt?.observed.height).toBeLessThan(world.sourceMaster.minimumHeight);
    expect(attempt?.allowedUse).toBe('VISUAL_DIRECTION_REFERENCE_ONLY');
  });

  it('locks SWIFT and moves the next generation target to WORLD only', () => {
    const rejected = review.attempts.find(item => item.id === 'SWIFT-CANDIDATE-01');
    expect(rejected?.verdict).toBe('REJECT_ISOLATION_CONTRACT');
    expect(review.nextGeneration.order).toEqual(['WORLD']);
    expect(review.nextGeneration.swift.mode).toBe('LOCKED_APPROVED_ASSET');
    expect(review.nextGeneration.swift.required).toContain('do not regenerate unless a regression is found');
  });
});
