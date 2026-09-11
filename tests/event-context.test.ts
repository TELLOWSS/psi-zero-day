import { describe, expect, it } from 'vitest';
import type { Condition, Effect } from '../src/domain';
import { ContentRegistry } from '../src/content/registry';
import { applyEffectBundle, bindParticipants, CoreEngine, evaluateCondition, evaluateConditions,
  eventCandidates, eventPresentation, getRelation, resolveCharacter, selectEventCandidate } from '../src/engine';
import { copyData } from '../src/engine/data';
import { bounds, emptyBundle } from './fixtures/run';
import { completeEvent, eventContent, eventFixture, firstChoice, startCommand } from './fixtures/event-runtime';
import { validFixture } from './fixtures/content';

const player = { kind: 'player' } as const;
const subject = { kind: 'participant', role_id: 'subject' } as const;
const other = { kind: 'participant', role_id: 'other' } as const;
const statCondition: Condition = { kind: 'context_stat', target: subject, stat_id: 'test_stat', operator: 'gte', value: 1 };

function contextInput() {
  const input = eventContent();
  input.characters.push({ ...structuredClone(input.characters[0]!), id: 'fixture.c' });
  input.events[0]!.participants = [
    { role_id: 'subject', selector: { stats: [], relations: [] } },
    { role_id: 'other', selector: { stats: [], relations: [] } },
  ];
  for (const [from_id, to_id] of [['fixture.b', 'fixture.a'], ['fixture.a', 'fixture.c'], ['fixture.c', 'fixture.a']]) {
    input.relations.push({ from_id: from_id!, to_id: to_id!, initial_state: {
      relationship_values: {}, trust: 0, respect: 0, reporting: 0, flags: {},
    } });
  }
  input.events[0]!.dialogue[2]!.effects = copyData(emptyBundle());
  return input;
}
function runChoice(effects: readonly Effect[]) {
  const input = contextInput(); input.events[0]!.choices[0]!.effects = { ...copyData(emptyBundle()), immediate_effects: copyData(effects) };
  const fixture = eventFixture(input); firstChoice(fixture.engine);
  fixture.engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' });
  return fixture;
}

describe('contextual participant effects and conditions', () => {
  it('applies context_stat and context_reveal to the selected NPC, not another NPC/player', () => {
    const { engine, content } = runChoice([
      { kind: 'context_stat', effect_id: 'bound.stat', target: subject, stat_id: 'test_stat', delta: 5 },
      { kind: 'context_reveal', effect_id: 'bound.reveal', target: subject, field_id: 'stats.test_stat' },
    ]);
    const state = engine.getState();
    expect(state.event_runtime.active_instance?.participant_bindings).toEqual({ subject: 'fixture.a', other: 'fixture.c' });
    expect(state.characters['fixture.a']?.stats.test_stat).toBe(5);
    expect(state.characters['fixture.a']?.revealed_fields).toContain('stats.test_stat');
    expect(state.characters['fixture.c']?.stats.test_stat).toBe(0); expect(state.player.stats.test_stat).toBe(0);
    expect(content.characters[0]?.stats.test_stat).toBe(0);
  });
  it.each([
    [player, subject, 'fixture.b', 'fixture.a'],
    [subject, player, 'fixture.a', 'fixture.b'],
    [subject, other, 'fixture.a', 'fixture.c'],
  ] as const)('applies directed context_relation %j → %j', (from, to, fromId, toId) => {
    const { engine } = runChoice([{ kind: 'context_relation', effect_id: 'bound.relation', from, to, field: 'trust', delta: 5 }]);
    expect(getRelation(engine.getState().relations, fromId, toId)?.trust).toBe(5);
    expect(getRelation(engine.getState().relations, toId, fromId)?.trust).toBe(0);
  });
  it.each(['stat', 'relation'] as const)('enables/disables and rechecks a participant %s requirement', kind => {
    const input = contextInput();
    const condition: Condition = kind === 'stat' ? statCondition : {
      kind: 'context_relation', from: player, to: subject, field: 'trust', operator: 'gte', value: 1,
    };
    input.events[0]!.choices[0]!.requirements = [condition];
    const { engine, content } = eventFixture(input); firstChoice(engine);
    expect(eventPresentation(engine.getState(), content)[0]).toMatchObject({ choices: [{ enabled: false }] });
    const before = engine.getState();
    expect(() => engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' })).toThrow('requirements');
    expect(engine.getState()).toBe(before);
    const changed = copyData(before);
    if (kind === 'stat') changed.characters['fixture.a']!.stats.test_stat = 1;
    else changed.relations.find(r => r.from_id === 'fixture.b' && r.to_id === 'fixture.a')!.trust = 1;
    const resumed = new CoreEngine(changed, content, bounds);
    expect(eventPresentation(resumed.getState(), content)[0]).toMatchObject({ choices: [{ enabled: true }] });
    resumed.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' });
    expect(resumed.getState().event_runtime.choice_history).toHaveLength(1);
  });
  it('rejects absent context/bindings, including short-circuited condition branches', () => {
    const { state } = eventFixture(contextInput());
    expect(() => evaluateCondition(state, statCondition)).toThrow('Participant context required');
    expect(() => evaluateCondition(state, statCondition, { participant_bindings: {} })).toThrow('Unbound participant role');
    expect(() => evaluateCondition(state, { kind: 'any', conditions: [{ kind: 'all', conditions: [] }, statCondition] })).toThrow('context required');
    expect(() => evaluateConditions(state, [{ kind: 'any', conditions: [] }, statCondition])).toThrow('context required');
    expect(() => resolveCharacter(state, subject, { participant_bindings: { subject: 'missing' } })).toThrow('Unknown resolved character');
    expect(resolveCharacter(state, { kind: 'character', character_id: 'fixture.a' })).toBe('fixture.a');
    expect(resolveCharacter(state, player)).toBe('fixture.b');
  });
  it('rolls back earlier writes and ledger entries when contextual resolution fails', () => {
    const { engine, content } = eventFixture(contextInput()); firstChoice(engine); const before = engine.getState();
    const bundle = { ...emptyBundle(), immediate_effects: [
      { kind: 'player_stat', effect_id: 'first', stat_id: 'test_stat', delta: 8 },
      { kind: 'context_stat', effect_id: 'missing', target: { kind: 'participant', role_id: 'absent' }, stat_id: 'test_stat', delta: 1 },
    ] as Effect[] };
    expect(() => applyEffectBundle(before, bundle, { event_id: 'fixture.event', event_instance_id: 'test.instance', bundle_id: 'test.bundle',
      choice_id: 'choose', participant_bindings: before.event_runtime.active_instance!.participant_bindings }, content, bounds)).toThrow('Unbound participant');
    expect(engine.getState()).toBe(before); expect(before.player.stats.test_stat).toBe(0);
    expect(before.event_runtime.applied_effect_ids).toEqual([]);
  });
  it('preserves deterministic contextual results, ledger and JSON resume idempotency', () => {
    const input = contextInput(); input.events[0]!.choices[0]!.effects.immediate_effects = [
      { kind: 'context_stat', effect_id: 'context.stat', target: subject, stat_id: 'test_stat', delta: 3 },
    ];
    const a = eventFixture(input); const b = eventFixture(input); firstChoice(a.engine); firstChoice(b.engine);
    const resumed = new CoreEngine(JSON.parse(JSON.stringify(a.engine.getState())), a.content, bounds);
    const command = { type: 'choose_event' as const, instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' };
    const result = resumed.dispatch(command); expect(result).toEqual(b.engine.dispatch(command));
    expect(JSON.parse(JSON.stringify(result.state))).toEqual(result.state);
    const snapshot = resumed.getState(); expect(() => resumed.dispatch(command)).toThrow(); expect(resumed.getState()).toBe(snapshot);
    expect(snapshot.run.rng.state).toBe(42);
  });
});

describe('unique deterministic role binding', () => {
  it('assigns distinct NPCs by default, regardless of definition order', () => {
    const { state, content } = eventFixture(contextInput());
    expect(bindParticipants(state, content, content.events[0]!)).toEqual({ subject: 'fixture.a', other: 'fixture.c' });
    const input = contextInput(); input.characters.reverse(); const reversed = new ContentRegistry(input).getValidatedContent();
    expect(bindParticipants(state, reversed, reversed.events[0]!)).toEqual({ subject: 'fixture.a', other: 'fixture.c' });
  });
  it('allows reuse only with explicit allow_reuse', () => {
    const input = contextInput(); input.events[0]!.runtime!.allow_reuse = true;
    const { state, content } = eventFixture(input);
    expect(bindParticipants(state, content, content.events[0]!)).toEqual({ subject: 'fixture.a', other: 'fixture.a' });
  });
  it('reserves pinned roles before earlier unpinned selectors', () => {
    const { state, content } = eventFixture(contextInput());
    expect(bindParticipants(state, content, content.events[0]!, { other: 'fixture.a' })).toEqual({ other: 'fixture.a', subject: 'fixture.c' });
    expect(bindParticipants(state, content, content.events[0]!, { subject: 'fixture.a', other: 'fixture.a' })).toBeNull();
  });
});

describe('follow-up contextual conditions and discovery', () => {
  function dueFixture(policy: 'defer' | 'cancel' | 'fail', satisfied = false) {
    const input = contextInput();
    const reservation = input.events[0]!.choices[1]!.effects.followup_events[0]!;
    reservation.conditions = [copyData(statCondition)]; reservation.unmet_policy = policy;
    const fixture = eventFixture(input); completeEvent(fixture.engine);
    const due = copyData(fixture.engine.getState()); due.clock = { day: 93, slot: 'MORNING' };
    if (satisfied) due.characters['fixture.a']!.stats.test_stat = 1;
    return { ...fixture, engine: new CoreEngine(due, fixture.content, bounds) };
  }
  it.each(['defer', 'cancel', 'fail'] as const)('discovers and resolves unmet %s through candidates without queue interpretation', policy => {
    const { engine, content } = dueFixture(policy); const before = engine.getState();
    const candidates = eventCandidates(before, content, 'test.chapter');
    expect(engine.getState()).toBe(before);
    if (policy === 'defer') { expect(candidates).toEqual([]); expect(before.followups[0]?.status).toBe('pending'); return; }
    const candidate = selectEventCandidate(candidates)!;
    expect(candidate.resolution).toBe(policy); expect(candidate.source_followup_id).toBeDefined();
    engine.dispatch({ ...startCommand, event_id: candidate.event_id, instance_id: 'resolved.followup', source_followup_id: candidate.source_followup_id! });
    expect(engine.getState().followups[0]?.status).toBe('cancelled');
    expect(engine.getState().event_runtime.completion_history).toHaveLength(1);
    expect(eventCandidates(engine.getState(), content, 'test.chapter')).toEqual([]);
    if (policy === 'fail') expect(engine.getState().event_runtime.finished_instances.at(-1)).toMatchObject({ status: 'FAILED', instance_id: 'resolved.followup' });
  });
  it('evaluates follow-up conditions using saved source roles and preserves the pinned participant', () => {
    const { engine, content } = dueFixture('defer', true);
    const candidate = selectEventCandidate(eventCandidates(engine.getState(), content, 'test.chapter'))!;
    expect(candidate.participant_bindings.subject).toBe('fixture.a');
    engine.dispatch({ ...startCommand, event_id: candidate.event_id, instance_id: 'next.instance', source_followup_id: candidate.source_followup_id! });
    expect(engine.getState().event_runtime.active_instance?.source_participant_bindings).toEqual({ subject: 'fixture.a', other: 'fixture.c' });
    expect(engine.getState().event_runtime.active_instance?.participant_bindings.subject).toBe('fixture.a');
  });
  it('uses a source-only role in follow-up conditions even when the target has no such role', () => {
    const input = contextInput();
    input.events[0]!.choices[1]!.effects.followup_events[0]!.conditions = [
      { kind: 'context_stat', target: other, stat_id: 'test_stat', operator: 'gte', value: 1 },
    ];
    const { engine, content } = eventFixture(input); completeEvent(engine);
    const due = copyData(engine.getState()); due.clock = { day: 93, slot: 'MORNING' };
    due.characters['fixture.c']!.stats.test_stat = 1;
    const resumed = new CoreEngine(due, content, bounds);
    const candidate = selectEventCandidate(eventCandidates(resumed.getState(), content, 'test.chapter'))!;
    expect(candidate.participant_bindings).toEqual({ subject: 'fixture.a' });
    resumed.dispatch({ ...startCommand, event_id: candidate.event_id, instance_id: 'source.role', source_followup_id: candidate.source_followup_id! });
    expect(resumed.getState().event_runtime.active_instance?.source_participant_bindings?.other).toBe('fixture.c');
  });
  it.each(['cancel', 'fail'] as const)('does not hide %s reservations when chapter or participant availability is unmet', policy => {
    const { engine, content } = dueFixture(policy, true); const due = copyData(engine.getState());
    due.characters['fixture.a']!.availability.available = false;
    due.event_runtime.chapter_id = 'other.chapter';
    const candidates = eventCandidates(due, content, 'other.chapter');
    expect(candidates).toHaveLength(1); expect(candidates[0]?.resolution).toBe(policy);
  });
});

describe('context and selector content validation', () => {
  it('rejects participant references before binding, including nested event conditions', () => {
    const input = contextInput(); input.events[0]!.conditions = [{ kind: 'not', condition: statCondition }];
    expect(() => new ContentRegistry(input)).toThrow('not allowed before binding');
  });
  it.each(['choice', 'failure', 'followup', 'effect'] as const)('rejects undeclared roles in %s context', location => {
    const input = contextInput(); const invalid: Condition = { ...statCondition, target: { kind: 'participant', role_id: 'missing' } };
    if (location === 'choice') input.events[0]!.choices[0]!.requirements = [invalid];
    if (location === 'failure') input.events[0]!.failure_conditions = [invalid];
    if (location === 'followup') input.events[0]!.choices[1]!.effects.followup_events[0]!.conditions = [invalid];
    if (location === 'effect') input.events[0]!.choices[0]!.effects.immediate_effects = [
      { kind: 'context_reveal', effect_id: 'bad.role', target: { kind: 'participant', role_id: 'missing' }, field_id: 'test_stat' },
    ];
    expect(() => new ContentRegistry(input)).toThrow('Unknown reference: missing');
  });
  it('rejects normal-only follow-up targets while retaining legacy/tooling compatibility', () => {
    const input = eventContent(); input.events[1]!.runtime!.trigger = 'normal';
    expect(() => new ContentRegistry(input)).toThrow('Follow-up target is normal-only');
    expect(() => new ContentRegistry(validFixture())).not.toThrow();
  });
  it.each(['none', 'reverse'] as const)('rejects directed relation selectors when only %s exists', mode => {
    const input = contextInput();
    input.characters[0]!.role_text_id = 'candidate.role'; input.localizations[0]!.messages['candidate.role'] = 'fixture';
    input.events[0]!.participants[0]!.selector = { role_text_id: 'candidate.role', stats: [], relations: [
      { character_id: 'fixture.b', direction: 'outgoing', field: 'trust', operator: 'gte', value: 0 },
    ] };
    input.relations = input.relations.filter(r => !(r.from_id === 'fixture.a' && r.to_id === 'fixture.b') &&
      (mode !== 'none' || !(r.from_id === 'fixture.b' && r.to_id === 'fixture.a')));
    expect(() => new ContentRegistry(input)).toThrow('Unsatisfiable directed relation selector');
  });
});

describe('failure ordering inside the command transaction', () => {
  it.each(['RESULT', 'END'] as const)('fails after choice effects before entering target %s rewards', target => {
    const input = contextInput();
    input.events[0]!.failure_conditions = [statCondition];
    input.events[0]!.choices[0]!.effects = { ...copyData(emptyBundle()), immediate_effects: [
      { kind: 'context_stat', effect_id: 'cause.failure', target: subject, stat_id: 'test_stat', delta: 1 },
    ] };
    if (target === 'END') {
      input.events[0]!.dialogue = input.events[0]!.dialogue.filter(n => ['intro', 'first', 'end'].includes(n.node_id));
      input.events[0]!.choices = [input.events[0]!.choices[0]!]; input.events[0]!.choices[0]!.next_node_id = 'end';
    }
    input.events[0]!.dialogue.find(n => n.type === target)!.effects = { ...copyData(emptyBundle()), flags: { forbidden_reward: true } };
    const { engine } = eventFixture(input); firstChoice(engine);
    engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' });
    const state = engine.getState(); expect(state.flags.forbidden_reward).toBeUndefined();
    expect(state.characters['fixture.a']?.stats.test_stat).toBe(1);
    expect(state.event_runtime.finished_instances[0]).toMatchObject({ status: 'FAILED', current_node_id: 'first' });
    expect(state.event_runtime.choice_history).toHaveLength(1); expect(state.event_runtime.completion_history).toEqual([]);
  });
  it('keeps RESULT effects when they cause failure, then skips later END effects', () => {
    const input = contextInput(); input.events[0]!.failure_conditions = [statCondition];
    input.events[0]!.choices[0]!.effects = copyData(emptyBundle());
    input.events[0]!.dialogue[2]!.effects = { ...copyData(emptyBundle()), immediate_effects: [
      { kind: 'context_stat', effect_id: 'result.failure', target: subject, stat_id: 'test_stat', delta: 1 },
    ], flags: { result_applied: true } };
    const { engine } = eventFixture(input); firstChoice(engine);
    engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' });
    expect(engine.getState().flags.result_applied).toBe(true); expect(engine.getState().flags.finished).toBeUndefined();
    expect(engine.getState().event_runtime.finished_instances[0]).toMatchObject({ status: 'FAILED', current_node_id: 'result' });
  });
  it('rolls back the entire choice command when contextual failure handling throws', () => {
    const input = contextInput(); input.events[0]!.failure_conditions = [statCondition];
    input.events[0]!.choices[0]!.effects.immediate_effects = [
      { kind: 'context_stat', effect_id: 'cause.failure', target: subject, stat_id: 'test_stat', delta: 1 },
    ];
    input.events[0]!.failure_effects = { ...copyData(emptyBundle()), immediate_effects: [
      { kind: 'context_stat', effect_id: 'bad.failure', target: subject, stat_id: 'missing', delta: 1 },
    ] };
    const { engine } = eventFixture(input); firstChoice(engine); const before = engine.getState();
    expect(() => engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' })).toThrow();
    expect(engine.getState()).toBe(before); expect(before.event_runtime.choice_history).toEqual([]);
  });
});
