import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { episodeOptions, episodeBounds, playEpisode } from './helpers/episode01-playthrough';
import type { EpisodeDecisions } from './helpers/episode01-playthrough';

export const uiPaths: EpisodeDecisions[] = [
  { plan: 'follow_junho', signal: 'listen_more', ramp: 'ask_minseok', entrance: 'assign_crew', evening: 'field_note' },
  { plan: 'negotiate_yoon', ramp: 'check_self', entrance: 'request_delay', evening: 'study', equipment: 'training_equip_camera' },
  { plan: 'coordinate_schedule', ramp: 'keep_schedule', entrance: 'assign_crew', evening: 'family' },
  { plan: 'delegate_kang', ramp: 'check_self', entrance: 'force_clear', evening: 'rest' },
];
export function inputFor(node: string, decisions: EpisodeDecisions): string | undefined {
  const defaultNextDay = decisions.nextDay ?? (
    decisions.evening === 'study' && (decisions.equipment ?? 'training_equip_camera') === 'training_equip_camera'
      ? 'next_day_camera_compare'
      : decisions.plan === 'follow_junho' && decisions.signal === 'listen_more'
        ? 'next_day_radio_checkin'
        : 'next_day_standard_check'
  );
  return ({
    plan: decisions.plan,
    listen: decisions.signal,
    ramp: decisions.ramp,
    entrance: decisions.entrance,
    action: decisions.inspection ?? 'inspection_sequence_agreement',
    report: decisions.responsibility ?? 'report_verify_timeline',
    tbm_action: decisions.tbm ?? 'tbm_change_control',
    restart_action: decisions.restart ?? 'restart_verify_controls',
    culture_action: decisions.stopwork ?? 'stopwork_protect_process',
    instruction_action: decisions.instruction ?? 'instruction_reconstruct_chain',
    record_action: decisions.record ?? 'record_preserve_timeline',
    evening: decisions.evening,
    training_equipment: decisions.equipment ?? 'training_equip_camera',
    next_day_action: defaultNextDay,
    lift_route: 'day02_walk_and_reset',
  } as Record<string, string | undefined>)[node];
}

describe('Episode application session', () => {
  it('creates a stable start snapshot with a run-facing progress target', () => {
    const session = new EpisodeSession();
    const start = session.getSnapshot();
    expect(start.phase).toBe('start'); expect(start.state).toBeNull(); expect(start.total).toBe(10);
    expect(session.getSnapshot()).toBe(start);
    session.start(start.revision);
    expect(session.getSnapshot().presentation[0]).toMatchObject({ type: 'SHOW_RESULT', text_id: 'ep01.arrival' });
    expect(start.state).toBeNull();
    expect(Object.isFrozen(session.getSnapshot().state)).toBe(true);
    expect(Object.isFrozen(session.getSnapshot().presentation)).toBe(true);
    expect(() => Object.assign(session.getSnapshot().state!.flags, { altered: true })).toThrow();
  });

  it.each(uiPaths)('matches complete headless state and closes progress for $plan / $entrance / $evening', decisions => {
    const session = new EpisodeSession(episodeOptions(815), episodeBounds);
    session.start(0);
    for (let i = 0; i < 340 && session.getSnapshot().phase === 'playing'; i++) {
      const s = session.getSnapshot();
      const p = s.presentation.find(c => 'node_id' in c);
      if (!p) {
        const finished = s.state?.event_runtime.finished_instances.at(-1);
        if (!finished) throw new Error('Missing field outcome source');
        expect(session.confirmFieldOutcome(finished.instance_id, s.revision)).toBe(true);
      } else if (p.type === 'SHOW_CHOICE') {
        expect(p.choices.filter(c => c.enabled).length).toBeGreaterThan(1);
        expect(session.dispatch({ type: 'choose_event', instance_id: p.instance_id, node_id: p.node_id, choice_id: inputFor(p.node_id, decisions)! }, s.revision)).toBe(true);
      } else if (p.type === 'SHOW_DIALOGUE' || p.type === 'SHOW_RESULT') {
        expect(session.dispatch({ type: 'advance_event', instance_id: p.instance_id, node_id: p.node_id }, s.revision)).toBe(true);
      }
    }
    const complete = session.getSnapshot();
    expect(complete.phase).toBe('complete');
    const dayOne = playEpisode(decisions, { seed: 815 }).state;
    expect(complete.state?.flags.episode01_completed).toBe(true);
    expect(complete.state?.flags.day02_opening_completed).toBe(true);
    expect(complete.state?.flags.day02_lift_result).toBe('shared_route_controlled');
    const completedIds = new Set(complete.state?.event_runtime.completion_history.map(item => item.event_id));
    for (const item of dayOne.event_runtime.completion_history) expect(completedIds.has(item.event_id)).toBe(true);
    expect(complete.total).toBe(complete.completed);
    expect(complete.total).toBeLessThan(26);
  });

  it('holds a terminal field result until the player confirms or reconsiders it', () => {
    const session = new EpisodeSession(episodeOptions(916), episodeBounds);
    session.start(0);
    let choiceSnapshot = session.getSnapshot();
    for (let step = 0; step < 40; step++) {
      choiceSnapshot = session.getSnapshot();
      const active = choiceSnapshot.state?.event_runtime.active_instance;
      const command = choiceSnapshot.presentation.find(item => 'node_id' in item);
      if (active?.event_id === 'e01_03_plan_breaks' && command?.type === 'SHOW_CHOICE') break;
      if (!command || command.type === 'SHOW_CHOICE') throw new Error('Unexpected choice before plan decision');
      expect(session.dispatch({ type: 'advance_event', instance_id: command.instance_id, node_id: command.node_id }, choiceSnapshot.revision)).toBe(true);
    }
    const planChoice = choiceSnapshot.presentation.find(item => item.type === 'SHOW_CHOICE');
    if (planChoice?.type !== 'SHOW_CHOICE' || !choiceSnapshot.state) throw new Error('Expected plan choice');
    const checkpoint = choiceSnapshot.state;
    expect(session.dispatch({
      type: 'choose_event', instance_id: planChoice.instance_id, node_id: planChoice.node_id, choice_id: 'delegate_kang',
    }, choiceSnapshot.revision)).toBe(true);
    const held = session.getSnapshot();
    expect(held.presentation).toEqual([]);
    expect(held.state?.event_runtime.active_instance).toBeNull();
    expect(held.state?.event_runtime.finished_instances.at(-1)?.instance_id).toBe(planChoice.instance_id);
    expect(held.state?.event_runtime.choice_history.some(item => item.choice_id === 'delegate_kang')).toBe(true);

    expect(session.reconsider(checkpoint, held.revision)).toBe(true);
    const restored = session.getSnapshot();
    expect(restored.state).toEqual(checkpoint);
    expect(restored.presentation.some(item => item.type === 'SHOW_CHOICE')).toBe(true);
    expect(restored.state?.event_runtime.choice_history.some(item => item.choice_id === 'delegate_kang')).toBe(false);
    expect(session.reconsider(checkpoint, restored.revision)).toBe(false);

    const restoredChoice = restored.presentation.find(item => item.type === 'SHOW_CHOICE');
    if (restoredChoice?.type !== 'SHOW_CHOICE') throw new Error('Expected restored plan choice');
    expect(session.dispatch({
      type: 'choose_event', instance_id: restoredChoice.instance_id, node_id: restoredChoice.node_id, choice_id: 'delegate_kang',
    }, restored.revision)).toBe(true);
    const secondHeld = session.getSnapshot();
    expect(secondHeld.state?.event_runtime.active_instance).toBeNull();
    expect(session.confirmFieldOutcome(restoredChoice.instance_id, secondHeld.revision)).toBe(true);
    const confirmed = session.getSnapshot();
    expect(confirmed.state?.event_runtime.active_instance?.event_id).not.toBe('e01_03_plan_breaks');
    expect(confirmed.presentation.length).toBeGreaterThan(0);
  });

  it('rejects stale input, invalid choices, and arbitrary effect commands without state changes', () => {
    const session = new EpisodeSession(); session.start(0);
    const before = session.getSnapshot(); const p = before.presentation[0]!;
    if (p.type !== 'SHOW_RESULT') throw new Error('Expected arrival');
    const command = { type: 'advance_event' as const, instance_id: p.instance_id, node_id: p.node_id };
    session.dispatch(command, before.revision);
    const after = session.getSnapshot();
    expect(session.dispatch(command, before.revision)).toBe(false);
    expect(session.dispatch({ type: 'draw_random' }, after.revision)).toBe(false);
    expect(session.dispatch({ type: 'choose_event', instance_id: p.instance_id, node_id: p.node_id, choice_id: 'invalid' }, after.revision)).toBe(false);
    expect(session.getSnapshot()).toBe(after);
  });

  it('notifies subscribers only on changes and restarts a clean deterministic run', () => {
    const session = new EpisodeSession(); let updates = 0;
    const unsubscribe = session.subscribe(() => updates++);
    session.start(0); const first = session.getSnapshot().state;
    session.start(0); expect(updates).toBe(1);
    unsubscribe(); session.restart(session.getSnapshot().revision);
    expect(session.getSnapshot().phase).toBe('start');
    expect(session.getSnapshot().state).toBeNull();
    session.start(session.getSnapshot().revision);
    expect(session.getSnapshot().state).toEqual(first);
    expect(updates).toBe(1);
  });
});
