import { describe, expect, it } from 'vitest';
import { episode01TbmChangeChain } from '../src/app/episode01-tbm-change-chain';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';

describe('Episode 01 TBM to changed-work chain',()=> {
  it('carries the 11:31 reporting lesson into the 13:42 changed-work gap',()=> {
    const model=episode01TbmChangeChain('e01_08g_tbm_field_gap',{
      report_result:'timeline_confirmed',
    });
    expect(model?.phase).toBe('change');
    expect(model?.stages.map(stage=>stage.state)).toEqual(['done','current','next']);
    expect(model?.cards.some(card=>card.title_text_id.includes('record.timeline'))).toBe(true);
    expect(model?.cards.some(card=>card.title_text_id==='ui.tbm_chain.morning.title')).toBe(true);
    expect(model?.cards.some(card=>card.title_text_id==='ui.tbm_chain.afternoon.title')).toBe(true);
  });

  it('shows the operational tradeoff after the 13:42 choice is written',()=> {
    const model=episode01TbmChangeChain('e01_08g_tbm_field_gap',{
      report_result:'correction_required',
      tbm_gap_action:'form_first',
    });
    expect(model?.cards.some(card=>card.title_text_id.includes('action.form_first'))).toBe(true);
  });

  it('changes the 13:56 verification focus by the selected TBM response',()=> {
    const form=episode01TbmChangeChain('e01_08h_tbm_return',{tbm_gap_action:'form_first'});
    const blame=episode01TbmChangeChain('e01_08h_tbm_return',{tbm_gap_action:'worker_blame'});
    const control=episode01TbmChangeChain('e01_08h_tbm_return',{tbm_gap_action:'change_control'});
    expect(form?.cards.some(card=>card.title_text_id.includes('focus.form_first'))).toBe(true);
    expect(blame?.cards.some(card=>card.title_text_id.includes('focus.worker_blame'))).toBe(true);
    expect(control?.cards.some(card=>card.title_text_id.includes('focus.change_control'))).toBe(true);
  });

  it('turns the same 13:56 panel into a field verdict after the return result lands',()=> {
    const model=episode01TbmChangeChain('e01_08h_tbm_return',{
      tbm_gap_action:'change_control',
      tbm_gap_result:'changed_work_rebriefed',
    });
    expect(model?.phase).toBe('verdict');
    expect(model?.cards.some(card=>card.title_text_id.includes('result.controlled'))).toBe(true);
  });

  it('keeps cinematic and audio continuity through changed-work return',()=> {
    expect(episodeCinematicBeat('e01_08g_tbm_field_gap')?.detail).toContain('작업순서');
    expect(episodeCinematicBeat('e01_08h_tbm_return')?.detail).toContain('다음 변경작업');
    expect(episodePresentationAudioCue('e01_08g_tbm_field_gap')?.production_key).toBe('radio_burst');
    expect(episodePresentationAudioCue('e01_08h_tbm_return')?.production_key).toBe('workface_pressure');
  });
});
