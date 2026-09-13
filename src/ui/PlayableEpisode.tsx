import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import { CharacterCard, SiteScene } from './VisualSlot';
import { PresentationView } from './PresentationView';
import { characterIntroduction, sceneContext } from './scene-context';
import { useSceneAudio } from './use-scene-audio';
import type { EngineCommand } from '../engine';

const DebugPanel = import.meta.env.DEV ? lazy(() => import('./DebugPanel')) : null;

export function PlayableEpisode({ session }: { session: EpisodeSession }) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const [debugOpen, setDebugOpen] = useState(false);
  const focusRef = useRef<HTMLElement>(null);
  const t = session.t;
  const presentation = snapshot.presentation.find(p => 'node_id' in p);
  const person = snapshot.dialogue?.speaker_id ? session.character(snapshot.dialogue.speaker_id) : undefined;
  const identity = person ? characterIntroduction(person.id) : undefined;
  const displayedPerson = person && identity?.name_text_id ? { ...person, name: t(identity.name_text_id) } : person;
  const scene = sceneContext(snapshot.dialogue?.event_id, snapshot.dialogue?.text_id);
  const portrait = snapshot.dialogue?.visual_reference;
  const clock = snapshot.state?.clock ?? { day: 1, slot: 'PRE_WORK' };
  const isPlaying = snapshot.phase === 'playing';
  const audio = useSceneAudio(snapshot.phase, snapshot.relationshipFeedback.map(f => f.delta.source.effect_instance_id).join('|'));
  const send = useCallback((command: EngineCommand) => {
    if (session.dispatch(command, snapshot.revision)) audio.cue(command.type === 'choose_event' ? 'confirm' : 'continue');
  }, [session, snapshot.revision, audio.cue]);

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
        if (choice?.enabled) send({ type: 'choose_event', instance_id: presentation.instance_id,
          node_id: presentation.node_id, choice_id: choice.choice_id });
      } else if (presentation.type !== 'SHOW_CHOICE' && (e.key === 'Enter' || e.code === 'Space')) {
        if (target?.closest('button') && !target.closest('.continue-button')) return;
        e.preventDefault();
        send({ type: 'advance_event', instance_id: presentation.instance_id, node_id: presentation.node_id });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [send, snapshot.phase, presentation]);

  return <main className={`game-frame phase-${snapshot.phase}${person ? ' has-speaker' : ''}${scene.opening && isPlaying ? ' opening-scene' : ''}`} data-stage={presentation?.type === 'SHOW_CHOICE' ? 'decision' : 'dialogue'}>
    <SiteScene chapter={snapshot.state?.event_runtime.chapter_id} focus={scene.focus} timeSlot={clock.slot} />
    <header className="game-header">
      <div className="day-marker"><span>{t('ui.day')}</span><strong>{String(clock.day).padStart(2, '0')}</strong></div>
      <div className="time-marker"><span>{t(`ui.slot.${clock.slot.toLowerCase()}`)}</span><i /><span>{snapshot.chapterTitle}</span></div>
      <span className="header-episode">{t('ui.episode')}</span>
    </header>
    {snapshot.phase === 'start' ? <section className="title-screen">
      <div className="title-copy"><span className="eyebrow">{t('ui.episode')} <i /> {t('ui.site')}</span>
        <h1>{t('ui.brand')}</h1><p className="tagline">{t('ui.tagline')}</p></div>
      <div className="start-block"><div><span className="eyebrow">{t('ui.day')} 01</span><h2>{t('ep01.title')}</h2><p>{t('ui.start_hint')}</p></div>
        <button className="primary-button" type="button" onClick={e => { if (e.detail < 2) session.start(snapshot.revision); }}>{t('ui.start')}<span aria-hidden="true">↗</span></button>
      </div>
    </section> : isPlaying ? <>
      <section className="scene-heading"><span className="eyebrow">{t(scene.location_text_id)}</span><h1>{snapshot.eventTitle}</h1><p className="scene-tension">{t(scene.tension_text_id)}</p></section>
      <section className="play-panel" ref={focusRef} tabIndex={-1} aria-label={t('ui.dialogue')}>
        {displayedPerson ? <CharacterCard key={displayedPerson.id} person={displayedPerson} speakerLabel={t('ui.speaking')} introductionLabel={scene.introduction ? t('ui.introduction') : undefined}
          domain={identity ? t(identity.domain_text_id) : undefined} functionText={identity ? t(identity.function_text_id) : undefined}
          portraitUri={portrait?.kind === 'asset' ? session.assetUri(portrait.id) : undefined} /> : <aside className="narrator-card"><span className="eyebrow">{t('ui.protagonist')}</span><strong>{t(scene.location_text_id)}</strong></aside>}
        <div className="presentation-area" aria-live="polite" key={snapshot.revision}>
          {snapshot.relationshipFeedback.length ? <div className="relationship-feedback" role="status" aria-label={t('ui.relationship_change')}>
            {snapshot.relationshipFeedback.map(({ npc_id, delta }) => <span data-npc-id={npc_id} key={delta.source.effect_instance_id}>
              <strong>{session.character(npc_id)?.name}</strong> {t(`ui.relationship.${delta.field}`)}
              <b className={delta.applied_delta > 0 ? 'delta-positive' : 'delta-negative'}>{delta.applied_delta > 0 ? '+' : ''}{delta.applied_delta}</b>
            </span>)}
          </div> : null}
          <PresentationView commands={snapshot.presentation} t={t} send={send} onChoiceFocus={() => audio.cue('hover')} assetUri={id => session.assetUri(id)} />
        </div>
      </section>
    </> : snapshot.phase === 'complete' ? <section className="complete-screen">
      <span className="completion-rule" /><p className="eyebrow">{t('ui.complete')}</p><h1>{t('ep01.title')}</h1>
      <p className="end-line">{t('ui.end_hint')}</p><button className="primary-button" type="button" onClick={e => { if (e.detail < 2) session.restart(snapshot.revision); }}>{t('ui.restart')}<span aria-hidden="true">↗</span></button>
    </section> : <section className="complete-screen" role="alert"><p>{t('ui.error')}</p><button className="primary-button" type="button" onClick={() => session.restart(snapshot.revision)}>{t('ui.restart')}</button></section>}
    <footer className="game-footer"><div className="progress-block"><span>{t('ui.progress')}</span>
      <progress aria-label={t('ui.progress')} value={snapshot.phase === 'complete' ? snapshot.total : snapshot.completed} max={snapshot.total} /></div>
      <span className="keyboard-hint">{t('ui.keyboard')}</span>
      <button className="audio-toggle" type="button" aria-pressed={audio.status === 'enabled'} disabled={audio.pending || audio.status === 'unavailable'}
        title={t('ui.audio.hint')} onClick={() => { void audio.toggle(); }}>
        <span className="audio-mark" aria-hidden="true"><i /><i /><i /></span>{t(audio.status === 'unavailable' ? 'ui.audio.unavailable' : audio.status === 'enabled' ? 'ui.audio.off' : 'ui.audio.on')}
      </button>
      {import.meta.env.DEV ? <button className="debug-toggle" type="button" aria-expanded={debugOpen} onClick={() => setDebugOpen(v => !v)}>{t('ui.debug')}</button> : null}
    </footer>
    {import.meta.env.DEV && debugOpen && DebugPanel ? <Suspense fallback={null}><DebugPanel state={snapshot.state} dialogue={snapshot.dialogue} t={t} close={() => setDebugOpen(false)} /></Suspense> : null}
  </main>;
}
