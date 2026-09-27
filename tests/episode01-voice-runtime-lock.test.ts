import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import voiceMedia from '../content/episode01/voice-media.json';

describe('Episode 01 voice runtime production lock', () => {
  it('keeps all four reviewed OGG masters byte-for-byte identical to the approved manifest', () => {
    expect(voiceMedia.assets).toHaveLength(4);
    for (const asset of voiceMedia.assets) {
      const bytes = readFileSync(asset.target);
      expect(bytes.length, asset.source).toBe(asset.bytes);
      expect(bytes.subarray(0, 4).toString('ascii'), asset.source).toBe('OggS');
      expect(createHash('sha256').update(bytes).digest('hex'), asset.source).toBe(asset.sha256);
    }
  });

  it('locks dialogue advance while reviewed voice is active and restores authored text afterward', () => {
    const playable = readFileSync('src/ui/PlayableEpisode.tsx', 'utf8');
    const presentation = readFileSync('src/ui/PresentationView.tsx', 'utf8');

    expect(playable).toContain('interactionLocked={voiceLocked}');
    expect(playable).toContain('dialogueOverrideText={voiceLocked ? voiceSubtitle : null}');
    expect(playable).toContain('activeVoiceCue?.countdown_label');
    expect(playable).toContain("if (voiceLocked && (e.key === 'Enter' || e.code === 'Space'");
    expect(presentation).toContain('disabled={interactionLocked}');
    expect(presentation).toContain('aria-busy={interactionLocked || undefined}');
    expect(presentation).toContain('dialogueOverrideText ?? t(p.text_id)');
  });

  it('ducks only presentation audio during voice and always releases the gameplay lock on failure/end', () => {
    const audio = readFileSync('src/ui/useEpisodeAudio.ts', 'utf8');

    expect(audio).toContain('applyVoiceDucking(cue.duck_gain ?? 0.28)');
    expect(audio).toContain('applyVoiceDucking(1)');
    expect(audio).toContain('void playback.catch(finish)');
    expect(audio).toContain('onEnded?.()');
  });
});
