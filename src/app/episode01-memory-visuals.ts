import type { GameState } from '../domain';
import { episode01CarryoverKey, type Episode01CarryoverKey } from './episode01-day-carryover';

export type Episode01MemoryVisualKey = 'branch' | 'field' | 'people' | 'record';

export interface Episode01MemoryVisualFrame {
  readonly key: Episode01MemoryVisualKey;
  readonly asset_id: string;
  readonly fallback_uri: string;
  readonly primary: boolean;
}

export interface Episode01MemoryVisualPlan {
  readonly phase: 'evening' | 'next-day';
  readonly carryover_key: Episode01CarryoverKey;
  readonly frames: readonly Episode01MemoryVisualFrame[];
}

const FRAME = Object.freeze({
  branch: Object.freeze({
    key: 'branch' as const,
    asset_id: 'ep01.scene_bg.ramp_entry',
    fallback_uri: 'assets/episode01/cg/ramp-entry-rc.svg',
  }),
  fieldInspection: Object.freeze({
    key: 'field' as const,
    asset_id: 'ep01.scene_bg.inspection_zone',
    fallback_uri: 'assets/episode01/cg/inspection-zone-rc.svg',
  }),
  fieldPour: Object.freeze({
    key: 'field' as const,
    asset_id: 'ep01.scene_bg.concrete_pour',
    fallback_uri: 'assets/episode01/cg/concrete-pour-rc.svg',
  }),
  peopleYard: Object.freeze({
    key: 'people' as const,
    asset_id: 'ep01.scene_bg.work_yard',
    fallback_uri: 'assets/episode01/cg/work-yard-rc.svg',
  }),
  peopleBreak: Object.freeze({
    key: 'people' as const,
    asset_id: 'ep01.scene_bg.break_area',
    fallback_uri: 'assets/episode01/cg/break-area-rc.svg',
  }),
  record: Object.freeze({
    key: 'record' as const,
    asset_id: 'ep01.scene_bg.site_office',
    fallback_uri: 'assets/episode01/cg/site-office-rc.svg',
  }),
});

function fieldFrame(state: GameState) {
  return state.flags.inspection_result ? FRAME.fieldInspection : FRAME.fieldPour;
}

function peopleFrame(state: GameState) {
  return state.flags.stopwork_culture_result ? FRAME.peopleBreak : FRAME.peopleYard;
}

function primaryKeyFor(carryover: Episode01CarryoverKey): Episode01MemoryVisualKey {
  if (carryover === 'record') return 'record';
  if (carryover === 'people' || carryover === 'instruction') return 'people';
  return 'field';
}

export function episode01MemoryVisualPlan(
  state: GameState | null,
  activeEventId: string | null,
): Episode01MemoryVisualPlan | undefined {
  if (!state || (activeEventId !== 'e01_09_evening' && activeEventId !== 'e01_10_next_day_tease')) return undefined;

  const carryover = episode01CarryoverKey(state.flags);
  const phase = activeEventId === 'e01_10_next_day_tease' ? 'next-day' : 'evening';
  const primaryKey = phase === 'next-day' ? primaryKeyFor(carryover) : undefined;

  const frames = [FRAME.branch, fieldFrame(state), peopleFrame(state), FRAME.record]
    .map(frame => Object.freeze({
      ...frame,
      primary: primaryKey === frame.key,
    }));

  return Object.freeze({
    phase,
    carryover_key: carryover,
    frames: Object.freeze(frames),
  });
}
