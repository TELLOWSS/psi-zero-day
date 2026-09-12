import type { GameState, RelationField, RelationState, RelationshipBounds, RelationshipMetric, RelationshipSource } from '../domain';
import { add, finite, freezeData, copyData } from './data';

export const RELATIONSHIP_FIELDS = { TRUST: 'trust', RESPECT: 'respect', REPORT: 'reporting', COMPLIANCE: 'compliance' } as const;
export function clampRelationship(value: number, bounds: RelationshipBounds): number {
  finite(value); finite(bounds.min); finite(bounds.max);
  if (bounds.min > bounds.max) throw new Error('Invalid relationship bounds');
  return Math.min(bounds.max, Math.max(bounds.min, value));
}
export function getNpcRelationship(state: GameState, npcId: string): RelationState {
  if (!Object.hasOwn(state.characters, npcId)) throw new Error('Unknown NPC relationship');
  const relation = getRelation(state.relations, npcId, state.player.character_id);
  if (!relation) throw new Error('Missing NPC -> player relationship');
  return relation;
}
export function relationshipValues(relation: RelationState): Readonly<Record<RelationshipMetric, number>> {
  if (relation.compliance === undefined || !relation.bounds) throw new Error('Four-value relationship policy required');
  return Object.freeze({ TRUST: relation.trust, RESPECT: relation.respect, REPORT: relation.reporting, COMPLIANCE: relation.compliance });
}
export function inspectRelationshipDeltas(state: GameState, npcId: string) {
  return getNpcRelationship(state, npcId).delta_history ?? Object.freeze([]);
}

export function getRelation(relations: readonly RelationState[], from: string, to: string): RelationState | undefined {
  const matches = relations.filter(r => r.from_id === from && r.to_id === to);
  if (matches.length > 1) throw new Error('Duplicate directed relation');
  return matches[0];
}
export function changeRelation(relations: readonly RelationState[], from: string, to: string,
  field: RelationField, delta: number, source?: RelationshipSource): readonly RelationState[] {
  if (!['trust', 'respect', 'reporting', 'compliance'].includes(field)) throw new Error('Unknown relation field');
  const relation = getRelation(relations, from, to);
  if (!relation) throw new Error('Missing directed relation; no implicit baseline');
  const requested = add(relation[field], delta);
  const value = relation.bounds ? clampRelationship(requested, relation.bounds) : requested;
  let changed: RelationState = { ...relation, [field]: value };
  if (relation.bounds) {
    if (!source?.effect_instance_id) throw new Error('Relationship delta requires an explainable source');
    if (relation.delta_history?.some(d => d.source.effect_instance_id === source.effect_instance_id)) throw new Error('Duplicate relationship effect source');
    changed = { ...changed, delta_history: [...(relation.delta_history ?? []), {
      field, requested_delta: delta, applied_delta: value - relation[field]!, before: relation[field]!, after: value, source: copyData(source),
    }] };
  }
  return freezeData(relations.map(r => r === relation ? changed : r));
}
