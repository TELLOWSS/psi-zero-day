import type { ContentBundle, EffectBundle, EventDefinition } from '../../src/domain';

export type Mutable<T> = T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;

function emptyEffects(): EffectBundle {
  return { immediate_effects: [], hidden_effects: [], relationship_effects: [], stat_effects: [],
    flags: {}, ending_flags: {}, followup_events: [] };
}

/** Synthetic IDs/text only. Never imported into the application. */
export function validFixture(): Mutable<ContentBundle> {
  const nextEvent: EventDefinition = {
    schema_version: 1, event_id: 'fixture.followup', title_text_id: 'fixture.text',
    category_text_id: 'fixture.text', chapter_text_id: 'fixture.text', conditions: [],
    participants: [], scene: { character_asset_ids: [] }, entry_node_id: 'end',
    dialogue: [{ node_id: 'end', text_id: 'fixture.text', choice_ids: [] }], choices: [], failure_conditions: [],
  };
  const bundle: ContentBundle = {
    schema_version: 1, content_version: 'fixture-1', default_locale: 'ko',
    localizations: [{ locale: 'ko', messages: { 'fixture.text': 'fixture' } }],
    characters: ['fixture.a', 'fixture.b'].map(id => ({
      schema_version: 1, id, name_text_id: 'fixture.text', role_text_id: 'fixture.text',
      trade_text_id: 'fixture.text', age_group_text_id: 'fixture.text', nationality_text_id: 'fixture.text',
      experience: 0, stats: { test_stat: 0 }, traits: [], weaknesses: [],
      appearance_conditions: [], exit_conditions: [], asset_bindings: { base: 'fixture.image' },
    })),
    relations: [{ from_id: 'fixture.a', to_id: 'fixture.b', relationship_values: {},
      trust: 0, respect: 0, reporting: 0, flags: {}, history: [] }],
    events: [{
      ...nextEvent, event_id: 'fixture.event',
      participants: [{ role_id: 'subject', character_id: 'fixture.a' }],
      scene: { background_asset_id: 'fixture.image', character_asset_ids: ['fixture.image'] },
      entry_node_id: 'start',
      dialogue: [{ node_id: 'start', text_id: 'fixture.text', speaker_role_id: 'subject', choice_ids: ['choose'] },
        { node_id: 'end', text_id: 'fixture.text', choice_ids: [] }],
      choices: [{ choice_id: 'choose', text_id: 'fixture.text', requirements: [], next_node_id: 'end',
        effects: {
          ...emptyEffects(),
          hidden_effects: [{ effect_id: 'set_flag', kind: 'flag', flag_id: 'fixture.flag', value: true }],
          stat_effects: [{ effect_id: 'change_stat', kind: 'stat', character_id: 'fixture.a', stat_id: 'test_stat', delta: 1 }],
          relationship_effects: [{ effect_id: 'change_relation', kind: 'relation', from_id: 'fixture.a',
            to_id: 'fixture.b', field: 'trust', delta: 1 }],
          followup_events: [{ followup_id: 'later', event_id: 'fixture.followup', delay: { days: 75, slot: 'MORNING' },
            conditions: [{ kind: 'flag', flag_id: 'fixture.flag', equals: true }], unmet_policy: 'defer' }],
        } }],
    }, nextEvent],
    endings: [{ schema_version: 1, ending_id: 'fixture.ending', title_text_id: 'fixture.text',
      eligibility: [], accumulated_requirements: [{ kind: 'event_completed', event_id: 'fixture.followup', minimum_count: 2 }],
      exclusions: [], result_asset_ids: ['fixture.image'], archive_text_id: 'fixture.text' }],
    asset_manifest: { schema_version: 1, assets: [{ asset_id: 'fixture.image', type: 'image', group_id: 'fixture',
      variants: [{ uri: 'assets/fixture.png', format: 'png', bytes: 0, hash: '0'.repeat(64) }],
      dependencies: [], preload_policy: 'on_demand', version: '1' }] },
  };
  return structuredClone(bundle) as Mutable<ContentBundle>;
}
