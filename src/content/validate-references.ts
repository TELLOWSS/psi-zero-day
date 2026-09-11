import type { CharacterReference, Condition, ContentBundle, Effect, EffectBundle, EventDefinition } from '../domain';

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
  const directedRelations = index(bundle.relations.map(r => `${r.from_id}->${r.to_id}`), 'relations');
  function relation(from: string, to: string, path: string) {
    ref(characters, from, `${path}.from_id`);
    ref(characters, to, `${path}.to_id`);
    if (!directedRelations.has(`${from}->${to}`)) error(path, `Unknown directed relation: ${from}->${to}`);
  }
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
  function characterReference(value: CharacterReference, path: string, roles?: ReadonlySet<string>): void {
    if (value.kind === 'character') ref(characters, value.character_id, `${path}.character_id`);
    if (value.kind === 'participant') {
      if (!roles) error(path, 'Participant reference is not allowed before binding');
      else ref(roles, value.role_id, `${path}.role_id`);
    }
  }
  function contextualRelation(from: CharacterReference, to: CharacterReference, path: string, roles?: ReadonlySet<string>): void {
    characterReference(from, `${path}.from`, roles); characterReference(to, `${path}.to`, roles);
    if (from.kind === 'character' && to.kind === 'character') relation(from.character_id, to.character_id, path);
  }
  function condition(c: Condition, path: string, roles?: ReadonlySet<string>): void {
    switch (c.kind) {
      case 'all': case 'any': c.conditions.forEach((v, i) => condition(v, `${path}.conditions[${i}]`, roles)); break;
      case 'not': condition(c.condition, `${path}.condition`, roles); break;
      case 'context_stat':
        characterReference(c.target, `${path}.target`, roles);
        if (c.target.kind === 'character') stat(c.target.character_id, c.stat_id, path);
        break;
      case 'context_relation': contextualRelation(c.from, c.to, path, roles); break;
      case 'stat': stat(c.character_id, c.stat_id, path); break;
      case 'event_completed': ref(events, c.event_id, `${path}.event_id`); break;
      case 'relation':
        relation(c.from_id, c.to_id, path); break;
      case 'choice_selected': {
        ref(events, c.event_id, `${path}.event_id`);
        const choices = new Set(bundle.events.find(e => e.event_id === c.event_id)?.choices.map(v => v.choice_id) ?? []);
        ref(choices, c.choice_id, `${path}.choice_id`); break;
      }
      case 'flag': break; // Open state keys; no flag catalog or game rule is invented here.
    }
  }
  function conditions(values: readonly Condition[], path: string, roles?: ReadonlySet<string>) {
    values.forEach((c, i) => condition(c, `${path}[${i}]`, roles));
  }
  function effect(e: Effect, path: string, roles?: ReadonlySet<string>) {
    switch (e.kind) {
      case 'context_stat':
        characterReference(e.target, `${path}.target`, roles);
        if (e.target.kind === 'character') stat(e.target.character_id, e.stat_id, path);
        break;
      case 'context_relation': contextualRelation(e.from, e.to, path, roles); break;
      case 'context_reveal': characterReference(e.target, `${path}.target`, roles); break;
      case 'stat': stat(e.character_id, e.stat_id, path); break;
      case 'reveal': ref(characters, e.character_id, `${path}.character_id`); break;
      case 'relation':
        relation(e.from_id, e.to_id, path); break;
      case 'flag': break;
    }
  }
  function effects(value: EffectBundle, path: string, effectIds: string[], followupIds: string[], roles: ReadonlySet<string>) {
    for (const group of ['immediate_effects', 'hidden_effects', 'relationship_effects', 'stat_effects'] as const) {
      value[group].forEach((e, i) => { effectIds.push(e.effect_id); effect(e, `${path}.${group}[${i}]`, roles); });
    }
    value.followup_events.forEach((f, i) => {
      const p = `${path}.followup_events[${i}]`;
      followupIds.push(f.followup_id);
      ref(events, f.event_id, `${p}.event_id`);
      conditions(f.conditions, `${p}.conditions`, roles);
      const target = bundle.events.find(e => e.event_id === f.event_id);
      if (target?.runtime?.trigger === 'normal') error(`${p}.event_id`, 'Follow-up target is normal-only');
    });
  }
  bundle.characters.forEach((c, i) => {
    const p = `characters[${i}]`;
    for (const field of ['name_text_id', 'role_text_id', 'trade_text_id', 'age_group_text_id', 'nationality_text_id'] as const) {
      text(c[field], `${p}.${field}`);
    }
    c.traits.forEach((id, n) => text(id, `${p}.traits[${n}]`));
    c.weaknesses.forEach((id, n) => text(id, `${p}.weaknesses[${n}]`));
    const reason = c.initial_state.availability.reason_text_id;
    if (reason !== undefined) text(reason, `${p}.initial_state.availability.reason_text_id`);
    conditions(c.appearance_conditions, `${p}.appearance_conditions`);
    conditions(c.exit_conditions, `${p}.exit_conditions`);
    for (const [key, id] of Object.entries(c.asset_bindings)) ref(imageAssets, id, `${p}.asset_bindings.${key}`);
  });
  bundle.relations.forEach((r, i) => {
    ref(characters, r.from_id, `relations[${i}].from_id`);
    ref(characters, r.to_id, `relations[${i}].to_id`);
  });
  function event(e: EventDefinition, i: number) {
    const p = `events[${i}]`;
    text(e.title_text_id, `${p}.title_text_id`);
    text(e.category_text_id, `${p}.category_text_id`);
    text(e.chapter_text_id, `${p}.chapter_text_id`);
    conditions(e.conditions, `${p}.conditions`);
    const roles = index(e.participants.map(v => v.role_id), `${p}.participants`);
    conditions(e.failure_conditions, `${p}.failure_conditions`, roles);
    e.participants.forEach((v, n) => ref(characters, v.character_id, `${p}.participants[${n}].character_id`));
    e.participants.forEach((v, n) => {
      if (!v.selector) return;
      const sp = `${p}.participants[${n}].selector`;
      for (const key of ['role_text_id', 'trade_text_id', 'nationality_text_id'] as const) {
        if (v.selector[key] !== undefined) text(v.selector[key], `${sp}.${key}`);
      }
      v.selector.relations.forEach((r, j) => ref(characters, r.character_id, `${sp}.relations[${j}].character_id`));
      const selector = v.selector;
      const feasible = bundle.characters.some(candidate =>
        (['role_text_id', 'trade_text_id', 'nationality_text_id'] as const).every(key => selector[key] === undefined || selector[key] === candidate[key]) &&
        selector.stats.every(c => Object.hasOwn(candidate.stats, c.stat_id)) &&
        selector.relations.every(r => directedRelations.has(r.direction === 'outgoing'
          ? `${candidate.id}->${r.character_id}` : `${r.character_id}->${candidate.id}`)));
      if (selector.relations.length && !feasible) error(`${sp}.relations`, 'Unsatisfiable directed relation selector');
    });
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
      conditions(c.requirements, `${cp}.requirements`, roles);
      effects(c.effects, `${cp}.effects`, effectIds, followupIds, roles);
    });
    if (e.failure_effects) effects(e.failure_effects, `${p}.failure_effects`, effectIds, followupIds, roles);
    e.dialogue.forEach((node, n) => {
      const np = `${p}.dialogue[${n}]`;
      if (node.effects) effects(node.effects, `${np}.effects`, effectIds, followupIds, roles);
      node.presentation_cues?.forEach((cue, j) => {
        if ('role_id' in cue) ref(roles, cue.role_id, `${np}.presentation_cues[${j}].role_id`);
        else {
          const appropriate = new Set(bundle.asset_manifest.assets.filter(a => a.type === (cue.type === 'AUDIO_CUE' ? 'audio' : 'image')).map(a => a.asset_id));
          ref(appropriate, cue.asset_id, `${np}.presentation_cues[${j}].asset_id`);
        }
      });
      if (!e.runtime) return;
      if (!node.type) error(np, 'Runtime node type required');
      if (node.type === 'CHOICE') {
        if (!node.choice_ids.length || node.next_node_id || node.effects || node.outcome) error(np, 'Invalid CHOICE node');
      } else if (node.choice_ids.length) error(np, 'Only CHOICE nodes may reference choices');
      if (node.type === 'DIALOGUE' || node.type === 'RESULT') {
        if (!node.next_node_id || node.outcome) error(np, 'Dialogue/result requires a next node');
        if (node.type === 'DIALOGUE' && (!node.speaker_role_id || node.effects)) error(np, 'Dialogue requires a speaker and has no effects');
      }
      if (node.type === 'END' && (!node.outcome || node.next_node_id)) error(np, 'END requires outcome and no next node');
    });
    if (e.runtime) {
      const usedChoices = e.dialogue.flatMap(n => [...n.choice_ids]);
      index(usedChoices, `${p}.used_choices`);
      e.choices.forEach((c, n) => {
        if (!c.next_node_id || !usedChoices.includes(c.choice_id)) error(`${p}.choices[${n}]`, 'Runtime choice must be connected with a next node');
      });
      const graph = new Map(e.dialogue.map(n => [n.node_id, [
        ...(n.next_node_id ? [n.next_node_id] : []),
        ...n.choice_ids.flatMap(id => { const c = e.choices.find(c => c.choice_id === id); return c?.next_node_id ? [c.next_node_id] : []; }),
      ]]));
      const visiting = new Set<string>(); const visited = new Set<string>();
      function walk(id: string): void {
        if (visiting.has(id)) { error(`${p}.dialogue`, `Node cycle: ${id}`); return; }
        if (visited.has(id)) return;
        visiting.add(id); visited.add(id);
        (graph.get(id) ?? []).forEach(walk); visiting.delete(id);
      }
      walk(e.entry_node_id);
      if (e.dialogue.some(n => !visited.has(n.node_id))) error(`${p}.dialogue`, 'Unreachable runtime node');
      e.dialogue.forEach(n => walk(n.node_id));
    }
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
