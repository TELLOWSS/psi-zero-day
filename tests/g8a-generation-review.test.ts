import { describe, expect, it } from 'vitest';
import review from '../content/defense/g8a-generation-review-20260926.json';
import world from '../content/defense/g8a-world-final-art.json';
import swift from '../content/defense/g8a-swift-final-art.json';

describe('G8-A generation review lock', () => {
  it('does not silently promote rejected image-generation outputs', () => {
    expect(review.currentState.worldFinalApproved).toBe(false);
    expect(review.currentState.swiftFinalApproved).toBe(false);
    expect(review.currentState.productionLockAllowed).toBe(false);
    expect(world.status).toBe('ASSET_PENDING');
    expect(world.promotion.productionApproved).toBe(false);
    expect(swift.status).toBe('ASSET_PENDING');
    expect(swift.promotion.productionApproved).toBe(false);
  });

  it('rejects low-resolution world art as a final master instead of upscaling it', () => {
    const attempt = review.attempts.find(item => item.id === 'WORLD-CANDIDATE-01');
    expect(attempt?.verdict).toBe('REJECT_AS_FINAL_SOURCE_RESOLUTION');
    expect(attempt?.observed.width).toBeLessThan(world.sourceMaster.minimumWidth);
    expect(attempt?.observed.height).toBeLessThan(world.sourceMaster.minimumHeight);
    expect(attempt?.allowedUse).toBe('VISUAL_DIRECTION_REFERENCE_ONLY');
  });

  it('requires the next SWIFT generation to be a single isolated transparent asset', () => {
    const attempt = review.attempts.find(item => item.id === 'SWIFT-CANDIDATE-01');
    expect(attempt?.verdict).toBe('REJECT_ISOLATION_CONTRACT');
    expect(review.nextGeneration.order[0]).toBe('SWIFT');
    expect(review.nextGeneration.swift.mode).toBe('SINGLE_OBJECT_ONLY');
    expect(review.nextGeneration.swift.required).toContain('transparent background');
    expect(review.nextGeneration.swift.required).toContain('no text, no labels, no UI, no asset sheet, no alternate views');
  });
});
