import growth from '../../content/episode01/character-growth.json';
import items from '../../content/episode01/items.json';
import type { FlagMap, Id } from '../domain';

export type CharacterGrowthStage = 'initial' | 'focused' | 'skilled';

export interface CharacterGrowthView {
  readonly character_id: Id;
  readonly stage: CharacterGrowthStage;
  readonly stage_label: string;
  readonly expression: string;
  readonly posture: string;
  readonly items: readonly { readonly item_id: Id; readonly name: string; readonly category: string }[];
  readonly age_visual_change: false;
}

type GrowthStageConfig = { readonly expression: string; readonly posture: string; readonly items: readonly string[] };
type GrowthCharacterConfig = {
  readonly stage_flag: string;
  readonly stages: Readonly<Record<CharacterGrowthStage, GrowthStageConfig>>;
};

const itemById = new Map(items.items.map(item => [item.item_id, item] as const));
const stageLabels: Readonly<Record<CharacterGrowthStage, string>> = {
  initial: '초기',
  focused: '집중',
  skilled: '숙련',
};

function validStage(value: unknown): CharacterGrowthStage {
  return value === 'focused' || value === 'skilled' ? value : 'initial';
}

/**
 * Presentation projection only. Growth stage is authored through explicit flags; there are no hidden XP formulas.
 * Identity/age remain locked. Growth is expressed through confidence, posture and equipment additions.
 */
export function projectCharacterGrowth(flags: FlagMap, characterId: Id): CharacterGrowthView | undefined {
  const config = (growth.characters as Readonly<Record<string, GrowthCharacterConfig>>)[characterId];
  if (!config) return undefined;
  const stage = validStage(flags[config.stage_flag]);
  const stageConfig = config.stages[stage];
  return Object.freeze({
    character_id: characterId,
    stage,
    stage_label: stageLabels[stage],
    expression: stageConfig.expression,
    posture: stageConfig.posture,
    items: Object.freeze(stageConfig.items.map(itemId => {
      const item = itemById.get(itemId);
      if (!item) throw new Error(`Unknown growth item: ${itemId}`);
      return Object.freeze({ item_id: item.item_id, name: item.name, category: item.category });
    })),
    age_visual_change: false,
  });
}
