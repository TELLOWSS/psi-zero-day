import type { FlagMap } from '../domain';
import { episode01InstructionRealityChain } from '../app/episode01-instruction-reality-chain';

export function EpisodeInstructionRealityChain({ eventId, flags, t }: {
  readonly eventId: string | null | undefined;
  readonly flags: FlagMap | undefined;
  readonly t: (id: string) => string;
}) {
  const model = episode01InstructionRealityChain(eventId, flags);
  if (!model) return null;
  return <section className="episode-instruction-reality-chain" data-phase={model.phase} data-doctrine={model.doctrine_id} aria-label={t(model.title_text_id)}>
    <header>
      <span>{t('ui.field_reality_doctrine.badge')} · {t(model.eyebrow_text_id)}</span>
      <strong>{t(model.title_text_id)}</strong>
    </header>
    <ol className="instruction-reality-timeline">
      {model.stages.map(stage => <li key={stage.time} data-state={stage.state}>
        <time>{stage.time}</time><span>{t(stage.label_text_id)}</span>
      </li>)}
    </ol>
    <div className="instruction-reality-cards">
      {model.cards.map(card => <article key={card.title_text_id} data-tone={card.tone}>
        <strong>{t(card.title_text_id)}</strong>
        <p>{t(card.body_text_id)}</p>
      </article>)}
    </div>
  </section>;
}
