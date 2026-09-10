import type { EffectBundle, FollowUpEvent, GameState, ValidatedContent } from '../domain';
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
  | { readonly type: 'draw_random' };
export interface CommandResult { readonly state: GameState; readonly value?: number }

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
    switch (command.type) {
      case 'advance_slot': next = freezeData({ ...next, clock: freezeData(nextSlot(next.clock)) }); break;
      case 'apply_effects': next = applyEffectBundle(next, command.bundle, command.context, this.#content, this.#bounds); break;
      case 'followup_status': next = setFollowUpStatus(next, command.instance_id, command.status); break;
      case 'draw_random': {
        const rng = restoreRng(next.run.rng); value = rng.next();
        next = freezeData({ ...next, run: { ...next.run, rng: rng.snapshot() } }); break;
      }
      default: throw new Error('Unsupported engine command');
    }
    this.#state = next; // Never reached when any primitive throws.
    return Object.freeze(value === undefined ? { state: next } : { state: next, value });
  }
}
