import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import phaseD from '../content/episode01/phase-d-production-lock.json';
import { EPISODE01_PHASE_D_LOCK } from '../src/app/episode01-phase-d-lock';
import { MASTER_DESIGN_PRINCIPLES } from '../src/app/master-design-principles';
import catalog from '../content/episode01/scene-element-catalog.json';

describe('Episode 01 Phase D production lock', () => {
  it('enters Phase D only after the final directed playthrough gate passed', () => {
    expect(phaseD.entry.status).toBe('PASSED');
    expect(phaseD.entry.validated_commit).toBe('128f77361248fc70b9afe1409bb787af7de2c795');
    expect(phaseD.entry.test_files_passed).toBe(121);
    expect(phaseD.entry.tests_passed).toBe(687);
    expect(phaseD.entry.responsive_profiles_passed).toBe(5);
    expect(EPISODE01_PHASE_D_LOCK.master_principles_id).toBe(MASTER_DESIGN_PRINCIPLES.id);
  });

  it('keeps locked binary tracks separate from the active visual and runtime-element blockers', () => {
    expect(phaseD.tracks.immersive_backgrounds).toMatchObject({ required: 8, ready: 8, status: 'LOCKED' });
    expect(phaseD.tracks.character_performance_wave).toMatchObject({ required: 5, ready: 5, status: 'LOCKED' });
    expect(phaseD.tracks.production_audio).toMatchObject({ required: 8, ready: 8, status: 'LOCKED' });
    expect(phaseD.tracks.title_cast_identity_refresh).toMatchObject({ required: 8, ready: 8, status: 'LOCKED' });
    expect(phaseD.tracks.visual_quality_rebaseline).toMatchObject({ required: 6, ready: 0, status: 'IN_PROGRESS' });
    expect(phaseD.tracks.episode01_runtime_scene_elements).toMatchObject({ required: 1, ready: 0, status: 'PENDING' });
  });

  it('derives Episode 01 scene-element scope from actual event placement instead of all future catalog art', () => {
    const placed = [...new Set(Object.values(catalog.event_elements).flat().map(item => item.element_key))];
    expect(placed).toEqual(['material_stack']);
    expect(phaseD.runtime_scene_element_scope.current_required_keys).toEqual(placed);
    expect(Object.keys(catalog.elements)).toHaveLength(118);
    expect(phaseD.runtime_scene_element_scope.field_guide_only_backlog_is_non_blocking).toBe(true);
  });

  it('forbids temporary visual expansion and keeps the current focus on TBM/FIELD rebaseline', () => {
    expect(phaseD.current_focus).toBe('D-2_VISUAL_QUALITY_REBASELINE_FIELD_TBM');
    expect(phaseD.asset_policy.mode).toBe('FINAL_CANDIDATES_ONLY');
    expect(phaseD.asset_policy.prohibited).toContain('new temporary visual slots');
    expect(phaseD.asset_policy.prohibited).toContain('renaming legacy binaries as final');
    expect(EPISODE01_PHASE_D_LOCK.asset_policy.mode).toBe('FINAL_CANDIDATES_ONLY');
    expect(EPISODE01_PHASE_D_LOCK.execution_order).toEqual([
      'D-1_TITLE_CAST_IDENTITY_LOCKED',
      'D-2_VISUAL_QUALITY_REBASELINE_TBM_FIELD_THEN_REMAINING_SCENES',
      'D-3_MATERIAL_STACK_REALISTIC_V2',
      'D-4_REMAINING_UI_SOUND_DIRECTION_VISUAL_LOCK',
      'D-5_STRICT_PHASE_D_CHECK_AND_CINEMATIC_VERTICAL_SLICE_LOCK',
    ]);
  });

  it('ships a strict Phase D command without turning all 118 future Field Guide assets into an Episode 01 blocker', () => {
    const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8')) as { scripts: Record<string, string> };
    expect(pkg.scripts['phase-d:check']).toContain('assets:character-replacement-check');
    expect(pkg.scripts['phase-d:check']).toContain('--require-phase-d');
    expect(pkg.scripts['phase-d:check']).toContain('test:episode01-visual');
    expect(pkg.scripts['phase-d:check']).not.toContain('assets:production-scene-elements-check');
  });
});
