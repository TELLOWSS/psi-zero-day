import { PATROL_STAGE_IDS } from '../domain/patrol-survivors';
import './shooting-entry.css';
import { WorkStopSongPlayer, workStopSongText } from './WorkStopSongPlayer';
import { GameManual, gameManualText } from './GameManual';
import { Component, lazy, Suspense, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ComponentType, ErrorInfo, ReactNode } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import { COMPANY_NAME, GAME_TITLE } from '../app/brand';
import { projectEpisodeJourney } from '../app/episode-journey';
import {
  characterHighResPortraitUri,
  characterMapUri,
  characterPortraitUri,
  episode01BackgroundUri,
  HIRES_KEY_ART,
} from '../app/episode-visual-assets';
import castPlan from '../../content/episode01/character-art-production.json';
import { VisualImage } from './VisualSlot';
import { EpisodeRecord } from './EpisodeRecord';
import { CinematicLoadingScreen } from './CinematicLoadingScreen';
import { SiteProfileScreen } from './SiteProfileScreen';
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
import {
  readFgPoints, readSurvivorsCredits, readUnlockedPatrolStages, subscribeUnifiedMeta,
} from '../app/unified-meta-bridge';

type HubPage = 'home' | 'site' | 'map' | 'people' | 'journal' | 'guide';
const tabs: readonly HubPage[] = ['home', 'map', 'people', 'journal', 'guide'];
const featured = TITLE_CAST_IDS;
const loadPlayableEpisode = () => import('./PlayableEpisode');
const PlayableEpisode = lazy(() => loadPlayableEpisode().then(module => ({ default: module.PlayableEpisode })));
const loadDefenseGame = () => import('./DefenseGame');
const DefenseGame = lazy(() => loadDefenseGame().then(module => ({ default: module.DefenseGame })));
const loadSurvivorsGame = () => import('./PatrolSurvivorsGame');
const MODE_PREVIEW_ART = {
  signal: '/mode-previews/signal-watch.webp',
  defense: '/mode-previews/defense-coming-soon.webp',
  story: '/mode-previews/story-coming-soon.webp',
} as const;
type ModePreviewKind = keyof typeof MODE_PREVIEW_ART;
const PatrolSurvivorsGame = lazy(() => loadSurvivorsGame().then(module => ({ default: module.PatrolSurvivorsGame })));
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
export function HubIcon({ kind }: { kind: HubPage | 'play' | 'lock' | 'check' | 'help' }) {
  const paths = {
    home: 'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',
    map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16',
    site: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16',
    people: 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 10v-3a6 6 0 0 1 12 0v3m3-17a4 4 0 0 1 0 8m1 3a5 5 0 0 1 4 5v1',
    help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M9.5 8.5a2.5 2.5 0 1 1 4.2 1.8C12.5 11.2 12 12 12 14M12 17v.1',
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
  const [inSurvivors, setInSurvivors] = useState(false);
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
    if (inDefense || inSurvivors || !snapshot.state || readE1UnlockNoticeSeen()) {
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
  }, [inDefense, inSurvivors, snapshot.revision, snapshot.state]);

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

  if (inSurvivors) return <Suspense fallback={<GameplayChunkFallback />}>
    <PatrolSurvivorsGame onExit={() => setInSurvivors(false)} audioMuted={audioMuted} />
  </Suspense>;

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
  return <GameHub
    session={session}
    onPlay={play}
    onNewGame={newGame}
    onDefense={scenarioId => openDefense(scenarioId ?? null)}
    onSurvivors={() => setInSurvivors(true)}
  />;
}

export function GameHub({ session, onPlay: _onPlay, onNewGame: _onNewGame, onDefense, onSurvivors }: {
  session: EpisodeSession;
  onPlay: () => void;
  onNewGame: () => void;
  onDefense?: (scenarioId?: string | null) => void;
  onSurvivors?: () => void;
}) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const audioMuted = useSyncExternalStore(subscribeAudioMuted, readAudioMuted, () => false);
  const [showSongPlayer, setShowSongPlayer] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [page, setPage] = useState<HubPage>('home');
  const [selectedPerson, setSelectedPerson] = useState('player');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showTitleSettings, setShowTitleSettings] = useState(false);
  const [modePreview,setModePreview]=useState<Exclude<ModePreviewKind,'signal'>|null>(null);
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

  const [unifiedMeta, setUnifiedMeta] = useState(() => ({
    fgPoints: readFgPoints(),
    unlockedStages: readUnlockedPatrolStages(),
    credits: readSurvivorsCredits(),
  }));

  useEffect(() => {
    return subscribeUnifiedMeta(() => {
      setUnifiedMeta({
        fgPoints: readFgPoints(),
        unlockedStages: readUnlockedPatrolStages(),
        credits: readSurvivorsCredits(),
      });
    });
  }, []);

  if (page === 'home') return <main className="commercial-title-home" data-title-layout="MODE_SELECT_V11">
    {showSongPlayer && <WorkStopSongPlayer onClose={() => setShowSongPlayer(false)} />}
    {showManual && <GameManual onClose={() => setShowManual(false)} />}
    <VisualImage uri={HIRES_KEY_ART.night_pour} fallbackUri={episode01BackgroundUri(resolve)} alt="" className="commercial-title-backdrop" />
    <div className="commercial-title-grade" aria-hidden="true" />
    <div className="commercial-title-grain" aria-hidden="true" />
    <div className="commercial-title-sun-glow" aria-hidden="true" />
    <div className="commercial-title-depth" aria-hidden="true" />
    <div className="commercial-title-scan" aria-hidden="true" />

    <header className="commercial-title-topline">
      <div className="commercial-title-meta">
        <small>Ver. 0.1.0</small>
        <b>{COMPANY_NAME}</b>
        <span>{t('ui.title.topline')}</span>
      </div>
      <nav className="commercial-title-utility" aria-label={t('ui.title.utility')}>
        <button type="button" aria-label={gameManualText('open')} title={gameManualText('open')} onClick={() => setShowManual(true)}><HubIcon kind="help" /><span>{gameManualText('open')}</span></button>
        <button type="button" onClick={() => setPage('journal')}><HubIcon kind="journal" /><span>{t('ui.title.utility.journal')}</span></button>
        <button type="button" onClick={() => setPage('people')}><HubIcon kind="people" /><span>{t('ui.title.utility.people')}</span></button>
        <button type="button" onMouseEnter={preloadGuide} onFocus={preloadGuide} onClick={openGuide}><HubIcon kind="guide" /><span>{t('ui.title.utility.guide')}</span></button>
        <button type="button" onClick={() => setShowTitleSettings(true)}><span className="commercial-title-settings-glyph" aria-hidden="true">⚙</span><span>{t('ui.title.settings')}</span></button>
      </nav>
    </header>

    <button type="button" className="work-stop-song-open" onClick={() => setShowSongPlayer(true)}>♫ {workStopSongText('open')}</button>

    <section className="commercial-title-copy" data-title-hierarchy="H01_LOCKED">
      <span className="commercial-title-kicker" data-title-rank="brand">NEW PSI</span>
      <div className="commercial-title-logo" data-title-rank="primary" aria-label="PSI : ZERO DAY"><span>PSI</span><b>:</b><span>ZERO DAY</span></div>
      <h1 data-title-rank="slogan">사고 전 신호를 읽고, 현장을 바꿔라.</h1>
      <p className="commercial-title-english">Proactive Safety Intelligence · FIELD DEFENSE</p>
      <p className="commercial-title-subcopy">같은 안전관리자라도 현장·공법·공정이 달라지면 읽어야 할 위험은 달라집니다.</p>

      {/* 4위 1체 통합 관제 상태 요약 바 */}
      <div className="commercial-triad-dashboard" style={{
        margin: '0.8rem 0 1rem 0',
        padding: '0.7rem 1rem',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.6rem',
        fontSize: '0.8rem',
      }}>
        <div>
          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>📖 스토리 모드</span>
          <strong style={{ color: '#fbbf24' }}>준비중 · 시네마틱 프리뷰</strong>
        </div>
        <div>
          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>⚡ 시그널 워치 (SURVIVORS)</span>
          <strong style={{ color: '#34d399' }}>{unifiedMeta.unlockedStages.length} / {PATROL_STAGE_IDS.length} 구역 해금</strong>
        </div>
        <div>
          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>🛡️ 디펜스 모드</span>
          <strong style={{ color: '#60a5fa' }}>준비중 · 전술 방어선 고도화</strong>
        </div>
        <div>
          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>🔬 현장도감 연구</span>
          <strong style={{ color: '#a78bfa' }}>{unifiedMeta.fgPoints} FG 연구 데이터</strong>
        </div>
      </div>

      <div className="commercial-title-actions is-defense-first">
        {onSurvivors ? <button
          className="commercial-title-action is-survivors-entry has-mode-art"
          type="button"
          onMouseEnter={() => { void loadSurvivorsGame(); }}
          onFocus={() => { void loadSurvivorsGame(); }}
          onClick={() => onSurvivors?.()}
        >
          <img src={MODE_PREVIEW_ART.signal} alt="" aria-hidden="true" className="commercial-title-action-art" />
          <span className="commercial-title-action-shade" aria-hidden="true" />
          <span className="commercial-title-action-icon is-lightning">⚡</span>
          <span className="commercial-title-action-copy">
            <strong className="commercial-title-survivors-title">
              시그널 워치 (SURVIVORS)
              <span className="commercial-title-badge-new">LIVE</span>
            </strong>
            <small>사고 전 신호 포착 · 현장 위험 실시간 요격 · 3-Wave 시네마틱 서바이벌</small>
          </span>
          <b>›</b>
        </button> : null}
        {onDefense ? <button className="commercial-title-action is-primary is-defense-entry has-mode-art is-coming-soon" data-title-primary-cta="defense" type="button" onClick={() => setModePreview('defense')}>
          <img src={MODE_PREVIEW_ART.defense} alt="" aria-hidden="true" className="commercial-title-action-art" />
          <span className="commercial-title-action-shade" aria-hidden="true" />
          <span className="commercial-title-action-icon"><HubIcon kind="lock" /></span>
          <span className="commercial-title-action-copy"><strong>디펜스 모드 · 준비중</strong><small>전술 방어선과 현장 개입 시스템을 최종 고도화하고 있습니다 · 탭하여 보기</small></span>
          <b>›</b>
        </button> : null}
        <button className="commercial-title-action is-story-entry has-mode-art is-coming-soon" type="button" onClick={() => setModePreview('story')}>
          <img src={MODE_PREVIEW_ART.story} alt="" aria-hidden="true" className="commercial-title-action-art" />
          <span className="commercial-title-action-shade" aria-hidden="true" />
          <span className="commercial-title-action-icon"><HubIcon kind="lock" /></span>
          <span className="commercial-title-action-copy">
            <strong>스토리 모드 · 준비중</strong>
            <small>사람·증거·판단이 연결되는 본편 시네마틱을 완성하고 있습니다 · 탭하여 보기</small>
          </span>
          <em>EP.01</em>
          <b>›</b>
        </button>
        <button className="commercial-title-action is-sub-entry" type="button" onClick={() => setPage('site')}>
          <span className="commercial-title-action-icon"><HubIcon kind="map" /></span>
          <span className="commercial-title-action-copy"><strong>현장 · 공정</strong><small>공동주택 · 리모델링 · 데이터센터 확장 준비</small></span>
          <b>›</b>
        </button>
        <button className="commercial-title-action is-quiet is-sub-entry is-coming-soon" type="button" onClick={() => setModePreview('story')}>
          <span className="commercial-title-action-icon"><HubIcon kind="lock" /></span>
          <span className="commercial-title-action-copy"><strong>새 스토리 · 준비중</strong><small>본편 완성 후 공개됩니다</small></span>
          <b>›</b>
        </button>
      </div>
    </section>

    {onDefense ? <button
      className="commercial-title-field-status is-live-entry"
      data-title-role="live-briefing"
      data-title-live-entry="DEF-CORE-01"
      type="button"
      aria-label="디펜스 모드 준비중 프리뷰 보기"
      onClick={() => setModePreview('defense')}
    >
      <div className="commercial-title-field-status-head">
        <span>LIVE SITE</span><b>DEF-CORE-01</b>
      </div>
      <strong>서측 Gate · 차량–보행 간섭</strong>
      <small>대표 시나리오 · WAVE 8 / 10</small>
      <div className="commercial-title-risk-strip">
        <span><i>01</i><b>SWIFT</b><small>차량 · 동선 급변</small></span>
        <span><i>02</i><b>CONTROL</b><small>유도 · 통로 분리</small></span>
        <span><i>03</i><b>PSI</b><small>약한 신호 읽기</small></span>
      </div>
      <span className="commercial-title-field-status-cta">디펜스 모드 준비중 · 프리뷰 보기 <b aria-hidden="true">›</b></span>
      <p>현장 종류·공법·공정에 따라 위험 우선순위가 달라지는 SITE PROFILE 시스템으로 확장됩니다.</p>
    </button> : null}

    <aside className="commercial-title-message">
      <p>{t('ui.title.brand_copy')}</p>
      <i aria-hidden="true" />
      <small>BUILD<br/>PEOPLE<br/>A SAFER<br/>TOMORROW</small>
    </aside>

    <div className="commercial-title-cast" data-title-role="human-anchor">
      {featured.map((id, index) => {
        const member = session.character(id);
        return <figure className={`commercial-title-worker worker-${index}`} key={id} data-art-surface="main" data-character={id}>
          <VisualImage uri={characterMapUri(id, resolve)} alt="" />
          <blockquote>{t(`ui.title.cast.${id}.quote`)}</blockquote>
          <figcaption>
            <strong>{member?.name}</strong>
            <span>{member?.role}</span>
          </figcaption>
        </figure>;
      })}
    </div>

    <section className="commercial-title-features" data-title-role="secondary-features" aria-label={t('ui.title.features')}>
      <button type="button" onClick={() => setPage('map')}>
        <VisualImage uri={titleFeatureVisuals.story} alt="" className="commercial-title-feature-art" />
        <span className="commercial-title-feature-shade" aria-hidden="true" />
        <div><strong>{t('ui.title.feature.story')}</strong><small>{t('ui.title.feature.story.hint')}</small></div><b>›</b>
      </button>
      <button type="button" onMouseEnter={preloadGuide} onFocus={preloadGuide} onClick={openGuide}>
        <VisualImage uri={titleFeatureVisuals.missions} alt="" className="commercial-title-feature-art" />
        <span className="commercial-title-feature-shade" aria-hidden="true" />
        <div><strong>{t('ui.title.feature.missions')}</strong><small>{t('ui.title.feature.missions.hint')}</small></div><b>›</b>
      </button>
      <button type="button" onClick={() => setPage('people')}>
        <VisualImage uri={titleFeatureVisuals.people} alt="" className="commercial-title-feature-art" />
        <span className="commercial-title-feature-shade" aria-hidden="true" />
        <div><strong>{t('ui.title.feature.people')}</strong><small>{t('ui.title.feature.people.hint')}</small></div><b>›</b>
      </button>
      <button type="button" onClick={() => setPage('journal')}>
        <VisualImage uri={titleFeatureVisuals.tomorrow} alt="" className="commercial-title-feature-art" />
        <span className="commercial-title-feature-shade" aria-hidden="true" />
        <div><strong>{t('ui.title.feature.tomorrow')}</strong><small>{t('ui.title.feature.tomorrow.hint')}</small></div><b>›</b>
      </button>
    </section>

    <div className="commercial-title-site-plaque" aria-hidden="true">
      <strong>{t('ui.title.plaque')}</strong><span>SAFER SITE · BETTER TOMORROW</span>
    </div>

    <div className="commercial-title-quick-settings" data-title-role="quick-settings" aria-label={t('ui.title.quick_settings')}>
      <button type="button" aria-pressed={motionEnabled} onClick={() => setMotionEnabled(value => !value)}>
        <span>{t('ui.title.settings.motion')}</span><b>{motionEnabled ? 'ON' : 'OFF'}</b>
      </button>
      <button type="button" aria-pressed={castQuotesEnabled} onClick={() => setCastQuotesEnabled(value => !value)}>
        <span>{t('ui.title.settings.quotes')}</span><b>{castQuotesEnabled ? 'ON' : 'OFF'}</b>
      </button>
      <button type="button" aria-pressed={!audioMuted} onClick={() => setAudioMuted(!audioMuted)}>
        <span>{t('ui.title.settings.audio')}</span><b>{audioMuted ? 'OFF' : 'ON'}</b>
      </button>
    </div>

    <button className="commercial-title-open-menu" type="button" onClick={() => setPage('map')}>
      <span>NEW PSI · FIELD</span><small>EP.01 · {snapshot.completed}/{snapshot.total}</small>
    </button>

    {modePreview ? <div className="mode-preview-backdrop" role="presentation" onMouseDown={() => setModePreview(null)}>
      <section className={`mode-preview-dialog is-${modePreview}`} role="dialog" aria-modal="true" aria-labelledby="mode-preview-title" onMouseDown={event => event.stopPropagation()}>
        <button type="button" className="mode-preview-close" aria-label="프리뷰 닫기" onClick={() => setModePreview(null)}>×</button>
        <img src={MODE_PREVIEW_ART[modePreview]} alt={modePreview==='defense'?'디펜스 모드 준비중':'스토리 모드 준비중'} />
        <div className="mode-preview-copy">
          <span>{modePreview==='defense'?'TACTICAL DEFENSE':'CINEMATIC STORY'}</span>
          <h2 id="mode-preview-title">{modePreview==='defense'?'디펜스 모드':'스토리 모드'} <b>준비중</b></h2>
          <p>{modePreview==='defense'
            ? '현장 배치·업그레이드·작업반경 통제와 시네마틱 전투 연출을 상업 게임 수준으로 다듬고 있습니다.'
            : '현장 사람들의 목소리, 증거, 책임과 판단이 장면 단위로 연결되는 본편 시네마틱을 완성하고 있습니다.'}</p>
          <small>곧 공개됩니다 · 현재 플레이 가능 모드는 시그널 워치입니다.</small>
        </div>
      </section>
    </div> : null}

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

    <footer className="commercial-title-footer">
      <span>{GAME_TITLE} · ver 1.0.0</span>
      <b>{t('ui.title.footer')}</b>
      <span>EPISODE 01 · {t('ep01.title')}</span>
    </footer>
  </main>;

  return <main className={`game-hub hub-page-${page}`}>
    <VisualImage uri={HIRES_KEY_ART.night_pour} fallbackUri={episode01BackgroundUri(resolve)} alt="" className="hub-backdrop" />
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
    <section className="hub-main" aria-label={page === 'site' ? '현장 · 공정' : t(`ui.hub.${page}`)}>
      {page === 'site' ? <SiteProfileScreen
        onBack={() => setPage('home')}
        onPracticeScenario={() => setModePreview('defense')}
      /> : page === 'map' ? <>
        <div className="hub-map-heading"><span className="hub-kicker">EPISODE 01</span><h1>{t('ep01.title')}</h1><p>{t('ui.hub.route_hint')}</p></div>
        <div className="hub-route">
          <svg className="hub-route-line" viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true"><path d="M150 100 L470 120 L810 155 L660 335 L300 340" /></svg>
          {journey.map((step, index) => <button className={`hub-route-node route-${index}`} key={step.id} type="button" data-status={step.status} aria-pressed={detail.id === step.id} onClick={() => setSelectedStep(step.id)}>
            <VisualImage uri={characterPortraitUri(step.character, resolve)} alt="" /><span><small>{String(index + 1).padStart(2, '0')} · {t(`ui.hub.step.${step.status}`)}</small><strong>{t(step.title)}</strong></span><HubIcon kind={step.status === 'done' ? 'check' : step.status === 'locked' ? 'lock' : 'play'} />
          </button>)}
        </div>
        <section className="hub-route-detail" aria-live="polite"><VisualImage uri={characterPortraitUri(detail.character, resolve)} alt="" /><div><small>{t(`ui.hub.step.${detail.status}`)}</small><h2>{t(detail.title)}</h2><p>{t(detail.hint)}</p>{detail.status === 'locked' ? <p>{t('ui.hub.locked_hint')}</p> : null}</div>
          <button className="hub-primary" type="button" onClick={() => setModePreview('story')}><HubIcon kind="lock" />스토리 모드 · 준비중</button>
        </section>
      </> : page === 'people' ? <div className="hub-people">
        <div className="hub-section-title"><span className="hub-kicker">FIELD TEAM / 08</span><h1>{t('ui.hub.people')}</h1><p>{t('ui.hub.people.intro')}</p></div>
        <div className="hub-person-grid">{castPlan.characters.map(character => <button type="button" key={character.id} aria-pressed={selectedPerson === character.id} onClick={() => setSelectedPerson(character.id)}>
          <VisualImage uri={characterHighResPortraitUri(character.id, resolve)} fallbackUri={characterPortraitUri(character.id, resolve)} alt="" /><strong>{session.character(character.id)?.name}</strong><small>{session.character(character.id)?.role}</small>
        </button>)}</div>
        <aside className="hub-person-detail" aria-live="polite"><VisualImage uri={characterHighResPortraitUri(selectedPerson, resolve)} fallbackUri={characterPortraitUri(selectedPerson, resolve)} alt={person?.name ?? ''} /><div><small>{person?.role}</small><h2>{person?.name}</h2><p>{t(`ui.hub.person.${selectedPerson}`)}</p>{castDetail ? <span className="hub-person-tag">{t('ui.hub.team_tag')}</span> : null}</div></aside>
      </div> : page === 'guide' ? <RecoverableFieldGuide session={session} onHome={() => setPage('home')} /> : <div className="hub-journal">
        <span className="hub-kicker">FIELD JOURNAL</span><h1>{t('ui.review.title')}</h1><p>{t('ui.review.hint')}</p>
        {review.length ? <EpisodeRecord entries={review} t={t} /> : <div className="hub-empty"><HubIcon kind="journal" /><h2>{t('ui.hub.journal.empty')}</h2><p>{t('ui.hub.journal.empty_hint')}</p></div>}
        <button className="hub-primary" type="button" onClick={() => setModePreview('story')}><HubIcon kind="lock" />스토리 모드 · 준비중</button>
      </div>}
    </section>
    <footer className="hub-footer"><span>{GAME_TITLE}</span><span>{t('ui.hub.footer')}</span><small>EPISODE 01 · {t('ep01.title')}</small></footer>
  </main>;
}
