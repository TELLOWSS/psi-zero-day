import { describe, expect, it } from 'vitest';
import type { ContentBundle, GameState } from '../src/domain';
import { ContentRegistry } from '../src/content/registry';
import { createEpisode01Registry, episode01Manifest } from '../src/content/episode01';
import { CoreEngine, createRun, eventCandidates, getRelation } from '../src/engine';
import { copyData } from '../src/engine/data';
import { createTranslator } from '../src/localization/translator';
import { episodeBounds, episodeContent, episodeOptions, eventOrder, playEpisode } from './helpers/episode01-playthrough';
import type { EpisodeDecisions } from './helpers/episode01-playthrough';
import ko from '../content/episode01/ko.json';
import approvedText from './fixtures/episode01-approved-text.json';

const paths: { name: string; decisions: EpisodeDecisions; result: string; consequence: 'reinforced' | 'missed';
  relations: [number, number, number, number, number]; negotiation: number; reaction: string[] }[] = [
  { name: 'A', decisions: { plan: 'follow_junho', signal: 'listen_more', ramp: 'ask_minseok', entrance: 'assign_crew', evening: 'field_note' },
    result: 'BEST_CONTROL', consequence: 'reinforced', relations: [33, 28, 30, 40, 48], negotiation: 30,
    reaction: ['kang.low', 'yoon.low', 'junho.high'] },
  { name: 'B', decisions: { plan: 'negotiate_yoon', ramp: 'check_self', entrance: 'request_delay', evening: 'study' },
    result: 'CONTROLLED_DELAY', consequence: 'missed', relations: [30, 33, 33, 20, 45], negotiation: 31,
    reaction: ['kang.low', 'yoon.high', 'junho.low'] },
  { name: 'C', decisions: { plan: 'coordinate_schedule', ramp: 'keep_schedule', entrance: 'assign_crew', evening: 'family' },
    result: 'NEAR_MISS', consequence: 'missed', relations: [33, 28, 34, 20, 45], negotiation: 32,
    reaction: ['kang.low', 'yoon.low', 'junho.low'] },
  { name: 'D', decisions: { plan: 'delegate_kang', ramp: 'check_self', entrance: 'force_clear', evening: 'rest' },
    result: 'RELATION_CONFLICT', consequence: 'missed', relations: [33, 20, 30, 20, 45], negotiation: 30,
    reaction: ['kang.low', 'yoon.low', 'junho.low'] },
];
const relationFields = [
  ['kang_taesik', 'trust'], ['yoon_sungho', 'respect'], ['lee_jaehoon', 'respect'],
  ['lim_junho', 'reporting'], ['choi_minseok', 'reporting'],
] as const;
const historyEvents = (state: GameState) => state.event_runtime.completion_history.map(item => item.event_id);
const pathFlags: Record<string, Record<string, boolean | string>> = {
  A: { followed_junho: true, junho_opened_up: true, ramp_signal_known: true, ramp_verified: true,
    minseok_checked_ramp: true, entrance_controlled: true, reporting_return_state: 'reinforced',
    evening_field_note: true, psi_seed_day01: true },
  B: { negotiated_rebar: true, ramp_verified: true, direct_ramp_check: true, pump_delayed: true,
    reporting_return_state: 'missed', evening_study: true },
  C: { schedule_first: true, ramp_unverified: true, entrance_controlled: true,
    reporting_return_state: 'missed', evening_family: true },
  D: { delegated_cleanup_kang: true, ramp_verified: true, direct_ramp_check: true, entrance_controlled: true,
    relation_conflict: true, reporting_return_state: 'missed', evening_rest: true },
};

describe('Episode 01 actual content', () => {
  it('loads the approved cast, all eleven event definitions and directed initial relationships', () => {
    const content = createEpisode01Registry().getValidatedContent();
    expect(content.characters.map(c => c.id)).toEqual(episode01Manifest.cast.map(c => c.runtime_id));
    expect(content.events.map(e => e.event_id)).toEqual(eventOrder);
    expect(content.characters).toHaveLength(6);
    expect(content.relations).toHaveLength(10);
    expect(content.characters[0]!.stats).toEqual({ field: 35, process: 30, people: 32, judgment: 28,
      negotiation: 30, response: 30, learning: 40, analysis: 38 });
    expect(content.characters.slice(1).map(c => [c.experience, c.initial_state.morale, c.initial_state.fatigue])).toEqual([
      [90, 75, 20], [86, 72, 22], [55, 68, 25], [12, 60, 15], [76, 74, 18],
    ]);
    expect(content.relations.filter(r => r.to_id === 'player').map(r =>
      [r.initial_state.trust, r.initial_state.respect, r.initial_state.reporting])).toEqual([
      [30, 25, 30], [30, 25, 30], [35, 30, 35], [25, 20, 20], [35, 40, 45],
    ]);
    for (const c of content.characters) {
      expect(c.initial_state.availability.available).toBe(true);
      expect(c.initial_state.story_flags).toEqual({});
      expect(c.initial_state.revealed_fields).toEqual([]);
    }
    for (const relation of content.relations.filter(r => r.from_id === 'player')) {
      expect(relation.initial_state).toEqual({ trust: 35, respect: 35, reporting: 30, flags: {}, relationship_values: {} });
    }
    expect(content.endings).toEqual([]);
    expect(content.asset_manifest.assets).toEqual([]);
  });

  it.each(paths)('plays PATH $name to completion with exact histories, flags, deltas and reactions', path => {
    const { initial, state, trace } = playEpisode(path.decisions);
    const expectedEvents = eventOrder.filter(id => path.decisions.plan === 'follow_junho' || id !== 'e01_04_junho_signal');
    expect(historyEvents(state)).toEqual(expectedEvents);
    expect(state.event_runtime.occurrence_history.map(item => item.event_id)).toEqual(expectedEvents);
    expect(state.event_runtime.finished_instances.map(item => item.event_id)).toEqual(expectedEvents);
    expect(state.event_runtime.finished_instances.every(item => item.status === 'COMPLETED')).toBe(true);
    expect(state.event_runtime.active_instance).toBeNull();
    expect(state.flags.pump_result).toBe(path.result);
    expect(state.flags).toEqual({ ...pathFlags[path.name], pump_result: path.result,
      first_pour_completed: true, episode01_completed: true });
    expect(state.flags.first_pour_completed).toBe(true);
    expect(state.flags.episode01_completed).toBe(true);
    expect(state.flags[`evening_${path.decisions.evening}`]).toBe(true);
    expect(state.flags.psi_seed_day01).toBe(path.decisions.evening === 'field_note' ? true : undefined);
    expect(state.player.stats.negotiation).toBe(path.negotiation);
    expect(state.player.stats.learning).toBe(path.decisions.evening === 'study' ? 41 : 40);
    expect(state.player.stats.analysis).toBe(path.decisions.evening === 'field_note' ? 39 : 38);
    expect(relationFields.map(([id, field]) => getRelation(state.relations, id, 'player')![field])).toEqual(path.relations);
    expect(state.relations.filter(r => r.from_id === 'player')).toEqual(initial.relations.filter(r => r.from_id === 'player'));
    expect(state.construction.stage_id).toBe('FOUNDATION');
    expect(state.construction.progress_by_stage).toEqual({ FOUNDATION: 14 });
    expect(state.construction.progress_by_stage.FOUNDATION! - initial.construction.progress_by_stage.FOUNDATION!).toBe(4);
    expect(state.construction.milestones).toEqual([]);
    expect(state.psi).toEqual(initial.psi);
    expect(state.ending_runtime).toEqual(initial.ending_runtime);
    expect(state.clock).toEqual({ day: 2, slot: 'PRE_WORK' });
    const expectedChoices = [path.decisions.plan, ...(path.decisions.signal ? [path.decisions.signal] : []),
      path.decisions.ramp, path.decisions.entrance, path.result.toLowerCase(), ...path.reaction,
      `reporting_return_${path.consequence}`, path.decisions.evening];
    expect(state.event_runtime.choice_history.map(item => item.choice_id)).toEqual(expectedChoices);
    expect(state.event_runtime.choice_history).toEqual(trace.flatMap(item => item.command.type === 'choose_event'
      ? [{ instance_id: item.command.instance_id, choice_id: item.command.choice_id }] : []));
    expect(new Set(state.event_runtime.applied_effect_ids).size).toBe(state.event_runtime.applied_effect_ids.length);
    const reactions = state.event_runtime.finished_instances.find(i => i.event_id === 'e01_08_reactions')!;
    expect(reactions.selected_choice_ids).toEqual(path.reaction);
    const consequence = state.event_runtime.finished_instances.find(i => i.event_id === 'e01_08a_reporting_return')!;
    expect(consequence.selected_choice_ids).toEqual([`reporting_return_${path.consequence}`]);
    const texts = trace.flatMap(item => item.presentation.flatMap(p => 'text_id' in p ? [p.text_id] : []));
    for (const reaction of path.reaction) expect(texts).toContain(`ep01.reactions.${reaction}`);
    expect(texts).toContain(`ep01.pump.${path.result.toLowerCase()}`);
    expect(texts).toContain(`ep01.reporting_return.${path.consequence}`);
    expect(texts.includes('ep01.evening.field_note.record')).toBe(path.decisions.evening === 'field_note');
    expect(eventCandidates(state, episodeContent, 'foundation')).toEqual([]);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it.each(paths)('replays and JSON-resumes PATH $name after every command without duplicate effects', path => {
    const baseline = playEpisode(path.decisions, { seed: 741 });
    expect(playEpisode(path.decisions, { seed: 741 })).toEqual(baseline);
    expect(playEpisode(path.decisions, { seed: 741, resumeEveryCommand: true })).toEqual(baseline);
    expect(baseline.state.run.rng).toEqual(baseline.initial.run.rng);
    const original = new CoreEngine(baseline.state, episodeContent, episodeBounds);
    const resumed = new CoreEngine(JSON.parse(JSON.stringify(baseline.state)) as GameState, episodeContent, episodeBounds);
    expect(Array.from({ length: 3 }, () => original.dispatch({ type: 'draw_random' }).value))
      .toEqual(Array.from({ length: 3 }, () => resumed.dispatch({ type: 'draw_random' }).value));
  });

  it('retains exact Director text and exposes only local Korean text without feature/result labels', () => {
    expect(ko.messages).toMatchObject(approvedText);
    const translate = createTranslator(episodeContent.localizations, 'ko');
    for (const path of paths) for (const item of playEpisode(path.decisions).trace) for (const p of item.presentation) {
      if ('text_id' in p) expect(translate(p.text_id)).toBeTruthy();
      if (p.type === 'SHOW_CHOICE') for (const choice of p.choices) expect(translate(choice.text_id)).toBeTruthy();
    }
    for (const text of Object.values(ko.messages)) {
      expect(text).not.toMatch(/PSI|Proactive Safety Intelligence|GOOD|BAD|BEST_CONTROL|CONTROLLED_DELAY|NEAR_MISS|RELATION_CONFLICT/i);
    }
  });

  it('does not mutate static definitions or add runtime history to content', () => {
    const before = JSON.stringify(episodeContent);
    playEpisode(paths[0]!.decisions);
    expect(JSON.stringify(episodeContent)).toBe(before);
    expect(episodeContent.characters[1]!.initial_state).not.toHaveProperty('event_history');
    expect(episodeContent.relations[0]).not.toHaveProperty('history');
  });

  it('blocks skipping the optional signal and prevents replaying the pour effect', () => {
    const run = playEpisode(paths[0]!.decisions);
    const beforeSignal = run.checkpoints.e01_04_junho_signal!;
    expect(eventCandidates(beforeSignal, episodeContent, 'foundation').map(c => c.event_id)).toEqual(['e01_04_junho_signal']);
    const engine = new CoreEngine(beforeSignal, episodeContent, episodeBounds);
    expect(() => engine.dispatch({ type: 'start_event', event_id: 'e01_05_command', instance_id: 'skip.command', chapter_id: 'foundation' })).toThrow();
    expect(engine.getState()).toEqual(beforeSignal);
    const finished = new CoreEngine(run.state, episodeContent, episodeBounds);
    expect(() => finished.dispatch({ type: 'start_event', event_id: 'e01_07_first_pour', instance_id: 'repeat.pour', chapter_id: 'foundation' })).toThrow();
    expect(finished.getState().construction.progress_by_stage.FOUNDATION).toBe(14);
  });

  it('uses dynamic participants for both command judgments and applies only approved contextual deltas', () => {
    const run = playEpisode(paths[0]!.decisions);
    const instance = run.state.event_runtime.finished_instances.find(i => i.event_id === 'e01_05_command')!;
    expect(instance.participant_bindings).toEqual({ kang: 'kang_taesik', yoon: 'yoon_sungho', lee: 'lee_jaehoon', minseok: 'choi_minseok' });
    expect(instance.selected_choice_ids).toEqual(['ask_minseok', 'assign_crew']);
    expect(instance.visited_node_ids).toEqual(['situation', 'ramp', 'entrance', 'end']);
    expect(episodeContent.events.find(e => e.event_id === instance.event_id)!.participants.every(p => p.selector !== undefined)).toBe(true);
    expect(run.state.flags).toMatchObject({ followed_junho: true, junho_opened_up: true, ramp_signal_known: true,
      ramp_verified: true, minseok_checked_ramp: true, entrance_controlled: true, reporting_return_state: 'reinforced' });
  });
});

// Independent outcome table from the Director priorities: three ramp decisions × three entrance decisions.
const lowSignal = ['CONTROLLED_DELAY', 'CONTROLLED_DELAY', 'RELATION_CONFLICT'];
const origins: { plan: EpisodeDecisions['plan']; signal?: EpisodeDecisions['signal']; rows: string[][] }[] = [
  { plan: 'delegate_kang', rows: [lowSignal, lowSignal, lowSignal] },
  { plan: 'negotiate_yoon', rows: [lowSignal, lowSignal, lowSignal] },
  { plan: 'coordinate_schedule', rows: [lowSignal, lowSignal, ['NEAR_MISS', 'NEAR_MISS', 'RELATION_CONFLICT']] },
  { plan: 'follow_junho', signal: 'dismiss', rows: [lowSignal, lowSignal, lowSignal] },
  { plan: 'follow_junho', signal: 'listen_more', rows: [
    ['BEST_CONTROL', 'BEST_CONTROL', 'RELATION_CONFLICT'], ['BEST_CONTROL', 'BEST_CONTROL', 'RELATION_CONFLICT'], lowSignal,
  ] },
];
const cases = origins.flatMap(origin => (['check_self', 'ask_minseok', 'keep_schedule'] as const).flatMap((ramp, i) =>
  (['assign_crew', 'request_delay', 'force_clear'] as const).map((entrance, j) => ({
    label: `${origin.plan}/${origin.signal ?? 'no_signal'}/${ramp}/${entrance}`,
    decisions: { plan: origin.plan, signal: origin.signal, ramp, entrance, evening: 'rest' as const },
    result: origin.rows[i]![j]!,
  }))));

describe('Episode 01 exhaustive reachable command decisions', () => {
  it.each(cases)('$label resolves exactly one result: $result', ({ decisions, result }) => {
    const { state, trace } = playEpisode(decisions);
    expect(state.flags.pump_result).toBe(result);
    expect(state.flags.episode01_completed).toBe(true);
    expect(state.event_runtime.finished_instances.every(i => i.status === 'COMPLETED')).toBe(true);
    for (const item of trace) for (const p of item.presentation) {
      if (p.type === 'SHOW_CHOICE' && (p.instance_id.endsWith('e01_06_pump_arrival') ||
        p.instance_id.endsWith('e01_08_reactions') || p.instance_id.endsWith('e01_08a_reporting_return'))) {
        expect(p.choices.filter(c => c.enabled)).toHaveLength(1);
      }
    }
    if (decisions.signal === 'dismiss') {
      expect(state.flags).toMatchObject({ junho_opened_up: false, ramp_signal_known: false, reporting_return_state: 'suppressed' });
      expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(22);
    }
  });

  it('shows Kang positive response at the trust boundary and delayed reporting fallout after dismissal', () => {
    const kang = playEpisode({ plan: 'delegate_kang', ramp: 'check_self', entrance: 'request_delay', evening: 'rest' }).state;
    expect(getRelation(kang.relations, 'kang_taesik', 'player')!.trust).toBe(38);
    expect(kang.event_runtime.finished_instances.find(i => i.event_id === 'e01_08_reactions')!.selected_choice_ids).toContain('kang.high');
    const junho = playEpisode({ plan: 'follow_junho', signal: 'dismiss', ramp: 'check_self', entrance: 'request_delay', evening: 'rest' }).state;
    expect(junho.event_runtime.finished_instances.find(i => i.event_id === 'e01_08_reactions')!.selected_choice_ids).toContain('junho.high');
    expect(junho.event_runtime.finished_instances.find(i => i.event_id === 'e01_08a_reporting_return')!.selected_choice_ids)
      .toEqual(['reporting_return_suppressed']);
    expect(getRelation(junho.relations, 'lim_junho', 'player')!.reporting).toBe(22);
  });
});

describe('Episode 01 deliberately broken content', () => {
  const mutations: { name: string; mutate: (input: ReturnType<typeof copyData<ContentBundle>>) => void }[] = [
    { name: 'character ID', mutate: c => { c.characters[1]!.id = 'missing.character'; } },
    { name: 'directed relation', mutate: c => { c.relations = c.relations.filter(r => !(r.from_id === 'kang_taesik' && r.to_id === 'player')); } },
    { name: 'event condition reference', mutate: c => { c.events[1]!.conditions = [{ kind: 'event_completed', event_id: 'missing.event', minimum_count: 1 }]; } },
    { name: 'node reference', mutate: c => { c.events[0]!.dialogue[0]!.next_node_id = 'missing.node'; } },
    { name: 'choice reference', mutate: c => { c.events[2]!.dialogue.find(n => n.type === 'CHOICE')!.choice_ids.push('missing.choice'); } },
    { name: 'localization key', mutate: c => { delete c.localizations[0]!.messages['ep01.plan.a']; } },
    { name: 'participant reference', mutate: c => { c.events[1]!.dialogue[0]!.speaker_role_id = 'missing.role'; } },
    { name: 'contextual effect reference', mutate: c => { c.events[4]!.choices[1]!.effects.immediate_effects = [{
      kind: 'context_relation', effect_id: 'missing.context', from: { kind: 'participant', role_id: 'missing.role' },
      to: { kind: 'player' }, field: 'reporting', delta: 3,
    }]; } },
    { name: 'fixed stat reference', mutate: c => { c.events[2]!.choices[2]!.effects.immediate_effects = [{
      kind: 'stat', effect_id: 'missing.stat', character_id: 'player', stat_id: 'missing.stat', delta: 2,
    }]; } },
  ];
  it.each(mutations)('rejects broken $name', ({ mutate }) => {
    const input = copyData(episodeContent);
    mutate(input);
    expect(() => new ContentRegistry(input)).toThrow();
  });

  it('starts with arrival only in a fresh run', () => {
    const state = createRun(episodeContent, episodeOptions(), episodeBounds);
    expect(eventCandidates(state, episodeContent, 'foundation').map(c => c.event_id)).toEqual(['e01_01_arrival']);
  });
});