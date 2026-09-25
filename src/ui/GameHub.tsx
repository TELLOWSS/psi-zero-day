import { Component, lazy, Suspense, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ComponentType, ErrorInfo, ReactNode } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import { COMPANY_NAME, GAME_TITLE } from '../app/brand';
import { projectEpisodeJourney } from '../app/episode-journey';
import { characterMapUri, characterPortraitUri, episode01BackgroundUri } from '../app/episode-visual-assets';
import castPlan from '../../content/episode01/character-art-production.json';
import { VisualImage } from './VisualSlot';
import { EpisodeRecord } from './EpisodeRecord';
import { CinematicLoadingScreen } from './CinematicLoadingScreen';
import { DefenseCommandHome } from './DefenseCommandHome';
import { TITLE_CAST_IDS } from '../app/title-cast';
import { readAudioMuted, setAudioMuted, subscribeAudioMuted } from '../app/audio-preference';
import { defenseText } from '../app/defense-text';
import { inspectDefenseSave } from '../app/defense-save';
import {
  defenseEventAvailabilityFromState, readE1UnlockNoticeSeen, writeE1UnlockNoticeSeen,
} from '../app/defense-story-bridge';
import { zeroBreachContent } from '../content/defense';
import { defenseEvents } from '../content/defense-events';
import { browserLocalStoragePort } from '../platform/browser-storage';

type HubPage = 'home' | 'map' | 'people' | 'journal' | 'guide';
const tabs: readonly HubPage[] = ['home', 'map', 'people', 'journal', 'guide'];
const featured = TITLE_CAST_IDS;
const loadPlayableEpisode = () => import('./PlayableEpisode');
const PlayableEpisode = lazy(() => loadPlayableEpisode().then(module => ({ default: module.PlayableEpisode })));
const loadDefenseGame = () => import('./DefenseGame');
const DefenseGame = lazy(() => loadDefenseGame().then(module => ({ default: module.DefenseGame })));
type FieldGuideModuleLoader = () => Promise<{ readonly FieldGuide: ComponentType<{ session: EpisodeSession }> }>;

const loadFieldGuide: FieldGuideModuleLoader = () => import('./FieldGuide');

export async function preloadFieldGuide(loader: FieldGuideModuleLoader = loadFieldGuide): Promise<boolean> {
  try {
    await loader();
    return true;
  } catch (error) {
    console.error('Field guide preload failed', error);
    return false;
  }
}

const createFieldGuideScreen = (loader: FieldGuideModuleLoader) =>
  lazy(() => loader().then(module => ({ default: module.FieldGuide })));

class FieldGuideErrorBoundary extends Component<{
  readonly children: ReactNode;
  readonly text: (id: string) => string;
  readonly onRetry: () => void;
  readonly onHome: () => void;
  readonly onReload: () => void;
}, { readonly error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Field guide chunk failed to load', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { text, onRetry, onHome, onReload } = this.props;
    return <div className="hub-empty field-guide-recovery" role="alert">
      <HubIcon kind="guide" />
      <h2>{text('ui.guide.recovery.title')}</h2>
      <p>{text('ui.guide.recovery.body')}</p>
      <div className="field-guide-recovery-actions">
        <button className="hub-primary" type="button" onClick={onRetry}>{text('ui.guide.recovery.retry')}</button>
        <button className="field-guide-recovery-secondary" type="button" onClick={onReload}>{text('ui.guide.recovery.reload')}</button>
        <button className="field-guide-recovery-secondary" type="button" onClick={onHome}>{text('ui.guide.recovery.home')}</button>
      </div>
    </div>;
  }
}

export function RecoverableFieldGuide({
  session,
  onHome,
  loader = loadFieldGuide,
  onReload = () => window.location.reload(),
}: {
  readonly session: EpisodeSession;
  readonly onHome: () => void;
  readonly loader?: FieldGuideModuleLoader;
  readonly onReload?: () => void;
}) {
  const [attempt, setAttempt] = useState(0);
  const FieldGuideScreen = useMemo(() => createFieldGuideScreen(loader), [attempt, loader]);

  return <FieldGuideErrorBoundary
    key={attempt}
    text={session.t}
    onRetry={() => setAttempt(value => value + 1)}
    onHome={onHome}
    onReload={onReload}
  >
    <Suspense fallback={<div className="hub-empty" role="status">
      <HubIcon kind="guide" />
      <h2>{session.t('ui.hub.guide')}</h2>
      <p>{session.t('ui.guide.recovery.loading')}</p>
    </div>}>
      <FieldGuideScreen session={session} />
    </Suspense>
  </FieldGuideErrorBoundary>;
}

function GameplayChunkFallback() {
  return <main className="gameplay-chunk-fallback" role="status" aria-live="polite">
    <div><strong>{GAME_TITLE}</strong><span>{COMPANY_NAME}</span><p>현장을 불러오고 있습니다.</p></div>
  </main>;
}
export function HubIcon({ kind }: { kind: HubPage | 'play' | 'lock' | 'check' }) {
  const paths = {
    home: 'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',
    map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16',
    people: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 10v-3a6 6 0 0 1 12 0v3m3-17a4 4 0 0 1 0 8m1 3a5 5 0 0 1 4 5v1',
    guide: 'M12 5C8 2 4 3 2 4v16c3-2 6-2 10 0 4-2 7-2 10 0V4c-3-1-6-2-10 1Zm0 0v15',
    journal: 'M6 3h14v18H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 0v18m4-13h6m-6 4h6m-6 4h4',
    play: 'm8 4 12 8-12 8Z', lock: 'M6 10h12v11H6Zm2 0V6a4 4 0 0 1 8 0v4m-4 5v2', check: 'm4 12 5 5L20 6',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

/** Navigation is presentation state; all run mutations remain in EpisodeSession/CoreEngine. */
export function GameShell({ session }: { session: EpisodeSession }) {
  const [inGame, setInGame] = useState(false);
  const [inDefense, setInDefense] = useState(false);
  const [defenseScenarioId, setDefenseScenarioId] = useState<string | null>(null);
  const [e1UnlockNotice, setE1UnlockNotice] = useState(false);
  const [loading, setLoading] = useState(false);
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const audioMuted = useSyncExternalStore(subscribeAudioMuted, readAudioMuted, () => false);
  const resolve = (id: string) => session.assetUri(id);
  const cinematicBackground = episode01BackgroundUri(resolve);
  const preloadUris = [
    cinematicBackground,
    ...featured.map(id => characterMapUri(id, resolve)),
    characterPortraitUri('player', resolve),
  ].filter((uri): uri is string => Boolean(uri));
  const loadingCrew = featured.map(id => {
    const member = session.character(id);
    return {
      id,
      uri: characterMapUri(id, resolve),
      name: member?.name ?? id,
      role: member?.role ?? '',
    };
  });

  const openDefense = (scenarioId: string | null = null) => {
    if (e1UnlockNotice) {
      writeE1UnlockNoticeSeen();
      setE1UnlockNotice(false);
    }
    void loadDefenseGame();
    setDefenseScenarioId(scenarioId);
    setInDefense(true);
  };
  const closeDefense = () => {
    setInDefense(false);
    setDefenseScenarioId(null);
  };

  useEffect(() => {
    let cancelled = false;
    if (inDefense || !snapshot.state || readE1UnlockNoticeSeen()) {
      setE1UnlockNotice(false);
      return () => { cancelled = true; };
    }
    void (async () => {
      try {
        const inspection = await inspectDefenseSave(browserLocalStoragePort(), zeroBreachContent);
        if (cancelled) return;
        if (inspection.kind !== 'ready' && inspection.kind !== 'empty' && inspection.kind !== 'version-mismatch') return;
        const event = defenseEvents[0];
        if (!event) return;
        const availability = defenseEventAvailabilityFromState(event, snapshot.state, inspection.document);
        setE1UnlockNotice(availability.unlocked);
      } catch {
        if (!cancelled) setE1UnlockNotice(false);
      }
    })();
    return () => { cancelled = true; };
  }, [inDefense, snapshot.revision, snapshot.state]);

  const play = () => {
    void loadPlayableEpisode();
    setLoading(true);
  };
  const newGame = () => {
    const current = session.getSnapshot();
    if (current.phase !== 'start') session.restart(current.revision);
    void loadPlayableEpisode();
    setLoading(true);
  };
  const enterGame = () => {
    const current = session.getSnapshot();
    if (current.phase === 'start' && !session.start(current.revision)) {
      setLoading(false);
      return;
    }
    setLoading(false);
    setInGame(true);
  };

  if (inDefense) return <Suspense fallback={<GameplayChunkFallback />}>
    <DefenseGame session={session} requestedScenarioId={defenseScenarioId} onExit={closeDefense} />
  </Suspense>;

  if (loading) return <CinematicLoadingScreen
    backgroundUri={cinematicBackground}
    preloadUris={preloadUris}
    crew={loadingCrew}
    onComplete={enterGame}
  />;

  if (inGame && snapshot.phase !== 'start') return <Suspense fallback={<GameplayChunkFallback />}>
    <PlayableEpisode session={session} onReturn={() => setInGame(false)} />
    <button
      className="game-defense-toggle"
      type="button"
      onMouseEnter={() => { void loadDefenseGame(); }}
      onFocus={() => { void loadDefenseGame(); }}
      onClick={() => openDefense()}
    >{defenseText('defense.ui.hub.title')}</button>
    {e1UnlockNotice ? <aside className="game-defense-unlock" role="status" aria-live="polite">
      <small>{defenseText('defense.event.new')}</small>
      <strong>{defenseText('defense.event.e1.title')}</strong>
      <p>{defenseText('defense.event.unlock.body')}</p>
      <div>
        <button type="button" onClick={() => {
          writeE1UnlockNoticeSeen();
          setE1UnlockNotice(false);
          openDefense(defenseEvents[0]?.id ?? null);
        }}>{defenseText('defense.event.unlock.play')}</button>
        <button type="button" onClick={() => {
          writeE1UnlockNoticeSeen();
          setE1UnlockNotice(false);
        }}>{defenseText('defense.event.unlock.later')}</button>
      </div>
    </aside> : null}
    <button
      className="game-audio-toggle"
      type="button"
      aria-pressed={audioMuted}
      aria-label={session.t(audioMuted ? 'ui.audio.toggle.off' : 'ui.audio.toggle.on')}
      onClick={() => setAudioMuted(!audioMuted)}
    ><span aria-hidden="true">SOUND</span><b>{audioMuted ? 'OFF' : 'ON'}</b></button>
  </Suspense>;
  return <GameHub session={session} onPlay={play} onNewGame={newGame} onDefense={() => openDefense()} />;
}

export function GameHub({ session, onPlay, onNewGame, onDefense }: { session: EpisodeSession; onPlay: () => void; onNewGame: () => void; onDefense?: () => void }) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const audioMuted = useSyncExternalStore(subscribeAudioMuted, readAudioMuted, () => false);
  const [page, setPage] = useState<HubPage>('home');
  const [selectedPerson, setSelectedPerson] = useState('player');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const [showTitleSettings, setShowTitleSettings] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [castQuotesEnabled, setCastQuotesEnabled] = useState(true);
  const t = session.t;
  const resolve = (id: string) => session.assetUri(id);
  const journey = projectEpisodeJourney(snapshot.state);
  const activeStep = journey.find(step => step.status === 'current') ?? journey[journey.length - 1]!;
  const detail = journey.find(step => step.id === selectedStep) ?? activeStep;
  const person = session.character(selectedPerson);
  const castDetail = castPlan.characters.find(character => character.id === selectedPerson);
  const review = session.review();
  const progress = snapshot.phase === 'complete' ? 100 : snapshot.total ? Math.round(snapshot.completed / snapshot.total * 100) : 0;
  const playLabel = t(snapshot.phase === 'start' ? 'ui.hub.start' : snapshot.phase === 'complete' ? 'ui.hub.results' : 'ui.hub.continue');
  const canContinue = snapshot.phase !== 'start';
  const openGuide = () => setPage('guide');
  const preloadGuide = () => { void preloadFieldGuide(); };
  const titleFeatureVisuals = {
    story: episode01BackgroundUri(resolve),
    missions: resolve('ep01.scene_element.suspended_load'),
    people: characterPortraitUri('player', resolve),
    tomorrow: resolve('ep01.scene_element.access_barrier'),
  };
  useEffect(() => {
    const storedMotion = window.localStorage.getItem('psi.title.motion');
    const storedQuotes = window.localStorage.getItem('psi.title.castQuotes');
    if (storedMotion === 'off') setMotionEnabled(false);
    if (storedQuotes === 'off') setCastQuotesEnabled(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('psi-title-motion-off', !motionEnabled);
    window.localStorage.setItem('psi.title.motion', motionEnabled ? 'on' : 'off');
  }, [motionEnabled]);

  useEffect(() => {
    document.documentElement.classList.toggle('psi-title-quotes-off', !castQuotesEnabled);
    window.localStorage.setItem('psi.title.castQuotes', castQuotesEnabled ? 'on' : 'off');
  }, [castQuotesEnabled]);


  if (page === 'home') return <>
    <DefenseCommandHome
      session={session}
      canContinueStory={canContinue}
      storyProgress={progress}
      onDefense={() => {
        void loadDefenseGame();
        onDefense?.();
      }}
      onStory={onPlay}
      onNewStory={() => canContinue ? setConfirmNewGame(true) : onNewGame()}
      onJournal={() => setPage('journal')}
      onPeople={() => setPage('people')}
      onGuide={() => { preloadGuide(); openGuide(); }}
      onSettings={() => setShowTitleSettings(true)}
    />

    {showTitleSettings ? <div className="commercial-title-settings-backdrop" role="presentation" onMouseDown={() => setShowTitleSettings(false)}>
      <section className="commercial-title-settings" role="dialog" aria-modal="true" aria-labelledby="title-settings-heading" onMouseDown={event => event.stopPropagation()}>
        <span>{GAME_TITLE}</span>
        <h2 id="title-settings-heading">{t('ui.title.settings')}</h2>
        <p>{t('ui.title.settings.hint')}</p>
        <label>
          <div><strong>{t('ui.title.settings.motion')}</strong><small>{t('ui.title.settings.motion.hint')}</small></div>
          <input type="checkbox" checked={motionEnabled} onChange={event => setMotionEnabled(event.currentTarget.checked)} />
        </label>
        <label>
          <div><strong>{t('ui.title.settings.quotes')}</strong><small>{t('ui.title.settings.quotes.hint')}</small></div>
          <input type="checkbox" checked={castQuotesEnabled} onChange={event => setCastQuotesEnabled(event.currentTarget.checked)} />
        </label>
        <label>
          <div><strong>{t('ui.title.settings.audio')}</strong><small>{t('ui.title.settings.audio.hint')}</small></div>
          <input type="checkbox" checked={!audioMuted} onChange={event => setAudioMuted(!event.currentTarget.checked)} />
        </label>
        <button type="button" onClick={() => setShowTitleSettings(false)}>{t('ui.title.settings.close')}</button>
      </section>
    </div> : null}

    {confirmNewGame ? <div className="commercial-title-dialog-backdrop" role="presentation" onMouseDown={() => setConfirmNewGame(false)}>
      <section className="commercial-title-dialog" role="dialog" aria-modal="true" aria-labelledby="new-game-confirm-title" onMouseDown={event => event.stopPropagation()}>
        <span>{GAME_TITLE}</span>
        <h2 id="new-game-confirm-title">{t('ui.title.confirm_new')}</h2>
        <p>{t('ui.title.confirm_new.hint')}</p>
        <div>
          <button type="button" onClick={() => setConfirmNewGame(false)}>{t('ui.title.cancel')}</button>
          <button className="is-danger" type="button" onClick={() => { setConfirmNewGame(false); onNewGame(); }}>{t('ui.title.restart')}</button>
        </div>
      </section>
    </div> : null}
  </>;

  return <main className={`game-hub hub-page-${page}`}>
    <VisualImage uri={episode01BackgroundUri(resolve)} alt="" className="hub-backdrop" />
    <div className="hub-shade" />
    <header className="hub-header">
      <div className="hub-brand"><span>{GAME_TITLE}</span><small>{t('ui.hub.brandline')}</small></div>
      <div className="hub-signature">{t('ui.hub.signature')}<small>{t('ui.hub.motto')}</small></div>
      <div className="hub-player-status">
        <VisualImage uri={characterPortraitUri('player', resolve)} alt="" />
        <div><strong>{t('ui.hub.status')}</strong><span>EP.01 · {snapshot.completed} / {snapshot.total}</span><progress aria-label={t('ui.progress')} value={progress} max={100} /></div>
      </div>
    </header>
    <nav className="hub-nav" aria-label={t('ui.hub.navigation')}>
      {tabs.map(tab => <button key={tab} type="button" aria-current={page === tab ? 'page' : undefined} onClick={() => setPage(tab)}>
        <HubIcon kind={tab} /><span><strong>{t(`ui.hub.${tab}`)}</strong><small>{t(`ui.hub.${tab}.hint`)}</small></span><b aria-hidden="true">›</b>
      </button>)}
      <p className="hub-nav-note">{t('ui.hub.note')}</p>
    </nav>
    <section className="hub-main" aria-label={t(`ui.hub.${page}`)}>
      {page === 'map' ? <>
        <div className="hub-map-heading"><span className="hub-kicker">EPISODE 01</span><h1>{t('ep01.title')}</h1><p>{t('ui.hub.route_hint')}</p></div>
        <div className="hub-route">
          <svg className="hub-route-line" viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true"><path d="M150 100 L470 120 L810 155 L660 335 L300 340" /></svg>
          {journey.map((step, index) => <button className={`hub-route-node route-${index}`} key={step.id} type="button" data-status={step.status} aria-pressed={detail.id === step.id} onClick={() => setSelectedStep(step.id)}>
            <VisualImage uri={characterPortraitUri(step.character, resolve)} alt="" /><span><small>{String(index + 1).padStart(2, '0')} · {t(`ui.hub.step.${step.status}`)}</small><strong>{t(step.title)}</strong></span><HubIcon kind={step.status === 'done' ? 'check' : step.status === 'locked' ? 'lock' : 'play'} />
          </button>)}
        </div>
        <section className="hub-route-detail" aria-live="polite"><VisualImage uri={characterPortraitUri(detail.character, resolve)} alt="" /><div><small>{t(`ui.hub.step.${detail.status}`)}</small><h2>{t(detail.title)}</h2><p>{t(detail.hint)}</p>{detail.status === 'locked' ? <p>{t('ui.hub.locked_hint')}</p> : null}</div>
          <button className="hub-primary" type="button" onClick={onPlay}><HubIcon kind="play" />{playLabel}</button>
        </section>
      </> : page === 'people' ? <div className="hub-people">
        <div className="hub-section-title"><span className="hub-kicker">FIELD TEAM / 08</span><h1>{t('ui.hub.people')}</h1><p>{t('ui.hub.people.intro')}</p></div>
        <div className="hub-person-grid">{castPlan.characters.map(character => <button type="button" key={character.id} aria-pressed={selectedPerson === character.id} onClick={() => setSelectedPerson(character.id)}>
          <VisualImage uri={characterPortraitUri(character.id, resolve)} alt="" /><strong>{session.character(character.id)?.name}</strong><small>{session.character(character.id)?.role}</small>
        </button>)}</div>
        <aside className="hub-person-detail" aria-live="polite"><VisualImage uri={characterPortraitUri(selectedPerson, resolve)} alt={person?.name ?? ''} /><div><small>{person?.role}</small><h2>{person?.name}</h2><p>{t(`ui.hub.person.${selectedPerson}`)}</p>{castDetail ? <span className="hub-person-tag">{t('ui.hub.team_tag')}</span> : null}</div></aside>
      </div> : page === 'guide' ? <RecoverableFieldGuide session={session} onHome={() => setPage('home')} /> : <div className="hub-journal">
        <span className="hub-kicker">FIELD JOURNAL</span><h1>{t('ui.review.title')}</h1><p>{t('ui.review.hint')}</p>
        {review.length ? <EpisodeRecord entries={review} t={t} /> : <div className="hub-empty"><HubIcon kind="journal" /><h2>{t('ui.hub.journal.empty')}</h2><p>{t('ui.hub.journal.empty_hint')}</p></div>}
        <button className="hub-primary" type="button" onClick={onPlay}><HubIcon kind="play" />{playLabel}</button>
      </div>}
    </section>
    <footer className="hub-footer"><span>{GAME_TITLE}</span><span>{t('ui.hub.footer')}</span><small>EPISODE 01 · {t('ep01.title')}</small></footer>
  </main>;
}
