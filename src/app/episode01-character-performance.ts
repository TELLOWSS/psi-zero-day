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

const EVENT_BASE: Readonly<Record<string, CharacterPatchMap>> = Object.freeze({
  e01_08b_inspection_find: Object.freeze({
    player: { pose: 'observe' },
    seo_jeongmin: { pose: 'inspect', expression: 'neutral' },
    lee_jaehoon: { pose: 'document', expression: 'concern' },
  }),
  e01_08c_site_pushback: Object.freeze({
    player: { pose: 'brace', expression: 'concern' },
    lee_jaehoon: { pose: 'press', expression: 'conflict' },
    seo_jeongmin: { pose: 'observe', expression: 'neutral' },
  }),
  e01_08d_reinspection: Object.freeze({
    player: { pose: 'observe' },
    seo_jeongmin: { pose: 'verify', expression: 'neutral' },
    lee_jaehoon: { pose: 'document', expression: 'concern' },
  }),
  e01_08i_restart_pressure: Object.freeze({
    player: { pose: 'verify', expression: 'concern' },
    lee_jaehoon: { pose: 'press', expression: 'concern' },
    kang_taesik: { pose: 'brace', expression: 'conflict' },
    lim_junho: { pose: 'hesitate', expression: 'concern' },
  }),
  e01_08j_restart_return: Object.freeze({
    player: { pose: 'observe', expression: 'concern' },
    lee_jaehoon: { pose: 'brace', expression: 'concern' },
    kang_taesik: { pose: 'listen', expression: 'neutral' },
    lim_junho: { pose: 'hesitate', expression: 'concern' },
  }),
  e01_08k_stopwork_aftershock: Object.freeze({
    player: { pose: 'listen', expression: 'concern' },
    kang_taesik: { pose: 'brace', expression: 'conflict' },
    lee_jaehoon: { pose: 'press', expression: 'concern' },
    lim_junho: { pose: 'hesitate', expression: 'concern' },
  }),
  e01_08l_stopwork_return: Object.freeze({
    player: { pose: 'listen', expression: 'neutral' },
    kang_taesik: { pose: 'listen', expression: 'neutral' },
    lim_junho: { pose: 'hesitate', expression: 'concern' },
  }),
});

const NODE_PATCHES: Readonly<Record<string, NodePatchMap>> = Object.freeze({
  e01_08b_inspection_find: Object.freeze({
    inspection: Object.freeze({
      seo_jeongmin: { pose: 'inspect', expression: 'neutral', motion: 'enter' },
    }),
    lee: Object.freeze({
      lee_jaehoon: { pose: 'document', expression: 'concern', motion: 'reengage' },
    }),
    full_stop_result: Object.freeze({
      player: { pose: 'verify', expression: 'resolve' },
      seo_jeongmin: { pose: 'verify', expression: 'resolve' },
      lee_jaehoon: { pose: 'listen', expression: 'concern', motion: 'withdraw' },
    }),
    quick_photo_result: Object.freeze({
      player: { pose: 'document', expression: 'neutral' },
      seo_jeongmin: { pose: 'observe', expression: 'concern', motion: 'withdraw' },
      lee_jaehoon: { pose: 'reengage', expression: 'relief' },
    }),
    sequence_result: Object.freeze({
      player: { pose: 'verify', expression: 'resolve' },
      seo_jeongmin: { pose: 'listen', expression: 'neutral' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
    }),
  }),
  e01_08c_site_pushback: Object.freeze({
    full_stop: Object.freeze({
      lee_jaehoon: { pose: 'press', expression: 'conflict', motion: 'reengage' },
    }),
    quick_photo: Object.freeze({
      lee_jaehoon: { pose: 'press', expression: 'concern', motion: 'reengage' },
    }),
    sequence: Object.freeze({
      lee_jaehoon: { pose: 'listen', expression: 'neutral', motion: 'reengage' },
    }),
  }),
  e01_08d_reinspection: Object.freeze({
    full: Object.freeze({
      seo_jeongmin: { pose: 'verify', expression: 'resolve' },
    }),
    reject: Object.freeze({
      seo_jeongmin: { pose: 'inspect', expression: 'conflict' },
      lee_jaehoon: { pose: 'brace', expression: 'concern' },
    }),
    lee_rework: Object.freeze({
      lee_jaehoon: { pose: 'document', expression: 'conflict', motion: 'reengage' },
      seo_jeongmin: { pose: 'observe', expression: 'neutral' },
    }),
    sequence: Object.freeze({
      seo_jeongmin: { pose: 'verify', expression: 'resolve' },
      lee_jaehoon: { pose: 'listen', expression: 'relief' },
    }),
  }),
  e01_08i_restart_pressure: Object.freeze({
    kang: Object.freeze({
      kang_taesik: { pose: 'press', expression: 'conflict', motion: 'reengage' },
    }),
    lee: Object.freeze({
      lee_jaehoon: { pose: 'press', expression: 'concern', motion: 'reengage' },
    }),
    junho: Object.freeze({
      lim_junho: { pose: 'hesitate', expression: 'concern', motion: 'reengage' },
    }),
    follow_verbal_result: Object.freeze({
      player: { pose: 'brace', expression: 'concern' },
      lee_jaehoon: { pose: 'reengage', expression: 'relief' },
      kang_taesik: { pose: 'reengage', expression: 'neutral' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    trace_instruction_result: Object.freeze({
      player: { pose: 'document', expression: 'neutral' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'hesitate', expression: 'concern' },
    }),
    verify_controls_result: Object.freeze({
      player: { pose: 'verify', expression: 'resolve' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'relief', motion: 'reengage' },
    }),
  }),
  e01_08j_restart_return: Object.freeze({
    premature: Object.freeze({
      player: { pose: 'brace', expression: 'conflict' },
      lee_jaehoon: { pose: 'press', expression: 'conflict' },
      kang_taesik: { pose: 'brace', expression: 'concern' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    distorted: Object.freeze({
      player: { pose: 'document', expression: 'concern' },
      lee_jaehoon: { pose: 'brace', expression: 'concern' },
      kang_taesik: { pose: 'listen', expression: 'conflict' },
      lim_junho: { pose: 'hesitate', expression: 'concern' },
    }),
    controlled: Object.freeze({
      player: { pose: 'verify', expression: 'resolve' },
      lee_jaehoon: { pose: 'listen', expression: 'relief' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'relief', motion: 'reengage' },
    }),
  }),
  e01_08k_stopwork_aftershock: Object.freeze({
    kang: Object.freeze({
      kang_taesik: { pose: 'brace', expression: 'conflict', motion: 'reengage' },
    }),
    junho: Object.freeze({
      lim_junho: { pose: 'hesitate', expression: 'concern', motion: 'reengage' },
    }),
    lee: Object.freeze({
      lee_jaehoon: { pose: 'press', expression: 'concern', motion: 'reengage' },
    }),
    ignore_social_result: Object.freeze({
      player: { pose: 'brace', expression: 'concern' },
      kang_taesik: { pose: 'reengage', expression: 'relief' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    public_boundary_result: Object.freeze({
      player: { pose: 'verify', expression: 'resolve' },
      kang_taesik: { pose: 'withdraw', expression: 'conflict', motion: 'withdraw' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'neutral', motion: 'reengage' },
    }),
    protect_process_result: Object.freeze({
      player: { pose: 'listen', expression: 'resolve' },
      kang_taesik: { pose: 'listen', expression: 'concern' },
      lee_jaehoon: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'relief', motion: 'reengage' },
    }),
  }),
  e01_08l_stopwork_return: Object.freeze({
    silenced: Object.freeze({
      player: { pose: 'brace', expression: 'concern' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'withdraw', expression: 'concern', motion: 'withdraw' },
    }),
    cold: Object.freeze({
      player: { pose: 'verify', expression: 'neutral' },
      kang_taesik: { pose: 'withdraw', expression: 'conflict', motion: 'withdraw' },
      lim_junho: { pose: 'listen', expression: 'concern' },
    }),
    route: Object.freeze({
      player: { pose: 'listen', expression: 'resolve' },
      kang_taesik: { pose: 'listen', expression: 'neutral' },
      lim_junho: { pose: 'reengage', expression: 'relief', motion: 'reengage' },
    }),
  }),
});

const DEFAULT_PERFORMANCE: Episode01CharacterPerformance = Object.freeze({
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

  return Object.freeze({ expression, pose, motion });
}

export function episode01UsesCharacterPerformance(eventId: string | null | undefined): boolean {
  return Boolean(eventId && EVENT_BASE[eventId]);
}
