import type { EventDefinition, FlagMap } from '../domain';

const REWARD_FLAGS: Readonly<Record<string, Readonly<Record<string, FlagMap[string]>>>> = {
  'e01_08a_reporting_return/reporting_return_reinforced': {
    'training.lim_junho.reporting': true,
    'growth.lim_junho': 'focused',
    'inventory.lim_junho.item.site_radio': true,
    'equipment.lim_junho.communication': 'item.site_radio',
  },
  'e01_09_evening/study': {
    'training.player.site_basics': true,
    'growth.player': 'focused',
    'inventory.player.item.inspection_camera': true,
    'equipment.player.secondary_tool': 'item.inspection_camera',
  },
};

/**
 * Authored progression hooks only: no XP thresholds or hidden formulas.
 * The selected event choice remains the sole gameplay mutation source.
 */
export function applyEpisode01ProgressionHooks(events: readonly EventDefinition[]): readonly EventDefinition[] {
  return events.map(event => ({
    ...event,
    choices: event.choices.map(choice => {
      const rewardFlags = REWARD_FLAGS[`${event.event_id}/${choice.choice_id}`];
      if (!rewardFlags) return choice;
      return {
        ...choice,
        effects: {
          ...choice.effects,
          flags: { ...choice.effects.flags, ...rewardFlags },
        },
      };
    }),
  }));
}
