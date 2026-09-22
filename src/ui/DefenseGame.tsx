import { useEffect, useState } from 'react';
import type { EpisodeSession } from '../app/episode-session';
import { characterPortraitUri } from '../app/episode-visual-assets';
import { defenseSupportCharacterId } from '../app/defense-support';
import { defenseText as t } from '../app/defense-text';
import { useDefensePersistence } from '../app/use-defense-persistence';
import { zeroBreachContent } from '../content/defense';
import type {
  DefenseEnemyId, DefenseRunState, DefenseSupportId, DefenseTowerId, DefenseTowerState,
} from '../domain/defense';
import {
  advanceDefense, applyDefenseCommand, defensePositionAtDistance, defenseResult,
} from '../engine/defense';
import type { StoragePort } from '../platform/storage';
import { VisualImage } from './VisualSlot';
import { DefenseConflictOverlay, DefensePersistenceGate, DefenseSaveStatus } from './DefensePersistenceGate';
import { DefenseTutorial, useDefenseTutorial } from './DefenseTutorial';

const content = zeroBreachContent;
const TOWER_IDS = content.scenario.availableTowers as readonly DefenseTowerId[];
const SUPPORT_IDS = content.scenario.availableSupports as readonly DefenseSupportId[];

function statusLabel(state: DefenseRunState): string {
  return t(`defense.ui.${state.status.toLowerCase()}`);
}

function towerDefinition(id: DefenseTowerId) {
  return content.towers.find(item => item.id === id)!;
}

function towerLevel(tower: DefenseTowerState) {
  return towerDefinition(tower.towerId).levels.find(level => level.id === tower.levelId)!;
}

function enemyName(id: DefenseEnemyId) {
  return t(`defense.enemy.${id}.name`);
}

function wavePreview(state: DefenseRunState) {
  const waveId = state.status === 'RUNNING'
    ? Math.min(content.waves.length, state.waveId + 1)
    : state.waveId;
  return content.waves.find(wave => wave.id === waveId) ?? content.waves.at(-1)!;
}

function TowerGlyph({ tower }: { tower: DefenseTowerState }) {
  const level = towerLevel(tower);
  const firing = tower.attackCooldown === level.intervalTicks;
  return <g className={`zb-tower zb-tower-${tower.towerId.toLowerCase()}${firing ? ' is-firing' : ''}`}>
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

function EnemyGlyph({ enemy, state }: { enemy: DefenseRunState['enemies'][number]; state: DefenseRunState }) {
  const definition = content.enemies.find(item => item.id === enemy.enemyId)!;
  const pos = defensePositionAtDistance(content.map.path, enemy.distance);
  const hpRatio = Math.max(0, Math.min(1, enemy.hp / definition.hp));
  const hidden = definition.hidden && enemy.revealUntilTick <= state.tick && state.revealAllUntilTick <= state.tick;
  const bossArmor = definition.boss && enemy.bossArmorFromTick <= state.tick && state.tick < enemy.bossArmorUntilTick;
  return <g
    transform={`translate(${pos.x} ${pos.y})`}
    className={`zb-enemy zb-enemy-${enemy.enemyId.toLowerCase()}${hidden ? ' is-hidden' : ''}${bossArmor ? ' has-boss-armor' : ''}`}
    data-enemy={enemy.enemyId}
  >
    {enemy.enemyId === 'SWIFT' ? <polygon points="-16,-9 18,0 -16,9 -7,0" /> :
      enemy.enemyId === 'ARMORED' ? <polygon points="-16,-14 8,-18 20,0 8,18 -16,14 -22,0" /> :
      enemy.enemyId === 'SWARM' ? <polygon points="-13,-4 -5,-14 4,-8 13,-13 16,-2 8,7 12,16 0,12 -9,18 -11,7 -20,3" /> :
      enemy.enemyId === 'VEILED' ? <>
        <circle r="17" className="zb-enemy-hollow" />
        <path d="M-13 0h7M6 0h7" className="zb-enemy-cut" />
      </> :
      enemy.enemyId === 'BOSS' ? <>
        <circle r="28" />
        <circle r="20" className="zb-boss-ring" />
        <circle r="10" className="zb-boss-core" />
      </> : <circle r="16" />}
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

export function DefenseGame({ session, onExit, storage }: { readonly session: EpisodeSession; readonly onExit: () => void; readonly storage?: StoragePort }) {
  const persistence = useDefensePersistence(content, onExit, storage);
  const { state, setState } = persistence;
  const [selectedPadId, setSelectedPadId] = useState<string | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [portrait, setPortrait] = useState(() => window.matchMedia?.('(orientation: portrait)').matches ?? false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const tutorial = useDefenseTutorial(state, content, paused => {
    if (!state) return;
    persistence.dispatch({ type: 'SetPaused', paused });
  });

  const selectedTower = state?.towers.find(tower => tower.id === selectedTowerId) ?? null;
  const selectedPad = content.map.pads.find(pad => pad.id === selectedPadId) ?? null;
  const selectedPadTower = state?.towers.find(tower => tower.padId === selectedPadId) ?? null;
  const supportCharacterId = state ? defenseSupportCharacterId(state.supportId) : null;
  const supportCharacter = supportCharacterId ? session.character(supportCharacterId) : null;
  const supportPortrait = supportCharacterId ? characterPortraitUri(supportCharacterId, id => session.assetUri(id)) : undefined;
  const preview = state ? wavePreview(state) : null;
  const result = state && (state.status === 'WON' || state.status === 'LOST') ? defenseResult(state) : null;

  useEffect(() => {
    if (!state || state.paused || (state.status !== 'RUNNING' && state.status !== 'INTERMISSION')) return;
    const timer = window.setInterval(() => {
      setState(current => current ? advanceDefense(current, content, 1) : current);
    }, content.tickMs);
    return () => window.clearInterval(timer);
  }, [state?.status, state?.paused, state?.speed]);

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return;
      setState(current => current && !current.paused
        ? applyDefenseCommand(current, content, { type: 'SetPaused', paused: true })
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
          ? applyDefenseCommand(current, content, { type: 'SetPaused', paused: true })
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
          ? applyDefenseCommand(current, content, { type: 'SetPaused', paused: !current.paused })
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
      const next = persistence.dispatch(command);
      if (!next) return;
      setNotice('');
      if (command.type === 'Build') {
        const built = next.towers.find(tower => tower.padId === command.padId);
        setSelectedTowerId(built?.id ?? null);
      }
      if (command.type === 'Sell') {
        setSelectedTowerId(null);
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
    persistence.startWithSupport(supportId, portrait);
  };

  const retry = () => {
    persistence.retryAfterResult();
    setSelectedPadId(null);
    setSelectedTowerId(null);
    setNotice('');
  };

  if (!state && persistence.entry.kind !== 'select') {
    return <DefensePersistenceGate controller={persistence} />;
  }

  if (!state) return <main className="zb-shell zb-prep" data-defense-screen="support-select">
    <header className="zb-prep-header">
      <div><small>{t('defense.ui.kicker')}</small><h1>{t('defense.ui.hub.title')}</h1></div>
      <button type="button" onClick={() => { void persistence.exitToMain(); }}>{t('defense.ui.exit')}</button>
    </header>
    <section className="zb-prep-copy">
      <span>{t('defense.ui.dev_notice')}</span>
      <h2>{t('defense.ui.support.title')}</h2>
      <p>{t('defense.ui.support.body')}</p>
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

  const selectedLevel = selectedTower ? towerLevel(selectedTower) : null;
  const upgrades = selectedTower
    ? towerDefinition(selectedTower.towerId).levels.filter(level => level.from === selectedTower.levelId)
    : [];
  const refund = selectedTower ? Math.floor(selectedTower.invested * content.sellRate) : 0;
  const supportCooldownSeconds = Math.ceil(state.supportCooldownRemaining * content.tickMs / 1000);

  return <main className="zb-shell" data-defense-screen="combat" data-status={state.status} data-speed={state.speed} data-run-id={state.runId} data-tick={state.tick} data-wave={state.waveId} data-shield={state.shield} data-resource={state.resource}>
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
          <rect width="1000" height="600" rx="22" fill="url(#zb-grid)" />
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
          {selectedTower && selectedLevel ? (() => {
            const pad = content.map.pads.find(item => item.id === selectedTower.padId)!;
            return <circle cx={pad.x} cy={pad.y} r={selectedLevel.range} className="zb-range-preview" />;
          })() : null}
          {content.map.pads.map(pad => <circle
            key={`pad-${pad.id}`}
            cx={pad.x}
            cy={pad.y}
            r="30"
            className={`zb-pad-mark${selectedPadId === pad.id ? ' is-selected' : ''}${state.towers.some(tower => tower.padId === pad.id) ? ' is-occupied' : ''}`}
          />)}
          {state.towers.map(tower => {
            const pad = content.map.pads.find(item => item.id === tower.padId)!;
            return <g key={tower.id} transform={`translate(${pad.x} ${pad.y})`}>
              <TowerGlyph tower={tower} />
            </g>;
          })}
          {state.enemies.map(enemy => <EnemyGlyph key={enemy.id} enemy={enemy} state={state} />)}
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
          <span>{t('defense.ui.dev_notice')}</span>
          <b>{t('defense.map.ramp-01.name')}</b>
        </div>
      </div>
    </section>

    <footer className="zb-command">
      <section className="zb-selection">
        {!selectedPad ? <div className="zb-empty-selection"><strong>{t('defense.ui.select_pad')}</strong><span>8 PAD · 1000×600 LOGICAL BOARD</span></div> : null}

        {selectedPad && !selectedPadTower ? <div className="zb-build-panel">
          <div className="zb-panel-heading"><span>{selectedPad.id}</span><strong>{t('defense.ui.select_tower')}</strong></div>
          <div className="zb-tower-shop">
            {TOWER_IDS.map(towerId => {
              const definition = towerDefinition(towerId);
              const level = definition.levels.find(item => item.id === 'L1')!;
              const disabled = state.resource < level.cost;
              return <button
                key={towerId}
                type="button"
                disabled={disabled}
                onClick={() => dispatch({ type: 'Build', padId: selectedPad.id, towerId })}
              >
                <span className={`zb-shop-glyph zb-shop-${towerId.toLowerCase()}`} aria-hidden="true" />
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
        {persistence.awardedCosmeticIds.length ? <div className="zb-result-rewards">
          <strong>{t('defense.save.reward')}</strong>
          {persistence.awardedCosmeticIds.map(id => <span key={id}>
            {id === content.scenario.threeStarCosmetic ? t('defense.save.reward.three') : t('defense.save.reward.first')}
          </span>)}
        </div> : null}
        <div className="zb-result-actions">
          <button type="button" onClick={retry}>{t('defense.ui.retry')}</button>
          <button type="button" onClick={() => { void persistence.exitToMain(); }}>{t('defense.ui.exit')}</button>
        </div>
      </div>
    </section> : null}

    <DefenseConflictOverlay controller={persistence} />

    {portrait ? <section className="zb-rotate" role="dialog" aria-modal="true">
      <div><span aria-hidden="true">↻</span><h2>{t('defense.ui.rotate.title')}</h2><p>{t('defense.ui.rotate.body')}</p><button type="button" onClick={() => { void persistence.exitToMain(); }}>{t('defense.ui.exit')}</button></div>
    </section> : null}
  </main>;
}
