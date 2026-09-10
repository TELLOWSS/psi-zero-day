import type { RngSnapshot } from '../domain';

export interface DeterministicRng {
  nextUint32(): number;
  next(): number;
  /** Uniform integer in [0, maxExclusive). */
  nextInt(maxExclusive: number): number;
  snapshot(): RngSnapshot;
}

const UINT32_RANGE = 0x100000000;
function assertUint32(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value >= UINT32_RANGE) {
    throw new RangeError('Expected an unsigned 32-bit integer');
  }
}

/** Seed 0 is valid. No Date, Math.random or platform API dependencies. */
export function createRng(seed: number): DeterministicRng {
  assertUint32(seed);
  let state = seed;
  function nextUint32(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return (value ^ (value >>> 14)) >>> 0;
  }
  return {
    nextUint32,
    next: () => nextUint32() / UINT32_RANGE,
    nextInt(maxExclusive) {
      if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
        throw new RangeError('maxExclusive must be an integer from 1 through 2^32');
      }
      const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
      let value: number;
      do { value = nextUint32(); } while (value >= limit);
      return value % maxExclusive;
    },
    snapshot: () => ({ algorithm: 'mulberry32-v1', state }),
  };
}

export function restoreRng(snapshot: RngSnapshot): DeterministicRng {
  if (snapshot.algorithm !== 'mulberry32-v1') throw new Error('Unsupported RNG algorithm');
  return createRng(snapshot.state);
}
