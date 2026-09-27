import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import baseline from '../content/episode01/phase-d-visual-quality-rebaseline-v1.json';
import { EPISODE01_VISUAL_QUALITY_REBASELINE } from '../src/app/episode01-visual-quality-rebaseline';
import phaseD from '../content/episode01/phase-d-production-lock.json';
import castQa from '../content/episode01/title-cast-three-surface-qa.json';

describe('Episode 01 Phase D visual quality rebaseline', () => {
  it('separates binary lock from player-facing visual production lock', () => {
    expect(baseline.lock_semantics.rule).toBe('BINARY_LOCKED does not imply VISUAL_PRODUCTION_LOCKED.');
    expect(EPISODE01_VISUAL_QUALITY_REBASELINE.lock_semantics.rule).toBe(baseline.lock_semantics.rule);
  });

  it('starts the real-screen rebuild with TBM then FIELD', () => {
    expect(baseline.first_wave).toEqual(['TBM','FIELD']);
    expect(EPISODE01_VISUAL_QUALITY_REBASELINE.first_wave).toEqual(['TBM','FIELD']);
  });

  it('forbids empty dark-stage completion and panel-first drift', () => {
    expect(EPISODE01_VISUAL_QUALITY_REBASELINE.global_acceptance.some(rule => /empty black canvas/i.test(rule))).toBe(true);
    expect(EPISODE01_VISUAL_QUALITY_REBASELINE.global_acceptance.some(rule => /HUD panels explain or act on the scene/i.test(rule))).toBe(true);
  });

  it('locks D-1 before the visual rebaseline moves into FIELD/TBM', () => {
    expect(castQa.status).toBe('PRODUCTION_LOCKED');
    expect(phaseD.tracks.title_cast_identity_refresh).toMatchObject({ required:8, ready:8, status:'LOCKED' });
    expect(phaseD.current_focus).toBe('D-2_VISUAL_QUALITY_REBASELINE_FIELD_TBM');
  });

  it('locks the D-2C TBM desktop and compact-landscape world-first composition', () => {
    const css = fs.readFileSync('src/ui/production-scenes.css', 'utf8');
    expect(css).toContain('Phase D D-2C — TBM desktop + compact-landscape world-first closure');
    expect(css).toContain('.episode-immersive-scene[data-visual-rebaseline="world-first-v1"]::after');
    expect(css).toContain('.episode-immersive-scene[data-tbm-depth="changed-work-layers"] .episode-immersive-props');
    expect(css).toContain('@media (orientation:landscape) and (max-height:650px)');
  });

});
