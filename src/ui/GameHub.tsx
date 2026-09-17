import { useState, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import { projectEpisodeJourney } from '../app/episode-journey';
import { characterPortraitUri, episode01BackgroundUri } from '../app/strategy-assets';
import castPlan from '../../content/episode01/character-art-production.json';
import { VisualImage, characterVisual } from './VisualSlot';
import { FieldGuide } from './FieldGuide';
import { PlayableEpisode } from './PlayableEpisode';

type HubPage = 'home' | 'map' | 'people' | 'journal' | 'guide';
const tabs: readonly HubPage[] = ['home', 'map', 'people', 'journal', 'guide'];
const featured = ['kang_taesik', 'player', 'lim_junho'] as const;
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
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const play = () => {
    if (snapshot.phase === 'start' && !session.start(snapshot.revision)) return;
    setInGame(true);
  };
  if (inGame && snapshot.phase !== 'start') return <>
    <PlayableEpisode session={session} />
    <button className="game-hub-return" onClick={() => setInGame(false)} type="button"><HubIcon kind="home" />{session.t('ui.hub.return')}</button>
  </>;
  return <GameHub session={session} onPlay={play} />;
}

export function GameHub({ session, onPlay }: { session: EpisodeSession; onPlay: () => void }) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const [page, setPage] = useState<HubPage>('home');
  const [selectedPerson, setSelectedPerson] = useState('player');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
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
  return <main className={`game-hub hub-page-${page}`}>
    <VisualImage uri={episode01BackgroundUri(resolve)} alt="" className="hub-backdrop" />
    <div className="hub-shade" />
    <header className="hub-header">
      <div className="hub-brand"><span>PSI : ZERO DAY</span><small>{t('ui.hub.brandline')}</small></div>
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
      {page === 'home' ? <>
        <div className="hub-intro"><span className="hub-kicker">EPISODE 01 / {t('ep01.title')}</span><h1>{t('ui.hub.hero')}</h1><p>{t('ui.hub.hero.hint')}</p>
          <button className="hub-primary" type="button" onClick={onPlay}><HubIcon kind="play" />{playLabel}<b>›</b></button>
        </div>
        <div className="hub-cast">{featured.map((id, index) => <button key={id} type="button" className={`hub-hero-person hero-${index}`} style={{ '--cast-accent': characterVisual(id)?.accent } as CSSProperties} onClick={() => { setSelectedPerson(id); setPage('people'); }}>
          <VisualImage uri={characterPortraitUri(id, resolve)} alt="" /><span><strong>{session.character(id)?.name}</strong><small>{session.character(id)?.role}</small></span>
        </button>)}</div>
        <div className="hub-chapter-strip">{journey.map((step, index) => <button key={step.id} type="button" data-status={step.status} onClick={() => { setSelectedStep(step.id); setPage('map'); }}>
          <VisualImage uri={characterPortraitUri(step.character, resolve)} alt="" /><span className="chapter-number">{String(index + 1).padStart(2, '0')}</span><div><small>{t(`ui.hub.step.${step.status}`)}</small><strong>{t(step.title)}</strong></div><HubIcon kind={step.status === 'done' ? 'check' : step.status === 'locked' ? 'lock' : 'play'} />
        </button>)}</div>
      </> : page === 'map' ? <>
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
      </div> : page === 'guide' ? <FieldGuide session={session} /> : <div className="hub-journal">
        <span className="hub-kicker">FIELD JOURNAL</span><h1>{t('ui.review.title')}</h1><p>{t('ui.review.hint')}</p>
        {review.length ? <ol>{review.map(entry => <li key={entry.key}><strong>{t(entry.event_text_id)}</strong><h2>{t(entry.choice_text_id)}</h2>{entry.result_text_id ? <p>{t(entry.result_text_id)}</p> : null}</li>)}</ol> : <div className="hub-empty"><HubIcon kind="journal" /><h2>{t('ui.hub.journal.empty')}</h2><p>{t('ui.hub.journal.empty_hint')}</p></div>}
        <button className="hub-primary" type="button" onClick={onPlay}><HubIcon kind="play" />{playLabel}</button>
      </div>}
    </section>
    <footer className="hub-footer"><span>PSI · ZERO DAY</span><span>{t('ui.hub.footer')}</span><small>EPISODE 01 · {t('ep01.title')}</small></footer>
  </main>;
}
