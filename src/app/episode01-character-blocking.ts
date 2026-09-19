export type Episode01BlockingSide = 'far-left' | 'left' | 'center' | 'right' | 'far-right';
export type Episode01BlockingDepth = 'foreground' | 'midground' | 'background';

export interface Episode01CharacterBlocking {
  readonly side: Episode01BlockingSide;
  readonly depth: Episode01BlockingDepth;
}

type BlockingMap = Readonly<Record<string, Episode01CharacterBlocking>>;

const BLOCKING_BY_EVENT: Readonly<Record<string, BlockingMap>> = Object.freeze({
  e01_08b_inspection_find: Object.freeze({
    player: Object.freeze({ side: 'left', depth: 'midground' }),
    seo_jeongmin: Object.freeze({ side: 'center', depth: 'foreground' }),
    lee_jaehoon: Object.freeze({ side: 'far-right', depth: 'midground' }),
  }),
  e01_08c_site_pushback: Object.freeze({
    player: Object.freeze({ side: 'far-left', depth: 'background' }),
    lee_jaehoon: Object.freeze({ side: 'center', depth: 'foreground' }),
    seo_jeongmin: Object.freeze({ side: 'right', depth: 'midground' }),
  }),
  e01_08d_reinspection: Object.freeze({
    player: Object.freeze({ side: 'left', depth: 'midground' }),
    seo_jeongmin: Object.freeze({ side: 'center', depth: 'foreground' }),
    lee_jaehoon: Object.freeze({ side: 'right', depth: 'midground' }),
  }),
  e01_08i_restart_pressure: Object.freeze({
    player: Object.freeze({ side: 'far-left', depth: 'midground' }),
    lee_jaehoon: Object.freeze({ side: 'left', depth: 'foreground' }),
    kang_taesik: Object.freeze({ side: 'right', depth: 'foreground' }),
    lim_junho: Object.freeze({ side: 'far-right', depth: 'background' }),
  }),
  e01_08j_restart_return: Object.freeze({
    lee_jaehoon: Object.freeze({ side: 'far-left', depth: 'midground' }),
    kang_taesik: Object.freeze({ side: 'left', depth: 'midground' }),
    lim_junho: Object.freeze({ side: 'right', depth: 'background' }),
    player: Object.freeze({ side: 'far-right', depth: 'midground' }),
  }),
  e01_08k_stopwork_aftershock: Object.freeze({
    player: Object.freeze({ side: 'far-left', depth: 'midground' }),
    kang_taesik: Object.freeze({ side: 'left', depth: 'foreground' }),
    lee_jaehoon: Object.freeze({ side: 'right', depth: 'foreground' }),
    lim_junho: Object.freeze({ side: 'far-right', depth: 'background' }),
  }),
  e01_08l_stopwork_return: Object.freeze({
    player: Object.freeze({ side: 'left', depth: 'midground' }),
    kang_taesik: Object.freeze({ side: 'center', depth: 'foreground' }),
    lim_junho: Object.freeze({ side: 'right', depth: 'foreground' }),
  }),
});


const BLOCKING_BY_EVENT_NODE: Readonly<Record<string, Readonly<Record<string, BlockingMap>>>> = Object.freeze({
  e01_08j_restart_return: Object.freeze({
    premature: Object.freeze({
      lee_jaehoon: Object.freeze({ side: 'left', depth: 'foreground' }),
      kang_taesik: Object.freeze({ side: 'right', depth: 'midground' }),
      lim_junho: Object.freeze({ side: 'far-right', depth: 'background' }),
      player: Object.freeze({ side: 'far-left', depth: 'midground' }),
    }),
    distorted: Object.freeze({
      lee_jaehoon: Object.freeze({ side: 'far-left', depth: 'midground' }),
      kang_taesik: Object.freeze({ side: 'left', depth: 'foreground' }),
      lim_junho: Object.freeze({ side: 'far-right', depth: 'background' }),
      player: Object.freeze({ side: 'right', depth: 'foreground' }),
    }),
    controlled: Object.freeze({
      lee_jaehoon: Object.freeze({ side: 'far-left', depth: 'midground' }),
      kang_taesik: Object.freeze({ side: 'left', depth: 'midground' }),
      lim_junho: Object.freeze({ side: 'right', depth: 'foreground' }),
      player: Object.freeze({ side: 'far-right', depth: 'foreground' }),
    }),
  }),
  e01_08k_stopwork_aftershock: Object.freeze({
    ignore_social_result: Object.freeze({
      player: Object.freeze({ side: 'far-left', depth: 'background' }),
      kang_taesik: Object.freeze({ side: 'left', depth: 'foreground' }),
      lee_jaehoon: Object.freeze({ side: 'right', depth: 'midground' }),
      lim_junho: Object.freeze({ side: 'far-right', depth: 'background' }),
    }),
    public_boundary_result: Object.freeze({
      player: Object.freeze({ side: 'left', depth: 'foreground' }),
      kang_taesik: Object.freeze({ side: 'far-left', depth: 'background' }),
      lee_jaehoon: Object.freeze({ side: 'far-right', depth: 'midground' }),
      lim_junho: Object.freeze({ side: 'right', depth: 'foreground' }),
    }),
    protect_process_result: Object.freeze({
      player: Object.freeze({ side: 'left', depth: 'foreground' }),
      kang_taesik: Object.freeze({ side: 'far-left', depth: 'midground' }),
      lee_jaehoon: Object.freeze({ side: 'far-right', depth: 'midground' }),
      lim_junho: Object.freeze({ side: 'right', depth: 'foreground' }),
    }),
  }),
});

const SIDE_ORDER: readonly Episode01BlockingSide[] = ['far-left', 'left', 'center', 'right', 'far-right'];

function moveSide(side: Episode01BlockingSide, direction: 'in' | 'out'): Episode01BlockingSide {
  const index = SIDE_ORDER.indexOf(side);
  if (index < 0 || side === 'center') return side;
  const isLeft = index < 2;
  const delta = direction === 'in'
    ? (isLeft ? 1 : -1)
    : (isLeft ? -1 : 1);
  return SIDE_ORDER[Math.max(0, Math.min(SIDE_ORDER.length - 1, index + delta))]!;
}

export function episode01CharacterBlocking(
  eventId: string | null | undefined,
  characterId: string,
  speakerId?: string | null,
  relationshipCue?: 'closer' | 'strained',
  nodeId?: string | null,
): Episode01CharacterBlocking | undefined {
  if (!eventId) return undefined;
  const base = (nodeId ? BLOCKING_BY_EVENT_NODE[eventId]?.[nodeId]?.[characterId] : undefined)
    ?? BLOCKING_BY_EVENT[eventId]?.[characterId];
  if (!base) return undefined;

  let side = base.side;
  let depth = base.depth;

  if (relationshipCue === 'closer') {
    side = moveSide(side, 'in');
    if (depth === 'background') depth = 'midground';
  } else if (relationshipCue === 'strained') {
    side = moveSide(side, 'out');
    if (depth === 'foreground') depth = 'midground';
    else if (depth === 'midground') depth = 'background';
  }

  if (speakerId === characterId) depth = 'foreground';

  return Object.freeze({ side, depth });
}

export function episode01UsesCharacterBlocking(eventId: string | null | undefined): boolean {
  return Boolean(eventId && BLOCKING_BY_EVENT[eventId]);
}
