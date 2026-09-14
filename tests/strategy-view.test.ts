import { describe, expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { projectStrategyView } from '../src/app/strategy-view';

describe('StrategyView adapter', () => {
  it('projects the current engine state without owning game rules', () => {
    const session = new EpisodeSession();
    session.start(0);
    const state = session.getSnapshot().state!;
    const view = projectStrategyView(state);

    expect(view.clock.day).toBe(state.clock.day);
    expect(view.clock.slot).toBe(state.clock.slot);
    expect(view.construction.stage_id).toBe(state.construction.stage_id);
    expect(view.construction.current_stage_progress)
      .toBe(state.construction.progress_by_stage[state.construction.stage_id] ?? 0);
    expect(view.psi.values).toEqual(state.psi.progress.values);
    expect(view.assignments).toHaveLength(state.assignments.length);
    expect(view.roster).toHaveLength(Object.keys(state.characters).length);
    expect(view.placements).toHaveLength(view.roster.filter(character => character.available).length);
    expect(view.runtime.active_event_id).toBe(state.event_runtime.active_instance?.event_id ?? null);
    expect(view.runtime.participant_bindings).toEqual(state.event_runtime.active_instance?.participant_bindings ?? {});
    expect(view.runtime.completed_event_count).toBe(state.event_runtime.completion_history.length);
  });

  it('returns an immutable snapshot that cannot mutate engine state', () => {
    const session = new EpisodeSession();
    session.start(0);
    const state = session.getSnapshot().state!;
    const view = projectStrategyView(state);

    expect(Object.isFrozen(view)).toBe(true);
    expect(Object.isFrozen(view.clock)).toBe(true);
    expect(Object.isFrozen(view.roster)).toBe(true);
    expect(Object.isFrozen(view.placements)).toBe(true);
    expect(() => Object.assign(view.clock, { day: 999 })).toThrow();
    expect(session.getSnapshot().state).toBe(state);
    expect(session.getSnapshot().state!.clock.day).not.toBe(999);
  });
});
