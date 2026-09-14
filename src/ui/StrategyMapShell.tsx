import { useState } from 'react';
import type { StrategyAction, StrategyActionIntent } from '../app/strategy-actions';
import type { StrategyView } from '../app/strategy-view';
import type { FieldFrictionKind } from '../app/strategy-frictions';
import type { StrategySignalKind } from '../app/strategy-signals';

export interface StrategyMapCopy {
  readonly brand: string;
  readonly day: string;
  readonly stage: string;
  readonly psi: string;
  readonly objectives: string;
  readonly assignments: string;
  readonly roster: string;
  readonly site: string;
  readonly events: string;
  readonly progress: string;
  readonly pressures: string;
  readonly focus: string;
  readonly focusHint: string;
  readonly actions: string;
  readonly actionHint: string;
}

export interface StrategyPersonLabel {
  readonly name: string;
  readonly role: string;
}

function signalIcon(kind: StrategySignalKind): string {
  switch (kind) {
    case 'ramp': return '↗';
    case 'vehicle': return '▣';
    case 'overlap': return '⇄';
    case 'access': return '!';
  }
}

function frictionIcon(kind: FieldFrictionKind): string {
  switch (kind) {
    case 'schedule_pressure': return '◷';
    case 'coordination_conflict': return '⇆';
    case 'reporting_hesitation': return '…';
    case 'hierarchy_pressure': return '▲';
    case 'responsibility_shift': return '↔';
    case 'inspection_pressure': return '✓';
  }
}

function actionIcon(intent: StrategyActionIntent): string {
  switch (intent) {
    case 'inspect': return '⌕';
    case 'coordinate': return '⇆';
    case 'control': return '■';
    case 'report': return '▤';
    case 'protect': return '⛨';
    case 'record': return '▧';
  }
}

function actionFocusKey(action: StrategyAction): string {
  switch (action.target.kind) {
    case 'character': return action.target.character_id;
    case 'signal': return action.target.signal_id;
    case 'anchor': return `anchor:${action.target.anchor}`;
    case 'site': return 'site';
  }
}

export function StrategyMapShell({ view, copy, text, person, actions = [], onAction }: {
  readonly view: StrategyView;
  readonly copy: StrategyMapCopy;
  readonly text: (textId: string) => string;
  readonly person: (characterId: string) => StrategyPersonLabel | undefined;
  readonly actions?: readonly StrategyAction[];
  readonly onAction?: (action: StrategyAction) => void;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [actionFocusId, setActionFocusId] = useState<string | null>(null);
  const effectiveFocusId = actionFocusId ?? focusId;
  const roster = view.roster.slice(0, 5);
  const progress = Math.max(0, Math.min(100, view.construction.current_stage_progress));
  const psiScore = Math.max(0, Math.min(100, Number(view.psi.values.score ?? 0)));
  const focusedSignal = view.signals.find(signal => signal.signal_id === effectiveFocusId);
  const focusedPlacement = view.placements.find(placement => placement.character_id === effectiveFocusId);
  const focusedPerson = focusedPlacement ? person(focusedPlacement.character_id) : undefined;
  const focusTitle = focusedSignal
    ? text(focusedSignal.label_text_id)
    : focusedPerson?.name ?? focusedPlacement?.character_id ?? (effectiveFocusId === 'site' ? copy.site : null);
  const focusDetail = focusedPlacement
    ? focusedPerson?.role ?? focusedPlacement.role_id ?? ''
    : focusedSignal ? copy.events : effectiveFocusId === 'site' ? copy.actionHint : '';
  const actionTargetLabel = (action: StrategyAction): string => {
    if (action.target.kind === 'character') return person(action.target.character_id)?.name ?? action.target.character_id;
    if (action.target.kind === 'signal') {
      const signal = view.signals.find(item => item.signal_id === action.target.signal_id);
      return signal ? text(signal.label_text_id) : copy.site;
    }
    return copy.site;
  };

  return <main className="strategy-shell" data-stage={view.construction.stage_id}>
    <header className="strategy-hud">
      <div className="strategy-brand"><span className="strategy-hardhat" aria-hidden="true">⛑</span><strong>{copy.brand}</strong></div>
      <div className="strategy-meter" aria-label={copy.psi}>
        <span>{copy.psi}</span>
        <div className="strategy-meter-track"><i style={{ width: `${psiScore}%` }} /></div>
      </div>
      <div className="strategy-day"><span>{copy.day}</span><strong>{view.clock.day}</strong></div>
    </header>

    <aside className="strategy-rail" aria-label={copy.objectives}>
      <section className="strategy-panel strategy-objectives">
        <h2>{copy.objectives}</h2>
        <p>{copy.stage}<strong>{view.construction.stage_id}</strong></p>
        <p>{copy.progress}<strong>{progress}%</strong></p>
      </section>

      <section className="strategy-panel strategy-friction-panel" aria-label={copy.pressures}>
        <h2>{copy.pressures}</h2>
        <div className="strategy-friction-list">
          {view.frictions.length ? view.frictions.map(friction => <article key={friction.friction_id} data-friction={friction.friction_id}>
            <span aria-hidden="true">{frictionIcon(friction.kind)}</span>
            <div><strong>{text(friction.label_text_id)}</strong><small>{text(friction.detail_text_id)}</small></div>
          </article>) : <p className="strategy-friction-empty">-</p>}
        </div>
      </section>

      <section className="strategy-panel strategy-focus-panel" aria-live="polite">
        <h2>{copy.focus}</h2>
        {focusTitle ? <p><strong>{focusTitle}</strong><span>{focusDetail}</span></p> : <small>{copy.focusHint}</small>}
      </section>

      <button type="button"><span aria-hidden="true">⌖</span>{copy.site}</button>
      <button type="button"><span aria-hidden="true">⚠</span>{copy.events}<b>{view.signals.length}</b></button>
      <button type="button"><span aria-hidden="true">▦</span>{copy.assignments}<b>{view.assignments.length}</b></button>
    </aside>

    <section className={`strategy-map${effectiveFocusId === 'site' ? ' is-site-focused' : ''}`} aria-label={copy.site}>
      <div className="strategy-map-sky" />
      <div className="strategy-map-road strategy-map-road-a" />
      <div className="strategy-map-road strategy-map-road-b" />
      <div className="strategy-site-building strategy-building-main"><span>5F</span><i /><i /><i /><i /></div>
      <div className="strategy-site-building strategy-building-side"><span>3F</span><i /><i /><i /></div>
      <div className="strategy-site-core"><span>CORE</span></div>
      <div className="strategy-tower-crane" aria-hidden="true"><i /><b /><em /></div>
      <div className="strategy-site-yard"><span>{view.assignments.length}</span><small>{copy.assignments}</small></div>
      <div className="strategy-map-stage-card">
        <span>{copy.stage}</span>
        <strong>{view.construction.stage_id}</strong>
        <progress value={progress} max={100} aria-label={copy.progress} />
      </div>

      <div className="strategy-worker-layer">
        {view.placements.map(placement => {
          const label = person(placement.character_id);
          const nearSignal = placement.nearby_signal_ids.length > 0;
          const actionAnchorFocused = effectiveFocusId === `anchor:${placement.anchor}`;
          return <button
            className={`strategy-map-worker worker-${placement.anchor}${placement.scene_participant ? ' is-scene-participant' : ''}${nearSignal ? ' is-near-signal' : ''}${effectiveFocusId === placement.character_id || actionAnchorFocused ? ' is-focused' : ''}`}
            data-character={placement.character_id}
            data-scene-participant={placement.scene_participant ? 'true' : 'false'}
            key={placement.character_id}
            type="button"
            onClick={() => setFocusId(placement.character_id)}
          >
            <span className="strategy-worker-figure" aria-hidden="true"><i className="worker-helmet" /><i className="worker-head" /><i className="worker-body" /></span>
            <span className="strategy-worker-label"><strong>{label?.name ?? placement.character_id}</strong><span>{label?.role ?? placement.role_id ?? ''}</span></span>
            {nearSignal ? <b className="strategy-worker-alert" aria-label={copy.events}>!</b> : null}
          </button>;
        })}
      </div>

      <div className="strategy-signal-layer" aria-live="polite">
        {view.signals.map(signal => {
          const actionAnchorFocused = effectiveFocusId === `anchor:${signal.anchor}`;
          return <button
            className={`strategy-risk-signal signal-${signal.anchor} signal-${signal.kind}${effectiveFocusId === signal.signal_id || actionAnchorFocused ? ' is-focused' : ''}`}
            data-signal={signal.signal_id}
            key={signal.signal_id}
            type="button"
            onClick={() => setFocusId(signal.signal_id)}
          >
            <span aria-hidden="true">{signalIcon(signal.kind)}</span>
            <strong>{text(signal.label_text_id)}</strong>
          </button>;
        })}
      </div>

      {actions.length ? <aside className="strategy-action-tray" aria-label={copy.actions}>
        <div className="strategy-action-heading"><strong>{copy.actions}</strong><span>{copy.actionHint}</span></div>
        <div className="strategy-action-list">
          {actions.map((action, index) => <button
            key={action.choice_id}
            type="button"
            disabled={!action.enabled}
            data-choice={action.choice_id}
            data-action-target={actionFocusKey(action)}
            onMouseEnter={() => setActionFocusId(actionFocusKey(action))}
            onMouseLeave={() => setActionFocusId(null)}
            onFocus={() => setActionFocusId(actionFocusKey(action))}
            onBlur={() => setActionFocusId(null)}
            onClick={event => { if (event.detail < 2 && action.enabled) onAction?.(action); }}
          >
            <span className="strategy-action-number">{index + 1}</span>
            <span className="strategy-action-icon" aria-hidden="true">{actionIcon(action.intent)}</span>
            <span className="strategy-action-copy"><strong>{text(action.label_text_id)}</strong><small>{actionTargetLabel(action)}</small></span>
            <span aria-hidden="true">↗</span>
          </button>)}
        </div>
      </aside> : null}
    </section>

    <footer className="strategy-roster" aria-label={copy.roster}>
      <div className="roster-title"><span>{copy.roster}</span><strong>{view.roster.length}</strong></div>
      {roster.map((character, index) => {
        const label = person(character.character_id);
        return <article className="strategy-character" key={character.character_id}>
          <div className="character-token" aria-hidden="true">{index + 1}</div>
          <div><strong>{label?.name ?? character.character_id}</strong><span>{label?.role ?? ''} · {character.available ? '●' : '○'} {character.experience}</span></div>
        </article>;
      })}
    </footer>
  </main>;
}
