import type { FlagMap } from '../domain';
import { episode01InspectionContext } from '../app/episode01-inspection-context';

export function EpisodeInspectionContext({ eventId, flags, t }: {
  readonly eventId: string | null | undefined;
  readonly flags: FlagMap | undefined;
  readonly t: (id: string) => string;
}) {
  const context = episode01InspectionContext(eventId, flags);
  if (!context) return null;
  return <section className="episode-inspection-context" aria-label={t(context.title_text_id)}>
    <header><span>{t(context.eyebrow_text_id)}</span><strong>{t(context.title_text_id)}</strong></header>
    <div role="list">
      {context.traces.map(trace => <article key={trace.title_text_id} role="listitem" data-tone={trace.tone}>
        <strong>{t(trace.title_text_id)}</strong>
        <p>{t(trace.body_text_id)}</p>
      </article>)}
    </div>
  </section>;
}
