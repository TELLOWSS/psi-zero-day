import type { Condition, Effect, FlagMap, GameTime, Id, StatMap, TextId, TimeSlot } from './common';

export interface CharacterDefinition {
  readonly schema_version: 1;
  readonly id: Id;
  readonly name_text_id: TextId;
  readonly role_text_id: TextId;
  readonly trade_text_id: TextId;
  readonly age_group_text_id: TextId;
  readonly nationality_text_id: TextId;
  readonly experience: number;
  readonly stats: StatMap;
  readonly traits: readonly TextId[];
  readonly weaknesses: readonly TextId[];
  readonly appearance_conditions: readonly Condition[];
  readonly exit_conditions: readonly Condition[];
  readonly asset_bindings: Readonly<Record<Id, Id>>;
  readonly initial_state: {
    readonly morale: number;
    readonly fatigue: number;
    readonly availability: { readonly available: boolean; readonly reason_text_id?: TextId };
    readonly revealed_fields: readonly Id[];
    readonly story_flags?: FlagMap;
  };
}

export interface CharacterState {
  readonly character_id: Id;
  readonly experience: number;
  readonly stats: StatMap;
  readonly traits: readonly TextId[];
  readonly weaknesses: readonly TextId[];
  readonly morale: number;
  readonly fatigue: number;
  readonly availability: { readonly available: boolean; readonly reason_text_id?: TextId };
  readonly story_flags: FlagMap;
  readonly event_history: readonly Id[];
  readonly revealed_fields: readonly Id[];
}

/** Directed relation: A -> B and B -> A are separate records. */
export interface RelationDefinition {
  readonly from_id: Id;
  readonly to_id: Id;
  readonly initial_state: {
    readonly relationship_values: StatMap;
    readonly trust: number;
    readonly respect: number;
    readonly reporting: number;
    readonly flags: FlagMap;
  };
}

export interface RelationState {
  readonly from_id: Id;
  readonly to_id: Id;
  readonly relationship_values: StatMap;
  readonly trust: number;
  readonly respect: number;
  readonly reporting: number;
  readonly flags: FlagMap;
  readonly history: readonly Id[];
}

export interface FollowUpDefinition {
  readonly followup_id: Id;
  readonly event_id: Id;
  readonly delay: { readonly days: number; readonly slot?: TimeSlot };
  readonly conditions: readonly Condition[];
  /** No implicit default policy before Director specification. */
  readonly unmet_policy: 'defer' | 'cancel' | 'fail';
}

export interface FollowUpEvent extends FollowUpDefinition {
  readonly instance_id: Id;
  readonly source_instance_id: Id;
  readonly source_choice_id?: Id;
  readonly participant_bindings: Readonly<Record<Id, Id>>;
  readonly created_at: GameTime;
  readonly due_at: GameTime;
  readonly expires_at?: GameTime;
  readonly status: 'pending' | 'running' | 'completed' | 'cancelled' | 'expired';
  readonly dedupe_key: Id;
}

export interface EffectBundle {
  readonly immediate_effects: readonly Effect[];
  readonly hidden_effects: readonly Effect[];
  readonly relationship_effects: readonly Extract<Effect, { kind: 'relation' }>[];
  readonly stat_effects: readonly Extract<Effect, { kind: 'stat' }>[];
  readonly flags: FlagMap;
  readonly ending_flags: FlagMap;
  readonly followup_events: readonly FollowUpDefinition[];
}

export interface EventChoice {
  readonly choice_id: Id;
  readonly text_id: TextId;
  readonly requirements: readonly Condition[];
  readonly next_node_id?: Id;
  readonly effects: EffectBundle;
}
export interface EventDefinition {
  readonly schema_version: 1;
  readonly event_id: Id;
  readonly title_text_id: TextId;
  readonly category_text_id: TextId;
  readonly chapter_text_id: TextId;
  readonly conditions: readonly Condition[];
  readonly participants: readonly { readonly role_id: Id; readonly character_id: Id }[];
  readonly scene: { readonly background_asset_id?: Id; readonly character_asset_ids: readonly Id[] };
  readonly entry_node_id: Id;
  readonly dialogue: readonly {
    readonly node_id: Id;
    readonly text_id: TextId;
    readonly speaker_role_id?: Id;
    readonly next_node_id?: Id;
    readonly choice_ids: readonly Id[];
  }[];
  readonly choices: readonly EventChoice[];
  readonly failure_conditions: readonly Condition[];
  readonly failure_effects?: EffectBundle;
}

export interface EndingRule {
  readonly schema_version: 1;
  readonly ending_id: Id;
  readonly title_text_id: TextId;
  readonly eligibility: readonly Condition[];
  readonly accumulated_requirements: readonly Condition[];
  readonly exclusions: readonly Condition[];
  readonly result_asset_ids: readonly Id[];
  readonly archive_text_id: TextId;
  // Evaluation point, formulas, thresholds and tie resolution remain unspecified.
}

export interface AssetEntry {
  readonly asset_id: Id;
  readonly type: 'image' | 'audio';
  readonly group_id: Id;
  readonly variants: readonly {
    readonly uri: string;
    readonly format: string;
    readonly bytes: number;
    readonly hash: string;
    readonly width?: number;
    readonly height?: number;
    readonly locale?: string;
  }[];
  readonly dependencies: readonly Id[];
  readonly fallback_id?: Id;
  readonly preload_policy: 'required' | 'next_scene' | 'on_demand';
  readonly version: string;
}
export interface AssetManifest {
  readonly schema_version: 1;
  readonly assets: readonly AssetEntry[];
}
export interface LocalizationCatalog {
  readonly locale: string;
  readonly messages: Readonly<Record<TextId, string>>;
}
export interface ContentBundle {
  readonly schema_version: 1;
  readonly content_version: string;
  readonly default_locale: string;
  readonly localizations: readonly LocalizationCatalog[];
  readonly characters: readonly CharacterDefinition[];
  readonly relations: readonly RelationDefinition[];
  readonly events: readonly EventDefinition[];
  readonly endings: readonly EndingRule[];
  readonly asset_manifest: AssetManifest;
}

declare const validatedContent: unique symbol;
/** Only ContentRegistry creates this compile-time validation proof. */
export type ValidatedContent = ContentBundle & { readonly [validatedContent]: true };
