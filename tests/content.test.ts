import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { ContentReferenceError, ContentRegistry } from '../src/content/registry';
import { contentBundleSchema, gameTimeSchema } from '../src/content/schemas';
import { validateReferences } from '../src/content/validate-references';
import { TIME_SLOTS } from '../src/domain';
import type { ContentBundle } from '../src/domain';
import { validFixture } from './fixtures/content';
import type { Mutable } from './fixtures/content';
import foundation from '../content/foundation.json';
import ko from '../content/localization/ko.json';

describe('ContentRegistry', () => {
  it('accepts a normal fixture and resolves definitions by ID', () => {
    const registry = new ContentRegistry(validFixture());
    expect(registry.getCharacter('fixture.a')?.stats.test_stat).toBe(0);
    expect(registry.getEvent('fixture.event')?.choices[0]?.effects.followup_events[0]?.event_id).toBe('fixture.followup');
    expect(registry.getEnding('fixture.ending')?.ending_id).toBe('fixture.ending');
    expect(registry.getAsset('fixture.image')?.type).toBe('image');
    expect(registry.getEvent('missing')).toBeUndefined();
  });

  it('boots with zero game content and local shell translations', () => {
    const registry = new ContentRegistry({ ...foundation, localizations: [ko] });
    expect(registry.bundle.characters).toEqual([]);
    expect(registry.bundle.events).toEqual([]);
    expect(registry.bundle.endings).toEqual([]);
    expect(registry.bundle.asset_manifest.assets).toEqual([]);
  });

  it('owns an immutable snapshot, not the caller object', () => {
    const input = validFixture();
    const registry = new ContentRegistry(input);
    input.characters[0]!.stats.test_stat = 999;
    expect(registry.getCharacter('fixture.a')?.stats.test_stat).toBe(0);
    expect(() => {
      (registry.bundle as Mutable<ContentBundle>).characters[0]!.stats.test_stat = 5;
    }).toThrow(TypeError);
    expect(Object.isFrozen(registry.bundle.events[0]?.choices[0]?.effects)).toBe(true);
  });

  const badReferences: [string, (b: Mutable<ContentBundle>) => void, string][] = [
    ['participant', b => { b.events[0]!.participants[0]!.character_id = 'missing'; }, 'participants[0].character_id'],
    ['relation endpoint', b => { b.relations[0]!.to_id = 'missing'; }, 'relations[0].to_id'],
    ['followup', b => { b.events[0]!.choices[0]!.effects.followup_events[0]!.event_id = 'missing'; }, 'followup_events[0].event_id'],
    ['nested condition', b => { b.events[0]!.conditions = [{ kind: 'all', conditions: [
      { kind: 'not', condition: { kind: 'event_completed', event_id: 'missing', minimum_count: 1 } },
    ] }]; }, 'conditions[0].conditions[0].condition.event_id'],
    ['stat key', b => { b.events[0]!.choices[0]!.effects.stat_effects[0]!.stat_id = 'missing'; }, 'stat_effects[0].stat_id'],
    ['effect endpoint', b => { b.events[0]!.choices[0]!.effects.relationship_effects[0]!.to_id = 'missing'; }, 'relationship_effects[0].to_id'],
    ['text', b => { b.characters[0]!.name_text_id = 'missing'; }, 'name_text_id'],
    ['entry node', b => { b.events[0]!.entry_node_id = 'missing'; }, 'entry_node_id'],
    ['next node', b => { b.events[0]!.choices[0]!.next_node_id = 'missing'; }, 'choices[0].next_node_id'],
    ['speaker role', b => { b.events[0]!.dialogue[0]!.speaker_role_id = 'missing'; }, 'speaker_role_id'],
    ['choice', b => { b.events[0]!.dialogue[0]!.choice_ids = ['missing']; }, 'choice_ids[0]'],
    ['asset', b => { b.characters[0]!.asset_bindings.base = 'missing'; }, 'asset_bindings.base'],
    ['asset dependency', b => { b.asset_manifest.assets[0]!.dependencies = ['missing']; }, 'dependencies[0]'],
    ['asset fallback', b => { b.asset_manifest.assets[0]!.fallback_id = 'missing'; }, 'fallback_id'],
    ['ending asset', b => { b.endings[0]!.result_asset_ids = ['missing']; }, 'result_asset_ids[0]'],
    ['default locale', b => { b.default_locale = 'en'; }, 'default_locale'],
  ];
  it.each(badReferences)('rejects broken %s references with a location', (_label, mutate, path) => {
    const input = validFixture(); mutate(input);
    expect(() => new ContentRegistry(input)).toThrow(ContentReferenceError);
    const issues = validateReferences(contentBundleSchema.parse(input));
    expect(issues.some(issue => issue.path.includes(path))).toBe(true);
  });

  it('collects multiple broken references without publishing a partial registry', () => {
    const input = validFixture();
    input.characters[0]!.name_text_id = 'missing'; input.events[0]!.entry_node_id = 'missing';
    expect(validateReferences(contentBundleSchema.parse(input))).toHaveLength(2);
    expect(() => new ContentRegistry(input)).toThrow(ContentReferenceError);
  });

  it('rejects duplicate IDs including scoped effect IDs', () => {
    const input = validFixture(); input.characters.push(structuredClone(input.characters[0]!));
    expect(() => new ContentRegistry(input)).toThrow('Duplicate ID: fixture.a');
    const other = validFixture();
    other.events[0]!.choices[0]!.effects.stat_effects[0]!.effect_id = 'set_flag';
    expect(() => new ContentRegistry(other)).toThrow('Duplicate ID: set_flag');
  });

  it('keeps directional relations independent and rejects duplicate directed pairs', () => {
    const input = validFixture();
    input.relations.push({ ...input.relations[0]!, from_id: 'fixture.b', to_id: 'fixture.a',
      initial_state: { ...input.relations[0]!.initial_state, trust: 3 } });
    expect(new ContentRegistry(input).bundle.relations.map(r => r.initial_state.trust)).toEqual([0, 3]);
    input.relations.push(structuredClone(input.relations[0]!));
    expect(() => new ContentRegistry(input)).toThrow('Duplicate ID');
  });

  it('rejects asset cycles and using audio in image slots', () => {
    const input = validFixture(); input.asset_manifest.assets[0]!.fallback_id = 'fixture.image';
    expect(() => new ContentRegistry(input)).toThrow('cycle');
    delete input.asset_manifest.assets[0]!.fallback_id;
    input.asset_manifest.assets[0]!.type = 'audio';
    expect(() => new ContentRegistry(input)).toThrow('asset_bindings.base');
  });
});

describe('strict schemas', () => {
  it('rejects malformed IDs, unknown fields, future schema versions and nonfinite numbers', () => {
    const input = validFixture(); input.characters[0]!.id = 'invalid id';
    expect(() => new ContentRegistry(input)).toThrow(ZodError);
    expect(() => new ContentRegistry({ ...validFixture(), schema_version: 2 })).toThrow(ZodError);
    expect(() => new ContentRegistry({ ...validFixture(), story: 'not allowed' })).toThrow(ZodError);
    const nonfinite = validFixture(); nonfinite.characters[0]!.stats.test_stat = Infinity;
    expect(() => new ContentRegistry(nonfinite)).toThrow(ZodError);
  });

  it('rejects external and traversal asset URIs for offline content', () => {
    for (const uri of ['https://example.com/image.png', 'assets/../secret.png', '/assets/image.png']) {
      const input = validFixture(); input.asset_manifest.assets[0]!.variants[0]!.uri = uri;
      expect(() => new ContentRegistry(input)).toThrow(ZodError);
    }
  });

  it('accepts only the four approved slots and treats display_time as optional metadata', () => {
    for (const slot of TIME_SLOTS) expect(gameTimeSchema.safeParse({ day: 18, slot }).success).toBe(true);
    expect(gameTimeSchema.safeParse({ day: 18, slot: 'MORNING', display_time: '08:40' }).success).toBe(true);
    expect(gameTimeSchema.safeParse({ day: 18, slot: '08:40' }).success).toBe(false);
    expect(gameTimeSchema.safeParse({ day: 18.5, slot: 'MORNING' }).success).toBe(false);
  });
});
