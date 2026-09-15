import { useEffect, useMemo, useState } from 'react';
import type { StrategyAction, StrategyActionIntent } from '../app/strategy-actions';
import { strategyActionTargetKey } from '../app/strategy-actions';
import type { PsiIndicatorId } from '../app/product-contract';
import { psiIndicatorTextId } from '../app/strategy-psi';

export interface StrategyOutcomeReconsideration {
  readonly item_id: string;
  readonly remaining: number;
  readonly enabled: boolean;
}

export interface StrategyMapOutcome {
  readonly key: string;
  readonly text: string;
  readonly relationship_lines?: readonly string[];
  readonly psi_cues?: readonly PsiIndicatorId[];
  readonly reconsideration?: StrategyOutcomeReconsideration;
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

export function StrategyLoopPanel({
  actions,
  selectedActions,
  focusId,
  focusTitle,
  text,
  personName,
  targetLabel,
  onAction,
  outcome,
  onOutcomeContinue,
  onOutcomeReconsider,
  onActionFocus,
}: {
  readonly actions: readonly StrategyAction[];
  readonly selectedActions: readonly StrategyAction[];
  readonly focusId: string | null;
  readonly focusTitle: string | null;
  readonly text: (id: string) => string;
  readonly personName: (characterId: string) => string;
  readonly targetLabel: (action: StrategyAction) => string;
  readonly onAction?: (action: StrategyAction) => void;
  readonly outcome?: StrategyMapOutcome;
  readonly onOutcomeContinue?: () => void;
  readonly onOutcomeReconsider?: () => void;
  readonly onActionFocus?: (targetKey: string | null) => void;
}) {
  const [pending, setPending] = useState<StrategyAction | null>(null);
  const [reconsiderConfirm, setReconsiderConfirm] = useState(false);
  const actionSetKey = useMemo(() => actions.map(action => `${action.instance_id}:${action.node_id}:${action.choice_id}:${action.enabled}`).join('|'), [actions]);

  useEffect(() => { setPending(null); setReconsiderConfirm(false); }, [actionSetKey, focusId, outcome?.key]);

  const step = outcome ? 3 : pending ? 2 : focusId ? 2 : 1;

  if (!actions.length && !outcome) return null;

  return <aside className={`strategy-action-tray strategy-loop-panel step-${step}`} aria-label={text('ui.strategy.actions')}>
    <div className="strategy-loop-steps" aria-label="strategy loop">
      <span className={step === 1 ? 'is-active' : step > 1 ? 'is-done' : ''}>{text('ui.strategy.loop.target')}</span>
      <span className={step === 2 ? 'is-active' : step > 2 ? 'is-done' : ''}>{text('ui.strategy.loop.action')}</span>
      <span className={step === 3 ? 'is-active' : ''}>{text('ui.strategy.loop.result')}</span>
    </div>

    {outcome ? <div className="strategy-outcome-card" role="status" data-outcome={outcome.key}>
      <span className="strategy-outcome-kicker">{text('ui.strategy.result')}</span>
      <p>{outcome.text}</p>
      {outcome.relationship_lines?.length ? <div className="strategy-outcome-relations">
        {outcome.relationship_lines.map(line => <span key={line}>{line}</span>)}
      </div> : null}
      {outcome.psi_cues?.length ? <div className="strategy-outcome-psi" aria-label={text('ui.psi.related')}>
        <strong>{text('ui.psi.related')}</strong>
        <div>{outcome.psi_cues.map(indicator => <span key={indicator}>{text(psiIndicatorTextId(indicator))}</span>)}</div>
      </div> : null}
      {outcome.reconsideration ? <div className="strategy-replan-card" data-paid-item={outcome.reconsideration.item_id}>
        <div className="strategy-replan-heading">
          <strong>{text('ui.paid_item.replan')}</strong>
          <span>{text('ui.paid_item.owned')} {outcome.reconsideration.remaining}</span>
        </div>
        <small>{text('ui.paid_item.replan_guard')}</small>
        {!reconsiderConfirm ? <button
          type="button"
          className="strategy-replan-button"
          disabled={!outcome.reconsideration.enabled}
          onClick={() => setReconsiderConfirm(true)}
        >{outcome.reconsideration.enabled ? text('ui.paid_item.use') : text('ui.paid_item.unavailable')}</button>
          : <div className="strategy-replan-confirm" role="group" aria-label={text('ui.paid_item.confirm_title')}>
            <p>{text('ui.paid_item.confirm_replan')}</p>
            <div>
              <button type="button" className="strategy-cancel-button" onClick={() => setReconsiderConfirm(false)}>{text('ui.paid_item.keep_result')}</button>
              <button type="button" className="strategy-replan-button" onClick={onOutcomeReconsider}>{text('ui.paid_item.confirm')}</button>
            </div>
          </div>}
      </div> : null}
      <button type="button" className="strategy-execute-button" onClick={onOutcomeContinue}>{text('ui.strategy.return_map')} <b aria-hidden="true">↗</b></button>
    </div> : <>
      <div className="strategy-action-heading"><strong>{text('ui.strategy.actions')}</strong><span>{focusId ? focusTitle ?? text('ui.strategy.site') : text('ui.strategy.action_hint')}</span></div>
      {!focusId ? <p className="strategy-action-empty">{text('ui.strategy.action_hint')}</p>
        : !selectedActions.length ? <p className="strategy-action-empty">{text('ui.strategy.no_actions')}</p>
        : <div className="strategy-action-list">
          {selectedActions.map((action, index) => <button
            key={action.choice_id}
            type="button"
            disabled={!action.enabled}
            className={pending?.choice_id === action.choice_id ? 'is-pending' : ''}
            data-choice={action.choice_id}
            data-action-target={strategyActionTargetKey(action.target)}
            data-action-actor={action.actor_character_id}
            data-action-skill={action.skill?.source}
            onMouseEnter={() => onActionFocus?.(strategyActionTargetKey(action.target))}
            onMouseLeave={() => onActionFocus?.(null)}
            onFocus={() => onActionFocus?.(strategyActionTargetKey(action.target))}
            onBlur={() => onActionFocus?.(null)}
            onClick={() => { if (action.enabled) setPending(action); }}
          >
            <span className="strategy-action-number">{index + 1}</span>
            <span className="strategy-action-icon" aria-hidden="true">{actionIcon(action.intent)}</span>
            <span className="strategy-action-copy">
              <strong>{text(action.label_text_id)}</strong>
              <small>{text('ui.strategy.actor')} · {personName(action.actor_character_id)} / {text('ui.strategy.target')} · {targetLabel(action)}</small>
              <span className="strategy-resource-cues" aria-label={text('ui.resource.impact')}>
                {action.resource_axes.map(axis => <i key={axis} data-axis={axis}>{text(`ui.resource.${axis}`)}</i>)}
              </span>
              {action.skill ? <em className="strategy-skill-badge">{text(action.skill.label_text_id)}</em> : null}
            </span>
            <span aria-hidden="true">›</span>
          </button>)}
        </div>}

      {pending ? <div className="strategy-action-confirm" data-pending-choice={pending.choice_id}>
        <div><span>{text('ui.strategy.actor')}</span><strong>{personName(pending.actor_character_id)}</strong></div>
        <div><span>{text('ui.strategy.target')}</span><strong>{targetLabel(pending)}</strong></div>
        <p>{text(pending.label_text_id)}</p>
        <div className="strategy-action-resource-impact">
          <span>{text('ui.resource.impact')}</span>
          <div>{pending.resource_axes.map(axis => <strong key={axis} data-axis={axis}>{text(`ui.resource.${axis}`)}</strong>)}</div>
        </div>
        <div className="strategy-action-confirm-buttons">
          <button type="button" className="strategy-cancel-button" onClick={() => setPending(null)}>{text('ui.strategy.cancel')}</button>
          <button type="button" className="strategy-execute-button" onClick={() => pending.enabled && onAction?.(pending)}>{text('ui.strategy.execute')} <b aria-hidden="true">↗</b></button>
        </div>
      </div> : null}
    </>}
  </aside>;
}
