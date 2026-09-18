import type { FlagMap } from '../domain';
import { episode01Montage } from '../app/episode01-montage';

export function EpisodeTimeMontage({ eventId, flags, t }: {
  readonly eventId: string | null | undefined;
  readonly flags: FlagMap | undefined;
  readonly t: (id: string) => string;
}) {
  const montage = episode01Montage(eventId, flags);
  if (!montage) return null;
  return <section className="episode-time-montage" aria-label={t(montage.title_text_id)}>
    <header><span>TIME FLOW</span><strong>{t(montage.title_text_id)}</strong></header>
    <div role="list">
      {montage.beats.map(beat => <article key={beat.time} role="listitem" data-tone={beat.tone}>
        <time>{beat.time}</time>
        <div><strong>{t(beat.title_text_id)}</strong><p>{t(beat.body_text_id)}</p></div>
      </article>)}
    </div>
  </section>;
}
