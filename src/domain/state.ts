import type { StageId, FlagMap, GameTime, Id, RngSnapshot, StatMap } from './common';
import type { CharacterState, FollowUpEvent, RelationState } from './content';

/** Opaque progression data only. No progression rules or initial values. */
export interface ProgressionState {
  readonly values: StatMap;
  readonly flags: FlagMap;
}
export interface PlayerState {
  readonly character_id: Id;
  readonly archetype_id: Id;
  readonly stats: StatMap;
  readonly health: number;
  readonly fatigue: number;
  readonly stress: number;
  readonly money: number;
  readonly family: StatMap;
  readonly company_evaluation: number;
  readonly reputation: number;
  readonly integrity: number;
  readonly career: ProgressionState;
  readonly dark_path: ProgressionState;
  readonly legal_status: FlagMap;
  readonly safety_record: StatMap;
}

export interface AudioTrack {
  readonly asset_id: Id;
  readonly loop: boolean;
  readonly gain: number;
  readonly logical_position?: number;
}
export interface AudioState {
  readonly context_id?: Id;
  readonly bgm: AudioTrack | null;
  readonly ambience: readonly AudioTrack[];
  readonly sfx_bus: readonly { readonly cue_id: Id; readonly asset_id: Id }[];
  readonly event_bus: readonly { readonly cue_id: Id; readonly asset_id: Id }[];
  readonly volumes: { readonly master: number; readonly bgm: number;
    readonly ambience: number; readonly sfx: number; readonly event: number };
  readonly muted: boolean;
  readonly suspended: boolean;
  readonly transition?: { readonly fade_out_ms: number; readonly fade_in_ms: number;
    readonly next_asset_id?: Id };
}

export interface GameState {
  readonly run: { readonly run_id: Id; readonly playthrough: number;
    readonly content_version: string; readonly rules_version: string; readonly rng: RngSnapshot };
  readonly clock: GameTime;
  readonly player: PlayerState;
  readonly schedule: { readonly selected_schedule_id?: Id; readonly evening_choice_id?: Id };
  readonly assignments: readonly { readonly assignment_id: Id; readonly character_id: Id;
    readonly task_id: Id; readonly delegated_to_id?: Id }[];
  readonly characters: Readonly<Record<Id, CharacterState>>;
  readonly relations: readonly RelationState[];
  readonly construction: { readonly stage_id: StageId;
    readonly progress_by_stage: Readonly<Partial<Record<StageId, number>>>;
    readonly milestones: readonly Id[] };
  readonly psi: { readonly unlocked_node_ids: readonly Id[]; readonly progress: ProgressionState };
  readonly flags: FlagMap;
  readonly ending_flags: FlagMap;
  readonly event_runtime: {
    readonly active_instance: { readonly instance_id: Id; readonly event_id: Id;
      readonly node_id: Id; readonly participant_bindings: Readonly<Record<Id, Id>> } | null;
    readonly occurrence_history: readonly { readonly instance_id: Id; readonly event_id: Id;
      readonly occurred_at: GameTime }[];
    readonly completion_history: readonly { readonly instance_id: Id; readonly event_id: Id;
      readonly completed_at: GameTime }[];
    readonly choice_history: readonly { readonly instance_id: Id; readonly choice_id: Id }[];
    readonly applied_effect_ids: readonly Id[];
  };
  readonly followups: readonly FollowUpEvent[];
  readonly ending_runtime: { readonly unlocked_path_ids: readonly Id[];
    readonly satisfied_rule_ids: readonly Id[]; readonly ending_id?: Id };
  readonly presentation_resume: { readonly event_id: Id; readonly node_id: Id } | null;
  readonly audio: AudioState;
}

/** Phase 1: unlocks only. No rewards, carry-over stats or progression. */
export interface ProfileState {
  readonly profile_id: Id;
  readonly unlocked_ending_ids: readonly Id[];
  readonly unlocked_cg_ids: readonly Id[];
  readonly unlocked_record_ids: readonly Id[];
}
