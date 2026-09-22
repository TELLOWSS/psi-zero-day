import { useState } from 'react';
import type { DefensePersistenceController } from '../app/use-defense-persistence';
import { defenseText as t } from '../app/defense-text';

function RecordSummary({ controller }: { readonly controller: DefensePersistenceController }) {
  const record = controller.document.records[0];
  if (!record) return null;
  return <section className="zb-save-record" aria-label={t('defense.save.record')}>
    <strong>{t('defense.save.record')}</strong>
    <dl>
      <div><dt>{t('defense.save.best_stars')}</dt><dd>{record.bestStars} / 3</dd></div>
      <div><dt>{t('defense.save.best_score')}</dt><dd>{record.bestScore.toLocaleString()}</dd></div>
      <div><dt>{t('defense.save.clears')}</dt><dd>{record.clears}</dd></div>
    </dl>
  </section>;
}

export function DefensePersistenceGate({ controller }: { readonly controller: DefensePersistenceController }) {
  const [confirming, setConfirming] = useState(false);
  const { entry } = controller;

  if (entry.kind === 'loading') return <main className="zb-shell zb-save-gate" data-defense-screen="save-loading">
    <section><span className="zb-save-spinner" aria-hidden="true" /><h1>{t('defense.save.loading')}</h1></section>
  </main>;

  const exit = () => { void controller.exitToMain(); };
  const replace = () => { void controller.discardSavedRun().then(ok => { if (ok) setConfirming(false); }); };

  if (entry.kind === 'blocked') return <main className="zb-shell zb-save-gate" data-defense-screen="save-blocked">
    <section>
      <small>ZERO BREACH</small>
      <h1>{t('defense.save.blocked.title')}</h1>
      <p>{t('defense.save.blocked.body')}</p>
      <div className="zb-save-actions">
        <button type="button" onClick={() => window.location.reload()}>{t('defense.save.reload')}</button>
        <button type="button" onClick={exit}>{t('defense.ui.exit')}</button>
      </div>
    </section>
  </main>;

  if (entry.kind === 'storage-error') return <main className="zb-shell zb-save-gate" data-defense-screen="save-storage-error">
    <section>
      <small>ZERO BREACH</small>
      <h1>{t('defense.save.storage.title')}</h1>
      <p>{t('defense.save.storage.body')}</p>
      <div className="zb-save-actions"><button type="button" onClick={exit}>{t('defense.ui.exit')}</button></div>
    </section>
  </main>;

  if (entry.kind === 'corrupt') return <main className="zb-shell zb-save-gate" data-defense-screen="save-corrupt">
    <section>
      <small>ZERO BREACH</small>
      <h1>{t('defense.save.corrupt.title')}</h1>
      <p>{t('defense.save.corrupt.body')}</p>
      <div className="zb-save-actions">
        <button type="button" className="is-primary" onClick={() => setConfirming(true)}>{t('defense.save.new.action')}</button>
        <button type="button" onClick={exit}>{t('defense.ui.exit')}</button>
      </div>
      {controller.saveStatus === 'error' ? <p className="zb-save-error" role="alert">{t('defense.save.status.error')} · {controller.saveError}</p> : null}
    </section>
    {confirming ? <ConfirmNewStart onCancel={() => setConfirming(false)} onConfirm={replace} /> : null}
  </main>;

  if (entry.kind === 'version-mismatch') return <main className="zb-shell zb-save-gate" data-defense-screen="save-version-mismatch">
    <section>
      <small>ZERO BREACH</small>
      <h1>{t('defense.save.version.title')}</h1>
      <p>{t('defense.save.version.body')}</p>
      <dl className="zb-save-version">
        <div><dt>{t('defense.save.rules')}</dt><dd>{entry.savedRulesVersion}</dd></div>
        <div><dt>{t('defense.save.content')}</dt><dd>{entry.savedContentVersion}</dd></div>
      </dl>
      <RecordSummary controller={controller} />
      <div className="zb-save-actions">
        <button type="button" className="is-primary" onClick={() => setConfirming(true)}>{t('defense.save.new.action')}</button>
        <button type="button" onClick={exit}>{t('defense.ui.exit')}</button>
      </div>
      {controller.saveStatus === 'error' ? <p className="zb-save-error" role="alert">{t('defense.save.status.error')} · {controller.saveError}</p> : null}
    </section>
    {confirming ? <ConfirmNewStart onCancel={() => setConfirming(false)} onConfirm={replace} /> : null}
  </main>;

  if (entry.kind === 'resume') return <main className="zb-shell zb-save-gate" data-defense-screen="save-resume">
    <section>
      <small>ZERO BREACH</small>
      <h1>{t('defense.save.resume.title')}</h1>
      <p>{t('defense.save.resume.body')}</p>
      <dl className="zb-save-version">
        <div><dt>{t('defense.save.wave')}</dt><dd>{entry.run.waveId} / 10</dd></div>
        <div><dt>{t('defense.save.shield')}</dt><dd>{entry.run.shield}</dd></div>
      </dl>
      <RecordSummary controller={controller} />
      <div className="zb-save-actions">
        <button type="button" className="is-primary" onClick={controller.resumeSavedRun}>{t('defense.save.resume.action')}</button>
        <button type="button" onClick={() => setConfirming(true)}>{t('defense.save.new.action')}</button>
        <button type="button" onClick={exit}>{t('defense.ui.exit')}</button>
      </div>
      <small className="zb-save-time">{t('defense.save.saved_at')} · {new Date(entry.savedAt).toLocaleString('ko-KR')}</small>
    </section>
    {confirming ? <ConfirmNewStart onCancel={() => setConfirming(false)} onConfirm={replace} /> : null}
  </main>;

  return null;
}

function ConfirmNewStart({ onCancel, onConfirm }: { readonly onCancel: () => void; readonly onConfirm: () => void }) {
  return <div className="zb-save-confirm-backdrop" role="presentation" onMouseDown={onCancel}>
    <section className="zb-save-confirm" role="dialog" aria-modal="true" aria-labelledby="zb-save-confirm-title" onMouseDown={event => event.stopPropagation()}>
      <small>ZERO BREACH</small>
      <h2 id="zb-save-confirm-title">{t('defense.save.new.confirm.title')}</h2>
      <p>{t('defense.save.new.confirm.body')}</p>
      <div>
        <button type="button" onClick={onCancel}>{t('defense.save.cancel')}</button>
        <button type="button" className="is-danger" onClick={onConfirm}>{t('defense.save.confirm')}</button>
      </div>
    </section>
  </div>;
}

export function DefenseConflictOverlay({ controller }: { readonly controller: DefensePersistenceController }) {
  if (!controller.conflict) return null;
  return <section className="zb-result zb-conflict" role="dialog" aria-modal="true" aria-labelledby="zb-conflict-title">
    <div>
      <small>ZERO BREACH</small>
      <h2 id="zb-conflict-title">{t('defense.save.conflict.title')}</h2>
      <p>{t('defense.save.conflict.body')}</p>
      <div className="zb-result-actions">
        <button type="button" onClick={() => { void controller.reloadAfterConflict(); }}>{t('defense.save.conflict.reload')}</button>
        <button type="button" onClick={() => { void controller.exitToMain(); }}>{t('defense.ui.exit')}</button>
      </div>
    </div>
  </section>;
}

export function DefenseSaveStatus({ controller }: { readonly controller: DefensePersistenceController }) {
  const label = controller.saveStatus === 'saving'
    ? t('defense.save.status.saving')
    : controller.saveStatus === 'error'
      ? t('defense.save.status.error')
      : controller.saveStatus === 'saved'
        ? t('defense.save.status.saved')
        : '';
  if (!label) return null;
  return <div className="zb-save-status" data-save-status={controller.saveStatus}>
    <span>{label}</span>
    {controller.saveStatus === 'error'
      ? <button type="button" onClick={() => { void controller.retrySave(); }}>{t('defense.save.retry')}</button>
      : null}
  </div>;
}
