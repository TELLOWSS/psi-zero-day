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

  it('keeps the other cast members on their presentation anchors', () => {
    const placements = projectEpisode01CharacterPlacements(['kang_taesik', 'yoon_sungho'], {}, []);
    expect(placements[0]).toMatchObject({ anchor: 'yard', scene_participant: false });
    expect(placements[1]).toMatchObject({ anchor: 'entry', scene_participant: false });
  });
});
