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

function addNextDaySkillSelection(event: EventDefinition): EventDefinition {
  if (event.event_id !== 'e01_10_next_day_tease') return event;
  return {
    ...event,
    entry_node_id: 'next_day_action',
    dialogue: [
      {
        node_id: 'next_day_action',
        type: 'CHOICE',
        text_id: 'ui.skill.next_day.prompt',
        choice_ids: ['next_day_standard_check', 'next_day_camera_compare', 'next_day_radio_checkin'],
      },
      {
        node_id: 'next_day_standard',
        type: 'RESULT',
        text_id: 'ui.skill.next_day.standard.result',
        next_node_id: 'end',
        choice_ids: [],
      },
      {
        node_id: 'next_day_camera',
        type: 'RESULT',
        text_id: 'ui.skill.next_day.camera.result',
        next_node_id: 'end',
        choice_ids: [],
      },
      {
        node_id: 'next_day_radio',
        type: 'RESULT',
        text_id: 'ui.skill.next_day.radio.result',
        next_node_id: 'end',
        choice_ids: [],
      },
      ...event.dialogue.filter(node => node.node_id === 'end'),
    ],
    choices: [
      {
        choice_id: 'next_day_standard_check',
        text_id: 'ui.skill.next_day.standard',
        next_node_id: 'next_day_standard',
        requirements: [],
        effects: {
          ...emptyEffects(),
          flags: { 'next_day.precheck': 'standard' },
        },
      },
      {
        choice_id: 'next_day_camera_compare',
        text_id: 'ui.skill.next_day.camera',
        next_node_id: 'next_day_camera',
        requirements: [{
          kind: 'all',
          conditions: [
            { kind: 'flag', flag_id: 'growth.player', equals: 'focused' },
            { kind: 'flag', flag_id: 'equipment.player.secondary_tool', equals: 'item.inspection_camera' },
          ],
        }],
        effects: {
          ...emptyEffects(),
          flags: {
            'skill.player.camera_compare.used': true,
            'next_day.precheck': 'camera_compare',
            'next_day.evidence_ready': true,
          },
        },
      },
      {
        choice_id: 'next_day_radio_checkin',
        text_id: 'ui.skill.next_day.radio',
        next_node_id: 'next_day_radio',
        requirements: [{
          kind: 'all',
          conditions: [
            { kind: 'flag', flag_id: 'growth.lim_junho', equals: 'focused' },
            { kind: 'flag', flag_id: 'equipment.lim_junho.communication', equals: 'item.site_radio' },
          ],
        }],
        effects: {
          ...emptyEffects(),
          flags: {
            'skill.lim_junho.radio_report.used': true,
            'next_day.precheck': 'radio_checkin',
            'next_day.report_channel_ready': true,
          },
        },
      },
    ],
  };
}

/**
 * Authored progression hooks only: no XP thresholds or hidden formulas.
 * Training rewards, equipment changes and skill unlocks still happen through normal event choices.
 */
export function applyEpisode01ProgressionHooks(events: readonly EventDefinition[]): readonly EventDefinition[] {
  return events.map(event => addNextDaySkillSelection(addPlayerEquipmentSelection(attachRewardFlags(event))));
}
