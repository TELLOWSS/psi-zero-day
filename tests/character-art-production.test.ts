import { describe, expect, it } from 'vitest';
import production from '../content/episode01/character-art-production.json';

const expectedIds = [
  'player', 'kang_taesik', 'yoon_sungho', 'lee_jaehoon',
  'lim_junho', 'choi_minseok', 'seo_jeongmin', 'oh_seungjae',
];

describe('TASK-009G character art production', () => {
  it('defines the complete eight-character commercial roster', () => {
    expect(production.characters.map(character => character.id).sort()).toEqual([...expectedIds].sort());
    expect(production.expression_set).toEqual(['neutral', 'concern', 'resolve', 'relief', 'conflict']);
  });

  it('keeps primary props, silhouettes and face keys unique', () => {
    const props = production.characters.map(character => character.signature_prop);
    const silhouettes = production.characters.map(character => character.silhouette);
    const faces = production.characters.map(character => character.face_key);
    expect(new Set(props).size).toBe(props.length);
    expect(new Set(silhouettes).size).toBe(silhouettes.length);
    expect(new Set(faces).size).toBe(faces.length);
  });

  it('requires portrait/map exports and explicit anti-lookalike pairs', () => {
    for (const character of production.characters) {
      expect(character.portrait_path).toMatch(/^assets\/episode01\/characters\/.+-portrait\.webp$/);
      expect(character.map_path).toMatch(/^assets\/episode01\/characters\/.+-map\.webp$/);
      expect(character.signature_pose.length).toBeGreaterThan(8);
      expect(character.must_not_resemble.length).toBeGreaterThan(0);
      expect(character.must_not_resemble).not.toContain(character.id);
    }
  });
});
