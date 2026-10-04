import { describe, expect, it } from 'vitest';
import { stageFrontPressure } from '../src/domain/survivors-front-pressure';

describe('Stage 01 front pressure rhythm', () => {
  it('keeps one readable approach front inside each 18 second beat', () => {
    const a = stageFrontPressure('stage_01', 4, 1234)!;
    const b = stageFrontPressure('stage_01', 17.9, 1234)!;
    expect(a.side).toBe(b.side);
    expect(a.anchorRatio).toBe(b.anchorRatio);
    expect(a.spread).toBe(210);
  });

  it('changes front beat deterministically without affecting other stages', () => {
    const a = stageFrontPressure('stage_01', 17.9, 1234)!;
    const b = stageFrontPressure('stage_01', 18.1, 1234)!;
    expect(b.bucket).toBe(a.bucket + 1);
    expect(b.side).not.toBe(a.side);
    expect(b.anchorRatio).toBeGreaterThanOrEqual(0.28);
    expect(b.anchorRatio).toBeLessThanOrEqual(0.72);
    expect(stageFrontPressure('stage_02', 30, 1234)).toBeNull();
  });
});
