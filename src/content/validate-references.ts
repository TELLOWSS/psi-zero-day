import type { Condition, ContentBundle, Effect, EffectBundle, EventDefinition } from '../domain';

export interface ReferenceIssue { readonly path: string; readonly message: string }

/** Called only after schema parsing. Reports all reference errors in one pass. */
export function validateReferences(bundle: ContentBundle): ReferenceIssue[] {
  const issues: ReferenceIssue[] = [];
  const error = (path: string, message: string) => { issues.push({ path, message }); };
  function index(ids: readonly string[], path: string): Set<string> {
    const result = new Set<string>();
    ids.forEach((id, i) => {
      if (result.has(id)) error(`${path}[${i}]`, `Duplicate ID: ${id}`);
      result.add(id);
    });
    return result;
  }
  function ref(ids: ReadonlySet<string>, id: string | undefined, path: string) {
    if (id !== undefined && !ids.has(id)) error(path, `Unknown reference: ${id}`);
  }
  const characters = index(bundle.characters.map(x => x.id), 'characters');
  const events = index(bundle.events.map(x => x.event_id), 'events');
  index(bundle.endings.map(x => x.ending_id), 'endings');
  const assets = index(bundle.asset_manifest.assets.map(x => x.asset_id), 'asset_manifest.assets');
  const locales = index(bundle.localizations.map(x => x.locale), 'localizations');
  ref(locales, bundle.default_locale, 'default_locale');
  const messages = bundle.localizations.find(x => x.locale === bundle.default_locale)?.messages ?? {};
  const texts = new Set(Object.keys(messages));
  const imageAssets = new Set(bundle.asset_manifest.assets.filter(x => x.type === 'image').map(x => x.asset_id));
  const text = (id: string, path: string) => ref(texts, id, path);
  const characterById = new Map(bundle.characters.map(x => [x.id, x]));
  function stat(characterId: string, statId: string, path: string) {
    ref(characters, characterId, `${path}.character_id`);
    const definition = characterById.get(characterId);
    if (definition && !Object.hasOwn(definition.stats, statId)) error(`${path}.stat_id`, `Unknown stat: ${statId}`);
  }
  function condition(c: Condition, path: string): void {
    switch (c.kind) {
      case 'all': case 'any': c.conditions.forEach((v, i) => condition(v, `${path}.conditions[${i}]`)); break;
      case 'not': condition(c.condition, `${path}.condition`); break;
      case 'stat': stat(c.character_id, c.stat_id, path); break;
      case 'event_completed': ref(events, c.event_id, `${path}.event_id`); break;
      case 'relation':
        ref(characters, c.from_id, `${path}.from_id`); ref(characters, c.to_id, `${path}.to_id`); break;
      case 'choice_selected': {
        ref(events, c.event_id, `${path}.event_id`);
        const choices = new Set(bundle.events.find(e => e.event_id === c.event_id)?.choices.map(v => v.choice_id) ?? []);
        ref(choices, c.choice_id, `${path}.choice_id`); break;
      }
      case 'flag': break; // Open state keys; no flag catalog or game rule is invented here.
    }
  }
  function conditions(values: readonly Condition[], path: string) {
    values.forEach((c, i) => condition(c, `${path}[${i}]`));
  }
  function effect(e: Effect, path: string) {
    switch (e.kind) {
      case 'stat': stat(e.character_id, e.stat_id, path); break;
      case 'reveal': ref(characters, e.character_id, `${path}.character_id`); break;
      case 'relation':
        ref(characters, e.from_id, `${path}.from_id`); ref(characters, e.to_id, `${path}.to_id`); break;
      case 'flag': break;
    }
  }
  function effects(value: EffectBundle, path: string, effectIds: string[], followupIds: string[]) {
    for (const group of ['immediate_effects', 'hidden_effects', 'relationship_effects', 'stat_effects'] as const) {
      value[group].forEach((e, i) => { effectIds.push(e.effect_id); effect(e, `${path}.${group}[${i}]`); });
    }
    value.followup_events.forEach((f, i) => {
      const p = `${path}.followup_events[${i}]`;
      followupIds.push(f.followup_id);
      ref(events, f.event_id, `${p}.event_id`);
      conditions(f.conditions, `${p}.conditions`);
    });
  }
  bundle.characters.forEach((c, i) => {
    const p = `characters[${i}]`;
    for (const field of ['name_text_id', 'role_text_id', 'trade_text_id', 'age_group_text_id', 'nationality_text_id'] as const) {
      text(c[field], `${p}.${field}`);
    }
    c.traits.forEach((id, n) => text(id, `${p}.traits[${n}]`));
    c.weaknesses.forEach((id, n) => text(id, `${p}.weaknesses[${n}]`));
    conditions(c.appearance_conditions, `${p}.appearance_conditions`);
    conditions(c.exit_conditions, `${p}.exit_conditions`);
    for (const [key, id] of Object.entries(c.asset_bindings)) ref(imageAssets, id, `${p}.asset_bindings.${key}`);
  });
  index(bundle.relations.map(r => `${r.from_id}->${r.to_id}`), 'relations');
  bundle.relations.forEach((r, i) => {
    ref(characters, r.from_id, `relations[${i}].from_id`);
    ref(characters, r.to_id, `relations[${i}].to_id`);
    // Initial content cannot contain runtime event-instance history.
    if (r.history.length) error(`relations[${i}].history`, 'Initial relation history must be empty');
  });
  function event(e: EventDefinition, i: number) {
    const p = `events[${i}]`;
    text(e.title_text_id, `${p}.title_text_id`);
    text(e.category_text_id, `${p}.category_text_id`);
    text(e.chapter_text_id, `${p}.chapter_text_id`);
    conditions(e.conditions, `${p}.conditions`);
    conditions(e.failure_conditions, `${p}.failure_conditions`);
    const roles = index(e.participants.map(v => v.role_id), `${p}.participants`);
    e.participants.forEach((v, n) => ref(characters, v.character_id, `${p}.participants[${n}].character_id`));
    ref(imageAssets, e.scene.background_asset_id, `${p}.scene.background_asset_id`);
    e.scene.character_asset_ids.forEach((id, n) => ref(imageAssets, id, `${p}.scene.character_asset_ids[${n}]`));
    const nodes = index(e.dialogue.map(v => v.node_id), `${p}.dialogue`);
    const choices = index(e.choices.map(v => v.choice_id), `${p}.choices`);
    ref(nodes, e.entry_node_id, `${p}.entry_node_id`);
    e.dialogue.forEach((node, n) => {
      const np = `${p}.dialogue[${n}]`;
      text(node.text_id, `${np}.text_id`);
      ref(roles, node.speaker_role_id, `${np}.speaker_role_id`);
      ref(nodes, node.next_node_id, `${np}.next_node_id`);
      index(node.choice_ids, `${np}.choice_ids`);
      node.choice_ids.forEach((id, j) => ref(choices, id, `${np}.choice_ids[${j}]`));
      if (node.next_node_id && node.choice_ids.length) error(np, 'Specify either next_node_id or choice_ids');
    });
    const effectIds: string[] = [];
    const followupIds: string[] = [];
    e.choices.forEach((c, n) => {
      const cp = `${p}.choices[${n}]`;
      text(c.text_id, `${cp}.text_id`);
      ref(nodes, c.next_node_id, `${cp}.next_node_id`);
      conditions(c.requirements, `${cp}.requirements`);
      effects(c.effects, `${cp}.effects`, effectIds, followupIds);
    });
    if (e.failure_effects) effects(e.failure_effects, `${p}.failure_effects`, effectIds, followupIds);
    index(effectIds, `${p}.effect_ids`);
    index(followupIds, `${p}.followup_ids`);
  }
  bundle.events.forEach(event);
  bundle.endings.forEach((e, i) => {
    const p = `endings[${i}]`;
    text(e.title_text_id, `${p}.title_text_id`); text(e.archive_text_id, `${p}.archive_text_id`);
    conditions(e.eligibility, `${p}.eligibility`);
    conditions(e.accumulated_requirements, `${p}.accumulated_requirements`);
    conditions(e.exclusions, `${p}.exclusions`);
    e.result_asset_ids.forEach((id, n) => ref(imageAssets, id, `${p}.result_asset_ids[${n}]`));
  });
  const assetById = new Map(bundle.asset_manifest.assets.map(a => [a.asset_id, a]));
  bundle.asset_manifest.assets.forEach((a, i) => {
    const p = `asset_manifest.assets[${i}]`;
    a.dependencies.forEach((id, n) => ref(assets, id, `${p}.dependencies[${n}]`));
    ref(assets, a.fallback_id, `${p}.fallback_id`);
    const fallback = a.fallback_id ? assetById.get(a.fallback_id) : undefined;
    if (fallback && fallback.type !== a.type) error(`${p}.fallback_id`, 'Fallback asset type mismatch');
    a.variants.forEach((v, n) => ref(locales, v.locale, `${p}.variants[${n}].locale`));
  });
  const active = new Set<string>();
  const visited = new Set<string>();
  function visitAsset(id: string): void {
    if (active.has(id)) { error('asset_manifest.assets', `Asset dependency/fallback cycle: ${id}`); return; }
    if (visited.has(id)) return;
    visited.add(id); active.add(id);
    const a = assetById.get(id);
    if (a) [...a.dependencies, ...(a.fallback_id ? [a.fallback_id] : [])].forEach(visitAsset);
    active.delete(id);
  }
  assets.forEach(visitAsset);
  return issues;
}
