export const EPISODE01_VISUAL_QUALITY_REBASELINE_ID = 'episode01-phase-d-visual-quality-rebaseline-v1' as const;

export const EPISODE01_VISUAL_QUALITY_REBASELINE = Object.freeze({
  id: EPISODE01_VISUAL_QUALITY_REBASELINE_ID,
  status: 'ACTIVE_PRODUCTION_BASELINE',
  effective: '2026-09-21',
  reference: 'Director-approved current-vs-target screen comparison, 2026-09-21',
  lock_semantics: Object.freeze({
    binary_locked: 'The contracted file exists and passes exact binary/format validation.',
    visual_production_locked: 'The live player-facing surface reaches the approved commercial visual bar across required viewports.',
    rule: 'BINARY_LOCKED does not imply VISUAL_PRODUCTION_LOCKED.',
  }),
  north_star: 'Episode 01 must read as a living construction site first and a UI second: people, work, hazards, materials and spatial change remain visible while PSI interprets the scene.',
  scene_order: Object.freeze(['FIELD','STOP_WORK','TBM','STRATEGY','OFFICE','DAY_RESULT'] as const),
  first_wave: Object.freeze(['TBM','FIELD'] as const),
  global_acceptance: Object.freeze([
    'The construction world occupies the primary visual surface; no large empty black canvas is accepted as final.',
    'Characters are grounded in the same site space as equipment, materials, hazards and routes instead of floating over a generic dark stage.',
    'HUD panels explain or act on the scene and do not replace the scene.',
    'Primary decision UI remains readable without covering the decisive visual evidence.',
    'Character identity, PPE, role props and relative scale remain consistent across scene families.',
    'Desktop, phone portrait, phone landscape and tablet preserve the same scene hierarchy even when panels collapse.',
    'Final art, UI, sound and motion reinforce one commercial NEW PSI visual system.',
  ] as const),
  scene_targets: Object.freeze({
    TBM: Object.freeze({
      benchmark: 'changed-work TBM / e01_08g_tbm_field_gap',
      world: 'Changed work condition, material yard, access/route change and active crew remain visibly present behind the briefing.',
      people: 'Player and field voices form one readable crew composition; active speaker emphasis never collapses the scene into isolated talking heads.',
      ui: 'PSI TRACE left, location/minimap right, live TBM/change-control judgment dock below.',
      decision: 'Morning rule versus afternoon changed condition is visible in the scene before the player reads explanatory copy.',
    }),
    FIELD: Object.freeze({
      benchmark: 'small signal / e01_04_junho_signal',
      world: 'Work area, route, material/equipment context and risk signal remain visible around the player and Junho.',
      people: 'Player and worker read as people standing inside a functioning site, not cutouts on an empty stage.',
      ui: 'Small signal, location and judgment controls stay secondary to the world.',
      decision: 'A player can identify what changed or what is uncertain within a few seconds before choosing an action.',
    }),
    STOP_WORK: Object.freeze({ benchmark:'e01_08c_site_pushback', goal:'The physical hazard and human stop action dominate before the choice dock.' }),
    STRATEGY: Object.freeze({ benchmark:'e01_05_command', goal:'Site overview acts as the playable board; workers, zones, routes and signals are legible in one world.' }),
    OFFICE: Object.freeze({ benchmark:'e01_08e_responsibility_clash', goal:'People and evidence share one believable room; records are clues, not a detached slide deck.' }),
    DAY_RESULT: Object.freeze({ benchmark:'e01_09_evening', goal:'The day closes as memory, people, record residue and tomorrow signal rather than a detached scorecard.' }),
  }),
  forbidden_drift: Object.freeze([
    'Do not count a technically present background binary as visually finished when the live screen is still too dark, empty or compositionally weak.',
    'Do not add new placeholder art to hide a layout problem.',
    'Do not solve scene quality by covering more of the world with larger panels.',
    'Do not redesign the 26-event topology while rebaselining visual quality.',
    'Do not expand Episode 02 or the 118-item Field Guide backlog before Episode 01 visual lock.',
  ] as const),
});

export type Episode01VisualScene = keyof typeof EPISODE01_VISUAL_QUALITY_REBASELINE.scene_targets;
