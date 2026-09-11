import type { ComparisonOperator, FlagMap, GameTime, Id, RelationField, TextId, TimeSlot } from './common';
import type { EffectBundle } from './content';

export interface ParticipantSelector {
  readonly role_text_id?: TextId;
  readonly trade_text_id?: TextId;
  readonly nationality_text_id?: TextId;
  readonly stats: readonly { readonly stat_id: Id; readonly operator: ComparisonOperator; readonly value: number }[];
  readonly relations: readonly { readonly character_id: Id; readonly direction: 'outgoing' | 'incoming';
    readonly field: RelationField; readonly operator: ComparisonOperator; readonly value: number }[];
}
export interface EventParticipant {
  readonly role_id: Id;
  readonly character_id?: Id;
  readonly selector?: ParticipantSelector;
}
export type PresentationCue =
  | { readonly type: 'SCENE_CHANGE' | 'CG_CHANGE' | 'AUDIO_CUE'; readonly asset_id: Id }
  | { readonly type: 'CHARACTER_ENTER' | 'CHARACTER_EXIT'; readonly role_id: Id };
export interface EventNode {
  readonly node_id: Id;
  readonly type?: 'DIALOGUE' | 'CHOICE' | 'RESULT' | 'END';
  readonly text_id: TextId;
  readonly speaker_role_id?: Id;
  readonly next_node_id?: Id;
  readonly choice_ids: readonly Id[];
  readonly effects?: EffectBundle;
  readonly outcome?: 'completed' | 'failed';
  readonly presentation_cues?: readonly PresentationCue[];
}
export interface EventRuntimePolicy {
  readonly allow_reuse?: boolean;
  readonly chapter_id: Id;
  readonly trigger: 'normal' | 'followup' | 'both';
  readonly repeat_policy: { readonly kind: 'once' | 'repeatable' } | { readonly kind: 'max_occurrences'; readonly count: number };
  readonly required_flags: FlagMap;
  readonly selection_policy: { readonly priority: number };
  readonly missing_participant_policy: 'exclude' | 'fail';
}
export interface EventInstance {
  readonly instance_id: Id;
  readonly event_id: Id;
  readonly status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  readonly started_day: number;
  readonly started_slot: TimeSlot;
  readonly participant_bindings: Readonly<Record<Id, Id>>;
  readonly current_node_id: Id;
  readonly visited_node_ids: readonly Id[];
  readonly selected_choice_ids: readonly Id[];
  readonly applied_effect_ids: readonly Id[];
  readonly source_followup_id?: Id;
  readonly source_instance_id?: Id;
  readonly source_choice_id?: Id;
  readonly source_participant_bindings?: Readonly<Record<Id, Id>>;
  readonly due_at?: GameTime;
  readonly completion_status?: 'completed' | 'failed' | 'cancelled';
  readonly runtime_flags: FlagMap;
}
export type PresentationCommand = PresentationCue |
  { readonly type: 'SHOW_DIALOGUE' | 'SHOW_RESULT'; readonly instance_id: Id; readonly node_id: Id;
    readonly text_id: TextId; readonly speaker_character_id?: Id } |
  { readonly type: 'SHOW_CHOICE'; readonly instance_id: Id; readonly node_id: Id; readonly text_id: TextId;
    readonly choices: readonly { readonly choice_id: Id; readonly text_id: TextId; readonly enabled: boolean }[] };
