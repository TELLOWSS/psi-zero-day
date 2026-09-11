import type { CharacterReference, Condition, GameState, ParticipantContext } from '../domain';
import { own } from './data';

export function resolveCharacter(state: GameState, reference: CharacterReference, context?: ParticipantContext): string {
  let id: string;
  switch (reference.kind) {
    case 'player': id = state.player.character_id; break;
    case 'character': id = reference.character_id; break;
    case 'participant': {
      if (!context) throw new Error('Participant context required');
      const bound = own(context.participant_bindings, reference.role_id);
      if (bound === undefined) throw new Error(`Unbound participant role: ${reference.role_id}`);
      id = bound; break;
    }
    default: throw new Error('Unsupported character reference');
  }
  if (id !== state.player.character_id && !own(state.characters, id)) throw new Error(`Unknown resolved character: ${id}`);
  return id;
}

/** Preflight every branch so boolean short-circuiting cannot mask missing context. */
export function assertConditionContext(state: GameState, condition: Condition, context?: ParticipantContext): void {
  switch (condition.kind) {
    case 'all': case 'any': condition.conditions.forEach(c => assertConditionContext(state, c, context)); break;
    case 'not': assertConditionContext(state, condition.condition, context); break;
    case 'context_stat': resolveCharacter(state, condition.target, context); break;
    case 'context_relation': resolveCharacter(state, condition.from, context); resolveCharacter(state, condition.to, context); break;
  }
}
