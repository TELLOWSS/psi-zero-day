import { describe, expect, it } from 'vitest';
import { uiAudioCueProfile } from '../src/ui/useEpisodeAudio';

describe('Episode 01 presentation audio', () => {
  it('keeps short deterministic UI cue profiles separate from authored game-state audio', () => {
    const execute = uiAudioCueProfile('execute');
    const positive = uiAudioCueProfile('result_positive');
    const negative = uiAudioCueProfile('result_negative');
    const neutral = uiAudioCueProfile('result_neutral');
    const continuation = uiAudioCueProfile('continue');

    for (const profile of [execute, positive, negative, neutral, continuation]) {
      expect(profile[0]).toBeGreaterThan(0);
      expect(profile[1]).toBeGreaterThan(0);
      expect(profile[2]).toBeGreaterThan(0);
      expect(profile[2]).toBeLessThan(0.2);
    }
    expect(positive[1]).toBeGreaterThan(positive[0]);
    expect(negative[1]).toBeLessThan(negative[0]);
    expect(execute).not.toEqual(continuation);
  });
});
