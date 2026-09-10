import type { RelationField, RelationState } from '../domain';
import { add } from './data';

export function getRelation(relations: readonly RelationState[], from: string, to: string): RelationState | undefined {
  const matches = relations.filter(r => r.from_id === from && r.to_id === to);
  if (matches.length > 1) throw new Error('Duplicate directed relation');
  return matches[0];
}
export function changeRelation(relations: readonly RelationState[], from: string, to: string,
  field: RelationField, delta: number): readonly RelationState[] {
  if (!['trust', 'respect', 'reporting'].includes(field)) throw new Error('Unknown relation field');
  const relation = getRelation(relations, from, to);
  if (!relation) throw new Error('Missing directed relation; no implicit baseline');
  const value = add(relation[field], delta);
  return relations.map(r => r === relation ? { ...r, [field]: value } : r);
}
