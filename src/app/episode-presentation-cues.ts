import type { PresentationAudioCue, UiAudioCue } from '../ui/useEpisodeAudio';

export interface EpisodePresentationAudioCue extends PresentationAudioCue {
  readonly production_key: string;
}

const cue = (
  production_key: string,
  fallback: UiAudioCue,
  asset_id?: string,
  gain = 1,
): EpisodePresentationAudioCue => Object.freeze({
  production_key,
  fallback,
  ...(asset_id ? { asset_id } : {}),
  gain,
});

const EVENT_AUDIO_CUES: Readonly<Record<string, EpisodePresentationAudioCue>> = Object.freeze({
  e01_01_arrival: cue('gate_queue', 'scene_shift', 'ep01.audio.gate_queue', 0.38),
  e01_02_meet_kang: cue('workface_pressure', 'scene_shift', 'ep01.audio.workface_pressure', 0.28),
  e01_03_plan_breaks: cue('gate_queue', 'scene_shift', 'ep01.audio.gate_queue', 0.5),
  e01_04_junho_signal: cue('radio_burst', 'radio_signal', 'ep01.audio.radio_burst', 0.55),
  e01_05_command: cue('workface_pressure', 'pressure', 'ep01.audio.workface_pressure', 0.45),
  e01_06_pump_arrival: cue('pump_engine_boom', 'pressure', 'ep01.audio.pump_engine_boom', 0.55),
  e01_07_first_pour: cue('concrete_pour', 'scene_shift', 'ep01.audio.concrete_pour', 0.58),
  e01_08_reactions: cue('concrete_pour', 'scene_shift', 'ep01.audio.concrete_pour', 0.3),
  e01_08a_reporting_return: cue('workface_pressure', 'radio_signal', 'ep01.audio.workface_pressure', 0.24),
  e01_08b_inspection_find: cue('workface_pressure', 'scene_shift', 'ep01.audio.workface_pressure', 0.4),
  e01_08c_site_pushback: cue('workface_pressure', 'pressure', 'ep01.audio.workface_pressure', 0.34),
  e01_08d_reinspection: cue('workface_pressure', 'scene_shift', 'ep01.audio.workface_pressure', 0.26),
  e01_08e_responsibility_clash: cue('office_report_roomtone', 'pressure', 'ep01.audio.office_report_roomtone', 0.36),
  e01_08f_report_return: cue('office_report_roomtone', 'scene_shift', 'ep01.audio.office_report_roomtone', 0.28),
  e01_08g_tbm_field_gap: cue('radio_burst', 'radio_signal', 'ep01.audio.radio_burst', 0.48),
  e01_08h_tbm_return: cue('workface_pressure', 'scene_shift', 'ep01.audio.workface_pressure', 0.3),
  e01_08i_restart_pressure: cue('workface_pressure', 'pressure', 'ep01.audio.workface_pressure', 0.45),
  e01_08j_restart_return: cue('workface_pressure', 'scene_shift', 'ep01.audio.workface_pressure', 0.32),
  e01_08k_stopwork_aftershock: cue('stopwork_silence_drop', 'scene_shift', 'ep01.audio.stopwork_silence_drop', 0.62),
  e01_08l_stopwork_return: cue('radio_burst', 'radio_signal', 'ep01.audio.radio_burst', 0.27),
  e01_08m_instruction_cascade: cue('radio_burst', 'radio_signal', 'ep01.audio.radio_burst', 0.48),
  e01_08n_instruction_return: cue('office_report_roomtone', 'scene_shift', 'ep01.audio.office_report_roomtone', 0.26),
  e01_08o_record_pressure: cue('office_report_roomtone', 'scene_shift', 'ep01.audio.office_report_roomtone', 0.32),
  e01_08p_record_return: cue('office_report_roomtone', 'evidence_return', 'ep01.audio.office_report_roomtone', 0.22),
  e01_09_evening: cue('home_night', 'scene_shift', 'ep01.audio.home_night', 0.34),
  e01_10_next_day_tease: cue('gate_queue', 'scene_shift', 'ep01.audio.gate_queue', 0.46),
});

/**
 * Presentation-only cue map. If a production audio asset has not been supplied yet,
 * useEpisodeAudio automatically falls back to the lightweight WebAudio cue.
 */
export function episodePresentationAudioCue(eventId: string | null | undefined): EpisodePresentationAudioCue | undefined {
  return eventId ? EVENT_AUDIO_CUES[eventId] : undefined;
}
