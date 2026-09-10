import type { Translate } from '../localization/translator';

/** Static boot screen only. UI has no GameState reference or mutation path. */
export function FoundationScreen({ t }: { readonly t: Translate }) {
  return (
    <main className="landscape-frame" aria-labelledby="title">
      <div>
        <h1 id="title">{t('app.title')}</h1>
        <h2>{t('foundation.heading')}</h2>
        <p>{t('foundation.description')}</p>
      </div>
    </main>
  );
}
