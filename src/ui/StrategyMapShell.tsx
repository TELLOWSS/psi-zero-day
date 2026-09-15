import { useState } from 'react';
import { strategyActionsForTarget } from '../app/strategy-actions';
import type { StrategyAction } from '../app/strategy-actions';
import type { StrategyVisualAssets } from '../app/strategy-assets';
import type { StrategyView } from '../app/strategy-view';
import type { FieldFrictionKind } from '../app/strategy-frictions';
import type { StrategySignalKind } from '../app/strategy-signals';
import { StrategyLoopPanel } from './StrategyLoopPanel';
import type { StrategyMapOutcome } from './StrategyLoopPanel';

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

export interface StrategySupportItem {
  readonly item_id: string;
  readonly category: 'facility' | 'equipment';
  readonly name_text_id: string;
  readonly remaining: number;
  readonly active: boolean;
  readonly enabled: boolean;
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

export function StrategyMapShell({
  view, copy, text, person, actions = [], onAction, visualAssets, outcome, onOutcomeContinue, onOutcomeReconsider,
  supportItems = [], onSupportItemUse,
}: {
  readonly view: StrategyView;
  readonly copy: StrategyMapCopy;
  readonly text: (textId: string) => string;
  readonly person: (characterId: string) => StrategyPersonLabel | undefined;
  readonly actions?: readonly StrategyAction[];
  readonly onAction?: (action: StrategyAction) => void;
  readonly visualAssets?: StrategyVisualAssets;
  readonly outcome?: StrategyMapOutcome;
  readonly onOutcomeContinue?: () => void;
  readonly onOutcomeReconsider?: () => void;
  readonly supportItems?: readonly StrategySupportItem[];
  readonly onSupportItemUse?: (itemId: string) => void;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [actionFocusId, setActionFocusId] = useState<string | null>(null);
  const effectiveFocusId = actionFocusId ?? focusId;
  const selectedActions = strategyActionsForTarget(actions, focusId);
  const roster = view.roster.slice(0, 5);
  const progress = Math.max(0, Math.min(100, view.construction.current_stage_progress));
  const focusedSignal = view.signals.find(signal => signal.signal_id === effectiveFocusId);
  const focusedPlacement = view.placements.find(placement => placement.character_id === effectiveFocusId);
  const focusedPerson = focusedPlacement ? person(focusedPlacement.character_id) : undefined;
  const focusedAnchor = effectiveFocusId?.startsWith('anchor:') ? effectiveFocusId.slice(7) : null;
  const anchorTitle = focusedAnchor ? text(`ui.strategy.zone.${focusedAnchor}`) : null;
  const focusTitle = focusedSignal
    ? text(focusedSignal.label_text_id)
    : focusedPerson?.name ?? focusedPlacement?.character_id ?? anchorTitle ?? (effectiveFocusId === 'site' ? copy.site : null);
  const focusDetail = focusedPlacement
    ? focusedPerson?.role ?? focusedPlacement.role_id ?? ''
    : focusedSignal ? copy.events : focusedAnchor ? text('ui.strategy.zone_hint') : effectiveFocusId === 'site' ? copy.actionHint : '';
  const hasActionsFor = (targetKey: string): boolean => strategyActionsForTarget(actions, targetKey).length > 0;
  const actionTargetLabel = (action: StrategyAction): string => {
    if (action.target.kind === 'character') return person(action.target.character_id)?.name ?? action.target.character_id;
    if (action.target.kind === 'signal') {
      const signalId = action.target.signal_id;
      const signal = view.signals.find(item => item.signal_id === signalId);
      return signal ? text(signal.label_text_id) : copy.site;
    }
    if (action.target.kind === 'anchor') return text(`ui.strategy.zone.${action.target.anchor}`);
    return copy.site;
  };

  const zones = ['entry', 'ramp', 'yard', 'gate'] as const;
  const hasBackgroundArt = visualAssets?.background_uri !== undefined;
  const moneyValue = `₩${Math.max(0, view.resources.money).toLocaleString('ko-KR')}`;
  const timeValue = view.resources.display_time ?? text(`ui.slot.${view.resources.time_slot.toLowerCase()}`);
  const safetyValue = `${text('ui.resource.safety_signals')} ${view.resources.safety_signal_count}`;

  return <main className="strategy-shell" data-stage={view.construction.stage_id} data-visual-mode={hasBackgroundArt ? 'art' : 'css'} data-loop-phase={outcome ? 'result' : focusId ? 'action' : 'target'}>
    <header className="strategy-hud">
      <div className="strategy-brand"><span className="strategy-hardhat" aria-hidden="true">⛑</span><strong>{copy.brand}</strong></div>
      <div className="strategy-resource-bar" aria-label={`${text('ui.resource.money')} ${text('ui.resource.time')} ${text('ui.resource.schedule')} ${text('ui.resource.safety')}`}>
        <article data-resource="money"><span>{text('ui.resource.money')}</span><strong>{moneyValue}</strong></article>
        <article data-resource="time"><span>{text('ui.resource.time')}</span><strong>{timeValue}</strong></article>
        <article data-resource="schedule"><span>{text('ui.resource.schedule')}</span><strong>{view.resources.schedule_progress}%</strong></article>
        <article data-resource="safety" data-signal-count={view.resources.safety_signal_count}><span>{text('ui.resource.safety')}</span><strong>{safetyValue}</strong></article>
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

      <button type="button" className={hasActionsFor('site') ? 'has-actions' : ''} onClick={() => setFocusId('site')}>
        <span aria-hidden="true">⌖</span>{copy.site}{hasActionsFor('site') ? <b>{strategyActionsForTarget(actions, 'site').length}</b> : null}
      </button>
      <button type="button"><span aria-hidden="true">⚠</span>{copy.events}<b>{view.signals.length}</b></button>
      <button type="button"><span aria-hidden="true">▦</span>{copy.assignments}<b>{view.assignments.length}</b></button>

      {supportItems.length ? <section className="strategy-support-panel" aria-label={text('ui.paid_item.support_title')}>
        <h2>{text('ui.paid_item.support_title')}</h2>
        <div className="strategy-support-list">
          {supportItems.map(item => <article key={item.item_id} data-support-item={item.item_id} data-support-active={item.active ? 'true' : 'false'}>
            <span>{text(`ui.paid_item.${item.category}`)}</span>
            <strong>{text(item.name_text_id)}</strong>
            {item.active ? <em>{text('ui.paid_item.active')}</em> : <button
              type="button"
              disabled={!item.enabled}
              onClick={() => item.enabled && onSupportItemUse?.(item.item_id)}
            >{item.category === 'facility' ? text('ui.paid_item.deploy') : text('ui.paid_item.commit')} · {text('ui.paid_item.owned')} {item.remaining}</button>}
          </article>)}
        </div>
      </section> : null}
    </aside>

    <section className={`strategy-map${effectiveFocusId === 'site' ? ' is-site-focused' : ''}${hasBackgroundArt ? ' has-background-art' : ''}`} aria-label={copy.site}>
      {visualAssets?.background_uri ? <img className="strategy-map-background-art" src={visualAssets.background_uri} alt="" aria-hidden="true" /> : null}
      <div className="strategy-map-css-scene" aria-hidden={hasBackgroundArt ? 'true' : undefined}>
        <div className="strategy-map-sky" />
        <div className="strategy-map-road strategy-map-road-a" />
        <div className="strategy-map-road strategy-map-road-b" />
        <div className="strategy-site-building strategy-building-main"><span>5F</span><i /><i /><i /><i /></div>
        <div className="strategy-site-building strategy-building-side"><span>3F</span><i /><i /><i /></div>
        <div className="strategy-site-core"><span>CORE</span></div>
        <div className="strategy-tower-crane"><i /><b /><em /></div>
        <div className="strategy-site-yard"><span>{view.assignments.length}</span><small>{copy.assignments}</small></div>
      </div>
      <div className="strategy-map-stage-card">
        <span>{copy.stage}</span>
        <strong>{view.construction.stage_id}</strong>
        <progress value={progress} max={100} aria-label={copy.progress} />
      </div>

      <div className="strategy-zone-layer" aria-label={text('ui.strategy.zones')}>
        {zones.map(zone => {
          const key = `anchor:${zone}`;
          return <button
            key={zone}
            type="button"
            data-zone={zone}
            className={`strategy-zone-target zone-${zone}${effectiveFocusId === key ? ' is-focused' : ''}${hasActionsFor(key) ? ' has-actions' : ''}`}
            onClick={() => setFocusId(key)}
          ><span>{text(`ui.strategy.zone.${zone}`)}</span>{hasActionsFor(key) ? <b>{strategyActionsForTarget(actions, key).length}</b> : null}</button>;
        })}
      </div>

      <div className="strategy-worker-layer">
        {view.placements.map(placement => {
          const label = person(placement.character_id);
          const nearSignal = placement.nearby_signal_ids.length > 0;
          const key = placement.character_id;
          const visual = visualAssets?.characters[placement.character_id];
          return <button
            className={`strategy-map-worker worker-${placement.anchor}${placement.scene_participant ? ' is-scene-participant' : ''}${nearSignal ? ' is-near-signal' : ''}${effectiveFocusId === key ? ' is-focused' : ''}${hasActionsFor(key) ? ' has-actions' : ''}${visual?.map_uri ? ' has-art' : ''}`}
            data-character={placement.character_id}
            data-scene-participant={placement.scene_participant ? 'true' : 'false'}
            data-action-count={strategyActionsForTarget(actions, key).length}
            data-visual={visual?.map_uri ? 'asset' : 'css'}
            key={placement.character_id}
            type="button"
            onClick={() => setFocusId(key)}
          >
            {visual?.map_uri
              ? <img className="strategy-worker-art" src={visual.map_uri} alt="" aria-hidden="true" />
              : <span className="strategy-worker-figure" aria-hidden="true"><i className="worker-helmet" /><i className="worker-head" /><i className="worker-body" /></span>}
            <span className="strategy-worker-label" style={visual ? { borderColor: visual.accent } : undefined}><strong>{label?.name ?? placement.character_id}</strong><span>{label?.role ?? placement.role_id ?? ''}</span></span>
            {nearSignal ? <b className="strategy-worker-alert" aria-label={copy.events}>!</b> : null}
          </button>;
        })}
      </div>

      <div className="strategy-signal-layer" aria-live="polite">
        {view.signals.map(signal => {
          const key = signal.signal_id;
          return <button
            className={`strategy-risk-signal signal-${signal.anchor} signal-${signal.kind}${effectiveFocusId === key ? ' is-focused' : ''}${hasActionsFor(key) ? ' has-actions' : ''}`}
            data-signal={signal.signal_id}
            data-action-count={strategyActionsForTarget(actions, key).length}
            key={signal.signal_id}
            type="button"
            onClick={() => setFocusId(key)}
          >
            <span aria-hidden="true">{signalIcon(signal.kind)}</span>
            <strong>{text(signal.label_text_id)}</strong>
          </button>;
        })}
      </div>

      <StrategyLoopPanel
        actions={actions}
        selectedActions={selectedActions}
        focusId={focusId}
        focusTitle={focusTitle}
        text={text}
        personName={id => person(id)?.name ?? id}
        targetLabel={actionTargetLabel}
        onAction={onAction}
        outcome={outcome}
        onOutcomeContinue={onOutcomeContinue}
        onOutcomeReconsider={onOutcomeReconsider}
        onActionFocus={setActionFocusId}
      />
    </section>

    <footer className="strategy-roster" aria-label={copy.roster}>
      <div className="roster-title"><span>{copy.roster}</span><strong>{view.roster.length}</strong></div>
      {roster.map((character, index) => {
        const label = person(character.character_id);
        const visual = visualAssets?.characters[character.character_id];
        return <article className="strategy-character" key={character.character_id}>
          <div className="character-token" aria-hidden="true">{visual?.portrait_uri ? <img src={visual.portrait_uri} alt="" /> : index + 1}</div>
          <div><strong>{label?.name ?? character.character_id}</strong><span>{label?.role ?? ''} · {character.available ? '●' : '○'} {character.experience}</span></div>
        </article>;
      })}
    </footer>
  </main>;
}
