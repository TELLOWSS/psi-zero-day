import { describe, expect, it } from 'vitest';
import { episode01StopworkCultureChain } from '../src/app/episode01-stopwork-culture-chain';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';

describe('Episode 01 stopwork culture chain',()=> {
  it('carries the restart outcome into the 15:10 social aftershock',()=> {
    const model=episode01StopworkCultureChain('e01_08k_stopwork_aftershock',{
      restart_result:'premature_restart_second_stop',
    });
    expect(model?.phase).toBe('aftershock');
    expect(model?.stages.map(stage=>stage.state)).toEqual(['done','current','next']);
    expect(model?.cards.some(card=>card.title_text_id.includes('previous.premature'))).toBe(true);
    expect(model?.cards.some(card=>card.title_text_id==='ui.stopwork_chain.principle.title')).toBe(true);
  });

  it('shows the distinct social tradeoff of each intervention route',()=> {
    const ignore=episode01StopworkCultureChain('e01_08k_stopwork_aftershock',{stopwork_culture_action:'ignore_social'});
    const publicRoute=episode01StopworkCultureChain('e01_08k_stopwork_aftershock',{stopwork_culture_action:'public_boundary'});
    const process=episode01StopworkCultureChain('e01_08k_stopwork_aftershock',{stopwork_culture_action:'protect_process'});
    expect(ignore?.cards.some(card=>card.title_text_id.includes('action.ignore'))).toBe(true);
    expect(publicRoute?.cards.some(card=>card.title_text_id.includes('action.public'))).toBe(true);
    expect(process?.cards.some(card=>card.title_text_id.includes('action.process'))).toBe(true);
  });

  it('changes the 15:32 reporting focus by the earlier culture action',()=> {
    const model=episode01StopworkCultureChain('e01_08l_stopwork_return',{
      stopwork_culture_action:'protect_process',
    });
    expect(model?.phase).toBe('return');
    expect(model?.cards.some(card=>card.title_text_id.includes('focus.process'))).toBe(true);
  });

  it('turns the same 15:32 panel into a reporting-culture verdict',()=> {
    const model=episode01StopworkCultureChain('e01_08l_stopwork_return',{
      stopwork_culture_action:'ignore_social',
      stopwork_culture_result:'reporting_silenced',
    });
    expect(model?.phase).toBe('verdict');
    expect(model?.cards.some(card=>card.title_text_id.includes('result.silenced'))).toBe(true);
  });

  it('keeps cinematic and audio continuity from silence into the next signal',()=> {
    expect(episodeCinematicBeat('e01_08k_stopwork_aftershock')?.detail).toContain('누가 문제를 제기했는지');
    expect(episodeCinematicBeat('e01_08l_stopwork_return')?.detail).toContain('무전');
    expect(episodePresentationAudioCue('e01_08k_stopwork_aftershock')?.production_key).toBe('stopwork_silence_drop');
    expect(episodePresentationAudioCue('e01_08l_stopwork_return')?.production_key).toBe('radio_burst');
  });
});
