import { describe, expect, it } from 'vitest';
import { ContentRegistry } from '../src/content/registry';
import { bindParticipants, CoreEngine, eventCandidates, eventPresentation, evaluateCondition, selectEventCandidate } from '../src/engine';
import type { GameState } from '../src/domain';
import { copyData } from '../src/engine/data';
import { bounds, emptyBundle } from './fixtures/run';
import { completeEvent, eventContent, eventFixture, firstChoice, startCommand } from './fixtures/event-runtime';

describe('event candidates and bindings', () => {
  it('filters chapter/flags/conditions/history/trigger without changing state or RNG', () => {
    const { state, content } = eventFixture(); const before = JSON.stringify(state);
    expect(eventCandidates(state, content, 'test.chapter').map(c => c.event_id)).toEqual(['fixture.event']);
    expect(eventCandidates(state, content, 'wrong')).toEqual([]);
    expect(eventCandidates({ ...state, event_runtime: { ...state.event_runtime, chapter_id: 'other' } }, content, 'test.chapter')).toEqual([]);
    expect(eventCandidates({ ...state, flags: {} }, content, 'test.chapter')).toEqual([]);
    const input = eventContent(); input.events[0]!.conditions = [{ kind: 'player_stat', stat_id: 'test_stat', operator: 'gt', value: 5 }];
    expect(eventCandidates(state, new ContentRegistry(input).getValidatedContent(), 'test.chapter')).toEqual([]);
    const occurred: GameState = { ...state, event_runtime: { ...state.event_runtime,
      occurrence_history: [{ instance_id: 'past', event_id: 'fixture.event', occurred_at: state.clock }] } };
    expect(eventCandidates(occurred, content, 'test.chapter')).toEqual([]);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('selects deterministically by authored priority then ID, independent of definition order', () => {
    const input = eventContent(); input.events[1]!.runtime!.trigger = 'normal';
    // This test ranks normal events; it must not author a now-invalid normal-only reservation.
    input.events[0]!.choices[1]!.effects.followup_events = [];
    input.events[1]!.runtime!.selection_policy.priority = 3;
    const { state, content } = eventFixture(input);
    const reverse = new ContentRegistry({ ...input, events: [...input.events].reverse() }).getValidatedContent();
    const a = eventCandidates(state, content, 'test.chapter'); const b = eventCandidates(state, reverse, 'test.chapter');
    expect(a).toEqual(b); expect(selectEventCandidate(a)?.event_id).toBe('fixture.followup');
    expect(state.run.rng.state).toBe(42);
  });
  it('binds authored role/trade/nationality/stat/directed-relation selectors', () => {
    const input = eventContent();
    input.events[0]!.participants = [{ role_id: 'subject', selector: {
      role_text_id: 'fixture.text', trade_text_id: 'fixture.text', nationality_text_id: 'fixture.text',
      stats: [{ stat_id: 'test_stat', operator: 'gte', value: 0 }],
      relations: [{ character_id: 'fixture.b', direction: 'outgoing', field: 'trust', operator: 'gte', value: 0 }],
    } }];
    const { state, content } = eventFixture(input);
    expect(bindParticipants(state, content, content.events[0]!)).toEqual({ subject: 'fixture.a' });
    input.events[0]!.participants[0]!.selector!.relations[0]!.direction = 'incoming';
    expect(() => new ContentRegistry(input)).toThrow('Unsatisfiable directed relation selector');
    // Retain the runtime negative check as well as the stronger load-time rejection.
    expect(bindParticipants(state, content, input.events[0]!)).toBeNull();
  });
  it('excludes unavailable NPCs and does not generate replacement characters', () => {
    const { state, content } = eventFixture(); const unavailable = copyData(state);
    unavailable.characters['fixture.a']!.availability.available = false;
    expect(bindParticipants(unavailable, content, content.events[0]!)).toBeNull();
    expect(eventCandidates(unavailable, content, 'test.chapter')).toEqual([]);
  });
  it('supports explicit fail policy without recording an event that never started', () => {
    const input = eventContent(); input.events[0]!.runtime!.missing_participant_policy = 'fail';
    input.characters[0]!.initial_state.availability.available = false;
    const { engine, content } = eventFixture(input);
    expect(eventCandidates(engine.getState(), content, 'test.chapter')[0]?.missing_participants).toBe(true);
    engine.dispatch(startCommand);
    expect(engine.getState().event_runtime.finished_instances[0]?.status).toBe('FAILED');
    expect(engine.getState().event_runtime.occurrence_history).toEqual([]);
  });
});

describe('event execution transactions', () => {
  it('records a single occurrence and emits pure presentation output on start', () => {
    const { engine, content } = eventFixture(); const original = JSON.stringify(content);
    const result = engine.dispatch(startCommand);
    expect(result.presentation?.some(c => c.type === 'SHOW_DIALOGUE')).toBe(true);
    expect(engine.getState().event_runtime.active_instance?.participant_bindings).toEqual({ subject: 'fixture.a' });
    const before = engine.getState();
    expect(() => engine.dispatch(startCommand)).toThrow(); expect(engine.getState()).toBe(before);
    expect(before.event_runtime.occurrence_history).toHaveLength(1);
    expect(before.event_runtime.completion_history).toEqual([]);
    expect(JSON.stringify(content)).toBe(original);
  });
  it('supports dialogue → choice → result → second choice → END and long follow-up', () => {
    const { engine, content } = eventFixture(); firstChoice(engine);
    const choice = eventPresentation(engine.getState(), content)[0]; expect(choice?.type).toBe('SHOW_CHOICE');
    engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' });
    expect(engine.getState().event_runtime.active_instance?.current_node_id).toBe('result');
    expect(engine.getState().player.stats.test_stat).toBe(2);
    expect(engine.getState().characters['fixture.a']?.stats.test_stat).toBe(1);
    engine.dispatch({ type: 'advance_event', instance_id: 'test.instance', node_id: 'result' });
    engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'second', choice_id: 'again' });
    const state = engine.getState();
    expect(state.event_runtime.active_instance).toBeNull();
    expect(state.event_runtime.finished_instances[0]).toMatchObject({ status: 'COMPLETED', selected_choice_ids: ['choose', 'again'],
      visited_node_ids: ['intro', 'first', 'result', 'second', 'end'] });
    expect(state.event_runtime.choice_history).toHaveLength(2);
    expect(state.event_runtime.completion_history).toHaveLength(1);
    expect(evaluateCondition(state, { kind: 'event_completed', event_id: 'fixture.event', minimum_count: 1 })).toBe(true);
    expect(state.flags.finished).toBe(true); expect(state.followups[0]?.due_at).toEqual({ day: 93, slot: 'MORNING' });
  });
  it('rejects stale, wrong-instance, wrong-node and unknown-choice requests without mutation', () => {
    const { engine } = eventFixture(); firstChoice(engine); const before = engine.getState();
    for (const command of [
      { type: 'choose_event' as const, instance_id: 'wrong', node_id: 'first', choice_id: 'choose' },
      { type: 'choose_event' as const, instance_id: 'test.instance', node_id: 'intro', choice_id: 'choose' },
      { type: 'choose_event' as const, instance_id: 'test.instance', node_id: 'first', choice_id: 'missing' },
      { type: 'advance_event' as const, instance_id: 'test.instance', node_id: 'first' },
    ]) { expect(() => engine.dispatch(command)).toThrow(); expect(engine.getState()).toBe(before); }
  });
  it('rechecks choice requirements at submission and exposes disabled choices', () => {
    const { engine, content } = eventFixture(); firstChoice(engine);
    const changed = copyData(engine.getState()); changed.flags.known = false;
    const resumed = new CoreEngine(changed, content, bounds); const before = resumed.getState();
    expect(eventPresentation(before, content)[0]).toMatchObject({ type: 'SHOW_CHOICE', choices: [{ enabled: false }] });
    expect(() => resumed.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' })).toThrow('requirements');
    expect(resumed.getState()).toBe(before);
  });
  it('blocks duplicate choices after JSON restore without repeating effects or history', () => {
    const { engine, content } = eventFixture(); firstChoice(engine);
    const command = { type: 'choose_event' as const, instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' };
    engine.dispatch(command);
    const resumed = new CoreEngine(JSON.parse(JSON.stringify(engine.getState())), content, bounds); const before = resumed.getState();
    expect(before.event_runtime.active_instance?.current_node_id).toBe('result');
    expect(before.event_runtime.active_instance?.applied_effect_ids.length).toBeGreaterThan(0);
    expect(() => resumed.dispatch(command)).toThrow(); expect(resumed.getState()).toBe(before);
    expect(eventPresentation(before, content)[0]?.type).toBe('SHOW_RESULT');
    engine.dispatch({ type: 'advance_event', instance_id: 'test.instance', node_id: 'result' });
    resumed.dispatch({ type: 'advance_event', instance_id: 'test.instance', node_id: 'result' });
    expect(resumed.getState()).toEqual(engine.getState());
  });
  it('rolls back choice effects/history/node movement when a subsequent result effect fails', () => {
    const input = eventContent(); input.events[0]!.dialogue[2]!.effects = { ...copyData(emptyBundle()), immediate_effects: [
      { effect_id: 'bad.result', kind: 'player_stat', stat_id: 'missing', delta: 1 },
    ] };
    const { engine } = eventFixture(input); firstChoice(engine); const before = engine.getState();
    expect(() => engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' })).toThrow();
    expect(engine.getState()).toBe(before); expect(before.event_runtime.choice_history).toEqual([]);
  });
  it('rolls back final effects, completion and reservations when END application fails', () => {
    const input = eventContent(); input.events[0]!.dialogue[4]!.effects = { ...copyData(emptyBundle()), immediate_effects: [
      { effect_id: 'last.flag', kind: 'flag', flag_id: 'partial', value: true },
      { effect_id: 'bad.end', kind: 'player_stat', stat_id: 'missing', delta: 1 },
    ] };
    const { engine } = eventFixture(input); firstChoice(engine);
    engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' });
    engine.dispatch({ type: 'advance_event', instance_id: 'test.instance', node_id: 'result' });
    const before = engine.getState();
    expect(() => engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'second', choice_id: 'again' })).toThrow();
    expect(engine.getState()).toBe(before); expect(before.followups).toEqual([]); expect(before.event_runtime.completion_history).toEqual([]);
  });
  it('failed END and cancellation never produce normal completion', () => {
    const input = eventContent(); input.events[0]!.dialogue[4]!.outcome = 'failed';
    const { engine } = eventFixture(input); completeEvent(engine);
    expect(engine.getState().event_runtime.finished_instances[0]?.status).toBe('FAILED');
    expect(engine.getState().event_runtime.completion_history).toEqual([]);
    const cancelled = eventFixture().engine; cancelled.dispatch(startCommand);
    cancelled.dispatch({ type: 'cancel_event', instance_id: 'test.instance' });
    expect(cancelled.getState().event_runtime.finished_instances[0]?.status).toBe('CANCELLED');
    expect(cancelled.getState().event_runtime.completion_history).toEqual([]);
  });
  it('fails on authored failure conditions after a choice result without normal completion', () => {
    const input = eventContent(); input.events[0]!.failure_conditions = [
      { kind: 'stat', character_id: 'fixture.a', stat_id: 'test_stat', operator: 'gte', value: 1 },
    ];
    input.events[0]!.failure_effects = { ...copyData(emptyBundle()), flags: { failed: true } };
    const { engine } = eventFixture(input); firstChoice(engine);
    engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' });
    expect(engine.getState().event_runtime.finished_instances[0]?.status).toBe('FAILED');
    expect(engine.getState().flags.failed).toBe(true);
    expect(engine.getState().event_runtime.completion_history).toEqual([]);
    expect(engine.getState().event_runtime.choice_history).toHaveLength(1);
  });
  it('keeps bound NPCs fixed during play and emits final presentation cues', () => {
    const input = eventContent(); input.events[0]!.dialogue[4]!.presentation_cues = [{ type: 'CG_CHANGE', asset_id: 'fixture.image' }];
    const { engine, content } = eventFixture(input); firstChoice(engine);
    const snapshot = copyData(engine.getState()); snapshot.characters['fixture.a']!.availability.available = false;
    const resumed = new CoreEngine(snapshot, content, bounds);
    resumed.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' });
    expect(resumed.getState().event_runtime.active_instance?.participant_bindings).toEqual({ subject: 'fixture.a' });
    resumed.dispatch({ type: 'advance_event', instance_id: 'test.instance', node_id: 'result' });
    const result = resumed.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'second', choice_id: 'again' });
    expect(result.presentation).toContainEqual({ type: 'CG_CHANGE', asset_id: 'fixture.image' });
  });
});

describe('follow-up execution link', () => {
  function dueFixture() {
    const fixture = eventFixture(); completeEvent(fixture.engine);
    const due = copyData(fixture.engine.getState()); due.clock = { day: 93, slot: 'MORNING' };
    return { ...fixture, engine: new CoreEngine(due, fixture.content, bounds), due };
  }
  it('starts due follow-up with pinned source participant, source choice and due data', () => {
    const { engine, content, due } = dueFixture(); const followup = due.followups[0]!;
    const candidates = eventCandidates(due, content, 'test.chapter');
    expect(candidates).toHaveLength(1); expect(candidates[0]?.source_followup_id).toBe(followup.instance_id);
    engine.dispatch({ ...startCommand, event_id: 'fixture.followup', instance_id: 'followup.instance', source_followup_id: followup.instance_id });
    expect(engine.getState().event_runtime.active_instance).toMatchObject({ participant_bindings: { subject: 'fixture.a' },
      source_instance_id: 'test.instance', source_choice_id: 'again', due_at: { day: 93, slot: 'MORNING' } });
    expect(engine.getState().followups[0]?.status).toBe('running');
    engine.dispatch({ type: 'advance_event', instance_id: 'followup.instance', node_id: 'intro' });
    expect(engine.getState().followups[0]?.status).toBe('completed');
    expect(engine.getState().event_runtime.completion_history).toHaveLength(2);
  });
  it.each(['defer', 'cancel', 'fail'] as const)('honors %s on unavailable pinned participant without replacement', policy => {
    const { due, content } = dueFixture(); due.characters['fixture.a']!.availability.available = false;
    due.followups[0]!.unmet_policy = policy;
    const engine = new CoreEngine(due, content, bounds); const before = engine.getState();
    engine.dispatch({ ...startCommand, event_id: 'fixture.followup', instance_id: 'followup.instance', source_followup_id: due.followups[0]!.instance_id });
    expect(engine.getState().event_runtime.active_instance).toBeNull();
    expect(engine.getState().event_runtime.occurrence_history).toHaveLength(1);
    if (policy === 'defer') expect(engine.getState()).toBe(before);
    else expect(engine.getState().followups[0]?.status).toBe('cancelled');
    if (policy === 'fail') expect(engine.getState().event_runtime.finished_instances.at(-1)?.status).toBe('FAILED');
  });
  it('rejects follow-ups before their due slot', () => {
    const { due, content } = dueFixture(); due.clock.slot = 'PRE_WORK';
    const engine = new CoreEngine(due, content, bounds); const before = engine.getState();
    expect(() => engine.dispatch({ ...startCommand, event_id: 'fixture.followup', instance_id: 'followup.instance', source_followup_id: due.followups[0]!.instance_id })).toThrow('not due');
    expect(engine.getState()).toBe(before);
  });
});

describe('graph integrity and runtime safety', () => {
  it('rejects invalid node references, cycles and undefined node semantics', () => {
    const input = eventContent(); input.events[0]!.dialogue[0]!.next_node_id = 'missing';
    expect(() => new ContentRegistry(input)).toThrow('Unknown reference');
    input.events[0]!.dialogue[0]!.next_node_id = 'intro';
    expect(() => new ContentRegistry(input)).toThrow('Node cycle');
    input.events[0]!.dialogue[0]!.next_node_id = 'first'; delete input.events[0]!.dialogue[0]!.type;
    expect(() => new ContentRegistry(input)).toThrow('node type required');
  });
  it('blocks revisiting a node even if a restored state contains an invalid visited list', () => {
    const { engine, content } = eventFixture(); engine.dispatch(startCommand);
    const invalid = copyData(engine.getState()); invalid.event_runtime.active_instance!.visited_node_ids.push('first');
    const restored = new CoreEngine(invalid, content, bounds); const before = restored.getState();
    expect(() => restored.dispatch({ type: 'advance_event', instance_id: 'test.instance', node_id: 'intro' })).toThrow('cycle');
    expect(restored.getState()).toBe(before);
  });
});
