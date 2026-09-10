export type Id = string;
export type TextId = string;
export type StatMap = Readonly<Record<Id, number>>;
export type FlagValue = boolean | number | string;
export type FlagMap = Readonly<Record<Id, FlagValue>>;
export type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export const TIME_SLOTS = ['PRE_WORK', 'MORNING', 'AFTERNOON', 'EVENING'] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];
export interface GameTime {
  readonly day: number;
  readonly slot: TimeSlot;
  /** Presentation metadata only. Never used for scheduling or comparisons. */
  readonly display_time?: string;
}
export const CONSTRUCTION_STAGES = [
  'Foundation', 'Basement', 'Low Rise', 'Typical Floor', 'High Rise', 'Roof', 'Completion',
] as const;
export type ConstructionStage = (typeof CONSTRUCTION_STAGES)[number];

export type Condition =
  | { readonly kind: 'all' | 'any'; readonly conditions: readonly Condition[] }
  | { readonly kind: 'not'; readonly condition: Condition }
  | { readonly kind: 'flag'; readonly flag_id: Id; readonly equals: FlagValue }
  | { readonly kind: 'stat'; readonly character_id: Id; readonly stat_id: Id;
      readonly operator: 'eq' | 'gte' | 'lte'; readonly value: number }
  | { readonly kind: 'event_completed'; readonly event_id: Id; readonly minimum_count: number };

/** Data contracts only; TASK-001 does not evaluate conditions or apply effects. */
export type Effect =
  | { readonly effect_id: Id; readonly kind: 'stat'; readonly character_id: Id;
      readonly stat_id: Id; readonly delta: number }
  | { readonly effect_id: Id; readonly kind: 'flag'; readonly flag_id: Id; readonly value: FlagValue }
  | { readonly effect_id: Id; readonly kind: 'relation'; readonly from_id: Id;
      readonly to_id: Id; readonly field: 'trust' | 'respect' | 'reporting'; readonly delta: number }
  | { readonly effect_id: Id; readonly kind: 'reveal'; readonly character_id: Id; readonly field_id: Id };

export interface RngSnapshot {
  readonly algorithm: 'mulberry32-v1';
  readonly state: number;
}
