import type { CharacterState, GameState, PlayerState, ValidatedContent } from '../domain';
import { assertTime } from './clock';
import { canonicalStage, checkedProgress, progressKey } from './construction';
import type { ProgressBounds } from './construction';
import { copyData, freezeData, own } from './data';
import { createRng } from './rng';

export interface NewRunOptions {
  readonly run_id: string;
  readonly seed: number;
  readonly playthrough: number;
  readonly rules_version: string;
  readonly clock: GameState['clock'];
  readonly player: Omit<PlayerState, 'stats'>;
  readonly character_runtime: Readonly<Record<string, Pick<CharacterState, 'morale' | 'fatigue' | 'availability' | 'revealed_fields'>>>;
  readonly construction: GameState['construction'];
  readonly audio: GameState['audio'];
  readonly flags?: GameState['flags'];
}

export function createRun(content: ValidatedContent, options: NewRunOptions, bounds: ProgressBounds): GameState {
  const config = copyData(options);
  const playerDefinition = content.characters.find(c => c.id === config.player.character_id);
  if (!playerDefinition) throw new Error('Player definition not found');
  if (!config.run_id || !config.rules_version || !Number.isSafeInteger(config.playthrough) || config.playthrough < 1) {
    throw new Error('Explicit run identity and rules version required');
  }
  assertTime(config.clock);
  canonicalStage(config.construction.stage_id);
  for (const key of Object.keys(config.construction.progress_by_stage)) {
    const stage = key as GameState['construction']['stage_id'];
    progressKey(config.construction, stage);
    checkedProgress(config.construction.progress_by_stage[stage]!, stage, bounds);
  }
  const characters: Record<string, CharacterState> = {};
  for (const definition of content.characters) {
    if (definition.id === playerDefinition.id) continue; // Player stats have a single owner.
    const runtime = own(config.character_runtime, definition.id);
    if (!runtime) throw new Error(`Explicit NPC runtime baseline required: ${definition.id}`);
    characters[definition.id] = {
      character_id: definition.id, experience: definition.experience, stats: definition.stats,
      traits: definition.traits, weaknesses: definition.weaknesses, ...runtime,
      story_flags: {}, event_history: [],
    };
  }
  if (Object.keys(config.character_runtime).some(id => !Object.hasOwn(characters, id))) throw new Error('Unknown NPC baseline');
  const state: GameState = {
    run: { run_id: config.run_id, playthrough: config.playthrough, rules_version: config.rules_version,
      content_version: content.content_version, rng: createRng(config.seed).snapshot() },
    clock: config.clock, player: { ...config.player, stats: playerDefinition.stats },
    characters, relations: content.relations, construction: config.construction, audio: config.audio,
    schedule: {}, assignments: [], psi: { unlocked_node_ids: [], progress: { values: {}, flags: {} } },
    flags: config.flags ?? {}, ending_flags: {}, followups: [],
    event_runtime: { active_instance: null, occurrence_history: [], choice_history: [], applied_effect_ids: [] },
    ending_runtime: { unlocked_path_ids: [], satisfied_rule_ids: [] }, presentation_resume: null,
  };
  return freezeData(copyData(state));
}
