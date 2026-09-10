import type { ComparisonOperator, Condition, FlagValue, GameState } from '../domain';
import { canonicalStage, getProgress } from './construction';
import { getRelation } from './relations';
import { own } from './data';

/** Strict equality, numeric ordering. Missing/type-mismatched values never match, including ne. */
export function compare(left: FlagValue | undefined, op: ComparisonOperator, right: FlagValue): boolean {
  if (left === undefined || typeof left !== typeof right) return false;
  if (typeof left === 'number' && (!Number.isFinite(left) || !Number.isFinite(right))) return false;
  if (op === 'eq') return left === right;
  if (op === 'ne') return left !== right;
  if (typeof left !== 'number' || typeof right !== 'number') return false;
  switch (op) {
    case 'gt': return left > right;
    case 'gte': return left >= right;
    case 'lt': return left < right;
    case 'lte': return left <= right;
    default: throw new Error('Unknown comparison operator');
  }
}
export function evaluateCondition(state: GameState, condition: Condition): boolean {
  const c = condition;
  switch (c.kind) {
    case 'all': return c.conditions.every(v => evaluateCondition(state, v));
    case 'any': return c.conditions.some(v => evaluateCondition(state, v));
    case 'not': return !evaluateCondition(state, c.condition);
    case 'compare': return compare(c.left, c.operator, c.right);
    case 'flag': return compare(own(state.flags, c.flag_id), 'eq', c.equals);
    case 'flag_compare': return compare(own(state.flags, c.flag_id), c.operator, c.value);
    case 'player_stat': return compare(own(state.player.stats, c.stat_id), c.operator, c.value);
    case 'stat': {
      const stats = c.character_id === state.player.character_id ? state.player.stats : own(state.characters, c.character_id)?.stats;
      return compare(stats ? own(stats, c.stat_id) : undefined, c.operator, c.value);
    }
    case 'relation': return compare(getRelation(state.relations, c.from_id, c.to_id)?.[c.field], c.operator, c.value);
    case 'construction_stage': return compare(canonicalStage(state.construction.stage_id), c.operator, canonicalStage(c.stage_id));
    case 'construction_progress': return compare(getProgress(state.construction, c.stage_id), c.operator, c.value);
    case 'event_completed': return new Set(state.event_runtime.occurrence_history
      .filter(e => e.event_id === c.event_id).map(e => e.instance_id)).size >= c.minimum_count;
    case 'choice_selected': {
      const occurrences = new Set(state.event_runtime.occurrence_history.filter(e => e.event_id === c.event_id).map(e => e.instance_id));
      return new Set(state.event_runtime.choice_history.filter(e => e.choice_id === c.choice_id && occurrences.has(e.instance_id))
        .map(e => e.instance_id)).size >= c.minimum_count;
    }
    default: throw new Error('Unsupported condition');
  }
}
