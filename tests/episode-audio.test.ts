import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { createEpisode01Registry } from '../src/content/episode01';
import { uiAudioAssetId, uiAudioCueProfile } from '../src/ui/useEpisodeAudio';

const cues = ['execute', 'result_positive', 'result_negative', 'result_neutral', 'continue'] as const;

describe('Episode 01 presentation audio', () => {
  it('binds every UI cue to a packaged deterministic WAV while retaining oscillator fallback profiles', () => {
    const registry = createEpisode01Registry();
    for (const cue of cues) {
      const assetId = uiAudioAssetId(cue);
      const asset = registry.getAsset(assetId);
      expect(asset?.type).toBe('audio');
      expect(asset?.variants[0]?.uri).toMatch(/\.wav$/);
      expect(asset?.variants[0]?.format).toBe('wav');

      const profile = uiAudioCueProfile(cue);
      expect(profile[0]).toBeGreaterThan(0);
      expect(profile[1]).toBeGreaterThan(0);
      expect(profile[2]).toBeGreaterThan(0);
      expect(profile[2]).toBeLessThan(0.2);
    }

    expect(uiAudioCueProfile('result_positive')[1]).toBeGreaterThan(uiAudioCueProfile('result_positive')[0]);
    expect(uiAudioCueProfile('result_negative')[1]).toBeLessThan(uiAudioCueProfile('result_negative')[0]);
    expect(uiAudioAssetId('execute')).not.toBe(uiAudioAssetId('continue'));
  });

  it('starts Episode 01 with authored foundation BGM and site ambience in GameState', () => {
    const session = new EpisodeSession();
    expect(session.start(0)).toBe(true);
    const audio = session.getSnapshot().state?.audio;

    expect(audio?.context_id).toBe('ep01.foundation');
    expect(audio?.bgm).toMatchObject({
      asset_id: 'ep01.audio.bgm.foundation_shift',
      loop: true,
      gain: 0.48,
    });
    expect(audio?.ambience).toContainEqual({
      asset_id: 'ep01.audio.ambience.site_morning',
      loop: true,
      gain: 0.24,
    });
  });
});
