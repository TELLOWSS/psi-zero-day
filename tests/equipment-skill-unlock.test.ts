import { describe, expect, it } from 'vitest';
import { createEpisode01Registry } from '../src/content/episode01';
import { projectStrategyActions } from '../src/app/strategy-actions';
import type { PresentationCommand } from '../src/domain';
import { playEpisode } from './helpers/episode01-playthrough';

const base = {
  plan: 'negotiate_yoon' as const,
  ramp: 'check_self' as const,
  entrance: 'request_delay' as const,
};

function nextDayChoice(trace: ReturnType<typeof playEpisode>['trace']) {
  const entry = trace.find(item => item.command.type === 'start_event' && item.command.event_id === 'e01_10_next_day_tease');
  return entry?.presentation.find(command => command.type === 'SHOW_CHOICE') as Extract<PresentationCommand, { type: 'SHOW_CHOICE' }> | undefined;
}

describe('TASK-010C growth/equipment field-skill unlocks', () => {
  it('keeps progression-generated text IDs valid inside the Episode registry', () => {
    const content = createEpisode01Registry().getValidatedContent();
    const nextDay = content.events.find(event => event.event_id === 'e01_10_next_day_tease')!;
    expect(nextDay.entry_node_id).toBe('next_day_action');
    expect(nextDay.choices.map(choice => choice.choice_id)).toEqual([
      'next_day_standard_check', 'next_day_camera_compare', 'next_day_radio_checkin',
    ]);
  });

  it('unlocks camera comparison only when the earned camera is actually equipped', () => {
    const equipped = playEpisode({
      ...base, evening: 'study', equipment: 'training_equip_camera', nextDay: 'next_day_camera_compare',
    });
    const equippedChoice = nextDayChoice(equipped.trace)!;
    expect(equippedChoice.choices.find(choice => choice.choice_id === 'next_day_camera_compare')?.enabled).toBe(true);
    expect(equipped.state.flags).toMatchObject({
      'skill.player.camera_compare.used': true,
      'next_day.precheck': 'camera_compare',
      'next_day.evidence_ready': true,
    });

    const kept = playEpisode({
      ...base, evening: 'study', equipment: 'training_keep_loadout', nextDay: 'next_day_standard_check',
    });
    const keptChoice = nextDayChoice(kept.trace)!;
    expect(keptChoice.choices.find(choice => choice.choice_id === 'next_day_camera_compare')?.enabled).toBe(false);
    expect(kept.state.flags['skill.player.camera_compare.used']).toBeUndefined();
    expect(kept.state.flags['next_day.precheck']).toBe('standard');
  });

  it('unlocks Junho radio check-in after the reporting-growth route equips his radio', () => {
    const result = playEpisode({
      plan: 'follow_junho', signal: 'listen_more', ramp: 'check_self', entrance: 'request_delay', evening: 'rest',
      nextDay: 'next_day_radio_checkin',
    });
    const choice = nextDayChoice(result.trace)!;
    expect(choice.choices.find(item => item.choice_id === 'next_day_radio_checkin')?.enabled).toBe(true);
    expect(choice.choices.find(item => item.choice_id === 'next_day_camera_compare')?.enabled).toBe(false);
    expect(result.state.flags).toMatchObject({
      'skill.lim_junho.radio_report.used': true,
      'next_day.precheck': 'radio_checkin',
      'next_day.report_channel_ready': true,
    });
  });

  it('can expose both earned equipment skills while leaving the standard action available', () => {
    const result = playEpisode({
      plan: 'follow_junho', signal: 'listen_more', ramp: 'check_self', entrance: 'request_delay',
      evening: 'study', equipment: 'training_equip_camera', nextDay: 'next_day_radio_checkin',
    });
    const choice = nextDayChoice(result.trace)!;
    expect(choice.choices.filter(item => item.enabled).map(item => item.choice_id)).toEqual([
      'next_day_standard_check', 'next_day_camera_compare', 'next_day_radio_checkin',
    ]);
  });

  it('projects unlocked field skills as map actions with equipment badges', () => {
    const presentation: PresentationCommand = {
      type: 'SHOW_CHOICE',
      instance_id: 'run.e01_10_next_day_tease',
      node_id: 'next_day_action',
      text_id: 'ui.skill.next_day.prompt',
      choices: [
        { choice_id: 'next_day_standard_check', text_id: 'ui.skill.next_day.standard', enabled: true },
        { choice_id: 'next_day_camera_compare', text_id: 'ui.skill.next_day.camera', enabled: true },
        { choice_id: 'next_day_radio_checkin', text_id: 'ui.skill.next_day.radio', enabled: true },
      ],
    };
    const actions = projectStrategyActions('e01_10_next_day_tease', presentation);
    expect(actions.find(action => action.choice_id === 'next_day_camera_compare')).toMatchObject({
      enabled: true,
      intent: 'record',
      target: { kind: 'site' },
      skill: { source: 'equipment', label_text_id: 'ui.skill.equipment' },
    });
    expect(actions.find(action => action.choice_id === 'next_day_radio_checkin')).toMatchObject({
      enabled: true,
      intent: 'report',
      target: { kind: 'character', character_id: 'lim_junho' },
      skill: { source: 'equipment', label_text_id: 'ui.skill.equipment' },
    });
  });
});
