export type Episode01OfficePhase =
  | 'fact-check'
  | 'position-read'
  | 'evidence-compare'
  | 'responsibility-clash'
  | 'judgment'
  | 'record-carryover';

export type Episode01OfficeCameraProfile =
  | 'incident-table'
  | 'three-person-table'
  | 'evidence-over-shoulder'
  | 'pressure-triangle'
  | 'player-over-table'
  | 'file-to-field';

export type Episode01OfficeDepthProfile =
  | 'document-layers'
  | 'human-depth'
  | 'evidence-stack'
  | 'compressed-table'
  | 'decision-layered'
  | 'open-handoff';

export type Episode01OfficeLightingProfile =
  | 'worklight-neutral'
  | 'person-soft'
  | 'paper-cool'
  | 'conflict-amber'
  | 'decision-contrast'
  | 'carryover-daylight';

export type Episode01OfficeUiProfile =
  | 'facts'
  | 'dialogue'
  | 'compare'
  | 'conflict'
  | 'judgment'
  | 'result';

export type Episode01OfficeFocus =
  | 'facts'
  | 'people'
  | 'evidence'
  | 'responsibility'
  | 'decision'
  | 'field-memory';

export type Episode01OfficeCastProfile =
  | 'fact-table'
  | 'three-way'
  | 'evidence-ring'
  | 'pressure-triangle'
  | 'player-centered'
  | 'record-handoff';

export type Episode01OfficeEvidenceState = 'past' | 'active' | 'next';

export interface Episode01OfficeEvidenceSlot {
  readonly time: string;
  readonly label_text_id: string;
  readonly state: Episode01OfficeEvidenceState;
}

export interface Episode01OfficeProduction {
  readonly phase: Episode01OfficePhase;
  readonly camera_profile: Episode01OfficeCameraProfile;
  readonly depth_profile: Episode01OfficeDepthProfile;
  readonly lighting_profile: Episode01OfficeLightingProfile;
  readonly ui_profile: Episode01OfficeUiProfile;
  readonly focus: Episode01OfficeFocus;
  readonly cast_profile: Episode01OfficeCastProfile;
  readonly kicker_text_id: string;
  readonly title_text_id: string;
  readonly evidence_slots: readonly Episode01OfficeEvidenceSlot[];
  readonly hero_character_id?: 'player' | 'oh_seungjae' | 'lee_jaehoon' | 'kang_taesik' | 'lim_junho';
}

const RESPONSIBILITY_SPEAKERS = Object.freeze({
  gc: 'oh_seungjae',
  lee: 'lee_jaehoon',
  kang: 'kang_taesik',
} as const);

const RECORD_SPEAKERS = Object.freeze({
  oh: 'oh_seungjae',
  lee: 'lee_jaehoon',
  kang: 'kang_taesik',
} as const);

const RESPONSIBILITY_RESULTS = new Set(['one_sided_result', 'defensive_result', 'timeline_result']);
const REPORT_RETURN_RESULTS = new Set(['correction', 'evidence', 'timeline']);
const INSTRUCTION_RETURN_RESULTS = new Set(['gap', 'chilled', 'reconstructed']);
const RECORD_RESULTS = new Set(['summary_result', 'align_result', 'timeline_result']);
const RECORD_RETURN_RESULTS = new Set(['correction', 'conflict', 'preserved']);

function responsibilityEvidence(returnActive = false): readonly Episode01OfficeEvidenceSlot[] {
  return Object.freeze([
    Object.freeze({ time: '10:39', label_text_id: 'ui.report_chain.stage.inspection', state: 'past' as const }),
    Object.freeze({ time: '11:12', label_text_id: 'ui.report_chain.stage.clash', state: returnActive ? 'past' as const : 'active' as const }),
    Object.freeze({ time: '11:31', label_text_id: 'ui.report_chain.stage.return', state: returnActive ? 'active' as const : 'next' as const }),
  ]);
}

function instructionEvidence(): readonly Episode01OfficeEvidenceSlot[] {
  return Object.freeze([
    Object.freeze({ time: '15:32', label_text_id: 'ui.instruction_reality.stage.report', state: 'past' as const }),
    Object.freeze({ time: '16:05', label_text_id: 'ui.instruction_reality.stage.cascade', state: 'past' as const }),
    Object.freeze({ time: '16:24', label_text_id: 'ui.instruction_reality.stage.return', state: 'active' as const }),
  ]);
}

function recordEvidence(returnActive = false): readonly Episode01OfficeEvidenceSlot[] {
  return Object.freeze([
    Object.freeze({ time: '16:24', label_text_id: 'ui.record_reality.stage.instruction', state: 'past' as const }),
    Object.freeze({ time: '16:42', label_text_id: 'ui.record_reality.stage.record', state: returnActive ? 'past' as const : 'active' as const }),
    Object.freeze({ time: '17:08', label_text_id: 'ui.record_reality.stage.return', state: returnActive ? 'active' as const : 'next' as const }),
  ]);
}

function profile(
  phase: Episode01OfficePhase,
  kicker_text_id: string,
  title_text_id: string,
  evidence_slots: readonly Episode01OfficeEvidenceSlot[],
  hero_character_id?: Episode01OfficeProduction['hero_character_id'],
): Episode01OfficeProduction {
  const visual = {
    'fact-check': {
      camera_profile: 'incident-table',
      depth_profile: 'document-layers',
      lighting_profile: 'worklight-neutral',
      ui_profile: 'facts',
      focus: 'facts',
      cast_profile: 'fact-table',
    },
    'position-read': {
      camera_profile: 'three-person-table',
      depth_profile: 'human-depth',
      lighting_profile: 'person-soft',
      ui_profile: 'dialogue',
      focus: 'people',
      cast_profile: 'three-way',
    },
    'evidence-compare': {
      camera_profile: 'evidence-over-shoulder',
      depth_profile: 'evidence-stack',
      lighting_profile: 'paper-cool',
      ui_profile: 'compare',
      focus: 'evidence',
      cast_profile: 'evidence-ring',
    },
    'responsibility-clash': {
      camera_profile: 'pressure-triangle',
      depth_profile: 'compressed-table',
      lighting_profile: 'conflict-amber',
      ui_profile: 'conflict',
      focus: 'responsibility',
      cast_profile: 'pressure-triangle',
    },
    judgment: {
      camera_profile: 'player-over-table',
      depth_profile: 'decision-layered',
      lighting_profile: 'decision-contrast',
      ui_profile: 'judgment',
      focus: 'decision',
      cast_profile: 'player-centered',
    },
    'record-carryover': {
      camera_profile: 'file-to-field',
      depth_profile: 'open-handoff',
      lighting_profile: 'carryover-daylight',
      ui_profile: 'result',
      focus: 'field-memory',
      cast_profile: 'record-handoff',
    },
  } as const;

  return Object.freeze({
    phase,
    ...visual[phase],
    kicker_text_id,
    title_text_id,
    evidence_slots,
    ...(hero_character_id ? { hero_character_id } : {}),
  });
}

/**
 * Phase C-5 OFFICE production direction.
 *
 * Presentation-only metadata. OFFICE never reuses the STRATEGY map grammar:
 * incident/fact -> different positions -> record/evidence comparison ->
 * responsibility clash -> player judgment -> a record that remains as field memory.
 * Event topology, choices and engine effects remain Phase B-owned.
 */
export function episode01OfficeProduction(
  eventId: string | null | undefined,
  nodeId?: string | null,
): Episode01OfficeProduction | undefined {
  if (!eventId) return undefined;

  if (eventId === 'e01_08e_responsibility_clash') {
    const evidence = responsibilityEvidence();
    const speaker = nodeId ? RESPONSIBILITY_SPEAKERS[nodeId as keyof typeof RESPONSIBILITY_SPEAKERS] : undefined;
    if (speaker) {
      return profile(
        nodeId === 'kang' ? 'responsibility-clash' : 'position-read',
        'ui.report_chain.clash.eyebrow',
        'ui.report_chain.clash.title',
        evidence,
        speaker,
      );
    }
    if (nodeId === 'report') {
      return profile('judgment', 'ui.report_chain.clash.eyebrow', 'ui.report_chain.clash.title', evidence, 'player');
    }
    if (nodeId && RESPONSIBILITY_RESULTS.has(nodeId)) {
      return profile('record-carryover', 'ui.report_chain.return.eyebrow', 'ui.report_chain.return.title', evidence, 'player');
    }
    return profile('fact-check', 'ui.report_chain.clash.eyebrow', 'ui.report_chain.clash.title', evidence);
  }

  if (eventId === 'e01_08f_report_return') {
    const evidence = responsibilityEvidence(true);
    if (nodeId && REPORT_RETURN_RESULTS.has(nodeId)) {
      return profile('record-carryover', 'ui.report_chain.verdict.eyebrow', 'ui.report_chain.verdict.title', evidence);
    }
    return profile('evidence-compare', 'ui.report_chain.return.eyebrow', 'ui.report_chain.return.title', evidence);
  }

  if (eventId === 'e01_08n_instruction_return') {
    const evidence = instructionEvidence();
    if (nodeId && INSTRUCTION_RETURN_RESULTS.has(nodeId)) {
      return profile('record-carryover', 'ui.instruction_reality.verdict.eyebrow', 'ui.instruction_reality.verdict.title', evidence);
    }
    return profile('evidence-compare', 'ui.instruction_reality.return.eyebrow', 'ui.instruction_reality.return.title', evidence);
  }

  if (eventId === 'e01_08o_record_pressure') {
    const evidence = recordEvidence();
    const speaker = nodeId ? RECORD_SPEAKERS[nodeId as keyof typeof RECORD_SPEAKERS] : undefined;
    if (speaker) {
      return profile(
        nodeId === 'kang' ? 'responsibility-clash' : 'position-read',
        'ui.record_reality.pressure.eyebrow',
        'ui.record_reality.pressure.title',
        evidence,
        speaker,
      );
    }
    if (nodeId === 'record_action') {
      return profile('judgment', 'ui.record_reality.pressure.eyebrow', 'ui.record_reality.pressure.title', evidence, 'player');
    }
    if (nodeId && RECORD_RESULTS.has(nodeId)) {
      return profile('record-carryover', 'ui.record_reality.return.eyebrow', 'ui.record_reality.return.title', evidence, 'player');
    }
    return profile('fact-check', 'ui.record_reality.pressure.eyebrow', 'ui.record_reality.pressure.title', evidence);
  }

  if (eventId === 'e01_08p_record_return') {
    const evidence = recordEvidence(true);
    if (nodeId && RECORD_RETURN_RESULTS.has(nodeId)) {
      return profile('record-carryover', 'ui.record_reality.verdict.eyebrow', 'ui.record_reality.verdict.title', evidence);
    }
    return profile('evidence-compare', 'ui.record_reality.return.eyebrow', 'ui.record_reality.return.title', evidence);
  }

  return undefined;
}
