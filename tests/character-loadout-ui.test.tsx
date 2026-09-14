import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { projectCharacterGrowth } from '../src/app/character-growth';
import { projectCharacterLoadout } from '../src/app/character-loadout';
import { CharacterCard } from '../src/ui/VisualSlot';

const flags = {
  'growth.player': 'focused',
  'inventory.player.item.inspection_camera': true,
  'equipment.player.secondary_tool': 'item.inspection_camera',
} as const;

describe('CharacterCard loadout UI', () => {
  it('renders growth separately from explicitly equipped items', () => {
    const html = renderToStaticMarkup(<CharacterCard
      person={{ id: 'player', name: '현장 안전관리자', role: '안전관리' }}
      growth={projectCharacterGrowth(flags, 'player')}
      loadout={projectCharacterLoadout(flags, 'player')}
      equipmentTitle="장착 장비"
      slotLabel={slot => slot === 'primary_tool' ? '주도구' : slot === 'secondary_tool' ? '보조도구' : slot}
    />);
    expect(html).toContain('집중');
    expect(html).toContain('장착 장비');
    expect(html).toContain('검측 태블릿');
    expect(html).toContain('현장 카메라');
    expect(html).toContain('보조도구');
  });
});
