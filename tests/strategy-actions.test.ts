import { describe, expect, it } from 'vitest';
import {
  projectStrategyActions,
  projectSupportAssistedActions,
  strategyActionExecutionChoiceId,
  strategyActionsForTarget,
  strategyActionTargetKey,
} from '../src/app/strategy-actions';
import type { PresentationCommand } from '../src/domain';

function choice(eventId: string, choices: readonly { choice_id: string; text_id: string; enabled: boolean }[], nodeId = 'action'): readonly [string, PresentationCommand] {
  return [eventId, {
    type: 'SHOW_CHOICE',
    instance_id: `run.${eventId}`,
    node_id: nodeId,
    text_id: 'prompt',
    choices,
  }];
}

describe('Episode 01 strategy actions', () => {
  it('maps planning choices to explicit actors, field targets and resource axes', () => {
    const [eventId, presentation] = choice('e01_03_plan_breaks', [
      { choice_id: 'delegate_kang', text_id: 'ep01.plan.a', enabled: true },
      { choice_id: 'follow_junho', text_id: 'ep01.plan.d', enabled: true },
      { choice_id: 'coordinate_schedule', text_id: 'ep01.plan.c', enabled: true },
    ]);
    const actions = projectStrategyActions(eventId, presentation);
    expect(actions[0]).toMatchObject({
      choice_id: 'delegate_kang', intent: 'coordinate', actor_character_id: 'kang_taesik',
      target: { kind: 'character', character_id: 'kang_taesik' }, resource_axes: ['time', 'schedule'],
    });
    expect(actions[1]).toMatchObject({
      choice_id: 'follow_junho', intent: 'inspect', actor_character_id: 'player',
      target: { kind: 'character', character_id: 'lim_junho' }, resource_axes: ['time', 'safety'],
    });
    expect(actions[2]).toMatchObject({
      choice_id: 'coordinate_schedule', resource_axes: ['time', 'schedule', 'safety'],
    });
    expect(strategyActionsForTarget(actions, 'kang_taesik').map(action => action.choice_id)).toEqual(['delegate_kang']);
    expect(strategyActionsForTarget(actions, 'lim_junho').map(action => action.choice_id)).toEqual(['follow_junho']);
    expect(strategyActionsForTarget(actions, null)).toEqual([]);
  });

  it('maps physical-control choices to their live field signal with the player as actor', () => {
    const [eventId, presentation] = choice('e01_08i_restart_pressure', [
      { choice_id: 'restart_verify_controls', text_id: 'ep01.restart.verify', enabled: true },
    ]);
    const action = projectStrategyActions(eventId, presentation)[0]!;
    expect(action).toMatchObject({
      choice_id: 'restart_verify_controls',
      intent: 'control',
      actor_character_id: 'player',
      target: { kind: 'signal', signal_id: 'signal.restart_unverified' },
      resource_axes: ['time', 'schedule', 'safety'],
    });
    expect(strategyActionTargetKey(action.target)).toBe('signal.restart_unverified');
  });

  it('supports selectable work-zone and site targets', () => {
    const [eventId, presentation] = choice('e01_05_command', [
      { choice_id: 'check_self', text_id: 'ep01.command.check_self', enabled: true },
    ]);
    const zoneAction = projectStrategyActions(eventId, presentation)[0]!;
    expect(strategyActionTargetKey(zoneAction.target)).toBe('anchor:ramp');
    expect(zoneAction.actor_character_id).toBe('player');
    expect(zoneAction.resource_axes).toEqual(['time', 'safety']);
    expect(strategyActionsForTarget([zoneAction], 'anchor:ramp')).toHaveLength(1);

    const [recordEventId, recordPresentation] = choice('e01_08o_record_pressure', [
      { choice_id: 'record_preserve_timeline', text_id: 'ep01.record.preserve', enabled: true },
    ]);
    const siteAction = projectStrategyActions(recordEventId, recordPresentation)[0]!;
    expect(strategyActionTargetKey(siteAction.target)).toBe('site');
    expect(siteAction.actor_character_id).toBe('player');
    expect(siteAction.resource_axes).toEqual(['time', 'safety']);
  });

  it('preserves disabled choices and the original command identity', () => {
    const [eventId, presentation] = choice('e01_08b_inspection_find', [
      { choice_id: 'inspection_sequence_agreement', text_id: 'ep01.inspection.sequence', enabled: false },
    ]);
    expect(projectStrategyActions(eventId, presentation)[0]).toMatchObject({
      event_id: 'e01_08b_inspection_find',
      instance_id: 'run.e01_08b_inspection_find',
      node_id: 'action',
      choice_id: 'inspection_sequence_agreement',
      enabled: false,
      actor_character_id: 'player',
      target: { kind: 'character', character_id: 'seo_jeongmin' },
      resource_axes: ['time', 'schedule', 'safety'],
    });
  });

  it('adds support shortcuts without removing or changing the free safety choice', () => {
    const [eventId, presentation] = choice('e01_05_command', [
      { choice_id: 'check_self', text_id: 'ep01.command.check_self', enabled: true },
      { choice_id: 'ask_minseok', text_id: 'ep01.command.ask_minseok', enabled: true },
      { choice_id: 'keep_schedule', text_id: 'ep01.command.keep_schedule', enabled: true },
    ], 'ramp');
    const base = projectStrategyActions(eventId, presentation);
    const noSupport = projectSupportAssistedActions(base, []);
    expect(noSupport).toBe(base);

    const withKit = projectSupportAssistedActions(base, ['equipment.inspection_kit']);
    expect(withKit.map(action => action.choice_id)).toContain('check_self');
    expect(withKit).toHaveLength(base.length + 1);
    const shortcut = withKit.find(action => action.choice_id === 'support.inspection_kit.verify_ramp')!;
    expect(shortcut).toMatchObject({
      execution_choice_id: 'check_self',
      label_text_id: 'ui.paid_item.action.inspection_kit_check',
      enabled: true,
      target: { kind: 'anchor', anchor: 'ramp' },
      resource_axes: ['time', 'safety'],
      skill: { source: 'equipment' },
    });
    expect(strategyActionExecutionChoiceId(shortcut)).toBe('check_self');
    expect(strategyActionExecutionChoiceId(base[0]!)).toBe('check_self');
  });

  it('reuses the same free entrance-control outcome for access-lane and traffic-control shortcuts', () => {
    const [eventId, presentation] = choice('e01_05_command', [
      { choice_id: 'assign_crew', text_id: 'ep01.command.assign_crew', enabled: true },
      { choice_id: 'request_delay', text_id: 'ep01.command.request_delay', enabled: true },
      { choice_id: 'force_clear', text_id: 'ep01.command.force_clear', enabled: true },
    ], 'entrance');
    const base = projectStrategyActions(eventId, presentation);
    const actions = projectSupportAssistedActions(base, ['facility.access_lane', 'equipment.traffic_control_pack']);
    const shortcuts = actions.filter(action => action.execution_choice_id !== undefined);
    expect(shortcuts).toHaveLength(2);
    expect(shortcuts.every(action => strategyActionExecutionChoiceId(action) === 'assign_crew')).toBe(true);
    expect(actions.some(action => action.choice_id === 'assign_crew' && action.execution_choice_id === undefined)).toBe(true);
  });

  it('inherits disabled state from the free choice instead of bypassing its requirements', () => {
    const [eventId, presentation] = choice('e01_05_command', [
      { choice_id: 'check_self', text_id: 'ep01.command.check_self', enabled: false },
    ], 'ramp');
    const actions = projectSupportAssistedActions(projectStrategyActions(eventId, presentation), ['equipment.inspection_kit']);
    const shortcut = actions.find(action => action.choice_id === 'support.inspection_kit.verify_ramp')!;
    expect(shortcut.enabled).toBe(false);
  });

  it('does not turn evening or non-choice presentation into fake map gameplay', () => {
    const [_, evening] = choice('e01_09_evening', [{ choice_id: 'rest', text_id: 'ep01.evening.rest', enabled: true }]);
    expect(projectStrategyActions('e01_09_evening', evening)).toEqual([]);
    expect(projectStrategyActions('e01_03_plan_breaks', {
      type: 'SHOW_RESULT', instance_id: 'run.e01_03_plan_breaks', node_id: 'result', text_id: 'result',
    })).toEqual([]);
  });
});
