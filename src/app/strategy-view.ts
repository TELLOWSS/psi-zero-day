import type { FlagMap, Id, StageId, StatMap, TimeSlot } from '../domain/common';
import type { GameState } from '../domain/state';
import { copyData, freezeData } from '../engine/data';
import { projectEpisode01Frictions } from './strategy-frictions';
import type { FieldFriction } from './strategy-frictions';
import { projectEpisode01CharacterPlacements } from './strategy-placements';
import type { StrategyCharacterPlacement } from './strategy-placements';
import { projectEpisode01Scene } from './strategy-scene';
import type { StrategySceneComposition } from './strategy-scene';
import { projectEpisode01Signals } from './strategy-signals';
import { projectPsiObservations } from './strategy-psi';
import type { PsiIndicatorId } from './product-contract';
import type { StrategySignal } from './strategy-signals';

export interface StrategyClockView {
  readonly day: number;
  readonly slot: TimeSlot;
  readonly display_time?: string;
}

export interface StrategyAssignmentView {
  readonly assignment_id: Id;
  readonly character_id: Id;
  readonly task_id: Id;
  readonly delegated_to_id?: Id;
}

export interface StrategyCharacterView {
  readonly character_id: Id;
  readonly experience: number;
  readonly morale: number;
  readonly fatigue: number;
  readonly available: boolean;
  readonly unavailable_reason_text_id?: Id;
  readonly stats: StatMap;
  readonly story_flags: FlagMap;
}

export interface StrategyConstructionView {
  readonly stage_id: StageId;
  readonly current_stage_progress: number;
  readonly progress_by_stage: Readonly<Partial<Record<StageId, number>>>;
  readonly milestones: readonly Id[];
}

export interface StrategyPsiView {
  readonly unlocked_node_ids: readonly Id[];
  readonly values: StatMap;
  readonly flags: FlagMap;
  readonly observation_counts: Readonly<Record<PsiIndicatorId, number>>;
  readonly observed_choice_count: number;
  readonly max_observation_count: number;
}

/**
 * Factual resource snapshot only. No money↔time↔schedule↔safety conversion formula lives here.
 * Safety is represented by current observable signal/pressure counts, not a synthetic score.
 */
export interface StrategyResourceView {
  readonly money: number;
  readonly time_slot: TimeSlot;
  readonly display_time?: string;
  readonly schedule_progress: number;
  readonly safety_signal_count: number;
  readonly pressure_count: number;
}

export interface StrategyRuntimeView {
  readonly active_event_id: Id | null;
  readonly active_instance_id: Id | null;
  readonly participant_bindings: Readonly<Record<Id, Id>>;
  readonly completed_event_count: number;
  readonly pending_followup_count: number;
}

export interface StrategyView {
  readonly clock: StrategyClockView;
  readonly construction: StrategyConstructionView;
  readonly psi: StrategyPsiView;
  readonly resources: StrategyResourceView;
  readonly assignments: readonly StrategyAssignmentView[];
  readonly roster: readonly StrategyCharacterView[];
  readonly scene: StrategySceneComposition;
  readonly signals: readonly StrategySignal[];
  readonly placements: readonly StrategyCharacterPlacement[];
  readonly frictions: readonly FieldFriction[];
  readonly runtime: StrategyRuntimeView;
}

export function projectStrategyView(state: GameState): StrategyView {
  const active = state.event_runtime.active_instance;
  const activeEventId = active?.event_id ?? null;
  const participantBindings = active?.participant_bindings ?? {};
  const stageProgress = state.construction.progress_by_stage[state.construction.stage_id] ?? 0;
  const roster: readonly StrategyCharacterView[] = Object.values(state.characters).map(character => ({
    character_id: character.character_id,
    experience: character.experience,
    morale: character.morale,
    fatigue: character.fatigue,
    available: character.availability.available,
    ...(character.availability.reason_text_id === undefined
      ? {}
      : { unavailable_reason_text_id: character.availability.reason_text_id }),
    stats: character.stats,
    story_flags: character.story_flags,
  }));
  const signals = projectEpisode01Signals(activeEventId);
  const scene = projectEpisode01Scene(activeEventId, signals);
  const psiObservations = projectPsiObservations(state.event_runtime.choice_history.map(item => item.choice_id));
  // Player state is intentionally separate from NPC character state, but the avatar belongs on
  // the strategy-map presentation layer. This adds no gameplay actor or engine-owned character.
  const placementCharacterIds = [
    'player',
    ...roster.filter(character => character.available).map(character => character.character_id),
  ];
  const placements = projectEpisode01CharacterPlacements(
    placementCharacterIds,
    participantBindings,
    signals,
  );
  const frictions = projectEpisode01Frictions(activeEventId);

  const view: StrategyView = {
    clock: {
      day: state.clock.day,
      slot: state.clock.slot,
      ...(state.clock.display_time === undefined ? {} : { display_time: state.clock.display_time }),
    },
    construction: {
      stage_id: state.construction.stage_id,
      current_stage_progress: stageProgress,
      progress_by_stage: state.construction.progress_by_stage,
      milestones: state.construction.milestones,
    },
    psi: {
      unlocked_node_ids: state.psi.unlocked_node_ids,
      values: state.psi.progress.values,
      flags: state.psi.progress.flags,
      observation_counts: psiObservations.counts,
      observed_choice_count: psiObservations.observed_choice_count,
      max_observation_count: psiObservations.max_count,
    },
    resources: {
      money: state.player.money,
      time_slot: state.clock.slot,
      ...(state.clock.display_time === undefined ? {} : { display_time: state.clock.display_time }),
      schedule_progress: stageProgress,
      safety_signal_count: signals.length,
      pressure_count: frictions.length,
    },
    assignments: state.assignments.map(assignment => ({
      assignment_id: assignment.assignment_id,
      character_id: assignment.character_id,
      task_id: assignment.task_id,
      ...(assignment.delegated_to_id === undefined ? {} : { delegated_to_id: assignment.delegated_to_id }),
    })),
    roster,
    scene,
    signals,
    placements,
    frictions,
    runtime: {
      active_event_id: activeEventId,
      active_instance_id: active?.instance_id ?? null,
      participant_bindings: participantBindings,
      completed_event_count: state.event_runtime.completion_history.length,
      pending_followup_count: state.followups.filter(followup => followup.status === 'pending').length,
    },
  };
  return freezeData(copyData(view));
}
