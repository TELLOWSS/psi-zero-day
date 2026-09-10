import { describe, expect, it } from 'vitest';
import { createRng, restoreRng } from '../src/engine/rng';
import type { RngSnapshot } from '../src/domain';

describe('deterministic RNG', () => {
  it('preserves the mulberry32-v1 reference sequence for seed 1', () => {
    const rng = createRng(1);
    expect(Array.from({ length: 5 }, () => rng.nextUint32())).toEqual([
      2693262067, 11749833, 2265367787, 4213581821, 4159151403,
    ]);
  });

  it('produces the same sequence for the same seed, including seed zero', () => {
    for (const seed of [0, 123, 0xffffffff]) {
      const a = createRng(seed); const b = createRng(seed);
      expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
    }
    expect(createRng(1).nextUint32()).not.toBe(createRng(2).nextUint32());
  });

  it('continues the exact sequence after a JSON snapshot round trip', () => {
    const rng = createRng(42); rng.next(); rng.next();
    const snapshot: RngSnapshot = JSON.parse(JSON.stringify(rng.snapshot()));
    const restored = restoreRng(snapshot);
    expect(Array.from({ length: 20 }, () => restored.next())).toEqual(Array.from({ length: 20 }, () => rng.next()));
    expect(snapshot.state).not.toBe(rng.snapshot().state);
  });

  it('keeps floats and integer draws within their documented ranges', () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) {
      const n = rng.next(); expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThan(1);
      const j = rng.nextInt(7); expect(Number.isInteger(j)).toBe(true);
      expect(j).toBeGreaterThanOrEqual(0); expect(j).toBeLessThan(7);
    }
    expect(rng.nextInt(1)).toBe(0);
    expect(rng.nextInt(0x100000000)).toBeLessThan(0x100000000);
  });

  it('rejects invalid seeds, limits and incompatible snapshots', () => {
    for (const n of [-1, 0.5, NaN, Infinity, 0x100000000]) expect(() => createRng(n)).toThrow(RangeError);
    for (const n of [0, -1, 0.5, Infinity, 0x100000001]) expect(() => createRng(0).nextInt(n)).toThrow(RangeError);
    expect(() => restoreRng({ algorithm: 'unknown', state: 0 } as unknown as RngSnapshot)).toThrow('Unsupported');
    expect(() => restoreRng({ algorithm: 'mulberry32-v1', state: -1 })).toThrow(RangeError);
  });
});
