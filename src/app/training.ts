import training from '../../content/episode01/training.json';
import items from '../../content/episode01/items.json';
import type { FlagMap, Id } from '../domain';

export interface TrainingStatusView {
  readonly training_id: Id;
  readonly character_id: Id;
  readonly title: string;
  readonly completed: boolean;
  readonly growth_stage: string;
  readonly rewards: readonly { readonly item_id: Id; readonly name: string }[];
  readonly equipped: readonly { readonly slot: string; readonly item_id: Id; readonly name: string }[];
}

type ItemConfig = { readonly item_id: string; readonly name: string };
const itemById = new Map((items.items as readonly ItemConfig[]).map(item => [item.item_id, item] as const));

export function projectTrainingStatuses(flags: FlagMap, characterId: Id): readonly TrainingStatusView[] {
  return Object.freeze(training.trainings
    .filter(item => item.character_id === characterId)
    .map(item => Object.freeze({
      training_id: item.training_id,
      character_id: item.character_id,
      title: item.title,
      completed: flags[item.completion_flag] === true,
      growth_stage: item.growth_stage,
      rewards: Object.freeze(item.rewards.map(itemId => Object.freeze({
        item_id: itemId,
        name: itemById.get(itemId)?.name ?? itemId,
      }))),
      equipped: Object.freeze(item.auto_equip.map(entry => Object.freeze({
        slot: entry.slot,
        item_id: entry.item_id,
        name: itemById.get(entry.item_id)?.name ?? entry.item_id,
      }))),
    })));
}

export function completedTraining(flags: FlagMap, characterId: Id): TrainingStatusView | undefined {
  return projectTrainingStatuses(flags, characterId).find(item => item.completed);
}
