import type { GameState, RelationshipMetric, ValidatedContent } from '../domain';
import type { EffectContext } from './scheduler';
import type { ProgressBounds } from './construction';
import { applyEffectBundle } from './effects';
import { getNpcRelationship, RELATIONSHIP_FIELDS } from './relations';

/** Pure helper; shares the existing atomic bundle and idempotency ledger. */
export function applyNpcRelationshipDelta(state: GameState,
  change: { readonly npc_id: string; readonly metric: RelationshipMetric; readonly delta: number; readonly effect_id: string },
  context: EffectContext, content: ValidatedContent, bounds: ProgressBounds): GameState {
  getNpcRelationship(state, change.npc_id);
  return applyEffectBundle(state, {
    immediate_effects: [{ kind: 'relation', effect_id: change.effect_id, from_id: change.npc_id,
      to_id: state.player.character_id, field: RELATIONSHIP_FIELDS[change.metric], delta: change.delta }],
    hidden_effects: [], relationship_effects: [], stat_effects: [], flags: {}, ending_flags: {}, followup_events: [],
  }, context, content, bounds);
}
