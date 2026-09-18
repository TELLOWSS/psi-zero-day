import { describe, expect, it } from 'vitest';
import layout from '../content/episode01/main-title-layout.json';
import production from '../content/episode01/character-art-production.json';
import replacement from '../content/episode01/character-replacement-plan.json';
import batchA from '../content/episode01/production-art-batch-a.json';

const titleCast = ['lim_junho', 'player', 'lee_jaehoon', 'seo_jeongmin'] as const;

describe('main title / loading / character production alignment', () => {
  it('uses one canonical four-character cast across title, loading and replacement plan', () => {
    expect(layout.composition.cast).toEqual(titleCast);
    expect(layout.loading.team_cast).toEqual(titleCast);
    expect(production.visual_uniqueness.main_title_cast).toEqual(titleCast);

    const replacementIds = replacement.batch
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .map(entry => entry.id);
    expect(new Set(replacementIds)).toEqual(new Set(titleCast));
  });

  it('keeps Batch A exactly aligned to the four title characters plus the foundation world art', () => {
    expect(batchA.title_cast).toEqual(titleCast);
    const characterIds = [...new Set(
      batchA.assets
        .filter(asset => 'character_id' in asset)
        .map(asset => asset.character_id),
    )];
    expect(new Set(characterIds)).toEqual(new Set(titleCast));
    expect(batchA.assets.filter(asset => asset.kind === 'background')).toHaveLength(1);
    expect(batchA.assets.filter(asset => asset.kind === 'portrait')).toHaveLength(4);
    expect(batchA.assets.filter(asset => asset.kind === 'map')).toHaveLength(4);
  });

  it('requires each title character to have a distinct identity contract on primary visual axes', () => {
    const byId = new Map(production.characters.map(character => [character.id, character]));
    const selected = titleCast.map(id => byId.get(id));
    expect(selected.every(Boolean)).toBe(true);

    const axes = [
      (character: NonNullable<(typeof selected)[number]>) => character.face_key,
      character => character.silhouette,
      character => character.helmet_key,
      character => character.wardrobe_key,
      character => character.signature_prop,
      character => character.age_band,
    ];

    for (const axis of axes) {
      const values = selected.map(character => axis(character!));
      expect(new Set(values).size).toBe(titleCast.length);
    }
  });

  it('keeps the generated concept as art direction while runtime controls stay live DOM', () => {
    expect(layout.runtime_rules).toContain('all menu controls must remain clickable DOM elements');
    expect(layout.runtime_rules).toContain('generated concept images are art direction only and must not bake functional buttons into runtime');
    expect(layout.composition.cast_mode).toBe('full_body_live_assets');
  });
});
