import { describe, expect, it } from 'vitest';
import audioProduction from '../content/episode01/audio-production.json';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';
import { uiAudioCueProfile } from '../src/ui/useEpisodeAudio';

describe('Episode 01 presentation audio cues',()=>{
  it('maps signal, pressure and set-piece beats to production slots with safe fallbacks',()=>{
    expect(episodePresentationAudioCue('e01_04_junho_signal')).toMatchObject({
      production_key:'radio_burst',
      asset_id:'ep01.audio.radio_burst',
      fallback:'radio_signal',
    });
    expect(episodePresentationAudioCue('e01_06_pump_arrival')).toMatchObject({
      production_key:'pump_engine_boom',
      fallback:'pressure',
    });
    expect(episodePresentationAudioCue('e01_07_first_pour')).toMatchObject({
      production_key:'concrete_pour',
      fallback:'scene_shift',
    });
  });

  it('keeps every mapped production asset registered in the audio production contract',()=>{
    const assetIds=new Set(audioProduction.assets.map(item=>item.asset_id));
    for(const id of ['e01_04_junho_signal','e01_06_pump_arrival','e01_07_first_pour','e01_08k_stopwork_aftershock','e01_09_evening']){
      const cue=episodePresentationAudioCue(id)!;
      expect(cue.asset_id && assetIds.has(cue.asset_id)).toBe(true);
      expect(uiAudioCueProfile(cue.fallback)).toHaveLength(3);
    }
  });

  it('covers authored Episode 01 beats while leaving unknown events unmapped',()=>{
    expect(episodePresentationAudioCue('e01_08_reactions')).toMatchObject({
      production_key:'concrete_pour',
      asset_id:'ep01.audio.concrete_pour',
    });
    expect(episodePresentationAudioCue('e01_unknown')).toBeUndefined();
  });
});
