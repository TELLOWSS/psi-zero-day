import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import { projectCharacterGrowth } from '../app/character-growth';
import { projectStrategyActions } from '../app/strategy-actions';
import { characterPortraitUri, projectStrategyVisualAssets } from '../app/strategy-assets';
import { CharacterCard, SiteScene } from './VisualSlot';
import { PresentationView } from './PresentationView';
import { StrategyMapShell } from './StrategyMapShell';

const DebugPanel = import.meta.env.DEV ? lazy(() => import('./DebugPanel')) : null;

export function PlayableEpisode({ session }: { session: EpisodeSession }) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const [debugOpen, setDebugOpen] = useState(false);
  const focusRef = useRef<HTMLElement>(null);
  const t = session.t;
  const presentation = snapshot.presentation.find(p => 'node_id' in p);
  const person = snapshot.dialogue?.speaker_id ? session.character(snapshot.dialogue.speaker_id) : undefined;
  const portrait = snapshot.dialogue?.visual_reference;
  const clock = snapshot.state?.clock ?? { day: 1, slot: 'PRE_WORK' };
  const isPlaying = snapshot.phase === 'playing';
  const strategy = snapshot.strategy;
  const strategyActions = projectStrategyActions(strategy?.runtime.active_event_id ?? null, presentation);
  const visualAssets = strategy
    ? projectStrategyVisualAssets(strategy.placements.map(item => item.character_id), id => session.assetUri(id))
    : undefined;
  const strategyCopy = {
    brand: t('ui.brand'),
    day: t('ui.day'),
    stage: t('ui.strategy.stage'),
    psi: t('ui.strategy.psi'),
    objectives: t('ui.strategy.objectives'),
    assignments: t('ui.strategy.assignments'),
    roster: t('ui.strategy.roster'),
    site: t('ui.strategy.site'),
    events: t('ui.strategy.events'),
    progress: t('ui.strategy.progress'),
    pressures: t('ui.strategy.pressures'),
    focus: t('ui.strategy.focus'),
    focusHint: t('ui.strategy.focus_hint'),
    actions: t('ui.strategy.actions'),
    actionHint: t('ui.strategy.action_hint'),
  };

  useEffect(() => { if (snapshot.phase === 'playing') focusRef.current?.focus({ preventScroll: true }); }, [snapshot.revision, snapshot.phase]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], .debug-panel')) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.repeat) { if (e.key === 'Enter' || e.code === 'Space') e.preventDefault(); return; }
      if (snapshot.phase !== 'playing' || !presentation || !('node_id' in presentation)) return;
      if (presentation.type === 'SHOW_CHOICE' && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        const choice = presentation.choices[Number(e.key) - 1];
        if (choice?.enabled) session.dispatch({ type: 'choose_event', instance_id: presentation.instance_id,
          node_id: presentation.node_id, choice_id: choice.choice_id }, snapshot.revision);
      } else if (presentation.type !== 'SHOW_CHOICE' && (e.key === 'Enter' || e.code === 'Space')) {
        if (target?.closest('button') && !target.closest('.continue-button')) return;
        e.preventDefault();
        session.dispatch({ type: 'advance_event', instance_id: presentation.instance_id, node_id: presentation.node_id }, snapshot.revision);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, snapshot.revision, snapshot.phase, presentation]);

  const strategyActive = isPlaying && strategy !== null;
  const dialoguePortraitUri = portrait?.kind === 'asset'
    ? session.assetUri(portrait.id)
    : person ? characterPortraitUri(person.id, id => session.assetUri(id)) : undefined;
  const dialogueGrowth = person && snapshot.state ? projectCharacterGrowth(snapshot.state.flags, person.id) : undefined;

  return <main className={`game-frame phase-${snapshot.phase}${strategyActive ? ' strategy-active' : ''}${strategyActions.length ? ' strategy-action-active' : ''}`}>
    {strategyActive ? <StrategyMapShell
      view={strategy}
      copy={strategyCopy}
      text={t}
      person={id => session.character(id)}
      actions={strategyActions}
      visualAssets={visualAssets}
      onAction={action => session.dispatch({
        type: 'choose_event', instance_id: action.instance_id, node_id: action.node_id, choice_id: action.choice_id,
      }, snapshot.revision)}
    /> : <SiteScene chapter={snapshot.state?.event_runtime.chapter_id} />}
    {!strategyActive ? <header className="game-header">
      <div className="day-marker"><span>{t('ui.day')}</span><strong>{String(clock.day).padStart(2, '0')}</strong></div>
      <div className="time-marker"><span>{t(`ui.slot.${clock.slot.toLowerCase()}`)}</span><i /><span>{snapshot.chapterTitle}</span></div>
      <span className="header-episode">{t('ui.episode')}</span>
    </header> : null}
    {snapshot.phase === 'start' ? <section className="title-screen">
      <div className="title-copy"><span className="eyebrow">{t('ui.episode')} <i /> {t('ui.site')}</span>
        <h1>{t('ui.brand')}</h1><p className="tagline">{t('ui.tagline')}</p></div>
      <div className="start-block"><div><span className="eyebrow">{t('ui.day')} 01</span><h2>{t('ep01.title')}</h2><p>{t('ui.start_hint')}</p></div>
        <button className="primary-button" type="button" onClick={e => { if (e.detail < 2) session.start(snapshot.revision); }}>{t('ui.start')}<span aria-hidden="true">↗</span></button>
      </div>
    </section> : isPlaying ? <>
      <section className="scene-heading"><span className="eyebrow">{t('ui.scene')}</span><h1>{snapshot.eventTitle}</h1></section>
      <section className="play-panel" ref={focusRef} tabIndex={-1} aria-label={t('ui.dialogue')}>
        {person ? <CharacterCard person={person} portraitUri={dialoguePortraitUri} growth={dialogueGrowth} /> : <aside className="narrator-card"><span className="narrator-mark" aria-hidden="true">01</span><strong>{t('ui.record')}</strong><span>{t('ep01.title')}</span></aside>}
        <div className="presentation-area" aria-live="polite" key={snapshot.revision}>
          {snapshot.relationshipFeedback.length ? <div className="relationship-feedback" role="status" aria-label={t('ui.relationship_change')}>
            {snapshot.relationshipFeedback.map(({ npc_id, delta }) => <span key={delta.source.effect_instance_id}>
              <strong>{session.character(npc_id)?.name}</strong> {t(`ui.relationship.${delta.field}`)}
              <b className={delta.applied_delta > 0 ? 'delta-positive' : 'delta-negative'}>{delta.applied_delta > 0 ? '+' : ''}{delta.applied_delta}</b>
            </span>)}
          </div> : null}
          <PresentationView
            commands={snapshot.presentation}
            t={t}
            send={command => { session.dispatch(command, snapshot.revision); }}
            assetUri={id => session.assetUri(id)}
            choiceFallback={strategyActions.length > 0}
          />
        </div>
      </section>
    </> : snapshot.phase === 'complete' ? <section className="complete-screen">
      <span className="completion-rule" /><p className="eyebrow">{t('ui.complete')}</p><h1>{t('ep01.title')}</h1>
      <p className="end-line">{t('ui.end_hint')}</p><button className="primary-button" type="button" onClick={e => { if (e.detail < 2) session.restart(snapshot.revision); }}>{t('ui.restart')}<span aria-hidden="true">↗</span></button>
    </section> : <section className="complete-screen" role="alert"><p>{t('ui.error')}</p><button className="primary-button" type="button" onClick={() => session.restart(snapshot.revision)}>{t('ui.restart')}</button></section>}
    <footer className="game-footer"><div className="progress-block"><span>{t('ui.progress')}</span>
      <progress aria-label={t('ui.progress')} value={snapshot.phase === 'complete' ? snapshot.total : snapshot.completed} max={snapshot.total} /></div>
      <span className="keyboard-hint">{t('ui.keyboard')}</span>
      {import.meta.env.DEV ? <button className="debug-toggle" type="button" aria-expanded={debugOpen} onClick={() => setDebugOpen(v => !v)}>{t('ui.debug')}</button> : null}
    </footer>
    {import.meta.env.DEV && debugOpen && DebugPanel ? <Suspense fallback={null}><DebugPanel state={snapshot.state} dialogue={snapshot.dialogue} t={t} close={() => setDebugOpen(false)} /></Suspense> : null}
  </main>;
}
