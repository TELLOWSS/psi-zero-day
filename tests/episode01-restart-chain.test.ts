import { describe, expect, it } from 'vitest';
import { episode01RestartChain } from '../src/app/episode01-restart-chain';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';

describe('Episode 01 restart gate chain',()=> {
  it('carries the 13:56 changed-work result into the 14:03 restart gate',()=> {
    const model=episode01RestartChain('e01_08i_restart_pressure',{
      tbm_gap_result:'changed_work_rebriefed',
    });
    expect(model?.phase).toBe('decision');
    expect(model?.stages.map(stage=>stage.state)).toEqual(['done','current','next']);
    expect(model?.cards.some(card=>card.title_text_id.includes('previous.controlled'))).toBe(true);
    expect(model?.cards.some(card=>card.title_text_id==='ui.restart_chain.condition.title')).toBe(true);
  });

  it('shows each restart action as a distinct tradeoff without changing the choice topology',()=> {
    const follow=episode01RestartChain('e01_08i_restart_pressure',{restart_action:'follow_verbal'});
    const trace=episode01RestartChain('e01_08i_restart_pressure',{restart_action:'trace_instruction'});
    const verify=episode01RestartChain('e01_08i_restart_pressure',{restart_action:'verify_controls'});
    expect(follow?.cards.some(card=>card.title_text_id.includes('action.follow'))).toBe(true);
    expect(trace?.cards.some(card=>card.title_text_id.includes('action.trace'))).toBe(true);
    expect(verify?.cards.some(card=>card.title_text_id.includes('action.verify'))).toBe(true);
  });

  it('changes the 14:11 verification focus by restart action before the outcome flag lands',()=> {
    const model=episode01RestartChain('e01_08j_restart_return',{restart_action:'trace_instruction'});
    expect(model?.phase).toBe('return');
    expect(model?.cards.some(card=>card.title_text_id.includes('focus.trace'))).toBe(true);
  });

  it('turns the same 14:11 panel into the actual restart verdict',()=> {
    const model=episode01RestartChain('e01_08j_restart_return',{
      restart_action:'follow_verbal',
      restart_result:'premature_restart_second_stop',
    });
    expect(model?.phase).toBe('verdict');
    expect(model?.cards.some(card=>card.title_text_id.includes('result.premature'))).toBe(true);
  });

  it('keeps cinematic and audio continuity through restart verification',()=> {
    expect(episodeCinematicBeat('e01_08i_restart_pressure')?.detail).toContain('복구상태');
    expect(episodeCinematicBeat('e01_08j_restart_return')?.detail).toContain('최종 확인자');
    expect(episodePresentationAudioCue('e01_08i_restart_pressure')?.production_key).toBe('workface_pressure');
    expect(episodePresentationAudioCue('e01_08j_restart_return')?.gain).toBeLessThan(0.4);
  });
});
