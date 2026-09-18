import { describe, expect, it } from 'vitest';
import { episode01InstructionRealityChain } from '../src/app/episode01-instruction-reality-chain';
import { FIELD_REALITY_DOCTRINE_ID } from '../src/app/gameplay-doctrine';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';

describe('Episode 01 instruction reality chain',()=> {
  it('binds the episode to the absolute field-reality doctrine',()=> {
    const model=episode01InstructionRealityChain('e01_08m_instruction_cascade',{stopwork_culture_result:'reporting_route_preserved'});
    expect(model?.doctrine_id).toBe(FIELD_REALITY_DOCTRINE_ID);
    expect(model?.cards.some(card=>card.title_text_id==='ui.instruction_reality.floor.title')).toBe(true);
    expect(model?.cards.some(card=>card.title_text_id==='ui.instruction_reality.voices.title')).toBe(true);
  });

  it('carries reporting climate into instruction interpretation',()=> {
    const model=episode01InstructionRealityChain('e01_08m_instruction_cascade',{stopwork_culture_result:'reporting_silenced'});
    expect(model?.cards.some(card=>card.title_text_id.includes('previous.silenced'))).toBe(true);
  });

  it('shows costs for every existing response',()=> {
    const top=episode01InstructionRealityChain('e01_08m_instruction_cascade',{instruction_chain_action:'accept_top'});
    const blame=episode01InstructionRealityChain('e01_08m_instruction_cascade',{instruction_chain_action:'blame_worker'});
    const reconstruct=episode01InstructionRealityChain('e01_08m_instruction_cascade',{instruction_chain_action:'reconstruct_chain'});
    expect(top?.cards.some(card=>card.title_text_id.includes('action.top'))).toBe(true);
    expect(blame?.cards.some(card=>card.title_text_id.includes('action.blame'))).toBe(true);
    expect(reconstruct?.cards.some(card=>card.title_text_id.includes('action.reconstruct'))).toBe(true);
  });

  it('turns 16:24 from listening focus into a field verdict',()=> {
    const before=episode01InstructionRealityChain('e01_08n_instruction_return',{instruction_chain_action:'reconstruct_chain'});
    const after=episode01InstructionRealityChain('e01_08n_instruction_return',{instruction_chain_action:'reconstruct_chain',instruction_chain_result:'conditional_phrase_restored'});
    expect(before?.phase).toBe('return');
    expect(after?.phase).toBe('verdict');
    expect(after?.cards.some(card=>card.title_text_id.includes('result.reconstructed'))).toBe(true);
  });

  it('keeps cinematic and audio continuity',()=> {
    expect(episodeCinematicBeat('e01_08m_instruction_cascade')?.detail).toContain('마지막 작업자');
    expect(episodeCinematicBeat('e01_08n_instruction_return')?.detail).toContain('각 단계');
    expect(episodePresentationAudioCue('e01_08m_instruction_cascade')?.production_key).toBe('radio_burst');
    expect(episodePresentationAudioCue('e01_08n_instruction_return')?.production_key).toBe('office_report_roomtone');
  });
});
