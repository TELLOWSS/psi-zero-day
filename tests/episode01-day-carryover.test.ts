import {describe,expect,it} from 'vitest';
import {episode01DayCarryover} from '../src/app/episode01-day-carryover';
import {FIELD_REALITY_DOCTRINE_ID} from '../src/app/gameplay-doctrine';
import {episodeCinematicBeat} from '../src/app/episode-cinematic-beats';
import {episodePresentationAudioCue} from '../src/app/episode-presentation-cues';

describe('Episode 01 day carryover',()=>{
  it('binds evening reflection to the field reality doctrine without a scorecard',()=>{
    const model=episode01DayCarryover('e01_09_evening',{
      record_result:'timeline_preserved',
      stopwork_culture_result:'reporting_route_preserved',
      instruction_chain_result:'conditional_phrase_restored'
    });
    expect(model?.doctrine_id).toBe(FIELD_REALITY_DOCTRINE_ID);
    expect(model?.phase).toBe('evening');
    expect(model?.stages.map(s=>s.state)).toEqual(['done','current','next']);
    expect(model?.cards.some(c=>c.title_text_id==='ui.day_carryover.evening.open.title')).toBe(true);
  });

  it('treats all four evening choices as legitimate but different recovery routes',()=>{
    const routes=[
      [{evening_rest:true},'evening.rest'],
      [{evening_family:true},'evening.family'],
      [{evening_study:true},'evening.study'],
      [{evening_field_note:true},'evening.note']
    ] as const;
    for(const [flags,key] of routes){
      const model=episode01DayCarryover('e01_10_next_day_tease',flags);
      expect(model?.cards.some(c=>c.title_text_id.includes(key))).toBe(true);
    }
  });

  it('makes reporting silence the next-day first condition when that social residue exists',()=>{
    const model=episode01DayCarryover('e01_10_next_day_tease',{
      stopwork_culture_result:'reporting_silenced',
      evening_rest:true
    });
    expect(model?.phase).toBe('day2');
    expect(model?.cards.some(c=>c.title_text_id==='ui.day_carryover.first.reporting.title')).toBe(true);
  });

  it('does not let a good prior result become automatic clearance for day two',()=>{
    const model=episode01DayCarryover('e01_10_next_day_tease',{
      record_result:'timeline_preserved',
      stopwork_culture_result:'reporting_route_preserved',
      instruction_chain_result:'conditional_phrase_restored',
      evening_field_note:true
    });
    expect(model?.cards.some(c=>c.title_text_id==='ui.day_carryover.first.stable.title')).toBe(true);
  });

  it('keeps evening and day-two cinematic/audio continuity',()=>{
    expect(episodeCinematicBeat('e01_09_evening')?.detail).toContain('정답표');
    expect(episodeCinematicBeat('e01_10_next_day_tease')?.detail).toContain('어제');
    expect(episodePresentationAudioCue('e01_09_evening')?.production_key).toBe('home_night');
    expect(episodePresentationAudioCue('e01_10_next_day_tease')?.production_key).toBe('gate_queue');
  });
});
