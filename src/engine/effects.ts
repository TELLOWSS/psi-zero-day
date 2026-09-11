import type { Effect, EffectBundle, GameState, ValidatedContent } from '../domain';
import type { ProgressBounds } from './construction';
import type { EffectContext } from './scheduler';
import { changeProgress } from './construction';
import { changeRelation } from './relations';
import { createFollowUp, instanceKey, validateContext } from './scheduler';
import { add, copyData, freezeData, own } from './data';
import type { Mutable } from './data';
import { resolveCharacter } from './character-reference';

function apply(draft: Mutable<GameState>, effect: Effect, bounds: ProgressBounds, context: EffectContext): void {
  switch (effect.kind) {
    case 'context_stat': apply(draft, { kind: 'stat', effect_id: effect.effect_id,
      character_id: resolveCharacter(draft, effect.target, context), stat_id: effect.stat_id, delta: effect.delta }, bounds, context); break;
    case 'context_relation': apply(draft, { kind: 'relation', effect_id: effect.effect_id,
      from_id: resolveCharacter(draft, effect.from, context), to_id: resolveCharacter(draft, effect.to, context),
      field: effect.field, delta: effect.delta }, bounds, context); break;
    case 'context_reveal': apply(draft, { kind: 'reveal', effect_id: effect.effect_id,
      character_id: resolveCharacter(draft, effect.target, context), field_id: effect.field_id }, bounds, context); break;
    case 'player_stat':
      draft.player.stats[effect.stat_id] = add(own(draft.player.stats, effect.stat_id), effect.delta); break;
    case 'stat': {
      const stats = effect.character_id === draft.player.character_id ? draft.player.stats : own(draft.characters, effect.character_id)?.stats;
      if (!stats) throw new Error('Unknown character');
      stats[effect.stat_id] = add(own(stats, effect.stat_id), effect.delta); break;
    }
    case 'relation': draft.relations = copyData(changeRelation(draft.relations, effect.from_id, effect.to_id, effect.field, effect.delta)); break;
    case 'flag': draft.flags[effect.flag_id] = effect.value; break;
    case 'flag_change': {
      const value = own(draft.flags, effect.flag_id);
      if (typeof value !== 'number') throw new Error('Flag change requires an existing numeric flag');
      draft.flags[effect.flag_id] = add(value, effect.delta); break;
    }
    case 'reveal': {
      const character = own(draft.characters, effect.character_id);
      if (!character) throw new Error('Unknown NPC for information reveal');
      // field_id is an opaque information key until the Director supplies a field catalog.
      if (!character.revealed_fields.includes(effect.field_id)) character.revealed_fields.push(effect.field_id);
      break;
    }
    case 'construction_progress': draft.construction = copyData(changeProgress(draft.construction, effect.stage_id, effect.delta, bounds)); break;
    default: throw new Error('Unsupported effect');
  }
}

/** All writes, ledger entries and reservations commit together, or throw with input untouched. */
export function applyEffectBundle(state: GameState, bundle: EffectBundle, context: EffectContext,
  content: ValidatedContent, bounds: ProgressBounds): GameState {
  // Copy also rejects NaN, functions, cycles and shared mutable input references.
  const input = copyData(bundle);
  const ctx = copyData(context);
  validateContext(state, content, ctx);
  const marker = instanceKey(state, ctx, 'bundle', ctx.bundle_id);
  if (state.event_runtime.applied_effect_ids.includes(marker)) return state;
  const effects = [...input.immediate_effects, ...input.hidden_effects, ...input.relationship_effects, ...input.stat_effects];
  const ids = effects.map(e => e.effect_id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate effect IDs in bundle');
  const followupIds = input.followup_events.map(e => e.followup_id);
  if (new Set(followupIds).size !== followupIds.length) throw new Error('Duplicate follow-up IDs in bundle');
  const draft = copyData(state);
  const ledger = new Set(draft.event_runtime.applied_effect_ids);
  function once(kind: string, id: string, operation: () => void) {
    const key = instanceKey(draft, ctx, kind, id);
    if (!ledger.has(key)) { operation(); ledger.add(key); }
  }
  for (const effect of effects) once('effect', effect.effect_id, () => apply(draft, effect, bounds, ctx));
  for (const [key, value] of Object.entries(input.flags)) once('flags', JSON.stringify([ctx.bundle_id, key]), () => { draft.flags[key] = value; });
  for (const [key, value] of Object.entries(input.ending_flags)) once('ending_flags', JSON.stringify([ctx.bundle_id, key]), () => { draft.ending_flags[key] = value; });
  for (const followup of input.followup_events) once('followup', followup.followup_id, () => {
    const event = createFollowUp(draft, content, followup, ctx);
    if (!draft.followups.some(e => e.dedupe_key === event.dedupe_key)) draft.followups.push(copyData(event));
  });
  ledger.add(marker);
  draft.event_runtime.applied_effect_ids = [...ledger];
  return freezeData(draft);
}
