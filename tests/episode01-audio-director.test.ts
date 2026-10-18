import { describe, expect, it } from 'vitest';
import immersiveScenes from '../content/episode01/immersive-scenes.json';
import contract from '../content/episode01/audio-production.json';
import { episodeAudioDirection, episodeAudioDirectedEventIds, EP01_DIRECTED_AUDIO_EVENT_COUNT } from '../src/app/episode01-audio-director';
import { storySoundscape } from '../src/app/story-soundscape';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';

describe('EP01 Audio Director v2 cue coverage and authenticity', () => {
  it('directs precisely the 26 authored events and does not alter their identifiers', () => {
    const authored = Object.keys(immersiveScenes.events);
    const directed = episodeAudioDirectedEventIds();
    expect(EP01_DIRECTED_AUDIO_EVENT_COUNT).toBe(26);
    expect(directed).toHaveLength(26);
    expect(new Set(directed)).toEqual(new Set(authored));
    expect(episodeAudioDirection('unknown')).toBeUndefined();
  });

  it('keeps scene and score fades within mobile-friendly editorial bounds', () => {
    for (const id of episodeAudioDirectedEventIds()) {
      const direction = episodeAudioDirection(id)!;
      expect(direction.sceneFadeMs,id).toBeGreaterThanOrEqual(800);
      expect(direction.sceneFadeMs,id).toBeLessThanOrEqual(1800);
      expect(direction.scoreFadeMs,id).toBeGreaterThanOrEqual(1700);
      expect(direction.scoreFadeMs,id).toBeLessThanOrEqual(3500);
      expect(direction.roomToneScale,id).toBeGreaterThan(0);
      expect(direction.roomToneScale,id).toBeLessThanOrEqual(1);
      expect(direction.editorialNote.length,id).toBeGreaterThan(12);
      const tone = storySoundscape(id);
      expect(tone,id).toBeDefined();
      if (tone) {
        const scaled = tone.gain*direction.roomToneScale;
        expect(scaled,id).toBeGreaterThan(0);
        expect(scaled,id).toBeLessThanOrEqual(tone.gain);
        expect(contract.assets.some(asset=>asset.asset_id===tone.asset_id),id).toBe(true);
      }
      const presented=episodePresentationAudioCue(id);
      expect(presented?.asset_id,id).toBeTruthy();
    }
  });

  it('keeps premium score motifs as UNPRODUCED metadata and preserves core binary count', () => {
    expect(contract.assets).toHaveLength(12);
    expect(contract.assets.filter(asset => asset.kind==='voice')).toHaveLength(4);
    for (const id of episodeAudioDirectedEventIds()) {
      expect(episodeAudioDirection(id)?.motif).toMatch(/^SC_0[1-8]_/);
      expect(contract.assets.some(asset=>asset.asset_id===episodeAudioDirection(id)?.motif)).toBe(false);
    }
  });

  it('directs the four signature moments with materially different space and transitions',()=>{
    const arrival=episodeAudioDirection('e01_01_arrival')!;
    const junho=episodeAudioDirection('e01_04_junho_signal')!;
    const stop=episodeAudioDirection('e01_08c_site_pushback')!;
    const home=episodeAudioDirection('e01_09_evening')!;
    expect(arrival.motif).toBe('SC_01_DAWN_PROMISE');
    expect(junho.motif).toBe('SC_03_UNSAID_SIGNAL');
    expect(junho.roomToneScale).toBeLessThan(arrival.roomToneScale);
    expect(stop.roomToneScale).toBeLessThan(junho.roomToneScale);
    expect(home.motif).toBe('SC_08_TODAY_RETURN_HOME');
    expect(home.sceneFadeMs).toBeGreaterThan(stop.sceneFadeMs);
    expect(home.scoreFadeMs).toBeGreaterThan(stop.scoreFadeMs);
    expect(storySoundscape('e01_06_pump_arrival')?.asset_id).not.toBe('ep01.audio.pump_engine_boom');
  });
});
