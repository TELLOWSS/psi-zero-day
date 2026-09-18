import { describe, expect, it } from 'vitest';
import { episode01InspectionAftermath } from '../src/app/episode01-inspection-aftermath';
import { episodeCinematicBeat } from '../src/app/episode-cinematic-beats';
import { episodePresentationAudioCue } from '../src/app/episode-presentation-cues';

describe('Episode 01 inspection aftermath timeline',()=> {
  it('turns the 10:24 pushback into a consequence of the selected inspection action',()=> {
    const model=episode01InspectionAftermath('e01_08c_site_pushback',{inspection_action:'full_stop'});
    expect(model?.phase).toBe('pushback');
    expect(model?.stages.map(stage=>stage.state)).toEqual(['done','current','next']);
    expect(model?.cards[0]?.title_text_id).toContain('full_stop');
  });

  it('changes the 10:39 focus by route before the reinspection result is known',()=> {
    const photo=episode01InspectionAftermath('e01_08d_reinspection',{inspection_action:'quick_photo'});
    const sequence=episode01InspectionAftermath('e01_08d_reinspection',{inspection_action:'sequence'});
    expect(photo?.phase).toBe('reinspection');
    expect(photo?.cards[1]?.title_text_id).toContain('focus.quick_photo');
    expect(sequence?.cards[1]?.title_text_id).toContain('focus.sequence');
  });

  it('turns the same 10:39 panel into the field verdict after the result flag lands',()=> {
    const model=episode01InspectionAftermath('e01_08d_reinspection',{
      inspection_action:'quick_photo',
      inspection_result:'rework_after_reinspection',
    });
    expect(model?.phase).toBe('verdict');
    expect(model?.cards[1]?.title_text_id).toContain('verdict.rework');
  });

  it('keeps cinematic and audio continuity through the complete inspection chain',()=> {
    expect(episodeCinematicBeat('e01_08c_site_pushback')?.detail).toContain('일정');
    expect(episodeCinematicBeat('e01_08d_reinspection')?.detail).toContain('실제 상태');
    expect(episodePresentationAudioCue('e01_08c_site_pushback')?.gain).toBeGreaterThan(0);
    expect(episodePresentationAudioCue('e01_08d_reinspection')?.gain).toBeLessThan(0.3);
  });
});
