import {describe,expect,it} from 'vitest';
import {episode01RecordRealityChain} from '../src/app/episode01-record-reality-chain';
import {FIELD_REALITY_DOCTRINE_ID} from '../src/app/gameplay-doctrine';
import {episodeCinematicBeat} from '../src/app/episode-cinematic-beats';
import {episodePresentationAudioCue} from '../src/app/episode-presentation-cues';

describe('Episode 01 record reality chain',()=>{
  it('binds record pressure to the field reality doctrine and prior instruction result',()=>{
    const model=episode01RecordRealityChain('e01_08o_record_pressure',{instruction_chain_result:'conditional_phrase_restored'});
    expect(model?.doctrine_id).toBe(FIELD_REALITY_DOCTRINE_ID);
    expect(model?.cards.some(c=>c.title_text_id.includes('previous.reconstructed'))).toBe(true);
    expect(model?.cards.some(c=>c.title_text_id==='ui.record_reality.floor.title')).toBe(true);
  });
  it('shows distinct costs for all existing record routes',()=>{
    for(const [action,key] of [['minimize_scope','minimize'],['retrofit_paper','retrofit'],['preserve_timeline','timeline']] as const){
      const model=episode01RecordRealityChain('e01_08o_record_pressure',{record_action:action});
      expect(model?.cards.some(c=>c.title_text_id.includes('action.'+key))).toBe(true);
    }
  });
  it('keeps retrofit distinct from retroactive fabrication',()=>{
    const model=episode01RecordRealityChain('e01_08o_record_pressure',{record_action:'retrofit_paper'});
    expect(model?.cards.some(c=>c.title_text_id==='ui.record_reality.floor.title')).toBe(true);
    expect(model?.cards.some(c=>c.title_text_id.includes('action.retrofit'))).toBe(true);
  });
  it('turns 17:08 evidence focus into a record verdict',()=>{
    const before=episode01RecordRealityChain('e01_08p_record_return',{record_action:'preserve_timeline'});
    const after=episode01RecordRealityChain('e01_08p_record_return',{record_action:'preserve_timeline',record_result:'timeline_preserved'});
    expect(before?.phase).toBe('return');
    expect(after?.phase).toBe('verdict');
    expect(after?.cards.some(c=>c.title_text_id.includes('result.preserved'))).toBe(true);
  });
  it('keeps cinematic and audio continuity',()=>{
    expect(episodeCinematicBeat('e01_08o_record_pressure')?.detail).toContain('당시 없던 사실');
    expect(episodeCinematicBeat('e01_08p_record_return')?.detail).toContain('사진');
    expect(episodePresentationAudioCue('e01_08p_record_return')?.production_key).toBe('office_report_roomtone');
  });
});
