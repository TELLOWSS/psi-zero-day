import { MASTER_DESIGN_PRINCIPLES_ID } from './master-design-principles';
import { EPISODE01_FINAL_PLAYTHROUGH_GATE_ID } from './episode01-final-playthrough-gate';
import { EPISODE01_VISUAL_QUALITY_REBASELINE_ID } from './episode01-visual-quality-rebaseline';

export const EPISODE01_PHASE_D_LOCK_ID = 'episode01-phase-d-production-lock-v1' as const;

export const EPISODE01_PHASE_D_LOCK = Object.freeze({
  id: EPISODE01_PHASE_D_LOCK_ID,
  status: 'IN_PROGRESS',
  entry: Object.freeze({
    status: 'PASSED',
    validated_commit: '128f77361248fc70b9afe1409bb787af7de2c795',
    workflow_run_id: 35550376043,
    test_files_passed: 121,
    tests_passed: 687,
    responsive_profiles_passed: 5,
  }),
  master_principles_id: MASTER_DESIGN_PRINCIPLES_ID,
  final_playthrough_gate_id: EPISODE01_FINAL_PLAYTHROUGH_GATE_ID,
  current_focus: 'D-2_VISUAL_QUALITY_REBASELINE_FIELD_TBM',
  visual_quality_rebaseline_id: EPISODE01_VISUAL_QUALITY_REBASELINE_ID,
  asset_policy: Object.freeze({
    mode: 'FINAL_CANDIDATES_ONLY',
    rule: 'Phase D does not create additional placeholder, mockup, fallback or CSS-only visual substitutes. New visual work must target an existing Phase D production slot and be eligible to become the shipped final asset.',
    acceptance: Object.freeze([
      'Asset targets an existing Phase D production slot.',
      'Binary passes required size, alpha and format checks.',
      'Character art passes identity and cross-surface continuity QA when applicable.',
      'Scene-element art passes authored field-reality profile and runtime placement QA when applicable.',
      'Replacement is verified in the live Episode 01 surface before the slot is marked LOCKED.',
    ] as const),
    prohibited: Object.freeze([
      'New temporary visual slots.',
      'Concept-only mockups counted as production progress.',
      'Renaming legacy binaries as final.',
      'CSS silhouettes or fallback art counted as final media.',
      'Future Field Guide or Episode 02 art expansion before Episode 01 Phase D closes.',
    ] as const),
  }),
  execution_order: Object.freeze([
    'D-1_TITLE_CAST_IDENTITY_LOCKED',
    'D-2_VISUAL_QUALITY_REBASELINE_TBM_FIELD_THEN_REMAINING_SCENES',
    'D-3_MATERIAL_STACK_REALISTIC_V2_LOCKED',
    'D-4_REMAINING_UI_SOUND_DIRECTION_VISUAL_LOCK',
    'D-5_STRICT_PHASE_D_CHECK_AND_CINEMATIC_VERTICAL_SLICE_LOCK',
  ] as const),
  tracks: Object.freeze([
    Object.freeze({ id: 'immersive_backgrounds', required: 8, ready: 8, status: 'LOCKED' }),
    Object.freeze({ id: 'character_performance_wave', required: 5, ready: 5, status: 'LOCKED' }),
    Object.freeze({ id: 'production_audio', required: 8, ready: 8, status: 'LOCKED' }),
    Object.freeze({ id: 'camera_transition_responsive_direction', required: 1, ready: 1, status: 'LOCKED' }),
    Object.freeze({ id: 'title_cast_identity_refresh', required: 8, ready: 8, status: 'LOCKED' }),
    Object.freeze({ id: 'visual_quality_rebaseline', required: 6, ready: 0, status: 'IN_PROGRESS' }),
    Object.freeze({ id: 'episode01_runtime_scene_elements', required: 1, ready: 1, status: 'LOCKED' }),
  ] as const),
  runtime_scene_element_scope: Object.freeze({
    policy: 'ONLY_ELEMENTS_REFERENCED_BY_EPISODE01_EVENT_ELEMENTS',
    current_required_keys: Object.freeze(['material_stack'] as const),
    field_guide_only_backlog_is_non_blocking: true,
    reason: 'Episode 01 cinematic lock must not be held open by reusable props reserved for later episodes, processes, or Field Guide expansion.',
  }),
  exit_criteria: Object.freeze([
    'Core Episode 01 production asset check passes.',
    'All eight title-cast replacement portrait/map binaries differ from the locked legacy baseline and pass shape/identity QA.',
    'All scene elements actually placed by Episode 01 event_elements are accepted final WebP assets.',
    'Eight immersive final backgrounds remain exact and production-valid.',
    'Five character performance-wave binaries remain exact and production-valid.',
    'Eight production-v1 audio binaries remain exact and production-valid.',
    'Episode 01 visual regression and five-profile responsive QA remain green.',
  ] as const),
  non_goals: Object.freeze([
    'Do not require all 118 reusable Field Guide/future-campaign scene-element slots before Episode 01 cinematic lock.',
    'Do not redesign Phase B event topology during Phase D.',
    'Do not open Episode 02 production before the Episode 01 Phase D lock is closed.',
  ] as const),
});

export type Episode01PhaseDTrack = (typeof EPISODE01_PHASE_D_LOCK.tracks)[number];
