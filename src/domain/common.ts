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
export const CORE_STAGES = ['FOUNDATION', 'BASEMENT', 'LOW_RISE', 'TYPICAL_FLOOR', 'HIGH_RISE', 'ROOF', 'COMPLETION'] as const;
export type CoreStage = (typeof CORE_STAGES)[number];
/** TASK-001 labels remain accepted; TASK-002 commands use canonical IDs. */
export type StageId = CoreStage | ConstructionStage;
export type ComparisonOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
export type RelationField = 'trust' | 'respect' | 'reporting';
export type CharacterReference =
  | { readonly kind: 'player' }
  | { readonly kind: 'character'; readonly character_id: Id }
  | { readonly kind: 'participant'; readonly role_id: Id };
export interface ParticipantContext {
  readonly participant_bindings: Readonly<Record<Id, Id>>;
}

export type Condition =
  | { readonly kind: 'all' | 'any'; readonly conditions: readonly Condition[] }
  | { readonly kind: 'not'; readonly condition: Condition }
  | { readonly kind: 'flag'; readonly flag_id: Id; readonly equals: FlagValue }
  | { readonly kind: 'stat'; readonly character_id: Id; readonly stat_id: Id;
      readonly operator: ComparisonOperator; readonly value: number }
  | { readonly kind: 'event_completed'; readonly event_id: Id; readonly minimum_count: number }
  | { readonly kind: 'player_stat'; readonly stat_id: Id; readonly operator: ComparisonOperator; readonly value: number }
  | { readonly kind: 'relation'; readonly from_id: Id; readonly to_id: Id; readonly field: RelationField;
      readonly operator: ComparisonOperator; readonly value: number }
  | { readonly kind: 'construction_stage'; readonly stage_id: StageId; readonly operator: 'eq' | 'ne' }
  | { readonly kind: 'construction_progress'; readonly stage_id: StageId; readonly operator: ComparisonOperator; readonly value: number }
  | { readonly kind: 'choice_selected'; readonly event_id: Id; readonly choice_id: Id; readonly minimum_count: number }
  | { readonly kind: 'compare'; readonly left: FlagValue; readonly operator: ComparisonOperator; readonly right: FlagValue }
  | { readonly kind: 'flag_compare'; readonly flag_id: Id; readonly operator: ComparisonOperator; readonly value: FlagValue }
  | { readonly kind: 'context_stat'; readonly target: CharacterReference; readonly stat_id: Id; readonly operator: ComparisonOperator; readonly value: number }
  | { readonly kind: 'context_relation'; readonly from: CharacterReference; readonly to: CharacterReference;
      readonly field: RelationField; readonly operator: ComparisonOperator; readonly value: number };

/** Serializable rule operations; implementations belong to engine only. */
export type Effect =
  | { readonly effect_id: Id; readonly kind: 'stat'; readonly character_id: Id;
      readonly stat_id: Id; readonly delta: number }
  | { readonly effect_id: Id; readonly kind: 'flag'; readonly flag_id: Id; readonly value: FlagValue }
  | { readonly effect_id: Id; readonly kind: 'relation'; readonly from_id: Id;
      readonly to_id: Id; readonly field: 'trust' | 'respect' | 'reporting'; readonly delta: number }
  | { readonly effect_id: Id; readonly kind: 'reveal'; readonly character_id: Id; readonly field_id: Id }
  | { readonly effect_id: Id; readonly kind: 'player_stat'; readonly stat_id: Id; readonly delta: number }
  | { readonly effect_id: Id; readonly kind: 'flag_change'; readonly flag_id: Id; readonly delta: number }
  | { readonly effect_id: Id; readonly kind: 'construction_progress'; readonly stage_id: StageId; readonly delta: number }
  | { readonly effect_id: Id; readonly kind: 'context_stat'; readonly target: CharacterReference; readonly stat_id: Id; readonly delta: number }
  | { readonly effect_id: Id; readonly kind: 'context_relation'; readonly from: CharacterReference; readonly to: CharacterReference;
      readonly field: RelationField; readonly delta: number }
  | { readonly effect_id: Id; readonly kind: 'context_reveal'; readonly target: CharacterReference; readonly field_id: Id };

export interface RngSnapshot {
  readonly algorithm: 'mulberry32-v1';
  readonly state: number;
}
