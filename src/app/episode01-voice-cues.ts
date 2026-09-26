export interface Episode01VoiceSubtitleSegment {
  readonly start_ms: number;
  readonly text: string;
}

export interface Episode01VoiceCue {
  readonly event_id: string;
  readonly node_id: string;
  readonly asset_id: string;
  readonly duration_ms: number;
  readonly gain: number;
  readonly duck_gain: number;
  readonly countdown_label?: string;
  readonly subtitles: readonly Episode01VoiceSubtitleSegment[];
}

const VOICE_CUES: Readonly<Record<string, Episode01VoiceCue>> = Object.freeze({
  'e01_02_meet_kang/kang': Object.freeze({
    event_id: 'e01_02_meet_kang',
    node_id: 'kang',
    asset_id: 'ep01.audio.voice_kang_first_contact',
    duration_ms: 16807,
    gain: 1,
    duck_gain: 0.28,
    subtitles: Object.freeze([
      { start_ms: 250, text: '새로운 안전관리자요?' },
      { start_ms: 2700, text: '강태식입니다.' },
      { start_ms: 4050, text: '형틀 맡고 있습니다.' },
      { start_ms: 6600, text: '오늘은 첫 타설이라' },
      { start_ms: 8650, text: '사람마다 급한 게 다를 겁니다.' },
      { start_ms: 11200, text: '누가 맞는지보다' },
      { start_ms: 13500, text: '누가 뭘 보고 움직이는지부터 보셔야 할 겁니다.' },
    ]),
  }),
  'e01_04_junho_signal/signal': Object.freeze({
    event_id: 'e01_04_junho_signal',
    node_id: 'signal',
    asset_id: 'ep01.audio.voice_junho_signal',
    duration_ms: 10607,
    gain: 1,
    duck_gain: 0.24,
    subtitles: Object.freeze([
      { start_ms: 250, text: '저… 말씀드릴 게 있는데,' },
      { start_ms: 3000, text: '아닐 수도 있습니다.' },
      { start_ms: 5000, text: '아까 덤프 지나간 뒤' },
      { start_ms: 7250, text: '경사로 쪽이 전이랑 조금 달라 보였습니다.' },
    ]),
  }),
  'e01_05_command/request_delay_result': Object.freeze({
    event_id: 'e01_05_command',
    node_id: 'request_delay_result',
    asset_id: 'ep01.audio.voice_lee_delay',
    duration_ms: 11207,
    gain: 1,
    duck_gain: 0.26,
    countdown_label: '07:00',
    subtitles: Object.freeze([
      { start_ms: 180, text: '7분.' },
      { start_ms: 1050, text: '그 이상은 어렵습니다.' },
      { start_ms: 2600, text: '기사한텐 제가 설명할게요.' },
      { start_ms: 5050, text: '대신 7분 뒤에는' },
      { start_ms: 7000, text: '왜 못 들어가는지가 아니라' },
      { start_ms: 8950, text: '들어가도 되는지 답을 주세요.' },
    ]),
  }),
  'e01_08o_record_pressure/oh': Object.freeze({
    event_id: 'e01_08o_record_pressure',
    node_id: 'oh',
    asset_id: 'ep01.audio.voice_oh_record_judgment',
    duration_ms: 14207,
    gain: 1,
    duck_gain: 0.22,
    subtitles: Object.freeze([
      { start_ms: 250, text: '지금 필요한 건' },
      { start_ms: 1950, text: '누가 잘못했는지 단정하는 문장이 아니라,' },
      { start_ms: 5400, text: '오늘 밤에도 설명 가능한' },
      { start_ms: 7550, text: '1차보고입니다.' },
      { start_ms: 9550, text: '너무 길면 늦고,' },
      { start_ms: 11750, text: '너무 짧으면' },
      { start_ms: 12950, text: '다시 물어옵니다.' },
    ]),
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
