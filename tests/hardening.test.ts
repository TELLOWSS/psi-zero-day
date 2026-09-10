import { describe, expect, it } from 'vitest';
import type { Condition, Effect, GameState } from '../src/domain';
import { ContentReferenceError, ContentRegistry } from '../src/content/registry';
import { characterDefinitionSchema, relationDefinitionSchema, relationStateSchema } from '../src/content/schemas';
import { applyEffectBundle, createRng, createRun, evaluateCondition } from '../src/engine';
import { validFixture } from './fixtures/content';
import { bounds, context, emptyBundle, runOptions, runtimeFixture } from './fixtures/run';

describe('definition/runtime separation', () => {
  it('creates independent directed runtime relations and never changes definitions or another run', () => {
    const input = validFixture();
    input.relations[0]!.initial_state.relationship_values = { affinity: 5 };
    input.relations[0]!.initial_state.flags = { introduced: true };
    input.relations.push({ from_id: 'fixture.b', to_id: 'fixture.a', initial_state: {
      relationship_values: {}, trust: 7, respect: 8, reporting: 9, flags: {},
    } });
    const content = new ContentRegistry(input).getValidatedContent();
    const before = JSON.stringify(content);
    const a = createRun(content, runOptions(), bounds);
    const b = createRun(content, runOptions(), bounds);
    expect(a.relations[0]).toEqual({ from_id: 'fixture.a', to_id: 'fixture.b',
      ...content.relations[0]!.initial_state, history: [] });
    expect(a.relations[0]).not.toBe(content.relations[0]);
    expect(a.relations[0]?.flags).not.toBe(content.relations[0]?.initial_state.flags);
    expect(a.relations[0]?.relationship_values).not.toBe(content.relations[0]?.initial_state.relationship_values);
    expect(a.relations[0]?.history).not.toBe(b.relations[0]?.history);
    const changed = applyEffectBundle(a, { ...emptyBundle(), relationship_effects: [
      { effect_id: 'trust', kind: 'relation', from_id: 'fixture.a', to_id: 'fixture.b', field: 'trust', delta: 3 },
    ] }, context, content, bounds);
    expect(changed.relations.map(r => r.trust)).toEqual([3, 7]);
    expect(a.relations.map(r => r.trust)).toEqual([0, 7]);
    expect(b.relations).toEqual(a.relations);
    expect(JSON.stringify(content)).toBe(before);
    expect(JSON.parse(JSON.stringify(changed))).toEqual(changed);
  });

  it('initializes 100 NPCs entirely from definitions without runtime options or RNG changes', () => {
    const input = validFixture();
    for (let i = 1; i < 100; i++) {
      input.characters.push({ ...structuredClone(input.characters[0]!), id: `fixture.npc-${i}`,
        initial_state: { morale: i, fatigue: i + 1, availability: { available: false, reason_text_id: 'fixture.text' },
          revealed_fields: ['stats.test_stat'], story_flags: { known: true } } });
    }
    const content = new ContentRegistry(input).getValidatedContent();
    const options = runOptions(42);
    expect(options).not.toHaveProperty('character_runtime');
    const state = createRun(content, options, bounds);
    expect(Object.keys(state.characters)).toHaveLength(100);
    expect(state.characters['fixture.npc-99']).toMatchObject({ morale: 99, fatigue: 100,
      availability: { available: false, reason_text_id: 'fixture.text' },
      revealed_fields: ['stats.test_stat'], story_flags: { known: true }, event_history: [] });
    const definition = content.characters.find(c => c.id === 'fixture.npc-99')!;
    expect(state.characters['fixture.npc-99']?.availability).not.toBe(definition.initial_state.availability);
    expect(state.characters['fixture.npc-99']?.revealed_fields).not.toBe(definition.initial_state.revealed_fields);
    expect(state.characters['fixture.npc-99']?.story_flags).not.toBe(definition.initial_state.story_flags);
    expect(state.run.rng).toEqual(createRng(42).snapshot());
    expect(state).toEqual(createRun(content, options, bounds));
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
    expect(runtimeFixture().state.run.rng).toEqual(state.run.rng);
  });

  it('requires authored initial values and rejects runtime history inside relation definitions', () => {
    const input = validFixture();
    expect(relationDefinitionSchema.safeParse(input.relations[0]).success).toBe(true);
    expect(relationStateSchema.safeParse(input.relations[0]).success).toBe(false);
    expect(relationDefinitionSchema.safeParse({ ...input.relations[0], history: [] }).success).toBe(false);
    for (const key of ['morale', 'fatigue', 'availability', 'revealed_fields']) {
      const initial: Record<string, unknown> = { ...input.characters[0]!.initial_state }; delete initial[key];
      expect(characterDefinitionSchema.safeParse({ ...input.characters[0], initial_state: initial }).success).toBe(false);
    }
    for (const key of ['relationship_values', 'trust', 'respect', 'reporting', 'flags']) {
      const initial: Record<string, unknown> = { ...input.relations[0]!.initial_state }; delete initial[key];
      expect(relationDefinitionSchema.safeParse({ ...input.relations[0], initial_state: initial }).success).toBe(false);
    }
  });
});

describe('occurred is not completed', () => {
  const completed: Condition = { kind: 'event_completed', event_id: 'fixture.event', minimum_count: 1 };
  it('starts with separate empty histories; occurrence and choice alone cannot satisfy completion', () => {
    const { state } = runtimeFixture();
    expect(state.event_runtime.completion_history).toEqual([]);
    expect(state.event_runtime.completion_history).not.toBe(state.event_runtime.occurrence_history);
    const occurred: GameState = { ...state, event_runtime: { ...state.event_runtime,
      occurrence_history: [{ event_id: 'fixture.event', instance_id: 'started', occurred_at: state.clock }],
      choice_history: [{ instance_id: 'started', choice_id: 'choose' }] } };
    const before = JSON.stringify(occurred);
    expect(evaluateCondition(occurred, completed)).toBe(false);
    expect(evaluateCondition(occurred, { kind: 'choice_selected', event_id: 'fixture.event', choice_id: 'choose', minimum_count: 1 })).toBe(true);
    expect(JSON.stringify(occurred)).toBe(before);
  });
  it('reads only matching completion records and counts unique completed instances', () => {
    const { state } = runtimeFixture();
    const record = { event_id: 'fixture.event', instance_id: 'finished', completed_at: state.clock };
    const done: GameState = { ...state, event_runtime: { ...state.event_runtime,
      completion_history: [record, record, { ...record, event_id: 'fixture.followup', instance_id: 'other' }] } };
    expect(evaluateCondition(done, completed)).toBe(true);
    expect(evaluateCondition(done, { ...completed, minimum_count: 2 })).toBe(false);
    expect(evaluateCondition(state, completed)).toBe(false);
    expect(JSON.parse(JSON.stringify(done))).toEqual(done);
  });
});

describe('directed relation references', () => {
  const condition: Condition = { kind: 'relation', from_id: 'fixture.a', to_id: 'fixture.b', field: 'trust', operator: 'gte', value: 1 };
  const effect: Extract<Effect, { kind: 'relation' }> = { kind: 'relation', effect_id: 'relation.check',
    from_id: 'fixture.a', to_id: 'fixture.b', field: 'trust', delta: 3 };

  it.each(['none', 'reverse'] as const)('rejects A→B conditions/effects when only %s is defined', mode => {
    const input = validFixture();
    input.relations = mode === 'none' ? [] : [{ ...input.relations[0]!, from_id: 'fixture.b', to_id: 'fixture.a' }];
    // Remove fixture's pre-existing relation effect to isolate each reference location.
    input.events[0]!.choices[0]!.effects.relationship_effects = [];
    for (const location of ['condition', 'effect'] as const) {
      const test = structuredClone(input);
      if (location === 'condition') test.events[0]!.conditions = [condition];
      else test.events[0]!.choices[0]!.effects.relationship_effects = [effect];
      expect(() => new ContentRegistry(test)).toThrow(ContentReferenceError);
      expect(() => new ContentRegistry(test)).toThrow('Unknown directed relation: fixture.a->fixture.b');
    }
  });
  it('validates nested conditions and hidden/failure effects using the same directed index', () => {
    const input = validFixture(); input.relations = [];
    input.events[0]!.choices[0]!.effects.relationship_effects = [];
    input.events[0]!.conditions = [{ kind: 'all', conditions: [{ kind: 'not', condition }] }];
    input.events[0]!.choices[0]!.effects.hidden_effects = [effect];
    input.events[0]!.failure_effects = { immediate_effects: [effect], hidden_effects: [],
      relationship_effects: [], stat_effects: [], flags: {}, ending_flags: {}, followup_events: [] };
    try { new ContentRegistry(input); throw new Error('Expected reference rejection'); }
    catch (error) {
      expect(error).toBeInstanceOf(ContentReferenceError);
      const paths = (error as ContentReferenceError).issues.map(issue => issue.path);
      expect(paths).toEqual(expect.arrayContaining([
        'events[0].conditions[0].conditions[0].condition',
        'events[0].choices[0].effects.hidden_effects[0]',
        'events[0].failure_effects.immediate_effects[0]',
      ]));
    }
  });
  it('accepts references when the exact directed definition exists', () => {
    const input = validFixture(); input.events[0]!.conditions = [condition];
    input.events[0]!.choices[0]!.effects.relationship_effects = [effect];
    expect(() => new ContentRegistry(input)).not.toThrow();
  });
});
