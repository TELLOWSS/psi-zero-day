import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { FIELD_SUPPORT_ITEMS, fieldSupportItem, isFieldSupportItemActive } from '../src/app/field-support-items';
import { isStrategyFieldActionEvent } from '../src/app/strategy-actions';

function reachFieldChoice(session: EpisodeSession) {
  session.start(0);
  for (let step = 0; step < 40; step++) {
    const snapshot = session.getSnapshot();
    const presentation = snapshot.presentation.find(command => 'node_id' in command);
    if (!presentation || !('node_id' in presentation)) throw new Error('Missing presentation');
    const eventId = snapshot.state?.event_runtime.active_instance?.event_id ?? null;
    if (presentation.type === 'SHOW_CHOICE' && isStrategyFieldActionEvent(eventId)) return snapshot;
    if (presentation.type === 'SHOW_CHOICE') {
      const enabled = presentation.choices.filter(choice => choice.enabled);
      if (!enabled.length) throw new Error('No enabled choice');
      session.dispatch({
        type: 'choose_event',
        instance_id: presentation.instance_id,
        node_id: presentation.node_id,
        choice_id: enabled[0]!.choice_id,
      }, snapshot.revision);
    } else {
      session.dispatch({
        type: 'advance_event',
        instance_id: presentation.instance_id,
        node_id: presentation.node_id,
      }, snapshot.revision);
    }
  }
  throw new Error('Field choice not reached');
}

describe('TASK-015B3 field support items', () => {
  it('keeps a fixed facility/equipment deployment catalog without balance numbers', () => {
    expect(FIELD_SUPPORT_ITEMS).toHaveLength(6);
    expect(FIELD_SUPPORT_ITEMS.filter(item => item.category === 'facility')).toHaveLength(3);
    expect(FIELD_SUPPORT_ITEMS.filter(item => item.category === 'equipment')).toHaveLength(3);
    expect(new Set(FIELD_SUPPORT_ITEMS.map(item => item.item_id)).size).toBe(FIELD_SUPPORT_ITEMS.length);
    expect(new Set(FIELD_SUPPORT_ITEMS.map(item => item.active_flag_id)).size).toBe(FIELD_SUPPORT_ITEMS.length);
    expect(fieldSupportItem('facility.access_lane')?.active_flag_id).toBe('support.facility.access_lane.active');
    expect(fieldSupportItem('action.replan_pass')).toBeUndefined();
  });

  it('records deployment through GameState without inventing money/time/schedule changes', () => {
    const session = new EpisodeSession();
    expect(session.activateSupportItem('facility.access_lane', 0)).toBe(false);
    const before = reachFieldChoice(session);
    const beforeState = before.state!;
    const beforePresentation = before.presentation;
    const beforeProgress = beforeState.construction.progress_by_stage[beforeState.construction.stage_id];

    expect(session.activateSupportItem('facility.access_lane', before.revision)).toBe(true);
    const after = session.getSnapshot();
    const afterState = after.state!;
    expect(isFieldSupportItemActive(afterState.flags, 'facility.access_lane')).toBe(true);
    expect(afterState.player.money).toBe(beforeState.player.money);
    expect(afterState.clock).toEqual(beforeState.clock);
    expect(afterState.construction.progress_by_stage[afterState.construction.stage_id]).toBe(beforeProgress);
    expect(after.presentation).toEqual(beforePresentation);

    const stable = session.getSnapshot();
    expect(session.activateSupportItem('facility.access_lane', stable.revision)).toBe(false);
    expect(session.getSnapshot()).toBe(stable);
    expect(session.activateSupportItem('unknown.support', stable.revision)).toBe(false);
    expect(session.getSnapshot()).toBe(stable);
  });

  it('supports an equipment commitment as a separate persistent run flag', () => {
    const session = new EpisodeSession();
    const before = reachFieldChoice(session);
    expect(session.activateSupportItem('equipment.inspection_kit', before.revision)).toBe(true);
    const state = session.getSnapshot().state!;
    expect(state.flags['support.equipment.inspection_kit.active']).toBe(true);
    expect(isFieldSupportItemActive(state.flags, 'equipment.inspection_kit')).toBe(true);
    expect(isFieldSupportItemActive(state.flags, 'facility.access_lane')).toBe(false);
  });
});
