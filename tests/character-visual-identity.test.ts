import { describe, expect, it } from 'vitest';
import visuals from '../content/episode01/visuals.json';

const castIds = ['player', 'kang_taesik', 'yoon_sungho', 'lee_jaehoon', 'lim_junho', 'choi_minseok', 'seo_jeongmin', 'oh_seungjae'] as const;

describe('Episode 01 character visual identity bible', () => {
  it('locks a complete visual identity for all eight visible cast members', () => {
    expect(Object.keys(visuals.characters).sort()).toEqual([...castIds].sort());
    for (const id of castIds) {
      const identity = visuals.characters[id].identity;
      expect(identity.visual_role.length).toBeGreaterThan(8);
      expect(identity.silhouette.length).toBeGreaterThan(8);
      expect(identity.face.length).toBeGreaterThan(8);
      expect(identity.helmet.length).toBeGreaterThan(5);
      expect(identity.outfit.length).toBeGreaterThan(8);
      expect(identity.signature_prop.length).toBeGreaterThan(5);
      expect(identity.default_pose.length).toBeGreaterThan(8);
      expect(identity.expression.length).toBeGreaterThan(5);
    }
  });

  it('does not permit silhouette-only or prop-only duplication across the cast', () => {
    const silhouettes = castIds.map(id => visuals.characters[id].identity.silhouette);
    const props = castIds.map(id => visuals.characters[id].identity.signature_prop);
    expect(new Set(silhouettes).size).toBe(castIds.length);
    expect(new Set(props).size).toBe(castIds.length);
  });

  it('keeps the approved visual direction away from helmet-color-only differentiation', () => {
    expect(visuals.visual_direction.forbidden).toContain('same-face cast');
    expect(visuals.visual_direction.forbidden).toContain('helmet-color-only differentiation');
    expect(visuals.visual_direction.style).toContain('2.5D casual-strategy');
  });

  it('includes a clearly differentiated female safety-manager player visual', () => {
    expect(visuals.characters.player.identity.visual_role).toContain('female');
    expect(visuals.characters.player.identity.signature_prop).toContain('tablet');
    expect(visuals.characters.player.identity.helmet).toContain('white');
  });
});
