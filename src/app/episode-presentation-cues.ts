import type { UiAudioCue } from '../ui/useEpisodeAudio';

const EVENT_AUDIO_CUES: Readonly<Record<string, UiAudioCue>> = Object.freeze({
  e01_03_plan_breaks: 'scene_shift',
  e01_04_junho_signal: 'radio_signal',
  e01_05_command: 'pressure',
  e01_06_pump_arrival: 'pressure',
  e01_07_first_pour: 'scene_shift',
  e01_08b_inspection_find: 'scene_shift',
  e01_08e_responsibility_clash: 'pressure',
  e01_08g_tbm_field_gap: 'radio_signal',
  e01_08i_restart_pressure: 'pressure',
  e01_08k_stopwork_aftershock: 'scene_shift',
  e01_08m_instruction_cascade: 'radio_signal',
  e01_08o_record_pressure: 'scene_shift',
  e01_09_evening: 'scene_shift',
  e01_10_next_day_tease: 'scene_shift',
});

/**
 * Presentation-only cue map. These synthetic cues are deliberately lightweight;
 * authored site ambience/SFX can replace them later without changing game rules.
 */
export function episodePresentationAudioCue(eventId: string | null | undefined): UiAudioCue | undefined {
  return eventId ? EVENT_AUDIO_CUES[eventId] : undefined;
}
