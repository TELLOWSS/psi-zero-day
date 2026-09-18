import { describe, expect, it } from 'vitest';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';
import { uiAudioCueProfile } from '../src/ui/useEpisodeAudio';

describe('Episode 01 presentation audio cues',()=>{
  it('assigns distinct lightweight cues to signal, pressure and transition beats',()=>{
    expect(episodePresentationAudioCue('e01_04_junho_signal')).toBe('radio_signal');
    expect(episodePresentationAudioCue('e01_06_pump_arrival')).toBe('pressure');
    expect(episodePresentationAudioCue('e01_07_first_pour')).toBe('scene_shift');
  });

  it('keeps presentation cues valid in the shared audio profile',()=>{
    for(const id of ['e01_04_junho_signal','e01_06_pump_arrival','e01_07_first_pour']){
      const cue=episodePresentationAudioCue(id)!;
      expect(uiAudioCueProfile(cue)).toHaveLength(3);
    }
  });

  it('does not force a cue onto every event',()=>{
    expect(episodePresentationAudioCue('e01_08_reactions')).toBeUndefined();
  });
});
