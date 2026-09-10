import type { FollowUpDefinition, FollowUpEvent, GameState, GameTime, ValidatedContent } from '../domain';
import { assertTime, compareTime } from './clock';
import { copyData, freezeData, own } from './data';

export interface EffectContext {
  readonly event_id: string;
  readonly event_instance_id: string;
  readonly bundle_id: string;
  readonly choice_id?: string;
  readonly participant_bindings: Readonly<Record<string, string>>;
}
export function instanceKey(state: GameState, context: EffectContext, kind: string, id: string): string {
  return JSON.stringify([state.run.run_id, context.event_id, context.event_instance_id, kind, id]);
}
export function validateContext(state: GameState, content: ValidatedContent, context: EffectContext): void {
  if (!context.event_instance_id || !context.bundle_id) throw new Error('Stable instance and bundle IDs required');
  const event = content.events.find(e => e.event_id === context.event_id);
  if (!event || (context.choice_id !== undefined && !event.choices.some(c => c.choice_id === context.choice_id))) {
    throw new Error('Unknown source event/choice');
  }
  const roles = new Set(event.participants.map(p => p.role_id));
  if (Object.keys(context.participant_bindings).some(role => !roles.has(role)) ||
    event.participants.some(p => !Object.hasOwn(context.participant_bindings, p.role_id))) {
    throw new Error('Source participant binding mismatch');
  }
  for (const id of Object.values(context.participant_bindings)) {
    if (id !== state.player.character_id && !own(state.characters, id)) throw new Error('Unknown bound participant');
  }
}
export function createFollowUp(state: GameState, content: ValidatedContent,
  definition: FollowUpDefinition, context: EffectContext): FollowUpEvent {
  validateContext(state, content, context);
  if (!content.events.some(e => e.event_id === definition.event_id)) throw new Error('Unknown follow-up event');
  if (!Number.isSafeInteger(definition.delay.days) || definition.delay.days < 0) throw new Error('Invalid follow-up delay');
  const due: GameTime = { day: state.clock.day + definition.delay.days, slot: definition.delay.slot ?? 'PRE_WORK' };
  assertTime(state.clock); assertTime(due);
  const key = instanceKey(state, context, 'followup', definition.followup_id);
  return freezeData(copyData({
    ...definition, instance_id: key, dedupe_key: key, source_instance_id: context.event_instance_id,
    ...(context.choice_id === undefined ? {} : { source_choice_id: context.choice_id }),
    participant_bindings: context.participant_bindings,
    created_at: { day: state.clock.day, slot: state.clock.slot }, due_at: due, status: 'pending' as const,
  }));
}
/** Exposes requested day/slot fields without duplicating TASK-001 persisted timestamps. */
export function followUpTiming(event: FollowUpEvent) {
  return { created_day: event.created_at.day, due_day: event.due_at.day,
    ...(event.delay.slot === undefined ? {} : { due_slot: event.due_at.slot }) };
}
export function isFollowUpDue(event: FollowUpEvent, now: GameTime): boolean {
  return event.status === 'pending' && compareTime(now, event.due_at) >= 0 &&
    (event.expires_at === undefined || compareTime(now, event.expires_at) <= 0);
}
export function dueFollowUps(state: GameState): readonly FollowUpEvent[] {
  return Object.freeze(state.followups.filter(e => isFollowUpDue(e, state.clock))
    .sort((a, b) => compareTime(a.due_at, b.due_at) || (a.instance_id < b.instance_id ? -1 : a.instance_id > b.instance_id ? 1 : 0)));
}
export function setFollowUpStatus(state: GameState, id: string, status: FollowUpEvent['status']): GameState {
  const event = state.followups.find(e => e.instance_id === id);
  if (!event) throw new Error('Unknown scheduled instance');
  if (event.status === status) return state;
  const allowed: Record<FollowUpEvent['status'], readonly FollowUpEvent['status'][]> = {
    pending: ['running', 'cancelled', 'expired'], running: ['completed', 'cancelled'],
    completed: [], cancelled: [], expired: [],
  };
  if (!allowed[event.status].includes(status)) throw new Error('Invalid scheduler status transition');
  return freezeData(copyData({ ...state, followups: state.followups.map(e => e === event ? { ...e, status } : e) }));
}
