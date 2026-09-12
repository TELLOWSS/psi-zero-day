import type { GameTime, Id, RelationField } from './common';

export type RelationshipMetric = 'TRUST' | 'RESPECT' | 'REPORT' | 'COMPLIANCE';
export interface RelationshipBounds { readonly min: number; readonly max: number }
/** Authored initialization policy, never a second mutable relationship store. */
export interface RelationshipPolicy {
  readonly bounds: RelationshipBounds;
  readonly initial_compliance: number;
}
export interface RelationshipSource {
  readonly effect_instance_id: string;
  readonly event_id: Id;
  readonly event_instance_id: Id;
  readonly effect_id: Id;
  readonly choice_id?: Id;
  readonly at: GameTime;
}
export interface RelationshipDelta {
  readonly field: RelationField;
  readonly requested_delta: number;
  readonly applied_delta: number;
  readonly before: number;
  readonly after: number;
  readonly source: RelationshipSource;
}
