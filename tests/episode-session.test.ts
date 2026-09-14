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
    for (let i = 0; i < 310 && session.getSnapshot().phase === 'playing'; i++) {
      const s = session.getSnapshot();
      const p = s.presentation.find(c => 'node_id' in c)!;
      if (p.type === 'SHOW_CHOICE') {
        expect(p.choices.filter(c => c.enabled).length).toBeGreaterThan(1);
        expect(session.dispatch({ type: 'choose_event', instance_id: p.instance_id, node_id: p.node_id, choice_id: inputFor(p.node_id, decisions)! }, s.revision)).toBe(true);
      } else if (p.type === 'SHOW_DIALOGUE' || p.type === 'SHOW_RESULT') {
        session.dispatch({ type: 'advance_event', instance_id: p.instance_id, node_id: p.node_id }, s.revision);
      }
    }
    const complete = session.getSnapshot();
    expect(complete.phase).toBe('complete');
    expect(complete.state).toEqual(playEpisode(decisions, { seed: 815 }).state);
    expect(complete.total).toBe(complete.completed);
    expect(complete.total).toBeLessThan(26);
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
