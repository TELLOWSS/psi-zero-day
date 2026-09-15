import type { EffectBundle, FollowUpEvent, GameState, PresentationCommand, ValidatedContent } from '../domain';
import { executeEventCommand } from './event-runtime';
import type { EventCommand } from './event-runtime';
import type { ProgressBounds } from './construction';
import type { EffectContext } from './scheduler';
import { nextSlot, assertTime } from './clock';
import { applyEffectBundle } from './effects';
import { setFollowUpStatus } from './scheduler';
import { copyData, freezeData } from './data';
import { restoreRng } from './rng';

export type EngineCommand =
  | { readonly type: 'advance_slot' }
  | { readonly type: 'apply_effects'; readonly bundle: EffectBundle; readonly context: EffectContext }
  | { readonly type: 'followup_status'; readonly instance_id: string; readonly status: FollowUpEvent['status'] }
  | { readonly type: 'draw_random' }
  | { readonly type: 'restore_decision_checkpoint'; readonly checkpoint: GameState }
  | EventCommand;
export interface CommandResult { readonly state: GameState; readonly value?: number; readonly presentation?: readonly PresentationCommand[] }

function assertDecisionCheckpoint(current: GameState, checkpoint: GameState): void {
  if (checkpoint.run.content_version !== current.run.content_version
    || checkpoint.run.rules_version !== current.run.rules_version
    || checkpoint.run.run_id !== current.run.run_id) throw new Error('Decision checkpoint run mismatch');
  const active = current.event_runtime.active_instance;
  const previous = checkpoint.event_runtime.active_instance;
  if (!active || !previous || active.instance_id !== previous.instance_id || active.event_id !== previous.event_id) {
    throw new Error('Decision checkpoint event mismatch');
  }
  if (current.event_runtime.completion_history.length !== checkpoint.event_runtime.completion_history.length) {
    throw new Error('Completed events cannot be reconsidered');
  }
  if (current.event_runtime.occurrence_history.length !== checkpoint.event_runtime.occurrence_history.length) {
    throw new Error('Decision checkpoint occurrence mismatch');
  }
  if (JSON.stringify(current.player.safety_record) !== JSON.stringify(checkpoint.player.safety_record)) {
    throw new Error('Recorded safety incidents cannot be erased');
  }
}

/** Single owner; no bus, UI subscription framework, DOM or rendering dependency. */
export class CoreEngine {
  #state: GameState;
  readonly #content: ValidatedContent;
  readonly #bounds: ProgressBounds;
  constructor(state: GameState, content: ValidatedContent, bounds: ProgressBounds) {
    if (state.run.content_version !== content.content_version) throw new Error('Content version mismatch');
    assertTime(state.clock); restoreRng(state.run.rng);
    this.#state = freezeData(copyData(state));
    this.#content = content;
    this.#bounds = freezeData(copyData(bounds));
  }
  getState(): GameState { return this.#state; }
  dispatch(command: EngineCommand): CommandResult {
    let next = this.#state;
    let value: number | undefined;
    let presentation: readonly PresentationCommand[] | undefined;
    switch (command.type) {
      case 'advance_slot': next = freezeData({ ...next, clock: freezeData(nextSlot(next.clock)) }); break;
      case 'apply_effects': next = applyEffectBundle(next, command.bundle, command.context, this.#content, this.#bounds); break;
      case 'followup_status': next = setFollowUpStatus(next, command.instance_id, command.status); break;
      case 'draw_random': {
        const rng = restoreRng(next.run.rng); value = rng.next();
        next = freezeData({ ...next, run: { ...next.run, rng: rng.snapshot() } }); break;
      }
      case 'restore_decision_checkpoint': {
        assertDecisionCheckpoint(next, command.checkpoint);
        next = freezeData(copyData(command.checkpoint));
        break;
      }
      case 'start_event': case 'advance_event': case 'choose_event': case 'cancel_event': {
        const result = executeEventCommand(next, command, this.#content, this.#bounds);
        next = result.state; presentation = result.presentation; break;
      }
      default: throw new Error('Unsupported engine command');
    }
    this.#state = next; // Never reached when any primitive throws.
    return Object.freeze({ state: next, ...(value === undefined ? {} : { value }), ...(presentation === undefined ? {} : { presentation }) });
  }
}
