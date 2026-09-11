import type { EffectBundle, EventDefinition, EventInstance, EventNode, GameState, PresentationCommand, ValidatedContent } from '../domain';
import type { ProgressBounds } from './construction';
import { applyEffectBundle } from './effects';
import { bindParticipants, eventEligible } from './event-candidates';
import { evaluateConditions } from './conditions';
import { isFollowUpDue, setFollowUpStatus } from './scheduler';
import { copyData, freezeData } from './data';

export type EventCommand =
  | { readonly type: 'start_event'; readonly event_id: string; readonly instance_id: string; readonly chapter_id: string; readonly source_followup_id?: string }
  | { readonly type: 'advance_event'; readonly instance_id: string; readonly node_id: string }
  | { readonly type: 'choose_event'; readonly instance_id: string; readonly node_id: string; readonly choice_id: string }
  | { readonly type: 'cancel_event'; readonly instance_id: string };
export interface EventResult { readonly state: GameState; readonly presentation: readonly PresentationCommand[] }

function definition(content: ValidatedContent, id: string): EventDefinition {
  const event = content.events.find(e => e.event_id === id);
  if (!event?.runtime) throw new Error('Event requires explicit runtime policy');
  return event;
}
function node(event: EventDefinition, id: string): EventNode {
  const found = event.dialogue.find(n => n.node_id === id);
  if (!found?.type) throw new Error('Unknown runtime node');
  return found;
}
function active(state: GameState, id?: string): EventInstance {
  const instance = state.event_runtime.active_instance;
  if (!instance || instance.status !== 'ACTIVE' || (id !== undefined && instance.instance_id !== id)) throw new Error('Event instance is not active');
  return instance;
}
function replace(state: GameState, instance: EventInstance): GameState {
  return { ...state, event_runtime: { ...state.event_runtime, active_instance: instance },
    presentation_resume: { event_id: instance.event_id, node_id: instance.current_node_id } };
}
function effects(state: GameState, bundle: EffectBundle | undefined, bundleId: string,
  content: ValidatedContent, bounds: ProgressBounds, choiceId?: string): GameState {
  if (!bundle) return state;
  const instance = active(state);
  const before = new Set(state.event_runtime.applied_effect_ids);
  const next = applyEffectBundle(state, bundle, {
    event_id: instance.event_id, event_instance_id: instance.instance_id, bundle_id: bundleId,
    ...(choiceId === undefined ? {} : { choice_id: choiceId }), participant_bindings: instance.participant_bindings,
  }, content, bounds);
  return replace(next, { ...active(next), applied_effect_ids: [...instance.applied_effect_ids,
    ...next.event_runtime.applied_effect_ids.filter(id => !before.has(id))] });
}
function finish(state: GameState, outcome: 'completed' | 'failed' | 'cancelled'): GameState {
  const instance = active(state);
  const terminal: EventInstance = { ...instance,
    status: outcome === 'completed' ? 'COMPLETED' : outcome === 'failed' ? 'FAILED' : 'CANCELLED', completion_status: outcome };
  let next = state;
  if (instance.source_followup_id) next = setFollowUpStatus(next, instance.source_followup_id, outcome === 'completed' ? 'completed' : 'cancelled');
  const completion = next.event_runtime.completion_history;
  return { ...next, presentation_resume: null, event_runtime: { ...next.event_runtime, active_instance: null,
    finished_instances: [...next.event_runtime.finished_instances, terminal],
    completion_history: outcome === 'completed' && !completion.some(h => h.instance_id === instance.instance_id)
      ? [...completion, { instance_id: instance.instance_id, event_id: instance.event_id,
        completed_at: { day: state.clock.day, slot: state.clock.slot } }] : completion,
  } };
}
function enter(state: GameState, target: string, content: ValidatedContent, bounds: ProgressBounds): GameState {
  const instance = active(state); const event = definition(content, instance.event_id); const targetNode = node(event, target);
  if (instance.visited_node_ids.includes(target) || instance.visited_node_ids.length >= event.dialogue.length) throw new Error('Runtime node cycle blocked');
  let next = replace(state, { ...instance, current_node_id: target, visited_node_ids: [...instance.visited_node_ids, target] });
  if (targetNode.type === 'RESULT' || targetNode.type === 'END') next = effects(next, targetNode.effects, `node.${target}`, content, bounds);
  const failed = failure(next, content, bounds);
  if (failed) return failed;
  if (targetNode.type === 'END') {
    if (!targetNode.outcome) throw new Error('END outcome missing');
    if (targetNode.outcome === 'failed') next = effects(next, event.failure_effects, 'failure', content, bounds);
    next = finish(next, targetNode.outcome);
  }
  return next;
}
function failure(state: GameState, content: ValidatedContent, bounds: ProgressBounds): GameState | undefined {
  const event = definition(content, active(state).event_id);
  if (event.failure_conditions.length && evaluateConditions(state, event.failure_conditions, active(state))) {
    return finish(effects(state, event.failure_effects, 'failure', content, bounds), 'failed');
  }
  return undefined;
}

/** Pure view, including resume: never repeats effects or history writes. */
export function eventPresentation(state: GameState, content: ValidatedContent): readonly PresentationCommand[] {
  const instance = state.event_runtime.active_instance;
  if (!instance) return [];
  const event = definition(content, instance.event_id); const current = node(event, instance.current_node_id);
  const commands: PresentationCommand[] = [...(current.presentation_cues ?? [])];
  if (current.type === 'DIALOGUE' || current.type === 'RESULT') {
    const speaker = current.speaker_role_id ? instance.participant_bindings[current.speaker_role_id] : undefined;
    commands.push({ type: current.type === 'DIALOGUE' ? 'SHOW_DIALOGUE' : 'SHOW_RESULT', instance_id: instance.instance_id,
      node_id: current.node_id, text_id: current.text_id, ...(speaker === undefined ? {} : { speaker_character_id: speaker }) });
  }
  if (current.type === 'CHOICE') commands.push({ type: 'SHOW_CHOICE', instance_id: instance.instance_id,
    node_id: current.node_id, text_id: current.text_id, choices: current.choice_ids.map(id => {
      const choice = event.choices.find(c => c.choice_id === id);
      if (!choice) throw new Error('Missing node choice');
      return { choice_id: id, text_id: choice.text_id, enabled: evaluateConditions(state, choice.requirements, instance) };
    }) });
  return freezeData(copyData(commands));
}

function start(state: GameState, command: Extract<EventCommand, { type: 'start_event' }>, content: ValidatedContent, bounds: ProgressBounds): GameState {
  if (state.event_runtime.active_instance) throw new Error('Another event is active');
  if (!/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(command.instance_id)) throw new Error('Invalid instance ID');
  if (state.event_runtime.finished_instances.some(i => i.instance_id === command.instance_id) ||
    state.event_runtime.occurrence_history.some(i => i.instance_id === command.instance_id)) throw new Error('Event instance ID already used');
  const event = definition(content, command.event_id);
  const followup = command.source_followup_id === undefined ? undefined : state.followups.find(f => f.instance_id === command.source_followup_id);
  if (command.source_followup_id !== undefined && (!followup || followup.event_id !== event.event_id || !isFollowUpDue(followup, state.clock))) throw new Error('Follow-up is not due');
  if (followup ? event.runtime!.trigger === 'normal' : event.runtime!.trigger === 'followup') throw new Error('Event trigger mismatch');
  const eligible = eventEligible(state, event, command.chapter_id) && (!followup || evaluateConditions(state, followup.conditions, followup));
  const bindings = eligible ? bindParticipants(state, content, event, followup?.participant_bindings) : null;
  let next = state;
  const instance: EventInstance = {
    instance_id: command.instance_id, event_id: event.event_id, status: 'ACTIVE', started_day: state.clock.day, started_slot: state.clock.slot,
    participant_bindings: bindings ?? {}, current_node_id: event.entry_node_id, visited_node_ids: [], selected_choice_ids: [],
    applied_effect_ids: [], runtime_flags: {},
    ...(followup ? { source_followup_id: followup.instance_id, source_instance_id: followup.source_instance_id,
      ...(followup.source_choice_id === undefined ? {} : { source_choice_id: followup.source_choice_id }),
      source_participant_bindings: followup.participant_bindings, due_at: followup.due_at } : {}),
  };
  if (!eligible || !bindings) {
    if (followup) {
      if (followup.unmet_policy === 'defer') return state; // Preserve pending/due fields; no invented reschedule.
      next = setFollowUpStatus(state, followup.instance_id, 'cancelled');
      if (followup.unmet_policy === 'cancel') return next;
    } else if (!eligible || event.runtime!.missing_participant_policy === 'exclude') throw new Error('Event is not eligible');
    const failed: EventInstance = { ...instance, status: 'FAILED', completion_status: 'failed', runtime_flags: { start_unmet: true } };
    return { ...next, event_runtime: { ...next.event_runtime, finished_instances: [...next.event_runtime.finished_instances, failed] } };
  }
  if (followup) next = setFollowUpStatus(next, followup.instance_id, 'running');
  next = replace({ ...next, event_runtime: { ...next.event_runtime, occurrence_history: [...next.event_runtime.occurrence_history,
    { instance_id: instance.instance_id, event_id: instance.event_id, occurred_at: { day: state.clock.day, slot: state.clock.slot } }] } }, instance);
  return failure(next, content, bounds) ?? enter(next, event.entry_node_id, content, bounds);
}

/** Transaction boundary includes effects, node transition, scheduler and histories. */
export function executeEventCommand(state: GameState, command: EventCommand, content: ValidatedContent, bounds: ProgressBounds): EventResult {
  if (state.run.content_version !== content.content_version) throw new Error('Content version mismatch');
  let next: GameState;
  if (command.type === 'start_event') next = start(state, command, content, bounds);
  else {
    const instance = active(state, command.instance_id); const event = definition(content, instance.event_id);
    if (command.type === 'cancel_event') next = finish(state, 'cancelled');
    else {
      if (instance.current_node_id !== command.node_id) throw new Error('Stale event node request');
      const current = node(event, command.node_id);
      if (command.type === 'choose_event') {
        if (current.type !== 'CHOICE' || !current.choice_ids.includes(command.choice_id)) throw new Error('Invalid current-node choice');
        const choice = event.choices.find(c => c.choice_id === command.choice_id)!;
        if (!choice.next_node_id || !evaluateConditions(state, choice.requirements, instance)) throw new Error('Choice requirements not met');
        if (instance.selected_choice_ids.includes(choice.choice_id)) throw new Error('Choice already selected');
        next = failure(state, content, bounds) ?? effects(state, choice.effects, `choice.${choice.choice_id}`, content, bounds, choice.choice_id);
        if (next.event_runtime.active_instance) {
          next = replace(next, { ...active(next), selected_choice_ids: [...instance.selected_choice_ids, choice.choice_id] });
          next = { ...next, event_runtime: { ...next.event_runtime, choice_history: [...next.event_runtime.choice_history,
            { instance_id: instance.instance_id, choice_id: choice.choice_id }] } };
          next = failure(next, content, bounds) ?? enter(next, choice.next_node_id, content, bounds);
        }
      } else {
        if ((current.type !== 'DIALOGUE' && current.type !== 'RESULT') || !current.next_node_id) throw new Error('Node cannot advance');
        next = failure(state, content, bounds) ?? enter(state, current.next_node_id, content, bounds);
      }
    }
  }
  const presentation: PresentationCommand[] = [...eventPresentation(next, content)];
  const terminal = next.event_runtime.finished_instances.at(-1);
  if (next.event_runtime.finished_instances.length > state.event_runtime.finished_instances.length && terminal?.visited_node_ids.length) {
    const lastNode = node(definition(content, terminal.event_id), terminal.current_node_id);
    if (lastNode.type === 'END') presentation.push(...(lastNode.presentation_cues ?? []));
  }
  if (command.type === 'start_event' && next.event_runtime.occurrence_history.length > state.event_runtime.occurrence_history.length) {
    const background = definition(content, command.event_id).scene.background_asset_id;
    if (background) presentation.unshift({ type: 'SCENE_CHANGE', asset_id: background });
  }
  return Object.freeze({ state: next === state ? state : freezeData(copyData(next)), presentation: freezeData(copyData(presentation)) });
}
