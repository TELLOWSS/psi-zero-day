import { describe, expect, it } from 'vitest';
import art from '../content/episode01/character-art-spec.json';

const entries = Object.entries(art.characters);

describe('Episode 01 character art production spec', () => {
  it('defines all eight current cast identities', () => {
    expect(entries).toHaveLength(8);
    expect(entries.map(([id]) => id).sort()).toEqual([
      'choi_minseok', 'kang_taesik', 'lee_jaehoon', 'lim_junho',
      'oh_seungjae', 'player', 'seo_jeongmin', 'yoon_sungho',
    ]);
  });

  it('requires multiple independent identity cues for every character', () => {
    for (const [id, spec] of entries) {
      expect(spec.silhouette, id).toBeTruthy();
      expect(spec.face, id).toBeTruthy();
      expect(spec.helmet, id).toBeTruthy();
      expect(spec.clothing, id).toBeTruthy();
      expect(spec.signature_prop, id).toBeTruthy();
      expect(spec.default_pose, id).toBeTruthy();
      expect(spec.palette.length, id).toBeGreaterThanOrEqual(4);
      expect(spec.do_not.length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it('does not reuse the same signature prop between cast members', () => {
    const props = entries.map(([, spec]) => spec.signature_prop);
    expect(new Set(props).size).toBe(props.length);
  });

  it('keeps the player visually distinct and includes a female lead presence', () => {
    expect(art.characters.player.gender_presentation).toBe('female');
    expect(art.characters.player.do_not.join(' ')).toContain('Lee Jaehoon');
  });
});
