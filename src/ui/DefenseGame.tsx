import { useEffect, useState } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import { characterPortraitUri } from '../app/episode-visual-assets';
import { defenseSupportCharacterId } from '../app/defense-support';
import { defenseText as t } from '../app/defense-text';
import { defenseBoardArtUri, defenseControlPqComposite, defenseEnemyArtUri, defenseSwiftPqAsset, defenseTowerArtUri, defenseVisualProduction } from '../app/defense-visual-assets';
import { useDefensePersistence } from '../app/use-defense-persistence';
import { readDataCenterState } from '../app/data-center-state';
import { readRemodelState } from '../app/remodel-state';
import { dataCenterDefense, dataCenterScenario } from '../content/data-center';
import { zeroBreachContent } from '../content/defense';
import { remodelDefense, remodelScenario } from '../content/remodel';
import { siteDefenseContentForScenario, siteProcessMapByMapId } from '../content/site-process-maps';
import {
  defenseContentForScenario, defenseEventById, defenseEvents, resolveDefenseContentForRun,
} from '../content/defense-events';
import { defenseEventAvailabilityFromState } from '../app/defense-story-bridge';
import type {
  DefenseContent, DefenseEnemyId, DefenseRunState, DefenseSupportId, DefenseTowerId, DefenseTowerState,
} from '../domain/defense';
import {
  advanceDefense, applyDefenseCommand, defensePositionAtDistance, defenseResult,
} from '../engine/defense';
import type { StoragePort } from '../platform/storage';
import { VisualImage } from './VisualSlot';
import { DefenseConflictOverlay, DefensePersistenceGate, DefenseSaveStatus } from './DefensePersistenceGate';
import { DefenseTutorial, useDefenseTutorial } from './DefenseTutorial';
import { applyDefCoreOneStepRuntime, DefCoreOneStepBoardOverlay, DefCoreOneStepOverlay, useDefCoreOneStep } from './DefCoreOneStep';
import { useDefenseAudio } from './useDefenseAudio';
import { useDefenseEffects } from './useDefenseEffects';
import { SiteProcessMapBoardOverlay } from './SiteProcessMapBoardOverlay';
import { RemodelBoardOverlay } from './RemodelBoardOverlay';
import { DataCenterBoardOverlay } from './DataCenterBoardOverlay';

function statusLabel(state: DefenseRunState): string {
  return t(`defense.ui.${state.status.toLowerCase()}`);
}

function towerDefinition(content: DefenseContent, id: DefenseTowerId) {
  return content.towers.find(item => item.id === id)!;
}

function towerLevel(content: DefenseContent, tower: DefenseTowerState) {
  return towerDefinition(content, tower.towerId).levels.find(level => level.id === tower.levelId)!;
}

function enemyName(id: DefenseEnemyId) {
  return t(`defense.enemy.${id}.name`);
}

function recommendedTowerForLeaks(leaks: DefenseRunState['leakedByEnemy']): DefenseTowerId {
  const entries = (Object.entries(leaks) as [DefenseEnemyId, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  const enemy = entries[0]?.[0] ?? 'VEILED';
  if (enemy === 'VEILED') return 'SENSOR';
  if (enemy === 'SWARM') return 'BURST';
  if (enemy === 'SWIFT') return 'CONTROL';
  return 'PULSE';
}

function wavePreview(content: DefenseContent, state: DefenseRunState) {
  const waveId = state.status === 'RUNNING'
    ? Math.min(content.waves.length, state.waveId + 1)
    : state.waveId;
  return content.waves.find(wave => wave.id === waveId) ?? content.waves.at(-1)!;
}

function TowerGlyph({ content, tower }: { content: DefenseContent; tower: DefenseTowerState }) {
  const level = towerLevel(content, tower);
  const firing = tower.attackCooldown === level.intervalTicks;
  const revealing = tower.towerId === 'SENSOR'
    && typeof level.revealIntervalTicks === 'number'
    && tower.revealCooldown === level.revealIntervalTicks;
  const controlPq = tower.towerId === 'CONTROL' && tower.levelId === 'L1' ? defenseControlPqComposite() : null;
  if (controlPq) {
    return <g
      className={`zb-tower zb-tower-production zb-control-pq${firing ? ' is-firing' : ''}`}
      data-pq-control="CONTROL:L1"
      data-tower-family={tower.towerId}
    >
      {firing ? <g className="zb-control-intervention" aria-hidden="true">
        <circle r="35" />
        <path d="M-30 18L-18 8M18 8L30 18M-18 8H18" />
      </g> : null}
      <image
        href={controlPq.barrierUri}
        x="-55"
        y="-22"
        width="110"
        height="70"
        preserveAspectRatio="xMidYMid meet"
        className="zb-control-pq-barrier"
        aria-hidden="true"
      />
      <image
        href={controlPq.marshalUri}
        x="-31"
        y="-77"
        width="62"
        height="93"
        preserveAspectRatio="xMidYMid meet"
        className="zb-control-pq-marshal"
        aria-hidden="true"
      />
    </g>;
  }
  const artUri = defenseTowerArtUri(tower.towerId, tower.levelId);
  if (artUri) {
    return <g
      className={`zb-tower zb-tower-production${firing ? ' is-firing' : ''}`}
      data-production-tower-art={`${tower.towerId}:${tower.levelId}`}
      data-tower-family={tower.towerId}
    >
      {firing && tower.towerId !== 'CONTROL' ? <circle r="31" className="zb-attack-flash" aria-hidden="true" /> : null}
      {firing && tower.towerId === 'CONTROL' ? <g className="zb-control-intervention" aria-hidden="true">
        <circle r="35" />
        <path d="M-30 18L-18 8M18 8L30 18M-18 8H18" />
      </g> : null}
      {firing && tower.towerId === 'BURST' ? <circle r="48" className="zb-area-pulse" aria-hidden="true" /> : null}
      {revealing ? <circle r="58" className="zb-detect-pulse" aria-hidden="true" /> : null}
      <image
        href={artUri}
        x="-64"
        y="-98"
        width="128"
        height="128"
        preserveAspectRatio="xMidYMid meet"
        className="zb-tower-production-image"
      />
    </g>;
  }
  return <g
    className={`zb-tower zb-tower-${tower.towerId.toLowerCase()}${firing ? ' is-firing' : ''}`}
    data-art-state="prototype"
  >
    <circle r="25" className="zb-tower-base" />
    {tower.towerId === 'PULSE' ? <>
      <circle r="14" className="zb-tower-core" />
      <path d="M-12 0h24M0-12v24" className="zb-tower-line" />
    </> : null}
    {tower.towerId === 'BURST' ? <>
      <polygon points="-17,-11 0,-20 17,-11 17,11 0,20 -17,11" className="zb-tower-core" />
      <circle r="7" className="zb-tower-line" />
    </> : null}
    {tower.towerId === 'CONTROL' ? <>
      <path d="M-16 12V-6Q0-22 16-6V12" className="zb-tower-line zb-tower-arch" />
      <circle r="5" className="zb-tower-core" />
    </> : null}
    {tower.towerId === 'SENSOR' ? <>
      <path d="M0 18V-8" className="zb-tower-line" />
      <circle cy="-9" r="10" className="zb-tower-core" />
      <circle cy="-9" r="17" className="zb-sensor-ring" />
    </> : null}
    <text y="40" textAnchor="middle">{tower.levelId}</text>
  </g>;
}

function EnemyGlyph({ content, enemy, state, isHit }: { content: DefenseContent; enemy: DefenseRunState['enemies'][number]; state: DefenseRunState; isHit: boolean }) {
  const definition = content.enemies.find(item => item.id === enemy.enemyId)!;
  const pos = defensePositionAtDistance(content.map.path, enemy.distance);
  const hpRatio = Math.max(0, Math.min(1, enemy.hp / definition.hp));
  const hidden = definition.hidden && enemy.revealUntilTick <= state.tick && state.revealAllUntilTick <= state.tick;
  const bossArmor = definition.boss && enemy.bossArmorFromTick <= state.tick && state.tick < enemy.bossArmorUntilTick;
  const slowed = enemy.slowEffects.some(effect => effect.startTick <= state.tick && state.tick < effect.endTick);
  const revealed = definition.hidden && (enemy.revealUntilTick > state.tick || state.revealAllUntilTick > state.tick);
  const swiftPq = enemy.enemyId === 'SWIFT' ? defenseSwiftPqAsset() : null;
  const artUri = defenseEnemyArtUri(enemy.enemyId);
  const artSize = definition.boss ? 92 : 60;
  const artY = definition.boss ? -60 : -39;
  return <g
    transform={`translate(${pos.x} ${pos.y})`}
    className={`zb-enemy zb-enemy-${enemy.enemyId.toLowerCase()}${hidden ? ' is-hidden' : ''}${bossArmor ? ' has-boss-armor' : ''}${isHit ? ' is-hit' : ''}`}
    data-enemy={enemy.enemyId}
    data-distance={enemy.distance.toFixed(3)}
  >
    {isHit ? <circle r="28" className="zb-impact-ring" aria-hidden="true" /> : null}
    {slowed && enemy.enemyId !== 'SWIFT' ? <circle r={definition.boss ? 42 : 24} className="zb-slow-ring" aria-hidden="true" /> : null}
    {slowed && enemy.enemyId === 'SWIFT' ? <g className="zb-swift-brake-cue" aria-hidden="true">
      <circle r="25" />
      <path d="M-26 13H-10M-30 19H-14" />
    </g> : null}
    {revealed ? <circle r={definition.boss ? 48 : 29} className="zb-reveal-ring" aria-hidden="true" /> : null}
    {bossArmor ? <circle r="50" className="zb-boss-armor-effect" aria-hidden="true" /> : null}
    {swiftPq ? <image
      href={swiftPq.uri}
      x="-39"
      y="-34"
      width="78"
      height="58"
      preserveAspectRatio="xMidYMid meet"
      className="zb-swift-pq-asset"
      data-pq-swift="SWIFT"
      aria-hidden="true"
    /> : artUri ? <image
      href={artUri}
      x={-artSize / 2}
      y={artY}
      width={artSize}
      height={artSize}
      preserveAspectRatio="xMidYMid meet"
      className="zb-enemy-production-image"
      data-production-enemy-art={enemy.enemyId}
    /> : enemy.enemyId === 'SWIFT' ? <polygon points="-16,-9 18,0 -16,9 -7,0" data-art-state="prototype" /> :
      enemy.enemyId === 'ARMORED' ? <polygon points="-16,-14 8,-18 20,0 8,18 -16,14 -22,0" data-art-state="prototype" /> :
      enemy.enemyId === 'SWARM' ? <polygon points="-13,-4 -5,-14 4,-8 13,-13 16,-2 8,7 12,16 0,12 -9,18 -11,7 -20,3" data-art-state="prototype" /> :
      enemy.enemyId === 'VEILED' ? <>
        <circle r="17" className="zb-enemy-hollow" data-art-state="prototype" />
        <path d="M-13 0h7M6 0h7" className="zb-enemy-cut" />
      </> :
      enemy.enemyId === 'BOSS' ? <>
        <circle r="28" data-art-state="prototype" />
        <circle r="20" className="zb-boss-ring" />
        <circle r="10" className="zb-boss-core" />
      </> : <circle r="16" data-art-state="prototype" />}
    <rect x="-22" y="-31" width="44" height="5" rx="2.5" className="zb-hp-track" />
    <rect x="-22" y="-31" width={44 * hpRatio} height="5" rx="2.5" className="zb-hp-fill" />
  </g>;
}

function SupportCard({
  session, supportId, onChoose,
}: {
  session: EpisodeSession;
  supportId: DefenseSupportId;
  onChoose: () => void;
}) {
  const characterId = defenseSupportCharacterId(supportId);
  const character = session.character(characterId);
  const portrait = characterPortraitUri(characterId, id => session.assetUri(id));
  return <button className="zb-support-card" type="button" onClick={onChoose} data-support={supportId}>
    <VisualImage uri={portrait} alt="" className="zb-support-portrait" />
    <span>
      <small>{supportId}</small>
      <strong>{character?.name ?? t(`defense.support.${supportId}.suggestedName`)}</strong>
      <em>{character?.role ?? ''}</em>
      <b>{t(`defense.support.${supportId}.skill`)}</b>
    </span>
    <i>{t('defense.ui.support.choose')}</i>
  </button>;
}

export function DefenseGame({
  session, onExit, storage, requestedScenarioId = zeroBreachContent.scenario.id,
}: {
  readonly session: EpisodeSession;
  readonly onExit: () => void;
  readonly storage?: StoragePort;
  readonly requestedScenarioId?: string | null;
}) {
  const persistence = useDefensePersistence(zeroBreachContent, onExit, storage, resolveDefenseContentForRun);
  const { state, setState } = persistence;
  const e1 = defenseEvents[0]!;
  const episodeState = session.getSnapshot?.().state ?? null;
  const e1Availability = defenseEventAvailabilityFromState(e1, episodeState, persistence.document);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(() => requestedScenarioId);
  const selectedScenarioAllowed = selectedScenarioId === zeroBreachContent.scenario.id
    || selectedScenarioId === remodelDefense.scenario.id
    || selectedScenarioId === dataCenterDefense.scenario.id
    || Boolean(selectedScenarioId && siteDefenseContentForScenario(selectedScenarioId))
    || (selectedScenarioId === e1.id && e1Availability.unlocked);
  const content = state
    ? resolveDefenseContentForRun(state)
    : selectedScenarioAllowed && selectedScenarioId
      ? defenseContentForScenario(selectedScenarioId)
      : zeroBreachContent;
  const TOWER_IDS = content.scenario.availableTowers as readonly DefenseTowerId[];
  const SUPPORT_IDS = content.scenario.availableSupports as readonly DefenseSupportId[];
  const BOARD_ART_URI = defenseBoardArtUri(content.map.id);
  const activeSiteMap = siteProcessMapByMapId(content.map.id)
    ?? (content.map.id === remodelScenario.map.id ? remodelScenario.map : undefined)
    ?? (content.map.id === dataCenterScenario.map.id ? dataCenterScenario.map : undefined);
  const remodelWorldState = content.scenario.id === remodelScenario.id ? readRemodelState() : null;
  const dataCenterWorldState = content.scenario.id === dataCenterScenario.id ? readDataCenterState() : null;
  const [selectedPadId, setSelectedPadId] = useState<string | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [portrait, setPortrait] = useState(() => window.matchMedia?.('(orientation: portrait)').matches ?? false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const tutorial = useDefenseTutorial(state, content, paused => {
    if (!state) return;
    persistence.dispatch({ type: 'SetPaused', paused });
  });
  const audio = useDefenseAudio(state);
  const effects = useDefenseEffects(state);
  const oneStep = useDefCoreOneStep({
    state,
    onPause: paused => {
      if (!state) return;
      persistence.dispatch({ type: 'SetPaused', paused });
    },
    playCue: audio.playCue,
    armAudio: audio.armAudio,
    muted: audio.muted,
  });

  const selectedTower = state?.towers.find(tower => tower.id === selectedTowerId) ?? null;
  const selectedPad = content.map.pads.find(pad => pad.id === selectedPadId) ?? null;
  const selectedPadTower = state?.towers.find(tower => tower.padId === selectedPadId) ?? null;
  const supportCharacterId = state ? defenseSupportCharacterId(state.supportId) : null;
  const supportCharacter = supportCharacterId ? session.character(supportCharacterId) : null;
  const supportPortrait = supportCharacterId ? characterPortraitUri(supportCharacterId, id => session.assetUri(id)) : undefined;
  const preview = state ? wavePreview(content, state) : null;
  const result = state && (state.status === 'WON' || state.status === 'LOST') ? defenseResult(state) : null;
  const activeEvent = state?.eventId ? defenseEventById(state.eventId) : undefined;
  const leakedEntries = state
    ? (Object.entries(state.leakedByEnemy) as [DefenseEnemyId, number][]).filter(([, count]) => count > 0)
    : [];
  const recommendedTowerId = state ? recommendedTowerForLeaks(state.leakedByEnemy) : 'SENSOR';
  const eventDebriefTextId = activeEvent && result
    ? result.won
      ? result.stars === 3 ? activeEvent.debriefTextIds.perfect : activeEvent.debriefTextIds.win
      : activeEvent.debriefTextIds.lose
    : null;

  useEffect(() => {
    if (!state || state.paused || (state.status !== 'RUNNING' && state.status !== 'INTERMISSION')) return;
    const timer = window.setInterval(() => {
      setState(current => {
        if (!current) return current;
        const advanced = advanceDefense(current, resolveDefenseContentForRun(current), 1);
        return applyDefCoreOneStepRuntime(current, advanced, oneStep.choice, oneStep.choiceTick);
      });
    }, content.tickMs);
    return () => window.clearInterval(timer);
  }, [state?.status, state?.paused, state?.speed, oneStep.choice, oneStep.choiceTick]);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return;
      setState(current => current && !current.paused
        ? applyDefenseCommand(current, resolveDefenseContentForRun(current), { type: 'SetPaused', paused: true })
        : current);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.('(orientation: portrait)');
    if (!media) return;
    const sync = () => {
      const next = media.matches;
      setPortrait(next);
      if (next) {
        setState(current => current && !current.paused
          ? applyDefenseCommand(current, resolveDefenseContentForRun(current), { type: 'SetPaused', paused: true })
          : current);
      }
    };
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!state || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === 'Space') {
        event.preventDefault();
        setState(current => current
          ? applyDefenseCommand(current, resolveDefenseContentForRun(current), { type: 'SetPaused', paused: !current.paused })
          : current);
      }
      if (event.key === 'Escape') {
        setSelectedPadId(null);
        setSelectedTowerId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state]);

  const dispatch = (command: Parameters<typeof applyDefenseCommand>[2]) => {
    if (!state) return;
    try {
      if (command.type === 'StartWave' || (command.type === 'SetPaused' && command.paused === false && state.status === 'RUNNING')) {
        audio.armAudio();
      }
      const next = persistence.dispatch(command);
      if (!next) return;
      setNotice('');
      if (command.type === 'Build') {
        const built = next.towers.find(tower => tower.padId === command.padId);
        setSelectedTowerId(built?.id ?? null);
        audio.playCue('place');
      }
      if (command.type === 'Upgrade') audio.playCue('upgrade');
      if (command.type === 'Sell') {
        setSelectedTowerId(null);
        audio.playCue('sell');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('defense.ui.command_error');
      setNotice(message === 'Insufficient resource' ? t('defense.ui.no_resource') : message);
    }
  };

  const choosePad = (padId: string) => {
    if (!state) return;
    const tower = state.towers.find(item => item.padId === padId);
    setSelectedPadId(padId);
    setSelectedTowerId(tower?.id ?? null);
    setNotice('');
  };

  const startWithSupport = (supportId: DefenseSupportId) => {
    audio.playCue('select');
    persistence.startWithSupport(supportId, portrait, content);
  };

  const retry = () => {
    if (state) setSelectedScenarioId(state.scenarioId);
    persistence.retryAfterResult();
    setSelectedPadId(null);
    setSelectedTowerId(null);
    setNotice('');
  };

  if (!state && persistence.entry.kind !== 'select') {
    return <DefensePersistenceGate controller={persistence} />;
  }

  if (!state && !selectedScenarioAllowed) return <main className="zb-shell zb-prep zb-scenario-select" data-defense-screen="scenario-select">
    <header className="zb-prep-header">
      <div><small>{t('defense.ui.kicker')}</small><h1>{t('defense.scenario.title')}</h1></div>
      <button type="button" onClick={() => { void persistence.exitToMain(); }}>{t('defense.ui.exit')}</button>
    </header>
    <section className="zb-prep-copy">
      <h2>{t('defense.scenario.title')}</h2>
      <p>{t('defense.scenario.body')}</p>
    </section>
    <section className="zb-scenario-grid">
      <button type="button" className="zb-scenario-card is-unlocked" data-scenario="training-ramp-v1" onClick={() => setSelectedScenarioId(zeroBreachContent.scenario.id)}>
        <small>{t('defense.scenario.training.status')}</small>
        <strong>{t('defense.scenario.training.title')}</strong>
        <p>{t('defense.scenario.training.body')}</p>
        <b>{t('defense.scenario.choose')}</b>
      </button>
      <button type="button" className={`zb-scenario-card${e1Availability.unlocked ? ' is-unlocked' : ' is-locked'}`} data-scenario={e1.id}
        disabled={!e1Availability.unlocked} onClick={() => setSelectedScenarioId(e1.id)}>
        <small>{t(e1Availability.unlocked ? 'defense.scenario.event.status.unlocked' : 'defense.scenario.event.status.locked')}</small>
        <strong>{t(e1.titleTextId)}</strong>
        <p>{t(e1.briefingTextId)}</p>
        {!e1Availability.unlocked ? <ul>
          {e1Availability.missing.map((missing, index) => <li key={index}>{t(missing.kind === 'scenario-cleared'
            ? 'defense.scenario.event.lock.training' : 'defense.scenario.event.lock.story')}</li>)}
        </ul> : <b>{t('defense.scenario.choose')}</b>}
      </button>
    </section>
  </main>;

  if (!state) return <main className="zb-shell zb-prep" data-defense-screen="support-select" data-scenario={content.scenario.id} data-map={content.map.id}>
    <header className="zb-prep-header">
      <div><small>{t('defense.ui.kicker')}</small><h1>{t('defense.ui.hub.title')}</h1></div>
      <button type="button" onClick={() => setSelectedScenarioId(null)}>{t('defense.scenario.back')}</button>
      <button type="button" onClick={() => { void persistence.exitToMain(); }}>{t('defense.ui.exit')}</button>
    </header>
    <section className="zb-prep-copy">
      <span>{activeSiteMap ? 'G5 · 공정별 맵 체험' : content.scenario.eventId ? t('defense.scenario.event.status.unlocked') : t('defense.scenario.training.status')}</span>
      <h2>{activeSiteMap ? activeSiteMap.label : content.scenario.eventId ? t(defenseEventById(content.scenario.eventId)?.titleTextId ?? 'defense.event.e1.title') : t('defense.ui.support.title')}</h2>
      <p>{activeSiteMap ? '동일한 현장 디펜스 규칙으로 공법·공정에 따른 동선과 개입 위치의 차이를 체험합니다.' : content.scenario.eventId ? t(defenseEventById(content.scenario.eventId)?.briefingTextId ?? 'defense.event.e1.briefing') : t('defense.ui.support.body')}</p>
    </section>
    <section className="zb-support-grid">
      {SUPPORT_IDS.map(id => <SupportCard
        key={id}
        session={session}
        supportId={id}
        onChoose={() => startWithSupport(id)}
      />)}
    </section>
  </main>;

  const selectedLevel = selectedTower ? towerLevel(content, selectedTower) : null;
  const upgrades = selectedTower
    ? towerDefinition(content, selectedTower.towerId).levels.filter(level => level.from === selectedTower.levelId)
    : [];
  const refund = selectedTower ? Math.floor(selectedTower.invested * content.sellRate) : 0;
  const supportCooldownSeconds = Math.ceil(state.supportCooldownRemaining * content.tickMs / 1000);

  return <main className={`zb-shell${effects.shieldHit ? ' is-shield-hit' : ''}${oneStep.active ? ' is-def-core-active' : ''}`} data-defense-screen="combat" data-def-core-phase={oneStep.phase} data-def-core-choice={oneStep.choice ?? ''} data-status={state.status} data-speed={state.speed} data-run-id={state.runId} data-tick={state.tick} data-wave={state.waveId} data-shield={state.shield} data-resource={state.resource} data-visual-version={defenseVisualProduction.visualVersion} data-audio-muted={audio.muted ? 'true' : 'false'} data-scenario={state.scenarioId} data-event={state.eventId ?? ''} data-map={content.map.id} data-remodel-phase={remodelWorldState?.phase ?? ''} data-data-center-phase={dataCenterWorldState?.phase ?? ''} data-energy-state={dataCenterWorldState?.energyState ?? ''}>
    <header className="zb-hud">
      <div className="zb-brand"><small>ZERO BREACH</small><strong>{t('defense.ui.hub.title')}</strong></div>
      <div className="zb-meter"><span>{t('defense.ui.shield')}</span><strong>{state.shield}</strong></div>
      <div className="zb-meter"><span>{t('defense.ui.resource')}</span><strong>R {state.resource}</strong></div>
      <div className="zb-meter"><span>{t('defense.ui.wave')}</span><strong>{state.waveId} / {content.waves.length}</strong></div>
      <div className="zb-status"><span>{statusLabel(state)}</span>{state.paused ? <b>PAUSED</b> : null}</div>
      <button
        type="button"
        className="zb-hud-button"
        aria-pressed={state.paused}
        onClick={() => dispatch({ type: 'SetPaused', paused: !state.paused })}
      >{t(state.paused ? 'defense.ui.resume' : 'defense.ui.pause')}</button>
      <div className="zb-speed" aria-label={t('defense.ui.speed')}>
        {[1, 2].map(speed => <button
          key={speed}
          type="button"
          className={state.speed === speed ? 'is-active' : ''}
          onClick={() => dispatch({ type: 'SetSpeed', speed: speed as 1 | 2 })}
        >{speed}×</button>)}
      </div>
      <button type="button" className="zb-exit" onClick={() => { void persistence.exitToMain(); }}>{t('defense.ui.exit')}</button>
    </header>
    <button className="zb-defense-settings" type="button" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(open => !open)}>설정</button>
    {settingsOpen ? <section className="zb-defense-settings-panel" aria-label="현장 디펜스 설정">
      <button type="button" onClick={() => { tutorial.replay(); setSettingsOpen(false); }}>{t('defense.tutorial.replay')}</button>
      <button
        type="button"
        data-audio-muted={audio.muted ? 'true' : 'false'}
        aria-pressed={audio.muted}
        onClick={() => audio.setMuted(!audio.muted)}
      ><span>SOUND</span><b>{audio.muted ? 'OFF' : 'ON'}</b></button>
    </section> : null}
    <DefenseSaveStatus controller={persistence} />
    <DefenseTutorial controller={tutorial} />

    <section className="zb-stage">
      <div className="zb-board-wrap">
        <svg
          className="zb-board"
          viewBox={`0 0 ${content.map.width} ${content.map.height}`}
          role="img"
          aria-label={t('defense.map.ramp-01.name')}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="zb-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M50 0H0V50" className="zb-grid-line" />
            </pattern>
          </defs>
          <rect width="1000" height="600" rx="22" className="zb-board-bg" />
          {BOARD_ART_URI ? <image
            href={BOARD_ART_URI}
            x="0"
            y="0"
            width="1000"
            height="600"
            preserveAspectRatio="none"
            className="zb-board-production-art"
            data-production-board-art={content.map.id}
          /> : <rect width="1000" height="600" rx="22" fill="url(#zb-grid)" />}
          <SiteProcessMapBoardOverlay mapId={content.map.id} />
          <RemodelBoardOverlay state={remodelWorldState} />
          <DataCenterBoardOverlay state={dataCenterWorldState} />
          <polyline
            points={content.map.path.map(point => point.join(',')).join(' ')}
            className="zb-path-shoulder"
            fill="none"
            aria-hidden="true"
          />
          <polyline
            points={content.map.path.map(point => point.join(',')).join(' ')}
            className="zb-path-shadow"
            fill="none"
          />
          <polyline
            points={content.map.path.map(point => point.join(',')).join(' ')}
            className="zb-path"
            fill="none"
          />
          <polyline
            points={content.map.path.map(point => point.join(',')).join(' ')}
            className="zb-path-centerline"
            fill="none"
            aria-hidden="true"
          />
          {selectedTower && selectedLevel ? (() => {
            const pad = content.map.pads.find(item => item.id === selectedTower.padId)!;
            return <circle cx={pad.x} cy={pad.y} r={selectedLevel.range} className="zb-range-preview" />;
          })() : null}
          {content.map.pads.map(pad => <g key={`pad-${pad.id}`} className="zb-pad-runtime">
            <circle cx={pad.x} cy={pad.y} r="42" className="zb-pad-hardstand" aria-hidden="true" />
            <circle
              cx={pad.x}
              cy={pad.y}
              r="22"
              className={`zb-pad-mark${selectedPadId === pad.id ? ' is-selected' : ''}${state.towers.some(tower => tower.padId === pad.id) ? ' is-occupied' : ''}`}
            />
          </g>)}
          {state.freezeMovementUntilTick > state.tick ? <g className="zb-support-field is-coordinator" aria-hidden="true">
            <rect x="8" y="8" width="984" height="584" rx="20" />
            <path d="M120 300H880" />
          </g> : null}
          {state.rangeBonusUntilTick > state.tick ? <g className="zb-support-field is-observer" aria-hidden="true">
            <circle cx="500" cy="300" r="210" />
            <circle cx="500" cy="300" r="130" />
          </g> : null}
          {effects.resolvedEnemyEchoes.map(echo => {
            const pos = defensePositionAtDistance(content.map.path, echo.distance);
            return <g key={`resolved-${echo.id}`} transform={`translate(${pos.x} ${pos.y})`} className="zb-resolve-burst" data-effect="resolve" aria-hidden="true">
              <circle r="10" />
              <path d="M-24 0H24M0-24V24M-17-17L17 17M17-17L-17 17" />
            </g>;
          })}
          <DefCoreOneStepBoardOverlay state={state} controller={oneStep} />
          {state.towers.map(tower => {
            const pad = content.map.pads.find(item => item.id === tower.padId)!;
            return <g key={tower.id} transform={`translate(${pad.x} ${pad.y})`}>
              <TowerGlyph content={content} tower={tower} />
            </g>;
          })}
          {state.enemies.map(enemy => <EnemyGlyph key={enemy.id} content={content} enemy={enemy} state={state} isHit={effects.impactedEnemyIds.has(enemy.id)} />)}
        </svg>

        <div className="zb-pad-layer" aria-label="설치 패드">
          {content.map.pads.map(pad => {
            const occupied = state.towers.some(tower => tower.padId === pad.id);
            return <button
              key={pad.id}
              type="button"
              className={`zb-pad-hit${selectedPadId === pad.id ? ' is-selected' : ''}`}
              style={{ left: `${pad.x / content.map.width * 100}%`, top: `${pad.y / content.map.height * 100}%` }}
              aria-label={`${pad.id} · ${occupied ? '타워 설치됨' : t('defense.ui.empty_pad')}`}
              onClick={() => choosePad(pad.id)}
            ><span>{pad.id}</span></button>;
          })}
        </div>

        <aside className="zb-wave-preview">
          <small>{state.status === 'RUNNING' ? t('defense.ui.next_wave') : t('defense.ui.current_wave')}</small>
          <strong>WAVE {preview?.id}</strong>
          <ul>
            {preview?.groups.map((group, index) => <li key={`${group.enemy}-${index}`}>
              <span>{enemyName(group.enemy)}</span><b>×{group.count}</b>
            </li>)}
          </ul>
        </aside>

        <div className="zb-board-caption">
          <span>{activeSiteMap ? 'G5 · PROCESS MAP' : t('defense.ui.dev_notice')}</span>
          <b>{activeSiteMap?.label ?? t('defense.map.ramp-01.name')}</b>
        </div>
      </div>
    </section>

    <DefCoreOneStepOverlay controller={oneStep} />

    <footer className="zb-command">
      <section className="zb-selection">
        {!selectedPad ? <div className="zb-empty-selection"><strong>{t('defense.ui.select_pad')}</strong><span>8 PAD · 1000×600 LOGICAL BOARD</span></div> : null}

        {selectedPad && !selectedPadTower ? <div className="zb-build-panel">
          <div className="zb-panel-heading"><span>{selectedPad.id}</span><strong>{t('defense.ui.select_tower')}</strong></div>
          <div className="zb-tower-shop">
            {TOWER_IDS.map(towerId => {
              const definition = towerDefinition(content, towerId);
              const level = definition.levels.find(item => item.id === 'L1')!;
              const disabled = state.resource < level.cost;
              return <button
                key={towerId}
                type="button"
                disabled={disabled}
                onClick={() => dispatch({ type: 'Build', padId: selectedPad.id, towerId })}
              >
                {defenseTowerArtUri(towerId, 'L1')
                  ? <img src={defenseTowerArtUri(towerId, 'L1') ?? undefined} className="zb-shop-production-art" alt="" aria-hidden="true" />
                  : <span className={`zb-shop-glyph zb-shop-${towerId.toLowerCase()}`} aria-hidden="true" data-art-state="prototype" />}
                <span><strong>{t(`defense.tower.${towerId}.name`)}</strong><small>{t(`defense.tower.${towerId}.role`)}</small></span>
                <b>R {level.cost}</b>
              </button>;
            })}
          </div>
        </div> : null}

        {selectedTower && selectedLevel ? <div className="zb-tower-panel">
          <div className="zb-panel-heading">
            <span>{selectedTower.padId} · {selectedTower.levelId}</span>
            <strong>{t(`defense.tower.${selectedTower.towerId}.name`)}</strong>
          </div>
          <div className="zb-tower-stats">
            <span>{t('defense.ui.damage')} <b>{selectedLevel.damage}</b></span>
            <span>{t('defense.ui.range')} <b>{selectedLevel.range}</b></span>
            <span>{t('defense.ui.interval')} <b>{(selectedLevel.intervalTicks * content.tickMs / 1000).toFixed(2)}s</b></span>
          </div>
          <div className="zb-target-mode">
            <span>{t('defense.ui.target')}</span>
            {content.targetModes.map(mode => <button
              key={mode}
              type="button"
              className={selectedTower.targetMode === mode ? 'is-active' : ''}
              onClick={() => dispatch({ type: 'SetTargetMode', towerInstanceId: selectedTower.id, targetMode: mode })}
            >{t(`defense.ui.target.${mode}`)}</button>)}
          </div>
          <div className="zb-upgrades">
            {upgrades.map(level => <button
              key={level.id}
              type="button"
              disabled={state.resource < level.cost}
              onClick={() => dispatch({ type: 'Upgrade', towerInstanceId: selectedTower.id, levelId: level.id })}
            >
              <span>{level.id === 'L3A' || level.id === 'L3B' ? t(`defense.tower.${selectedTower.towerId}.${level.id}.name`) : `${t('defense.ui.upgrade')} ${level.id}`}</span>
              <b>R {level.cost}</b>
            </button>)}
            <button className="zb-sell" type="button" onClick={() => dispatch({ type: 'Sell', towerInstanceId: selectedTower.id })}>
              <span>{t('defense.ui.sell')}</span><b>R {refund}</b>
            </button>
          </div>
        </div> : null}
      </section>

      <section className="zb-run-controls">
        <div className="zb-support-action">
          <VisualImage uri={supportPortrait} alt="" className="zb-support-mini" />
          <span><small>{supportCharacter?.name ?? state.supportId}</small><strong>{t(`defense.support.${state.supportId}.skill`)}</strong></span>
          <button
            type="button"
            disabled={state.status !== 'RUNNING' || state.paused || state.supportCooldownRemaining > 0}
            onClick={() => dispatch({ type: 'UseSupport' })}
          >{state.supportCooldownRemaining > 0 ? `${supportCooldownSeconds}s` : t('defense.ui.support')}</button>
        </div>
        {(state.status === 'READY' || state.status === 'INTERMISSION') ? <button
          className="zb-start-wave"
          type="button"
          onClick={() => dispatch({ type: 'StartWave' })}
        >{t(state.status === 'READY' ? 'defense.ui.start_wave' : 'defense.ui.start_next')}</button> : null}
        {notice ? <p className="zb-notice" role="status">{notice}</p> : null}
      </section>
    </footer>

    {result ? <section className="zb-result" role="dialog" aria-modal="true" aria-labelledby="zb-result-title">
      <div>
        <small>{t('defense.ui.result')}</small>
        <h2 id="zb-result-title">{t(result.won ? 'defense.ui.won' : 'defense.ui.lost')}</h2>
        <dl>
          <div><dt>{t('defense.ui.stars')}</dt><dd>{result.stars} / 3</dd></div>
          <div><dt>{t('defense.ui.score')}</dt><dd>{result.score.toLocaleString()}</dd></div>
          <div><dt>{t('defense.ui.completed')}</dt><dd>{result.completedWaves} / 10</dd></div>
          <div><dt>{t('defense.ui.shield')}</dt><dd>{result.shield}</dd></div>
        </dl>
        {activeEvent && eventDebriefTextId ? <section className="zb-event-debrief" data-event-debrief={activeEvent.id}>
          <strong>{t(activeEvent.titleTextId)}</strong>
          <p>{t(eventDebriefTextId)}</p>
          <div className="zb-event-leaks">
            <small>{t('defense.event.result.leaks')}</small>
            {leakedEntries.length ? <ul>{leakedEntries.map(([enemyId, count]) => <li key={enemyId}>
              <span>{enemyName(enemyId)}</span><b>×{count}</b>
            </li>)}</ul> : <p>{t('defense.event.result.no_leaks')}</p>}
          </div>
          <div className="zb-event-recommend">
            <small>{t('defense.event.result.recommend')}</small>
            <strong>{t(`defense.tower.${recommendedTowerId}.name`)}</strong>
            <span>{t(`defense.tower.${recommendedTowerId}.role`)}</span>
          </div>
        </section> : null}
        {persistence.awardedCosmeticIds.length ? <div className="zb-result-rewards">
          <strong>{t('defense.save.reward')}</strong>
          {persistence.awardedCosmeticIds.map(id => <span key={id}>
            {id === 'tablet-skin-signal-blue'
              ? t('defense.event.reward.signal_blue')
              : id === content.scenario.threeStarCosmetic ? t('defense.save.reward.three') : t('defense.save.reward.first')}
          </span>)}
        </div> : null}
        <div className="zb-result-actions">
          <button type="button" onClick={retry}>{t('defense.ui.retry')}</button>
          <button type="button" onClick={() => { void persistence.exitToMain(); }}>{t(activeEvent ? 'defense.event.return' : 'defense.ui.exit')}</button>
        </div>
      </div>
    </section> : null}

    <DefenseConflictOverlay controller={persistence} />

    {portrait && !oneStep.active ? <section className="zb-rotate" role="dialog" aria-modal="true">
      <div><span aria-hidden="true">↻</span><h2>{t('defense.ui.rotate.title')}</h2><p>{t('defense.ui.rotate.body')}</p><button type="button" onClick={() => { void persistence.exitToMain(); }}>{t('defense.ui.exit')}</button></div>
    </section> : null}
  </main>;
}
