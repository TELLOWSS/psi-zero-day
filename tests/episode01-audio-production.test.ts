import { describe, expect, it } from 'vitest';
import contract from '../content/episode01/audio-production.json';
import immersiveScenes from '../content/episode01/immersive-scenes.json';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';
import { uiAudioCueTimbre } from '../src/ui/useEpisodeAudio';

describe('Episode 01 audio production contract', () => {
  it('keeps exactly eight core audio slots while binaries are still pending', () => {
    expect(contract.required_core_assets).toBe(8);
    expect(contract.assets).toHaveLength(8);
    expect(contract.final_asset_count).toBe(0);
    expect(contract.status).toBe('runtime_slots_wired_binaries_pending');
  });

  it('uses unique stable runtime asset ids and audio target paths', () => {
    const ids = contract.assets.map(item => item.asset_id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => id.startsWith('ep01.audio.'))).toBe(true);
    expect(contract.assets.every(item => item.target_uri.startsWith('assets/episode01/audio/'))).toBe(true);
  });

  it('maps all 26 immersive events to a production audio slot', () => {
    const assets = new Map(contract.assets.map(asset => [asset.asset_id, asset]));
    const eventIds = Object.keys(immersiveScenes.events);
    expect(eventIds).toHaveLength(26);

    for (const eventId of eventIds) {
      const cue = episodePresentationAudioCue(eventId);
      expect(cue, eventId).toBeTruthy();
      expect(cue?.asset_id, eventId).toBeTruthy();
      const asset = cue?.asset_id ? assets.get(cue.asset_id) : undefined;
      expect(asset, eventId).toBeTruthy();
      expect(asset?.key).toBe(cue?.production_key);
      expect(asset?.events).toContain(eventId);
    }
  });

  it('uses field-oriented synthetic timbres until reviewed binaries land', () => {
    expect(uiAudioCueTimbre('radio_signal')).toBe('radio');
    expect(uiAudioCueTimbre('pressure')).toBe('pressure');
    expect(uiAudioCueTimbre('scene_shift')).toBe('air');
    expect(uiAudioCueTimbre('continue')).toBe('clean');
  });

  it('does not claim final field recordings exist before their binaries are supplied', () => {
    expect(contract.integration.current).toContain('If absent');
    expect(contract.integration.finalization).toContain('reviewed binary');
  });
});
