export type Episode01OfficePhase =
  | 'fact-intake'
  | 'position-split'
  | 'responsibility-judgment'
  | 'report-commit'
  | 'evidence-return'
  | 'instruction-trace'
  | 'record-pressure'
  | 'record-judgment'
  | 'prevention-return';

export type Episode01OfficeCameraProfile =
  | 'table-wide'
  | 'speaker-tight'
  | 'judgment-table'
  | 'commit-medium'
  | 'evidence-wide'
  | 'trace-medium'
  | 'record-wide'
  | 'record-decision'
  | 'carryover-wide';

export type Episode01OfficeDepthProfile =
  | 'room-open'
  | 'testimony-layered'
  | 'evidence-table'
  | 'commit-layered'
  | 'evidence-return'
  | 'trace-board'
  | 'record-stack'
  | 'decision-layered'
  | 'prevention-open';

export type Episode01OfficeLightingProfile =
  | 'office-neutral'
  | 'speaker-focus'
  | 'decision-amber'
  | 'commit-neutral'
  | 'verification-clear'
  | 'trace-cool'
  | 'record-neutral'
  | 'decision-contrast'
  | 'prevention-soft';

export type Episode01OfficeUiProfile =
  | 'context'
  | 'dialogue'
  | 'judgment'
  | 'result'
  | 'verify'
  | 'trace'
  | 'record';

export type Episode01OfficeCastProfile =
  | 'four-person-table'
  | 'speaker-focus'
  | 'balanced-table'
  | 'report-commit'
  | 'evidence-return'
  | 'instruction-return'
  | 'record-table'
  | 'decision-table'
  | 'carryover-table';

export type Episode01OfficeEvidenceFocus =
  | 'facts'
  | 'statements'
  | 'responsibility'
  | 'timeline'
  | 'instruction'
  | 'record'
  | 'prevention';

export interface Episode01OfficeProduction {
  readonly phase: Episode01OfficePhase;
  readonly camera_profile: Episode01OfficeCameraProfile;
  readonly depth_profile: Episode01OfficeDepthProfile;
  readonly lighting_profile: Episode01OfficeLightingProfile;
  readonly ui_profile: Episode01OfficeUiProfile;
  readonly cast_profile: Episode01OfficeCastProfile;
  readonly evidence_focus: Episode01OfficeEvidenceFocus;
  readonly hero_character_id?: string;
}

const RESPONSIBILITY_SPEAKERS: Readonly<Record<string, string>> = Object.freeze({
  gc: 'oh_seungjae',
  lee: 'lee_jaehoon',
  kang: 'kang_taesik',
});

const REPORT_RESULTS = new Set(['one_sided_result', 'defensive_result', 'timeline_result']);
const REPORT_RETURN_RESULTS = new Set(['correction', 'evidence', 'timeline']);
const INSTRUCTION_RETURN_RESULTS = new Set(['gap', 'chilled', 'reconstructed']);
const RECORD_SPEAKERS: Readonly<Record<string, string>> = Object.freeze({
  oh: 'oh_seungjae',
  lee: 'lee_jaehoon',
  kang: 'kang_taesik',
});
const RECORD_RESULTS = new Set(['summary_result', 'align_result', 'timeline_result']);
const RECORD_RETURN_RESULTS = new Set(['correction', 'conflict', 'preserved']);

/**
 * Phase C-5 OFFICE production direction.
 *
 * Presentation-only metadata. OFFICE must read as one shared room where people,
 * records and evidence remain visible together:
 * facts -> role-specific statements -> responsibility judgment -> committed
 * record -> returning evidence -> trace/record pressure -> prevention carry-over.
 *
 * This never changes Phase B topology, choice ids, effects or existing flags.
 */
export function episode01OfficeProduction(
  eventId: string | null | undefined,
  nodeId?: string | null,
): Episode01OfficeProduction | undefined {
  if (!eventId) return undefined;

  if (eventId === 'e01_08e_responsibility_clash') {
    if (nodeId && RESPONSIBILITY_SPEAKERS[nodeId]) {
      return Object.freeze({
        phase: nodeId === 'gc' ? 'fact-intake' : 'position-split',
        camera_profile: 'speaker-tight',
        depth_profile: 'testimony-layered',
        lighting_profile: 'speaker-focus',
        ui_profile: 'dialogue',
        cast_profile: 'speaker-focus',
        evidence_focus: nodeId === 'gc' ? 'facts' : 'statements',
        hero_character_id: RESPONSIBILITY_SPEAKERS[nodeId],
      });
    }
    if (nodeId === 'report') {
      return Object.freeze({
        phase: 'responsibility-judgment',
        camera_profile: 'judgment-table',
        depth_profile: 'evidence-table',
        lighting_profile: 'decision-amber',
        ui_profile: 'judgment',
        cast_profile: 'balanced-table',
        evidence_focus: 'responsibility',
      });
    }
    if (nodeId && REPORT_RESULTS.has(nodeId)) {
      return Object.freeze({
        phase: 'report-commit',
        camera_profile: 'commit-medium',
        depth_profile: 'commit-layered',
        lighting_profile: 'commit-neutral',
        ui_profile: 'result',
        cast_profile: 'report-commit',
        evidence_focus: 'timeline',
      });
    }
    return Object.freeze({
      phase: 'fact-intake',
      camera_profile: 'table-wide',
      depth_profile: 'room-open',
      lighting_profile: 'office-neutral',
      ui_profile: 'context',
      cast_profile: 'four-person-table',
      evidence_focus: 'facts',
    });
  }

  if (eventId === 'e01_08f_report_return') {
    return Object.freeze({
      phase: 'evidence-return',
      camera_profile: 'evidence-wide',
      depth_profile: 'evidence-return',
      lighting_profile: 'verification-clear',
      ui_profile: nodeId === 'resolve' ? 'judgment' : REPORT_RETURN_RESULTS.has(nodeId ?? '') ? 'verify' : 'context',
      cast_profile: 'evidence-return',
      evidence_focus: 'timeline',
    });
  }

  if (eventId === 'e01_08n_instruction_return') {
    return Object.freeze({
      phase: 'instruction-trace',
      camera_profile: 'trace-medium',
      depth_profile: 'trace-board',
      lighting_profile: 'trace-cool',
      ui_profile: nodeId === 'resolve' ? 'judgment' : INSTRUCTION_RETURN_RESULTS.has(nodeId ?? '') ? 'trace' : 'context',
      cast_profile: 'instruction-return',
      evidence_focus: 'instruction',
    });
  }

  if (eventId === 'e01_08o_record_pressure') {
    if (nodeId && RECORD_SPEAKERS[nodeId]) {
      return Object.freeze({
        phase: 'record-pressure',
        camera_profile: 'speaker-tight',
        depth_profile: 'record-stack',
        lighting_profile: 'speaker-focus',
        ui_profile: 'dialogue',
        cast_profile: 'speaker-focus',
        evidence_focus: 'record',
        hero_character_id: RECORD_SPEAKERS[nodeId],
      });
    }
    if (nodeId === 'record_action') {
      return Object.freeze({
        phase: 'record-judgment',
        camera_profile: 'record-decision',
        depth_profile: 'decision-layered',
        lighting_profile: 'decision-contrast',
        ui_profile: 'record',
        cast_profile: 'decision-table',
        evidence_focus: 'record',
      });
    }
    if (nodeId && RECORD_RESULTS.has(nodeId)) {
      return Object.freeze({
        phase: 'report-commit',
        camera_profile: 'commit-medium',
        depth_profile: 'commit-layered',
        lighting_profile: 'commit-neutral',
        ui_profile: 'result',
        cast_profile: 'report-commit',
        evidence_focus: 'timeline',
      });
    }
    return Object.freeze({
      phase: 'record-pressure',
      camera_profile: 'record-wide',
      depth_profile: 'record-stack',
      lighting_profile: 'record-neutral',
      ui_profile: 'context',
      cast_profile: 'record-table',
      evidence_focus: 'record',
    });
  }

  if (eventId === 'e01_08p_record_return') {
    return Object.freeze({
      phase: 'prevention-return',
      camera_profile: 'carryover-wide',
      depth_profile: 'prevention-open',
      lighting_profile: 'prevention-soft',
      ui_profile: nodeId === 'resolve' ? 'judgment' : RECORD_RETURN_RESULTS.has(nodeId ?? '') ? 'verify' : 'context',
      cast_profile: 'carryover-table',
      evidence_focus: 'prevention',
    });
  }

  return undefined;
}
