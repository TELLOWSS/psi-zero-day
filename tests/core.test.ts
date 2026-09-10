import { describe, expect, it } from 'vitest';
import type { Condition, Effect, GameState } from '../src/domain';
import { ContentRegistry } from '../src/content/registry';
import { conditionSchema, effectSchema } from '../src/content/schemas';
import { applyEffectBundle, canonicalStage, compare, CoreEngine, createRun, currentSlot,
  dueFollowUps, evaluateCondition, followUpTiming, getRelation, nextSlot, setFollowUpStatus } from '../src/engine';
import { assertData } from '../src/engine/data';
import { validFixture } from './fixtures/content';
import { bounds, context, emptyBundle, runOptions, runtimeFixture } from './fixtures/run';

describe('initialization and clock', () => {
  it('creates identical serializable states and RNG output for identical seed/config/content', () => {
    const a = runtimeFixture(); const b = runtimeFixture();
    expect(a.state).toEqual(b.state);
    expect(a.engine.dispatch({ type: 'draw_random' })).toEqual(b.engine.dispatch({ type: 'draw_random' }));
    expect(runtimeFixture(43).state.run.rng).not.toEqual(a.state.run.rng);
    expect(JSON.parse(JSON.stringify(a.state))).toEqual(a.state);
  });
  it('separates definitions, configuration, player and NPC state', () => {
    const content = new ContentRegistry(validFixture()).getValidatedContent();
    const config = runOptions(); const state = createRun(content, config, bounds);
    expect(state.characters['fixture.b']).toBeUndefined();
    expect(state.characters['fixture.a']?.stats).not.toBe(content.characters[0]?.stats);
    expect(state.audio).not.toBe(config.audio);
    expect(Object.isFrozen(state.characters['fixture.a']?.stats)).toBe(true);
    const invalid = validFixture();
    const { initial_state: _initial, ...withoutInitial } = invalid.characters[0]!;
    expect(() => new ContentRegistry({ ...invalid, characters: [withoutInitial, invalid.characters[1]!] })).toThrow();
    expect(() => createRun(content, config, {})).toThrow('bounds');
  });
  it('advances four slots and rolls into next DAY without display_time math', () => {
    const { engine } = runtimeFixture();
    expect(currentSlot(engine.getState().clock)).toBe('PRE_WORK');
    for (const slot of ['MORNING', 'AFTERNOON', 'EVENING', 'PRE_WORK']) {
      expect(engine.dispatch({ type: 'advance_slot' }).state.clock.slot).toBe(slot);
    }
    expect(engine.getState().clock).toEqual({ day: 19, slot: 'PRE_WORK' });
    expect(nextSlot({ day: 1, slot: 'MORNING', display_time: '23:59' })).toEqual({ day: 1, slot: 'AFTERNOON' });
    expect(() => nextSlot({ day: Number.MAX_SAFE_INTEGER, slot: 'EVENING' })).toThrow();
  });
  it('restores deterministic random continuation from serialized state', () => {
    const { engine, content } = runtimeFixture(); engine.dispatch({ type: 'draw_random' });
    const restored = new CoreEngine(JSON.parse(JSON.stringify(engine.getState())), content, bounds);
    expect(restored.dispatch({ type: 'draw_random' })).toEqual(engine.dispatch({ type: 'draw_random' }));
  });
});

describe('read-only conditions', () => {
  const cases: [Condition, boolean][] = [
    [{ kind: 'all', conditions: [] }, true], [{ kind: 'any', conditions: [] }, false],
    [{ kind: 'all', conditions: [{ kind: 'flag', flag_id: 'known', equals: true },
      { kind: 'not', condition: { kind: 'any', conditions: [] } }] }, true],
    [{ kind: 'player_stat', stat_id: 'test_stat', operator: 'eq', value: 0 }, true],
    [{ kind: 'stat', character_id: 'fixture.a', stat_id: 'test_stat', operator: 'gte', value: 0 }, true],
    [{ kind: 'stat', character_id: 'fixture.b', stat_id: 'test_stat', operator: 'eq', value: 0 }, true],
    [{ kind: 'player_stat', stat_id: 'missing', operator: 'ne', value: 0 }, false],
    [{ kind: 'flag', flag_id: 'known', equals: true }, true],
    [{ kind: 'flag_compare', flag_id: 'count', operator: 'gt', value: 0 }, true],
    [{ kind: 'flag_compare', flag_id: 'label', operator: 'eq', value: 'test' }, true],
    [{ kind: 'flag_compare', flag_id: 'count', operator: 'eq', value: '1' }, false],
    [{ kind: 'compare', left: false, operator: 'ne', right: true }, true],
    [{ kind: 'relation', from_id: 'fixture.a', to_id: 'fixture.b', field: 'trust', operator: 'eq', value: 0 }, true],
    [{ kind: 'relation', from_id: 'fixture.b', to_id: 'fixture.a', field: 'trust', operator: 'eq', value: 0 }, false],
    [{ kind: 'construction_stage', stage_id: 'Foundation', operator: 'eq' }, true],
    [{ kind: 'construction_stage', stage_id: 'ROOF', operator: 'ne' }, true],
    [{ kind: 'construction_progress', stage_id: 'FOUNDATION', operator: 'gte', value: 10 }, true],
  ];
  it.each(cases)('evaluates %j without mutation', (condition, expected) => {
    const { state } = runtimeFixture(); const before = JSON.stringify(state);
    expect(conditionSchema.safeParse(condition).success).toBe(true);
    expect(evaluateCondition(state, condition)).toBe(expected);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('supports strict scalar comparisons without coercion', () => {
    expect(compare(2, 'gt', 1)).toBe(true); expect(compare(2, 'lt', 1)).toBe(false);
    expect(compare(2, 'lte', 2)).toBe(true); expect(compare('a', 'eq', 'a')).toBe(true);
    expect(compare('2', 'eq', 2)).toBe(false); expect(compare(NaN, 'ne', 1)).toBe(false);
    expect(compare(undefined, 'ne', true)).toBe(false);
  });
  it('queries event and choice history by event instance, without double-counting duplicates', () => {
    const { state } = runtimeFixture();
    const history: GameState = { ...state, event_runtime: { ...state.event_runtime,
      occurrence_history: [{ event_id: 'fixture.event', instance_id: 'old', occurred_at: state.clock }],
      completion_history: [{ event_id: 'fixture.event', instance_id: 'old', completed_at: state.clock }],
      choice_history: [{ instance_id: 'old', choice_id: 'choose' }, { instance_id: 'old', choice_id: 'choose' }] } };
    expect(evaluateCondition(history, { kind: 'event_completed', event_id: 'fixture.event', minimum_count: 1 })).toBe(true);
    expect(evaluateCondition(history, { kind: 'choice_selected', event_id: 'fixture.event', choice_id: 'choose', minimum_count: 1 })).toBe(true);
    expect(evaluateCondition(history, { kind: 'choice_selected', event_id: 'fixture.event', choice_id: 'choose', minimum_count: 2 })).toBe(false);
    expect(evaluateCondition(history, { kind: 'choice_selected', event_id: 'fixture.followup', choice_id: 'choose', minimum_count: 1 })).toBe(false);
  });
});

describe('atomic effects and command ownership', () => {
  const changes: Effect[] = [
    { effect_id: 'player', kind: 'player_stat', stat_id: 'test_stat', delta: 2 },
    { effect_id: 'npc', kind: 'stat', character_id: 'fixture.a', stat_id: 'test_stat', delta: -1 },
    { effect_id: 'relation', kind: 'relation', from_id: 'fixture.a', to_id: 'fixture.b', field: 'trust', delta: 3 },
    { effect_id: 'flag', kind: 'flag', flag_id: 'new', value: 'value' },
    { effect_id: 'increment', kind: 'flag_change', flag_id: 'count', delta: 2 },
    { effect_id: 'reveal', kind: 'reveal', character_id: 'fixture.a', field_id: 'stats.test_stat' },
    { effect_id: 'progress', kind: 'construction_progress', stage_id: 'FOUNDATION', delta: 5 },
  ];
  it('applies data operations and keeps the original state/definitions untouched', () => {
    const { engine, state, content } = runtimeFixture();
    changes.forEach(e => expect(effectSchema.safeParse(e).success).toBe(true));
    engine.dispatch({ type: 'apply_effects', bundle: { ...emptyBundle(), immediate_effects: changes }, context });
    const result = engine.getState();
    expect(result.player.stats.test_stat).toBe(2);
    expect(result.characters['fixture.a']?.stats.test_stat).toBe(-1);
    expect(getRelation(result.relations, 'fixture.a', 'fixture.b')?.trust).toBe(3);
    expect(getRelation(result.relations, 'fixture.b', 'fixture.a')).toBeUndefined();
    expect(result.flags).toMatchObject({ new: 'value', count: 3 });
    expect(result.characters['fixture.a']?.revealed_fields).toContain('stats.test_stat');
    expect(result.construction.progress_by_stage.FOUNDATION).toBe(15);
    expect(result.construction.stage_id).toBe('FOUNDATION');
    expect(state.player.stats.test_stat).toBe(0); expect(content.characters[0]?.stats.test_stat).toBe(0);
    expect(() => Object.assign(result.player.stats, { test_stat: 100 })).toThrow(TypeError);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
  it('blocks replay after JSON restore but allows the same definition in a different event instance', () => {
    const { engine, content } = runtimeFixture();
    const bundle = { ...emptyBundle(), immediate_effects: changes };
    engine.dispatch({ type: 'apply_effects', bundle, context });
    const restored = new CoreEngine(JSON.parse(JSON.stringify(engine.getState())), content, bounds);
    const before = restored.getState();
    expect(restored.dispatch({ type: 'apply_effects', bundle, context }).state).toBe(before);
    restored.dispatch({ type: 'apply_effects', bundle, context: { ...context, event_instance_id: 'instance.2' } });
    expect(restored.getState().player.stats.test_stat).toBe(4);
    // Changing only the bundle label cannot replay effect IDs from the same event instance.
    restored.dispatch({ type: 'apply_effects', bundle, context: { ...context, bundle_id: 'another' } });
    expect(restored.getState().player.stats.test_stat).toBe(4);
  });
  it('rolls back every earlier write, flags, RNG, ledger and queue on a late scheduling failure', () => {
    const { engine, state, content } = runtimeFixture();
    const before = engine.getState();
    const followup = content.events[0]!.choices[0]!.effects.followup_events[0]!;
    expect(() => engine.dispatch({ type: 'apply_effects', context, bundle: {
      ...emptyBundle(), immediate_effects: changes, flags: { extra: true }, ending_flags: { test: true },
      followup_events: [followup, { ...followup, followup_id: 'broken', event_id: 'missing' }],
    } })).toThrow('Unknown follow-up event');
    expect(engine.getState()).toBe(before);
    expect(engine.getState()).toEqual(state);
    expect(engine.getState().event_runtime.applied_effect_ids).toEqual([]);
    expect(engine.getState().followups).toEqual([]);
  });
  it('rejects duplicate IDs, missing stats/relations and overflow without partial application', () => {
    const { engine } = runtimeFixture(); const before = engine.getState();
    for (const effects of [
      [changes[0]!, changes[0]!],
      [changes[0]!, { effect_id: 'bad', kind: 'player_stat' as const, stat_id: 'missing', delta: 1 }],
      [changes[0]!, { effect_id: 'bad', kind: 'relation' as const, from_id: 'fixture.b', to_id: 'fixture.a', field: 'trust' as const, delta: 1 }],
      [{ effect_id: 'large', kind: 'player_stat' as const, stat_id: 'test_stat', delta: Number.MAX_VALUE },
        { effect_id: 'overflow', kind: 'player_stat' as const, stat_id: 'test_stat', delta: Number.MAX_VALUE }],
    ]) {
      expect(() => engine.dispatch({ type: 'apply_effects', context, bundle: { ...emptyBundle(), immediate_effects: effects } })).toThrow();
      expect(engine.getState()).toBe(before);
    }
  });
  it('safely increases/decreases progress with supplied bounds and never auto-transitions', () => {
    const { state, content } = runtimeFixture();
    const bundle = { ...emptyBundle(), immediate_effects: [{ effect_id: 'progress', kind: 'construction_progress' as const, stage_id: 'FOUNDATION' as const, delta: -10 }] };
    const result = applyEffectBundle(state, bundle, context, content, bounds);
    expect(result.construction.progress_by_stage.FOUNDATION).toBe(0);
    expect(result.construction.stage_id).toBe('FOUNDATION');
    expect(() => applyEffectBundle(result, bundle, { ...context, event_instance_id: 'next' }, content, bounds)).toThrow('outside');
    expect(canonicalStage('Typical Floor')).toBe('TYPICAL_FLOOR');
    expect(() => createRun(content, { ...runOptions(), construction: { ...state.construction,
      progress_by_stage: { Foundation: 10, FOUNDATION: 10 } } }, bounds)).toThrow('Duplicate');
  });
  it('handles respect/reporting as independent directed fields', () => {
    const { engine } = runtimeFixture();
    engine.dispatch({ type: 'apply_effects', context, bundle: { ...emptyBundle(), relationship_effects: [
      { effect_id: 'respect', kind: 'relation', from_id: 'fixture.a', to_id: 'fixture.b', field: 'respect', delta: 4 },
      { effect_id: 'reporting', kind: 'relation', from_id: 'fixture.a', to_id: 'fixture.b', field: 'reporting', delta: -2 },
    ] } });
    expect(getRelation(engine.getState().relations, 'fixture.a', 'fixture.b')).toMatchObject({ trust: 0, respect: 4, reporting: -2 });
  });
});

describe('follow-up queue only', () => {
  it('preserves bindings, schedules DAY 18 → 93, checks slot and blocks duplicate reservations', () => {
    const { engine, content } = runtimeFixture();
    const bundle = content.events[0]!.choices[0]!.effects;
    engine.dispatch({ type: 'apply_effects', bundle, context });
    engine.dispatch({ type: 'apply_effects', bundle, context });
    const state = engine.getState(); const reservation = state.followups[0]!;
    expect(state.followups).toHaveLength(1);
    expect(followUpTiming(reservation)).toEqual({ created_day: 18, due_day: 93, due_slot: 'MORNING' });
    expect(reservation.participant_bindings).toEqual(context.participant_bindings);
    expect(reservation.participant_bindings).not.toBe(context.participant_bindings);
    expect(dueFollowUps({ ...state, clock: { day: 93, slot: 'PRE_WORK' } })).toHaveLength(0);
    expect(dueFollowUps({ ...state, clock: { day: 93, slot: 'MORNING' } })).toHaveLength(1);
    expect(dueFollowUps({ ...state, clock: { day: 94, slot: 'PRE_WORK' } })).toHaveLength(1);
    const running = setFollowUpStatus(state, reservation.instance_id, 'running');
    expect(dueFollowUps({ ...running, clock: { day: 94, slot: 'PRE_WORK' } })).toEqual([]);
    const completed = setFollowUpStatus(running, reservation.instance_id, 'completed');
    expect(() => setFollowUpStatus(completed, reservation.instance_id, 'pending')).toThrow();
    expect(state.event_runtime.active_instance).toBeNull();
  });
  it('supports day-only and zero-day reservations and rejects unsafe delays', () => {
    const { state, content } = runtimeFixture();
    const definition = content.events[0]!.choices[0]!.effects.followup_events[0]!;
    const bundle = { ...emptyBundle(), followup_events: [{ ...definition, delay: { days: 0 } }] };
    const result = applyEffectBundle(state, bundle, context, content, bounds);
    expect(followUpTiming(result.followups[0]!)).toEqual({ created_day: 18, due_day: 18 });
    expect(dueFollowUps(result)).toHaveLength(1);
    for (const days of [-1, 0.5, Number.MAX_SAFE_INTEGER]) {
      expect(() => applyEffectBundle(state, { ...bundle, followup_events: [{ ...definition, delay: { days } }] }, context, content, bounds)).toThrow();
    }
  });
});

describe('data and schema boundary', () => {
  it('rejects values which cannot survive JSON serialization', () => {
    for (const value of [NaN, Infinity, undefined, () => 1, BigInt(1), new Map(), new Date()]) {
      expect(() => assertData(value)).toThrow();
    }
    const cycle: { self?: unknown } = {}; cycle.self = cycle;
    expect(() => assertData(cycle)).toThrow('Cyclic');
  });
  it('validates new relation and choice references without breaking old fixtures', () => {
    const input = validFixture(); input.events[0]!.conditions = [
      { kind: 'relation', from_id: 'missing', to_id: 'fixture.b', field: 'trust', operator: 'gte', value: 1 },
    ];
    expect(() => new ContentRegistry(input)).toThrow('Unknown reference: missing');
    input.events[0]!.conditions = [{ kind: 'choice_selected', event_id: 'fixture.event', choice_id: 'missing', minimum_count: 1 }];
    expect(() => new ContentRegistry(input)).toThrow('Unknown reference: missing');
  });
});
