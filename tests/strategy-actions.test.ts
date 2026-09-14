import { describe, expect, it } from 'vitest';
import { projectStrategyActions, strategyActionsForTarget, strategyActionTargetKey } from '../src/app/strategy-actions';
import type { PresentationCommand } from '../src/domain';

function choice(eventId: string, choices: readonly { choice_id: string; text_id: string; enabled: boolean }[]): readonly [string, PresentationCommand] {
  return [eventId, {
    type: 'SHOW_CHOICE',
    instance_id: `run.${eventId}`,
    node_id: 'action',
    text_id: 'prompt',
    choices,
  }];
}

describe('Episode 01 strategy actions', () => {
  it('maps planning choices to the people the player is acting through', () => {
    const [eventId, presentation] = choice('e01_03_plan_breaks', [
      { choice_id: 'delegate_kang', text_id: 'ep01.plan.a', enabled: true },
      { choice_id: 'follow_junho', text_id: 'ep01.plan.d', enabled: true },
    ]);
    const actions = projectStrategyActions(eventId, presentation);
    expect(actions[0]).toMatchObject({ choice_id: 'delegate_kang', intent: 'coordinate', target: { kind: 'character', character_id: 'kang_taesik' } });
    expect(actions[1]).toMatchObject({ choice_id: 'follow_junho', intent: 'inspect', target: { kind: 'character', character_id: 'lim_junho' } });
    expect(strategyActionsForTarget(actions, 'kang_taesik').map(action => action.choice_id)).toEqual(['delegate_kang']);
    expect(strategyActionsForTarget(actions, 'lim_junho').map(action => action.choice_id)).toEqual(['follow_junho']);
    expect(strategyActionsForTarget(actions, null)).toEqual([]);
  });

  it('maps physical-control choices to their live field signal', () => {
    const [eventId, presentation] = choice('e01_08i_restart_pressure', [
      { choice_id: 'restart_verify_controls', text_id: 'ep01.restart.verify', enabled: true },
    ]);
    const action = projectStrategyActions(eventId, presentation)[0]!;
    expect(action).toMatchObject({
      choice_id: 'restart_verify_controls',
      intent: 'control',
      target: { kind: 'signal', signal_id: 'signal.restart_unverified' },
    });
    expect(strategyActionTargetKey(action.target)).toBe('signal.restart_unverified');
  });

  it('supports selectable work-zone and site targets', () => {
    const [eventId, presentation] = choice('e01_05_command', [
      { choice_id: 'check_self', text_id: 'ep01.command.check_self', enabled: true },
    ]);
    const zoneAction = projectStrategyActions(eventId, presentation)[0]!;
    expect(strategyActionTargetKey(zoneAction.target)).toBe('anchor:ramp');
    expect(strategyActionsForTarget([zoneAction], 'anchor:ramp')).toHaveLength(1);

    const [recordEventId, recordPresentation] = choice('e01_08o_record_pressure', [
      { choice_id: 'record_preserve_timeline', text_id: 'ep01.record.preserve', enabled: true },
    ]);
    const siteAction = projectStrategyActions(recordEventId, recordPresentation)[0]!;
    expect(strategyActionTargetKey(siteAction.target)).toBe('site');
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
      target: { kind: 'character', character_id: 'seo_jeongmin' },
    });
  });

  it('does not turn evening or non-choice presentation into fake map gameplay', () => {
    const [_, evening] = choice('e01_09_evening', [{ choice_id: 'rest', text_id: 'ep01.evening.rest', enabled: true }]);
    expect(projectStrategyActions('e01_09_evening', evening)).toEqual([]);
    expect(projectStrategyActions('e01_03_plan_breaks', {
      type: 'SHOW_RESULT', instance_id: 'run.e01_03_plan_breaks', node_id: 'result', text_id: 'result',
    })).toEqual([]);
  });
});
