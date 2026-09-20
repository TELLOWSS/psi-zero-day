import type { FlagMap } from '../domain';

export interface EpisodeMontageBeat {
  readonly time: string;
  readonly title_text_id: string;
  readonly body_text_id: string;
  readonly tone: 'work' | 'memory' | 'transition';
}

export interface EpisodeMontage {
  readonly title_text_id: string;
  readonly beats: readonly EpisodeMontageBeat[];
}

const outcomeBeat = (flags: FlagMap): EpisodeMontageBeat => {
  switch (flags.pump_result) {
    case 'BEST_CONTROL':
      return { time: '09:54', title_text_id: 'ui.montage.ep01.outcome.control.title', body_text_id: 'ui.montage.ep01.outcome.control.body', tone: 'memory' };
    case 'NEAR_MISS':
      return { time: '09:54', title_text_id: 'ui.montage.ep01.outcome.near_miss.title', body_text_id: 'ui.montage.ep01.outcome.near_miss.body', tone: 'memory' };
    case 'RELATION_CONFLICT':
      return { time: '09:54', title_text_id: 'ui.montage.ep01.outcome.relation.title', body_text_id: 'ui.montage.ep01.outcome.relation.body', tone: 'memory' };
    case 'CONTROLLED_DELAY':
    default:
      return { time: '09:54', title_text_id: 'ui.montage.ep01.outcome.delay.title', body_text_id: 'ui.montage.ep01.outcome.delay.body', tone: 'memory' };
  }
};

export function episode01Montage(eventId: string | null | undefined, flags: FlagMap | undefined): EpisodeMontage | undefined {
  if (eventId !== 'e01_08_reactions' || !flags) return undefined;
  const beats: readonly EpisodeMontageBeat[] = Object.freeze([
    { time: '09:48', title_text_id: 'ui.montage.ep01.pour.title', body_text_id: 'ui.montage.ep01.pour.body', tone: 'work' },
    outcomeBeat(flags),
    { time: '09:59', title_text_id: 'ui.montage.ep01.cleanup.title', body_text_id: 'ui.montage.ep01.cleanup.body', tone: 'transition' },
  ]);
  return Object.freeze({
    title_text_id: 'ui.montage.ep01.title',
    beats,
  });
}
