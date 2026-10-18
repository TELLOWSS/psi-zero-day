/**
 * EP01 candidate score and field Foley.
 *
 * Music files are EDITORIAL EXCERPTS from a single Gemini video, not
 * eight independently composed masters or source stems.
 * Uploaded files are staged separately from the 12 approved core assets.
 */
export type EpisodeCandidateScore =
  | 'SC_01_DAWN_PROMISE' | 'SC_02_WORK_PULSE' | 'SC_03_UNSAID_SIGNAL'
  | 'SC_04_SEVEN_MINUTES' | 'SC_05_ZERO_MOMENT'
  | 'SC_06_AFTER_THE_STOP' | 'SC_07_FACT_AND_MEMORY'
  | 'SC_08_TODAY_RETURN_HOME';

export type EpisodeCandidateFoley =
  | 'radio_ptt_detail' | 'metal_sheet_tap' | 'zero_moment_air_cut'
  | 'pump_hydraulic_detail' | 'hose_surface_touch' | 'tbm_paper_gear'
  | 'record_page_key' | 'home_key_door' | 'day02_gate_reprise';

const prefix = 'ep01.audio.candidate.';
const foleyForScene: Readonly<Record<string, readonly EpisodeCandidateFoley[]>> = Object.freeze({
  e01_04_junho_signal: ['radio_ptt_detail'],
  e01_06_pump_arrival: ['pump_hydraulic_detail'],
  e01_07_first_pour: ['hose_surface_touch'],
  e01_08a_reporting_return: ['metal_sheet_tap'],
  e01_08c_site_pushback: ['zero_moment_air_cut'],
  e01_08g_tbm_field_gap: ['tbm_paper_gear'],
  e01_08m_instruction_cascade: ['radio_ptt_detail'],
  e01_08o_record_pressure: ['record_page_key'],
  e01_09_evening: ['home_key_door'],
  e01_10_next_day_tease: ['day02_gate_reprise'],
});

export function episode01CandidateScoreAsset(motif: EpisodeCandidateScore | null | undefined) {
  return motif ? { asset_id: prefix + motif.toLowerCase(), gain: 0.27, loop: true } as const : undefined;
}

export function episode01CandidateFoleyAssets(eventId: string | null | undefined) {
  return eventId ? (foleyForScene[eventId] ?? []).map(id => ({
    asset_id: prefix + id, gain: id === 'zero_moment_air_cut' ? 0.16 : 0.23,
    fallback: 'scene_shift' as const,
  })) : [];
}

export const EP01_CANDIDATE_ASSET_COUNT = 17;
export const EP01_CANDIDATE_STATUS = 'DIRECTOR_REVIEW_PREVIEW_ONLY' as const;
