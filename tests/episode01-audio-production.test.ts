import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import contract from '../content/episode01/audio-production.json';
import immersiveScenes from '../content/episode01/immersive-scenes.json';
import { episodePresentationAudioCue, episodePresentationNodeCue } from '../src/app/episode-presentation-cues';
import { uiAudioCueTimbre } from '../src/ui/useEpisodeAudio';

const root = process.cwd();
const present = contract.assets.filter(item =>
  fs.existsSync(path.join(root, 'public', item.target_uri)));

describe('Episode 01 audio production contract', () => {
  it('keeps twelve production slots and reports binary state truthfully', () => {
    expect(contract.required_core_assets).toBe(12);
    expect(contract.assets).toHaveLength(12);
    expect(contract.final_asset_count).toBe(present.length);
    if (present.length === 12) expect(contract.status).toBe('production_v1_voice_lock');
    else expect(contract.status).toBe('runtime_slots_wired_binaries_pending');
  });

  it('uses unique stable runtime asset ids and audio target paths', () => {
    const ids = contract.assets.map(item => item.asset_id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => id.startsWith('ep01.audio.'))).toBe(true);
    expect(contract.assets.every(item => item.target_uri.startsWith('assets/episode01/audio/'))).toBe(true);
  });

  it('validates every materialized binary as a non-trivial Ogg container', () => {
    for (const item of present) {
      const bytes = fs.readFileSync(path.join(root, 'public', item.target_uri));
      expect(bytes.length, item.key).toBeGreaterThan(512);
      expect(bytes.subarray(0, 4).toString('ascii'), item.key).toBe('OggS');
    }
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

  it('keeps field-oriented fallback timbres behind real binaries', () => {
    expect(uiAudioCueTimbre('radio_signal')).toBe('radio');
    expect(uiAudioCueTimbre('pressure')).toBe('pressure');
    expect(uiAudioCueTimbre('scene_shift')).toBe('air');
    expect(uiAudioCueTimbre('continue')).toBe('clean');
  });

  it('separates generated field audio from Director-supplied voice mastering', () => {
    expect(contract.production_generation.method).toContain('procedural');
    expect(contract.production_generation.generator).toBe('tools/generate_episode01_audio.py');
    expect(contract.production_generation.rights).toContain('no external recordings');
    expect(contract.production_generation.assets).toHaveLength(8);
    expect(contract.voice_mastering.source).toContain('Director-supplied');
    expect(contract.voice_mastering.assets).toHaveLength(4);
  });


  it('adds node-level accents only at signature decision moments', () => {
    expect(episodePresentationNodeCue('e01_04_junho_signal', 'detail', 'SHOW_DIALOGUE')).toBe('radio_signal');
    expect(episodePresentationNodeCue('e01_06_pump_arrival', 'near_miss', 'SHOW_RESULT')).toBe('pressure');
    expect(episodePresentationNodeCue('e01_08b_inspection_find', 'action', 'SHOW_CHOICE')).toBe('scene_shift');
    expect(episodePresentationNodeCue('e01_08k_stopwork_aftershock', 'culture_action', 'SHOW_CHOICE')).toBe('pressure');
    expect(episodePresentationNodeCue('e01_08o_record_pressure', 'record_action', 'SHOW_CHOICE')).toBe('pressure');
    expect(episodePresentationNodeCue('e01_06_pump_arrival', 'resolve', 'SHOW_CHOICE')).toBeUndefined();
  });
});
