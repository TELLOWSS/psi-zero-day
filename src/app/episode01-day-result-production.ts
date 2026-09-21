import type { FlagMap } from '../domain';
import { episode01CarryoverKey, episode01DayCarryover, type DayCarryoverCard, type Episode01CarryoverKey } from './episode01-day-carryover';

export type Episode01DayResultPhase = 'day-reflection' | 'choice-afterglow';
export type Episode01DayResultCameraProfile = 'sunset-memory-wide' | 'personal-settle-wide';
export type Episode01DayResultDepthProfile = 'memory-tableau' | 'future-threshold';
export type Episode01DayResultLightingProfile = 'home-night-warm' | 'night-to-dawn';
export type Episode01DayResultUiProfile = 'reflect' | 'afterglow';
export type Episode01DayResultLaneKind = 'result' | 'people' | 'memory' | 'tomorrow';

export interface Episode01DayResultLane {
  readonly kind: Episode01DayResultLaneKind;
  readonly label_text_id: string;
  readonly title_text_id: string;
  readonly body_text_id: string;
}

export interface Episode01DayResultProduction {
  readonly phase: Episode01DayResultPhase;
  readonly camera_profile: Episode01DayResultCameraProfile;
  readonly depth_profile: Episode01DayResultDepthProfile;
  readonly lighting_profile: Episode01DayResultLightingProfile;
  readonly ui_profile: Episode01DayResultUiProfile;
  readonly carryover_key: Episode01CarryoverKey;
  readonly eyebrow_text_id: string;
  readonly title_text_id: string;
  readonly lanes: readonly Episode01DayResultLane[];
}

function firstCard(cards: readonly DayCarryoverCard[], tone: DayCarryoverCard['tone']) {
  return cards.find(card => card.tone === tone);
}

function outcomeCard(cards: readonly DayCarryoverCard[], carryover: Episode01CarryoverKey) {
  if (carryover === 'people') return firstCard(cards, 'people');
  if (carryover === 'instruction') return firstCard(cards, 'instruction');
  if (carryover === 'record') return firstCard(cards, 'record');
  return firstCard(cards, 'record') ?? firstCard(cards, 'instruction') ?? firstCard(cards, 'people');
}

function lane(kind: Episode01DayResultLaneKind, card: DayCarryoverCard | undefined): Episode01DayResultLane | undefined {
  if (!card) return undefined;
  return Object.freeze({
    kind,
    label_text_id: `ui.day_result.lane.${kind}`,
    title_text_id: card.title_text_id,
    body_text_id: card.body_text_id,
  });
}

/**
 * Phase C-6 DAY RESULT production direction.
 *
 * No grade, rank or score is introduced here. The scene reads the existing run
 * state as four connected residues:
 * day result -> people change -> remembered choice -> tomorrow's first signal.
 * Phase B event/choice topology and all gameplay effects remain untouched.
 */
export function episode01DayResultProduction(
  eventId: string | null | undefined,
  nodeId: string | null | undefined,
  flags: FlagMap | undefined,
): Episode01DayResultProduction | undefined {
  if (eventId !== 'e01_09_evening' || !flags) return undefined;

  const evening = episode01DayCarryover('e01_09_evening', flags);
  const tomorrow = episode01DayCarryover('e01_10_next_day_tease', flags);
  if (!evening || !tomorrow) return undefined;

  const carryover = episode01CarryoverKey(flags);
  const result = outcomeCard(evening.cards, carryover);
  const people = firstCard(evening.cards, 'people') ?? result;
  const memory = firstCard(evening.cards, 'recovery');
  const first = firstCard(tomorrow.cards, 'first');
  const lanes = [
    lane('result', result),
    lane('people', people),
    lane('memory', memory),
    lane('tomorrow', first),
  ].filter((item): item is Episode01DayResultLane => Boolean(item));

  const settled = nodeId !== null && nodeId !== undefined && nodeId !== 'evening';

  return Object.freeze({
    phase: settled ? 'choice-afterglow' : 'day-reflection',
    camera_profile: settled ? 'personal-settle-wide' : 'sunset-memory-wide',
    depth_profile: settled ? 'future-threshold' : 'memory-tableau',
    lighting_profile: settled ? 'night-to-dawn' : 'home-night-warm',
    ui_profile: settled ? 'afterglow' : 'reflect',
    carryover_key: carryover,
    eyebrow_text_id: 'ui.day_result.production.eyebrow',
    title_text_id: 'ui.day_result.production.title',
    lanes: Object.freeze(lanes),
  });
}
