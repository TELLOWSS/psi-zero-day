import { describe, expect, it } from 'vitest';
import { episode01ReportChain } from '../src/app/episode01-report-chain';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';

describe('Episode 01 responsibility and report-return chain',()=> {
  it('carries the verified inspection state into the 11:12 responsibility clash',()=> {
    const model=episode01ReportChain('e01_08e_responsibility_clash',{
      inspection_result:'rework_after_reinspection',
    });
    expect(model?.phase).toBe('clash');
    expect(model?.stages.map(stage=>stage.state)).toEqual(['done','current','next']);
    expect(model?.cards[0]?.title_text_id).toContain('inspection.rework');
    expect(model?.cards.some(card=>card.title_text_id==='ui.report_chain.deadline.title')).toBe(true);
  });

  it('shows the selected reporting basis before the report comes back',()=> {
    const model=episode01ReportChain('e01_08f_report_return',{
      inspection_result:'accepted',
      report_basis:'defensive',
    });
    expect(model?.phase).toBe('return');
    expect(model?.stages.map(stage=>stage.state)).toEqual(['done','done','current']);
    expect(model?.cards.some(card=>card.title_text_id.includes('basis.defensive'))).toBe(true);
    expect(model?.cards.some(card=>card.title_text_id.includes('focus.defensive'))).toBe(true);
  });

  it('turns the same 11:31 panel into an evidence verdict after the return result lands',()=> {
    const model=episode01ReportChain('e01_08f_report_return',{
      inspection_result:'accepted_after_sequence',
      report_basis:'timeline',
      report_result:'timeline_confirmed',
    });
    expect(model?.phase).toBe('verdict');
    expect(model?.cards.some(card=>card.title_text_id.includes('result.timeline'))).toBe(true);
  });

  it('keeps office audio and cinematic detail across responsibility and report return',()=> {
    expect(episodeCinematicBeat('e01_08e_responsibility_clash')?.detail).toContain('세 사람');
    expect(episodeCinematicBeat('e01_08f_report_return')?.detail).toContain('추가자료');
    expect(episodePresentationAudioCue('e01_08e_responsibility_clash')?.production_key).toBe('office_report_roomtone');
    expect(episodePresentationAudioCue('e01_08f_report_return')?.gain).toBeLessThan(0.3);
  });
});
