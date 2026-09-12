import { z } from 'zod';
import type { RelationState, ValidatedContent } from '../domain';
import { relationStateSchema } from '../content/schemas';
import { copyData, freezeData } from '../engine/data';
import { clampRelationship } from '../engine/relations';

/** JSON codec only, no storage, whole-save migration or additional mutable state. */
export function serializeRelationships(relations: readonly RelationState[]): string {
  return JSON.stringify(z.array(relationStateSchema).parse(copyData(relations)));
}
export function restoreRelationships(json: string, content: ValidatedContent): readonly RelationState[] {
  const relations = z.array(relationStateSchema).parse(JSON.parse(json));
  const definitions = new Map(content.relations.map(r => [`${r.from_id}->${r.to_id}`, r]));
  const seen = new Set<string>();
  for (const relation of relations) {
    const key = `${relation.from_id}->${relation.to_id}`;
    if (!definitions.has(key) || seen.has(key)) throw new Error('Unknown/duplicate saved relationship reference');
    seen.add(key);
    const policy = content.relationship_policy;
    if (!policy) {
      if (relation.bounds || relation.compliance !== undefined || relation.delta_history) throw new Error('Saved relationship policy mismatch');
      continue;
    }
    if (!relation.bounds || relation.bounds.min !== policy.bounds.min || relation.bounds.max !== policy.bounds.max ||
      relation.compliance === undefined || !relation.delta_history) throw new Error('Saved relationship policy mismatch');
    for (const field of ['trust', 'respect', 'reporting', 'compliance'] as const) {
      const value = relation[field]!;
      if (clampRelationship(value, policy.bounds) !== value) throw new Error('Saved relationship outside bounds');
    }
    const initial = definitions.get(key)!.initial_state;
    const values = { trust: initial.trust, respect: initial.respect, reporting: initial.reporting, compliance: policy.initial_compliance };
    const effects = new Set<string>();
    for (const delta of relation.delta_history) {
      const event = content.events.find(e => e.event_id === delta.source.event_id);
      if (!event || (delta.source.choice_id && !event.choices.some(c => c.choice_id === delta.source.choice_id))) throw new Error('Unknown relationship history event/choice');
      if (effects.has(delta.source.effect_instance_id)) throw new Error('Duplicate saved relationship delta');
      effects.add(delta.source.effect_instance_id);
      if (delta.before !== values[delta.field] || delta.after !== clampRelationship(delta.before + delta.requested_delta, policy.bounds) ||
        delta.applied_delta !== delta.after - delta.before) throw new Error('Inconsistent saved relationship history');
      values[delta.field] = delta.after;
    }
    for (const field of ['trust', 'respect', 'reporting', 'compliance'] as const) {
      if (values[field] !== relation[field]) throw new Error('Saved values do not match relationship history');
    }
  }
  if (seen.size !== definitions.size) throw new Error('Missing saved relationships');
  return freezeData(copyData(relations));
}
