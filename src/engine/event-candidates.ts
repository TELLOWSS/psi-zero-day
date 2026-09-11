import type { EventDefinition, EventParticipant, GameState, ValidatedContent } from '../domain';
import { compare, evaluateConditions } from './conditions';
import { getRelation } from './relations';
import { dueFollowUps } from './scheduler';
import { copyData, freezeData, own } from './data';

export interface EventCandidate {
  readonly event_id: string;
  readonly participant_bindings: Readonly<Record<string, string>>;
  readonly priority: number;
  readonly source_followup_id?: string;
  readonly missing_participants: boolean;
  /** Non-start actions remain discoverable and use the same start_event command for resolution. */
  readonly resolution?: 'cancel' | 'fail';
}
function matches(state: GameState, content: ValidatedContent, slot: EventParticipant, id: string): boolean {
  const definition = content.characters.find(c => c.id === id);
  if (!definition) return false;
  const npc = own(state.characters, id);
  if (id !== state.player.character_id && !npc?.availability.available) return false;
  if (slot.character_id !== undefined) return slot.character_id === id;
  const selector = slot.selector;
  if (!selector || !npc) return false; // Dynamic slots select NPCs; player is an explicit binding.
  for (const key of ['role_text_id', 'trade_text_id', 'nationality_text_id'] as const) {
    if (selector[key] !== undefined && selector[key] !== definition[key]) return false;
  }
  return selector.stats.every(c => compare(own(npc.stats, c.stat_id), c.operator, c.value)) &&
    selector.relations.every(c => {
      const relation = c.direction === 'outgoing' ? getRelation(state.relations, id, c.character_id) : getRelation(state.relations, c.character_id, id);
      return compare(relation?.[c.field], c.operator, c.value);
    });
}
/** ID ordering provides deterministic binding without probability or implicit replacement. */
export function bindParticipants(state: GameState, content: ValidatedContent, event: EventDefinition,
  pinned: Readonly<Record<string, string>> = {}): Readonly<Record<string, string>> | null {
  const bindings: Record<string, string> = {};
  const used = new Set<string>();
  const slots = [...event.participants].sort((a, b) => {
    const rank = (slot: EventParticipant) => Object.hasOwn(pinned, slot.role_id) ? 0 : slot.character_id !== undefined ? 1 : 2;
    return rank(a) - rank(b); // Stable sort preserves authored order within each group.
  });
  for (const slot of slots) {
    const fixed = own(pinned, slot.role_id) ?? slot.character_id;
    const acceptable = (id: string) => (event.runtime?.allow_reuse === true || !used.has(id)) && matches(state, content, slot, id);
    const id = fixed !== undefined ? (acceptable(fixed) ? fixed : undefined)
      : content.characters.map(c => c.id).sort().find(acceptable);
    if (id === undefined) return null;
    bindings[slot.role_id] = id; used.add(id);
  }
  return freezeData(bindings);
}
export function eventEligible(state: GameState, event: EventDefinition, chapter: string): boolean {
  const policy = event.runtime;
  if (!policy || policy.chapter_id !== chapter || state.event_runtime.chapter_id !== chapter) return false;
  if (!evaluateConditions(state, event.conditions)) return false;
  if (!Object.entries(policy.required_flags).every(([key, value]) => compare(own(state.flags, key), 'eq', value))) return false;
  const count = new Set(state.event_runtime.occurrence_history.filter(h => h.event_id === event.event_id).map(h => h.instance_id)).size;
  return policy.repeat_policy.kind === 'repeatable' || count < (policy.repeat_policy.kind === 'max_occurrences' ? policy.repeat_policy.count : 1);
}
export function eventCandidates(state: GameState, content: ValidatedContent, chapter: string): readonly EventCandidate[] {
  if (state.event_runtime.active_instance) return [];
  const result: EventCandidate[] = [];
  for (const event of content.events) {
    if (!event.runtime) continue;
    const eligible = eventEligible(state, event, chapter);
    if (eligible && event.runtime.trigger !== 'followup') {
      const bindings = bindParticipants(state, content, event);
      if (bindings || event.runtime.missing_participant_policy === 'fail') result.push({ event_id: event.event_id,
        participant_bindings: bindings ?? {}, priority: event.runtime.selection_policy.priority, missing_participants: bindings === null });
    }
    if (event.runtime.trigger !== 'normal') for (const followup of dueFollowUps(state).filter(f => f.event_id === event.event_id)) {
      const conditionsMet = evaluateConditions(state, followup.conditions, followup);
      const bindings = bindParticipants(state, content, event, followup.participant_bindings);
      if (eligible && conditionsMet && bindings) result.push({ event_id: event.event_id, participant_bindings: bindings,
        priority: event.runtime.selection_policy.priority, missing_participants: false, source_followup_id: followup.instance_id });
      else if (followup.unmet_policy !== 'defer') result.push({ event_id: event.event_id,
        participant_bindings: followup.participant_bindings, priority: event.runtime.selection_policy.priority,
        missing_participants: bindings === null, source_followup_id: followup.instance_id, resolution: followup.unmet_policy });
    }
  }
  return freezeData(copyData(result.sort((a, b) => b.priority - a.priority ||
    lexical(a.event_id, b.event_id) || lexical(a.source_followup_id ?? '', b.source_followup_id ?? ''))));
}
function lexical(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0; }
export function selectEventCandidate(candidates: readonly EventCandidate[]): EventCandidate | undefined {
  return candidates[0]; // Candidates are sorted by explicit priority then stable ID. RNG is untouched.
}
