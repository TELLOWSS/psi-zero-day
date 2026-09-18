import { describe, expect, it } from 'vitest';
import { episode01Montage } from '../src/app/episode01-montage';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';

describe('Episode 01 post-pour montage',()=>{
  it('compresses the 07:48 to 10:16 gap into readable field beats',()=>{
    const montage=episode01Montage('e01_08_reactions',{pump_result:'BEST_CONTROL'});
    expect(montage?.beats.map(beat=>beat.time)).toEqual(['08:12','08:56','09:42']);
    expect(episodeCinematicBeat('e01_08_reactions')?.time).toBe('08:12 → 09:58');
    expect(episodeCinematicBeat('e01_08a_reporting_return')?.time).toBe('10:07');
  });

  it('remembers the pump outcome in the middle montage beat',()=>{
    expect(episode01Montage('e01_08_reactions',{pump_result:'BEST_CONTROL'})?.beats[1]?.title_text_id).toContain('control');
    expect(episode01Montage('e01_08_reactions',{pump_result:'NEAR_MISS'})?.beats[1]?.title_text_id).toContain('near_miss');
    expect(episode01Montage('e01_08_reactions',{pump_result:'RELATION_CONFLICT'})?.beats[1]?.title_text_id).toContain('relation');
  });

  it('carries work ambience through the montage and lowers it for the reporting return',()=>{
    expect(episodePresentationAudioCue('e01_08_reactions')?.production_key).toBe('concrete_pour');
    expect(episodePresentationAudioCue('e01_08a_reporting_return')?.gain).toBeLessThan(0.3);
  });
});
