export type Episode01Expression = 'neutral' | 'concern' | 'resolve' | 'relief' | 'conflict';
export type Episode01Pose =
  | 'observe'
  | 'inspect'
  | 'press'
  | 'listen'
  | 'hesitate'
  | 'verify'
  | 'brace'
  | 'withdraw'
  | 'reengage'
  | 'document';
export type Episode01PresenceMotion = 'enter' | 'hold' | 'withdraw' | 'reengage';

export interface Episode01CharacterPerformance {
  readonly expression: Episode01Expression;
  readonly pose: Episode01Pose;
  readonly motion: Episode01PresenceMotion;
}

type CharacterPerformancePatch = Partial<Episode01CharacterPerformance>;
type CharacterPatchMap = Readonly<Record<string, CharacterPerformancePatch>>;
type NodePatchMap = Readonly<Record<string, CharacterPatchMap>>;

function freeze<const T>(value: T): Readonly<T> {
  return Object.freeze(value);
}

const EVENT_BASE: Readonly<Record<string, CharacterPatchMap>> = freeze({
  e01_08b_inspection_find: freeze({
    player: { pose: 'observe' },
    seo_jeongmin: { pose: 'inspect', expression: 'neutral' },
    lee_jaehoon: { pose: 'document', expression: 'concern' },
  }),
  e01_08c_site_pushback: freeze({
    player: { pose: 'brace', expression: 'resolve' },
    lee_jaehoon: { pose: 'press', expression: 'conflict' },
    seo_jeongmin: { pose: 'observe', expression: 'concern' },
  }),
  e01_08d_reinspection: freeze({
    player: { pose: 'observe' },
    seo_jeongmin: { pose: 'verify', expression: 'neutral' },
    lee_jaehoon: { pose: 'document', expression: 'concern' },
  }),
  e01_08i_restart_pressure: freeze({
    player: { pose: 'verify', expression: 'concern' },
    lee_jaehoon: { pose: 'press', expression: 'concern' },
    kang_taesik: { pose: 'brace', expression: 'conflict' },
    lim_junho: { pose: 'hesitate', expression: 'concern' },
  }),
  e01_08j_restart_return: freeze({
    player: { pose: 'observe', expression: 'concern' },
    lee_jaehoon: { pose: 'brace', expression: 'concern' },
    kang_taesik: { pose: 'listen', expression: 'neutral' },
    lim_junho: { pose: 'hesitate', expression: 'concern' },
  }),
  e01_08k_stopwork_aftershock: freeze({
    player: { pose: 'listen', expression: 'concern' },
    kang_taesik: { pose: 'brace', expression: 'conflict' },
    lee_jaehoon: { pose: 'press', expression: 'concern' },
    lim_junho: { pose: 'hesitate', expression: 'concern' },
  }),
  e01_08l_stopwork_return: freeze({
    player: { pose: 'listen', expression: 'neutral' },
    kang_taesik: { pose: 'listen', expression: 'neutral' },
    lim_junho: { pose: 'hesitate', expression: 'concern' },
  }),
  e01_08e_responsibility_clash: freeze({
    player: { pose: 'document', expression: 'concern' },
    oh_seungjae: { pose: 'press', expression: 'concern' },
    lee_jaehoon: { pose: 'brace', expression: 'concern' },
    kang_taesik: { pose: 'brace', expression: 'conflict' },
  }),
  e01_08f_report_return: freeze({
    oh_seungjae: { pose: 'listen', expression: 'neutral' },
    lee_jaehoon: { pose: 'document', expression: 'concern' },
    kang_taesik: { pose: 'listen', expression: 'concern' },
    player: { pose: 'document', expression: 'neutral' },
  }),
  e01_08m_instruction_cascade: freeze({
    player: { pose: 'observe', expression: 'concern' },
    lee_jaehoon: { pose: 'press', expression: 'concern' },
    kang_taesik: { pose: 'press', expression: 'conflict' },
    lim_junho: { pose: 'hesitate', expression: 'concern' },
  }),
  e01_08n_instruction_return: freeze({
    lee_jaehoon: { pose: 'document', expression: 'concern' },
    kang_taesik: { pose: 'listen', expression: 'concern' },
    lim_junho: { pose: 'hesitate', expression: 'concern' },
    player: { pose: 'document', expression: 'neutral' },
  }),
  e01_08o_record_pressure: freeze({
    player: { pose: 'document', expression: 'concern' },
    oh_seungjae: { pose: 'press', expression: 'concern' },
    lee_jaehoon: { pose: 'document', expression: 'concern' },
    kang_taesik: { pose: 'brace', expression: 'conflict' },
  }),
  e01_08p_record_return: freeze({
    oh_seungjae: { pose: 'listen', expression: 'neutral' },
    lee_jaehoon: { pose: 'document', expression: 'concern' },
    kang_taesik: { pose: 'listen', expression: 'concern' },
    player: { pose: 'document', expression: 'neutral' },
  }),
  e01_10_next_day_tease: freeze({
    player: { pose: 'reengage', expression: 'neutral', motion: 'enter' },
  }),
});

const NODE_PATCHES: Readonly<Record<string, NodePatchMap>> = freeze({
  e01_08b_inspection_find: freeze({
    inspection: freeze({
      seo_jeongmin: { pose: 'inspect', expression: 'neutral', motion: 'enter' },
    }),
    lee: freeze({
      lee_jaehoon: { pose: 'document', expression: 'concern', motion: 'reengage' },
    }),
    full_stop_result: freeze({
      player: { pose: 'verify', expression: 'resolve' },
      seo_jeongmin: { pose: 'verify', expression: 'resolve' },
      lee_jaehoon: { pose: 'listen', expression: 'concern', motion: 'withdraw' },
    }),
    quick_photo_result: freeze({
      player: { pose: 'document', expression: 'neutral' },
      seo_jeongmin: { pose: 'observe', expression: 'concern', motion: 'withdraw' },
      lee_jaehoon: { pose: 'reengage', expression: 'relief' },
    }),
    sequence_result: freeze({
      player: { pose: 'verify', expression: 'resolve' },
      seo_jeongmin: { pose: 'listen', expression: 'neutral' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
    }),
  }),
  e01_08c_site_pushback: freeze({
    full_stop: freeze({
      lee_jaehoon: { pose: 'press', expression: 'conflict', motion: 'reengage' },
    }),
    quick_photo: freeze({
      lee_jaehoon: { pose: 'press', expression: 'concern', motion: 'reengage' },
    }),
    sequence: freeze({
      lee_jaehoon: { pose: 'listen', expression: 'neutral', motion: 'reengage' },
    }),
  }),
  e01_08d_reinspection: freeze({
    full: freeze({
      seo_jeongmin: { pose: 'verify', expression: 'resolve' },
    }),
    reject: freeze({
      seo_jeongmin: { pose: 'inspect', expression: 'conflict' },
      lee_jaehoon: { pose: 'brace', expression: 'concern' },
    }),
    lee_rework: freeze({
      lee_jaehoon: { pose: 'document', expression: 'conflict', motion: 'reengage' },
      seo_jeongmin: { pose: 'observe', expression: 'neutral' },
    }),
    sequence: freeze({
      seo_jeongmin: { pose: 'verify', expression: 'resolve' },
      lee_jaehoon: { pose: 'listen', expression: 'relief' },
    }),
  }),
  e01_08i_restart_pressure: freeze({
    kang: freeze({
      kang_taesik: { pose: 'press', expression: 'conflict', motion: 'reengage' },
    }),
    lee: freeze({
      lee_jaehoon: { pose: 'press', expression: 'concern', motion: 'reengage' },
    }),
    junho: freeze({
      lim_junho: { pose: 'hesitate', expression: 'concern', motion: 'reengage' },
    }),
    follow_verbal_result: freeze({
      player: { pose: 'brace', expression: 'concern' },
      lee_jaehoon: { pose: 'reengage', expression: 'relief' },
      kang_taesik: { pose: 'reengage', expression: 'neutral' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    trace_instruction_result: freeze({
      player: { pose: 'document', expression: 'neutral' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'hesitate', expression: 'concern' },
    }),
    verify_controls_result: freeze({
      player: { pose: 'verify', expression: 'resolve' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'relief', motion: 'reengage' },
    }),
  }),
  e01_08j_restart_return: freeze({
    premature: freeze({
      player: { pose: 'brace', expression: 'conflict' },
      lee_jaehoon: { pose: 'press', expression: 'conflict' },
      kang_taesik: { pose: 'brace', expression: 'concern' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    distorted: freeze({
      player: { pose: 'document', expression: 'concern' },
      lee_jaehoon: { pose: 'brace', expression: 'concern' },
      kang_taesik: { pose: 'listen', expression: 'conflict' },
      lim_junho: { pose: 'hesitate', expression: 'concern' },
    }),
    controlled: freeze({
      player: { pose: 'verify', expression: 'resolve' },
      lee_jaehoon: { pose: 'listen', expression: 'relief' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'relief', motion: 'reengage' },
    }),
  }),
  e01_08k_stopwork_aftershock: freeze({
    kang: freeze({
      kang_taesik: { pose: 'brace', expression: 'conflict', motion: 'reengage' },
    }),
    junho: freeze({
      lim_junho: { pose: 'hesitate', expression: 'concern', motion: 'reengage' },
    }),
    lee: freeze({
      lee_jaehoon: { pose: 'press', expression: 'concern', motion: 'reengage' },
    }),
    ignore_social_result: freeze({
      player: { pose: 'brace', expression: 'concern' },
      kang_taesik: { pose: 'reengage', expression: 'relief' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    public_boundary_result: freeze({
      player: { pose: 'verify', expression: 'resolve' },
      kang_taesik: { pose: 'withdraw', expression: 'conflict', motion: 'withdraw' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'neutral', motion: 'reengage' },
    }),
    protect_process_result: freeze({
      player: { pose: 'listen', expression: 'resolve' },
      kang_taesik: { pose: 'listen', expression: 'concern' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'relief', motion: 'reengage' },
    }),
  }),
  e01_08l_stopwork_return: freeze({
    silenced: freeze({
      player: { pose: 'brace', expression: 'concern' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    cold: freeze({
      player: { pose: 'verify', expression: 'neutral' },
      kang_taesik: { pose: 'withdraw', expression: 'conflict', motion: 'withdraw' },
      lim_junho: { pose: 'listen', expression: 'concern' },
    }),
    route: freeze({
      player: { pose: 'listen', expression: 'resolve' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'relief', motion: 'reengage' },
    }),
  }),
  e01_08e_responsibility_clash: freeze({
    gc: freeze({
      oh_seungjae: { pose: 'press', expression: 'concern', motion: 'reengage' },
    }),
    lee: freeze({
      lee_jaehoon: { pose: 'document', expression: 'concern', motion: 'reengage' },
    }),
    kang: freeze({
      kang_taesik: { pose: 'press', expression: 'conflict', motion: 'reengage' },
    }),
    one_sided_result: freeze({
      player: { pose: 'document', expression: 'concern' },
      oh_seungjae: { pose: 'listen', expression: 'neutral' },
      lee_jaehoon: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
      kang_taesik: { pose: 'brace', expression: 'conflict' },
    }),
    defensive_result: freeze({
      player: { pose: 'brace', expression: 'conflict' },
      oh_seungjae: { pose: 'press', expression: 'conflict' },
      lee_jaehoon: { pose: 'brace', expression: 'conflict' },
      kang_taesik: { pose: 'press', expression: 'conflict' },
    }),
    timeline_result: freeze({
      player: { pose: 'document', expression: 'resolve' },
      oh_seungjae: { pose: 'listen', expression: 'neutral' },
      lee_jaehoon: { pose: 'document', expression: 'neutral' },
      kang_taesik: { pose: 'listen', expression: 'concern' },
    }),
  }),
  e01_08f_report_return: freeze({
    correction: freeze({
      player: { pose: 'verify', expression: 'neutral' },
      lee_jaehoon: { pose: 'document', expression: 'concern' },
    }),
    evidence: freeze({
      player: { pose: 'document', expression: 'resolve' },
      oh_seungjae: { pose: 'listen', expression: 'neutral' },
      lee_jaehoon: { pose: 'document', expression: 'relief' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
    }),
    timeline: freeze({
      player: { pose: 'document', expression: 'resolve' },
      oh_seungjae: { pose: 'listen', expression: 'neutral' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
    }),
  }),
  e01_08m_instruction_cascade: freeze({
    lee: freeze({
      lee_jaehoon: { pose: 'press', expression: 'concern', motion: 'reengage' },
    }),
    kang: freeze({
      kang_taesik: { pose: 'press', expression: 'conflict', motion: 'reengage' },
    }),
    junho: freeze({
      lim_junho: { pose: 'hesitate', expression: 'concern', motion: 'reengage' },
    }),
    accept_top_result: freeze({
      player: { pose: 'brace', expression: 'concern' },
      lee_jaehoon: { pose: 'listen', expression: 'relief' },
      kang_taesik: { pose: 'reengage', expression: 'neutral' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    blame_worker_result: freeze({
      player: { pose: 'brace', expression: 'conflict' },
      lee_jaehoon: { pose: 'press', expression: 'conflict' },
      kang_taesik: { pose: 'press', expression: 'conflict' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    reconstruct_result: freeze({
      player: { pose: 'document', expression: 'resolve' },
      lee_jaehoon: { pose: 'document', expression: 'concern' },
      kang_taesik: { pose: 'listen', expression: 'concern' },
      lim_junho: { pose: 'reengage', expression: 'relief', motion: 'reengage' },
    }),
  }),
  e01_08n_instruction_return: freeze({
    gap: freeze({
      player: { pose: 'document', expression: 'concern' },
      lee_jaehoon: { pose: 'brace', expression: 'concern' },
      kang_taesik: { pose: 'listen', expression: 'concern' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    chilled: freeze({
      player: { pose: 'brace', expression: 'concern' },
      lee_jaehoon: { pose: 'listen', expression: 'concern' },
      kang_taesik: { pose: 'withdraw', expression: 'conflict', motion: 'withdraw' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    reconstructed: freeze({
      player: { pose: 'document', expression: 'resolve' },
      lee_jaehoon: { pose: 'listen', expression: 'relief' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'relief', motion: 'reengage' },
    }),
  }),
  e01_08o_record_pressure: freeze({
    oh: freeze({
      oh_seungjae: { pose: 'press', expression: 'concern', motion: 'reengage' },
    }),
    lee: freeze({
      lee_jaehoon: { pose: 'document', expression: 'concern', motion: 'reengage' },
    }),
    kang: freeze({
      kang_taesik: { pose: 'brace', expression: 'conflict', motion: 'reengage' },
    }),
    summary_result: freeze({
      player: { pose: 'document', expression: 'neutral' },
      oh_seungjae: { pose: 'listen', expression: 'neutral' },
      lee_jaehoon: { pose: 'document', expression: 'concern' },
      kang_taesik: { pose: 'listen', expression: 'concern' },
    }),
    align_result: freeze({
      player: { pose: 'document', expression: 'neutral' },
      oh_seungjae: { pose: 'listen', expression: 'neutral' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
    }),
    timeline_result: freeze({
      player: { pose: 'document', expression: 'resolve' },
      oh_seungjae: { pose: 'listen', expression: 'neutral' },
      lee_jaehoon: { pose: 'document', expression: 'relief' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
    }),
  }),
  e01_08p_record_return: freeze({
    correction: freeze({
      player: { pose: 'document', expression: 'concern' },
      lee_jaehoon: { pose: 'document', expression: 'concern' },
    }),
    conflict: freeze({
      player: { pose: 'brace', expression: 'concern' },
      oh_seungjae: { pose: 'press', expression: 'conflict' },
      lee_jaehoon: { pose: 'brace', expression: 'conflict' },
      kang_taesik: { pose: 'press', expression: 'conflict' },
    }),
    preserved: freeze({
      player: { pose: 'document', expression: 'resolve' },
      oh_seungjae: { pose: 'listen', expression: 'neutral' },
      lee_jaehoon: { pose: 'document', expression: 'relief' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
    }),
  }),
});

const DEFAULT_PERFORMANCE: Episode01CharacterPerformance = freeze({
  expression: 'neutral',
  pose: 'observe',
  motion: 'hold',
});

export function episode01CharacterPerformance(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
  characterId: string,
  speakerId?: string | null,
  relationshipCue?: 'closer' | 'strained',
): Episode01CharacterPerformance | undefined {
  if (!eventId || !EVENT_BASE[eventId]?.[characterId]) return undefined;

  const eventPatch = EVENT_BASE[eventId]?.[characterId] ?? {};
  const nodePatch = nodeId ? NODE_PATCHES[eventId]?.[nodeId]?.[characterId] ?? {} : {};
  let expression = nodePatch.expression ?? eventPatch.expression ?? DEFAULT_PERFORMANCE.expression;
  let pose = nodePatch.pose ?? eventPatch.pose ?? DEFAULT_PERFORMANCE.pose;
  let motion = nodePatch.motion ?? eventPatch.motion ?? DEFAULT_PERFORMANCE.motion;

  if (speakerId === characterId && motion === 'hold') motion = 'reengage';
  if (relationshipCue === 'closer' && motion === 'hold') motion = 'reengage';
  if (relationshipCue === 'strained' && motion === 'hold') {
    motion = 'withdraw';
    if (expression === 'neutral' || expression === 'relief') expression = 'concern';
    if (pose === 'listen' || pose === 'observe') pose = 'withdraw';
  }

  return freeze({ expression, pose, motion });
}

export function episode01UsesCharacterPerformance(eventId: string | null | undefined): boolean {
  return Boolean(eventId && EVENT_BASE[eventId]);
}
