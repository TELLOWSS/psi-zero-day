import type { FlagMap } from '../domain';
import { episode01ReportChain } from '../app/episode01-report-chain';

export function EpisodeReportChain({ eventId, flags, t }: {
  readonly eventId: string | null | undefined;
  readonly flags: FlagMap | undefined;
  readonly t: (id: string) => string;
}) {
  const model = episode01ReportChain(eventId, flags);
  if (!model) return null;
  return <section className="episode-report-chain" data-phase={model.phase} aria-label={t(model.title_text_id)}>
    <header><span>{t(model.eyebrow_text_id)}</span><strong>{t(model.title_text_id)}</strong></header>
    <ol className="report-chain-timeline">
      {model.stages.map(stage => <li key={stage.time} data-state={stage.state}>
        <time>{stage.time}</time><span>{t(stage.label_text_id)}</span>
      </li>)}
    </ol>
    <div className="report-chain-cards">
      {model.cards.map(card => <article key={card.title_text_id} data-tone={card.tone}>
        <strong>{t(card.title_text_id)}</strong>
        <p>{t(card.body_text_id)}</p>
      </article>)}
    </div>
  </section>;
}
