import { useEffect } from 'react';
import { VisualImage } from './VisualSlot';

export function EpisodeColdOpen({
  backgroundUri,
  playerUri,
  kangUri,
  junhoUri,
  t,
  onComplete,
}: {
  readonly backgroundUri?: string;
  readonly playerUri?: string;
  readonly kangUri?: string;
  readonly junhoUri?: string;
  readonly t: (id: string) => string;
  readonly onComplete: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 6200);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return <section className="episode-cold-open" role="dialog" aria-modal="true" aria-label={t('story.ep01.prologue.title')}>
    <VisualImage uri={backgroundUri} alt="" className="episode-cold-open-bg" />
    <div className="episode-cold-open-grade" aria-hidden="true" />
    <div className="episode-cold-open-cast" aria-hidden="true">
      <VisualImage uri={kangUri} alt="" className="episode-cold-open-kang" />
      <VisualImage uri={junhoUri} alt="" className="episode-cold-open-junho" />
      <VisualImage uri={playerUri} alt="" className="episode-cold-open-player" />
    </div>
    <div className="episode-cold-open-copy">
      <span>{t('story.ep01.prologue.kicker')}</span>
      <strong>{t('story.ep01.prologue.title')}</strong>
      <p>{t('story.ep01.prologue.line')}</p>
    </div>
    <div className="episode-cold-open-rewind" aria-hidden="true">
      <i />
      <span>{t('story.ep01.prologue.rewind')}</span>
    </div>
    <button className="primary-button episode-cold-open-cta" type="button" onClick={onComplete}>
      {t('story.ep01.prologue.cta')}<span aria-hidden="true">→</span>
    </button>
  </section>;
}
