export interface Episode01VoiceCue {
  readonly event_id: string;
  readonly node_id: string;
  readonly asset_id: string;
  readonly duration_ms: number;
  readonly gain: number;
  readonly duck_gain: number;
  readonly countdown_label?: string;
}

const VOICE_CUES: Readonly<Record<string, Episode01VoiceCue>> = Object.freeze({
  'e01_02_meet_kang/kang': Object.freeze({
    event_id: 'e01_02_meet_kang',
    node_id: 'kang',
    asset_id: 'ep01.audio.voice_kang_first_contact',
    duration_ms: 16807,
    gain: 1,
    duck_gain: 0.28,
  }),
  'e01_04_junho_signal/signal': Object.freeze({
    event_id: 'e01_04_junho_signal',
    node_id: 'signal',
    asset_id: 'ep01.audio.voice_junho_signal',
    duration_ms: 10607,
    gain: 1,
    duck_gain: 0.24,
  }),
  'e01_05_command/request_delay_result': Object.freeze({
    event_id: 'e01_05_command',
    node_id: 'request_delay_result',
    asset_id: 'ep01.audio.voice_lee_delay',
    duration_ms: 11207,
    gain: 1,
    duck_gain: 0.26,
    countdown_label: '07:00',
  }),
  'e01_08o_record_pressure/oh': Object.freeze({
    event_id: 'e01_08o_record_pressure',
    node_id: 'oh',
    asset_id: 'ep01.audio.voice_oh_record_judgment',
    duration_ms: 14207,
    gain: 1,
    duck_gain: 0.22,
  }),
});

/**
 * Phase D voice is presentation-only: authored story nodes still own progression.
 * A voice cue may lock manual advance while the reviewed recording is playing,
 * but it never changes game rules or selects a choice.
 */
export function episode01VoiceCue(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
  presentationType: string | null | undefined,
): Episode01VoiceCue | undefined {
  if (!eventId || !nodeId || presentationType !== 'SHOW_DIALOGUE') return undefined;
  return VOICE_CUES[`${eventId}/${nodeId}`];
}

export const EPISODE01_VOICE_CUES = Object.freeze(Object.values(VOICE_CUES));
