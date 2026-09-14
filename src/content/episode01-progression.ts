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
  },
};

const emptyEffects = () => ({
  immediate_effects: [],
  hidden_effects: [],
  relationship_effects: [],
  stat_effects: [],
  flags: {},
  ending_flags: {},
  followup_events: [],
});

function attachRewardFlags(event: EventDefinition): EventDefinition {
  return {
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
  };
}

function addPlayerEquipmentSelection(event: EventDefinition): EventDefinition {
  if (event.event_id !== 'e01_09_evening') return event;
  const equipmentNodeId = 'training_equipment';
  return {
    ...event,
    dialogue: [
      ...event.dialogue.map(node => node.node_id === 'study'
        ? { ...node, next_node_id: equipmentNodeId }
        : node),
      {
        node_id: equipmentNodeId,
        type: 'CHOICE',
        text_id: 'ui.training.equip_prompt',
        choice_ids: ['training_equip_camera', 'training_keep_loadout'],
      },
    ],
    choices: [
      ...event.choices,
      {
        choice_id: 'training_equip_camera',
        text_id: 'ui.training.equip_camera',
        next_node_id: 'end',
        requirements: [{ kind: 'flag', flag_id: 'inventory.player.item.inspection_camera', equals: true }],
        effects: {
          ...emptyEffects(),
          flags: {
            'equipment.player.secondary_tool': 'item.inspection_camera',
            'equipment.player.last_choice': 'camera',
          },
        },
      },
      {
        choice_id: 'training_keep_loadout',
        text_id: 'ui.training.keep_loadout',
        next_node_id: 'end',
        requirements: [],
        effects: {
          ...emptyEffects(),
          flags: { 'equipment.player.last_choice': 'keep' },
        },
      },
    ],
  };
}

/**
 * Authored progression hooks only: no XP thresholds or hidden formulas.
 * Training rewards and equipment changes still happen through normal event choices.
 */
export function applyEpisode01ProgressionHooks(events: readonly EventDefinition[]): readonly EventDefinition[] {
  return events.map(event => addPlayerEquipmentSelection(attachRewardFlags(event)));
}
