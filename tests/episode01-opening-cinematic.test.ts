import { describe, expect, it } from 'vitest';
import events from '../content/episode01/events.json';
import pass from '../content/episode01/episode01-opening-cinematic-v1.json';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';

describe('Episode 01 opening cinematic pass',()=>{
  it('preserves the original opening branch topology while polishing presentation',()=>{
    const plan=events.find(item=>item.event_id==='e01_03_plan_breaks')!;
    expect(plan.choices.map(choice=>choice.choice_id)).toEqual([
      'delegate_kang','negotiate_yoon','coordinate_schedule','follow_junho',
    ]);
    expect(pass.locks.event_topology).toBe('unchanged');
    expect(pass.locks.effect_bundles).toBe('unchanged');
  });

  it('gives every opening beat a cinematic detail line',()=>{
    for(const id of pass.scope){
      expect(episodeCinematicBeat(id)?.detail?.length).toBeGreaterThan(8);
    }
  });

  it('starts ambience before the first decision rather than only at the conflict',()=>{
    expect(episodePresentationAudioCue('e01_01_arrival')?.production_key).toBe('gate_queue');
    expect(episodePresentationAudioCue('e01_02_meet_kang')?.production_key).toBe('workface_pressure');
  });
});
