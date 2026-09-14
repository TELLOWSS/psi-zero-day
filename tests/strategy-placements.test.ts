import { describe, expect, it } from 'vitest';
import { projectEpisode01CharacterPlacements } from '../src/app/strategy-placements';

describe('Episode 01 character placements', () => {
  it('places Junho at the ramp and marks him as the current participant', () => {
    const placements = projectEpisode01CharacterPlacements(
      ['player', 'kang_taesik', 'lim_junho'],
      { junho: 'lim_junho' },
      [{ signal_id: 'signal.ramp_movement', kind: 'ramp', anchor: 'ramp', label_text_id: 'ui.signal.ramp_movement' }],
    );
    const junho = placements.find(item => item.character_id === 'lim_junho');
    expect(junho).toMatchObject({ anchor: 'ramp', scene_participant: true, role_id: 'junho' });
    expect(junho?.nearby_signal_ids).toEqual(['signal.ramp_movement']);
  });

  it('keeps the existing crews on their presentation anchors', () => {
    const placements = projectEpisode01CharacterPlacements(['kang_taesik', 'yoon_sungho'], {}, []);
    expect(placements[0]).toMatchObject({ anchor: 'yard', scene_participant: false });
    expect(placements[1]).toMatchObject({ anchor: 'entry', scene_participant: false });
  });

  it('offsets the inspector from the entry crew while keeping the access finding linked', () => {
    const placements = projectEpisode01CharacterPlacements(
      ['yoon_sungho', 'seo_jeongmin'],
      { inspector: 'seo_jeongmin' },
      [{ signal_id: 'signal.inspection_access', kind: 'access', anchor: 'entry', label_text_id: 'ui.signal.inspection_access' }],
    );
    const inspector = placements.find(item => item.character_id === 'seo_jeongmin');
    expect(inspector).toMatchObject({ anchor: 'inspection', scene_participant: true, role_id: 'inspector' });
    expect(inspector?.nearby_signal_ids).toEqual(['signal.inspection_access']);
  });

  it('keeps the general contractor staff separate from the field crew during responsibility conflict', () => {
    const placements = projectEpisode01CharacterPlacements(
      ['lee_jaehoon', 'kang_taesik', 'oh_seungjae'],
      { gc: 'oh_seungjae', lee: 'lee_jaehoon', kang: 'kang_taesik' },
      [],
    );
    expect(placements.find(item => item.character_id === 'oh_seungjae'))
      .toMatchObject({ anchor: 'office', scene_participant: true, role_id: 'gc' });
  });
});
