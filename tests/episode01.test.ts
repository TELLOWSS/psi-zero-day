import { describe, expect, it } from 'vitest';
import type { GameState } from '../src/domain';
import { createEpisode01Registry, episode01Manifest } from '../src/content/episode01';
import { CoreEngine, eventCandidates, getRelation } from '../src/engine';
import { createTranslator } from '../src/localization/translator';
import { episodeBounds, episodeContent, eventOrder, playEpisode } from './helpers/episode01-playthrough';
import type { EpisodeDecisions } from './helpers/episode01-playthrough';

const paths: { name: string; decisions: EpisodeDecisions; result: string; consequence: 'reinforced' | 'missed';
  relations: [number, number, number, number, number]; negotiation: number; analysis: number; reaction: string[] }[] = [
  { name: 'A', decisions: { plan: 'follow_junho', signal: 'listen_more', ramp: 'ask_minseok', entrance: 'assign_crew', evening: 'field_note' },
    result: 'BEST_CONTROL', consequence: 'reinforced', relations: [33, 28, 34, 40, 48], negotiation: 31, analysis: 40,
    reaction: ['kang.low', 'yoon.low', 'junho.high'] },
  { name: 'B', decisions: { plan: 'negotiate_yoon', ramp: 'check_self', entrance: 'request_delay', evening: 'study' },
    result: 'CONTROLLED_DELAY', consequence: 'missed', relations: [30, 33, 37, 20, 45], negotiation: 32, analysis: 39,
    reaction: ['kang.low', 'yoon.high', 'junho.low'] },
  { name: 'C', decisions: { plan: 'coordinate_schedule', ramp: 'keep_schedule', entrance: 'assign_crew', evening: 'family' },
    result: 'NEAR_MISS', consequence: 'missed', relations: [33, 28, 38, 20, 45], negotiation: 33, analysis: 39,
    reaction: ['kang.low', 'yoon.low', 'junho.low'] },
  { name: 'D', decisions: { plan: 'delegate_kang', ramp: 'check_self', entrance: 'force_clear', evening: 'rest' },
    result: 'RELATION_CONFLICT', consequence: 'missed', relations: [33, 20, 34, 20, 45], negotiation: 31, analysis: 39,
    reaction: ['kang.low', 'yoon.low', 'junho.low'] },
];

const relationFields = [
  ['kang_taesik', 'trust'], ['yoon_sungho', 'respect'], ['lee_jaehoon', 'respect'],
  ['lim_junho', 'reporting'], ['choi_minseok', 'reporting'],
] as const;
const historyEvents = (state: GameState) => state.event_runtime.completion_history.map(item => item.event_id);
const realismFlags = {
  inspection_action: 'sequence', inspection_pushback: 'coordinated', inspection_result: 'accepted_after_sequence', inspection_closed: true,
  report_basis: 'timeline', report_result: 'timeline_confirmed',
} as const;
const pathFlags: Record<string, Record<string, boolean | string>> = {
  A: { followed_junho: true, junho_opened_up: true, ramp_signal_known: true, ramp_verified: true,
    minseok_checked_ramp: true, entrance_controlled: true, reporting_return_state: 'reinforced', ...realismFlags,
    evening_field_note: true, psi_seed_day01: true },
  B: { negotiated_rebar: true, ramp_verified: true, direct_ramp_check: true, pump_delayed: true,
    reporting_return_state: 'missed', ...realismFlags, evening_study: true },
  C: { schedule_first: true, ramp_unverified: true, entrance_controlled: true,
    reporting_return_state: 'missed', ...realismFlags, evening_family: true },
  D: { delegated_cleanup_kang: true, ramp_verified: true, direct_ramp_check: true, entrance_controlled: true,
    relation_conflict: true, reporting_return_state: 'missed', ...realismFlags, evening_rest: true },
};

describe('Episode 01 integrated vertical slice', () => {
  it('loads the expanded fictional cast, sixteen events and directed relationships', () => {
    const content = createEpisode01Registry().getValidatedContent();
    expect(content.characters.map(c => c.id)).toEqual(episode01Manifest.cast.map(c => c.runtime_id));
    expect(content.events.map(e => e.event_id)).toEqual(eventOrder);
    expect(content.characters).toHaveLength(8);
    expect(content.relations).toHaveLength(14);
    expect(content.characters.slice(1).map(c => [c.experience, c.initial_state.morale, c.initial_state.fatigue])).toEqual([
      [90, 75, 20], [86, 72, 22], [55, 68, 25], [12, 60, 15], [76, 74, 18], [82, 70, 20], [68, 70, 24],
    ]);
    expect(content.relations.filter(r => r.to_id === 'player').map(r =>
      [r.initial_state.trust, r.initial_state.respect, r.initial_state.reporting])).toEqual([
      [30, 25, 30], [30, 25, 30], [35, 30, 35], [25, 20, 20], [35, 40, 45], [30, 30, 25], [30, 30, 25],
    ]);
    expect(content.endings).toEqual([]);
    expect(content.asset_manifest.assets).toEqual([]);
  });

  it.each(paths)('plays PATH $name through relationship, inspection and responsibility consequences', path => {
    const { initial, state, trace } = playEpisode(path.decisions);
    const expectedEvents = eventOrder.filter(id => path.decisions.plan === 'follow_junho' || id !== 'e01_04_junho_signal');
    expect(historyEvents(state)).toEqual(expectedEvents);
    expect(state.event_runtime.finished_instances.map(item => item.event_id)).toEqual(expectedEvents);
    expect(state.event_runtime.finished_instances.every(item => item.status === 'COMPLETED')).toBe(true);
    expect(state.event_runtime.active_instance).toBeNull();
    expect(state.flags).toEqual({ ...pathFlags[path.name], pump_result: path.result, first_pour_completed: true, episode01_completed: true });
    expect(state.player.stats.negotiation).toBe(path.negotiation);
    expect(state.player.stats.analysis).toBe(path.analysis);
    expect(state.player.stats.learning).toBe(path.decisions.evening === 'study' ? 41 : 40);
    expect(relationFields.map(([id, field]) => getRelation(state.relations, id, 'player')![field])).toEqual(path.relations);
    expect(getRelation(state.relations, 'seo_jeongmin', 'player')).toMatchObject({ trust: 32, respect: 32 });
    expect(getRelation(state.relations, 'oh_seungjae', 'player')).toMatchObject({ trust: 32, respect: 31 });
    expect(state.relations.filter(r => r.from_id === 'player')).toEqual(initial.relations.filter(r => r.from_id === 'player'));
    expect(state.construction.progress_by_stage).toEqual({ FOUNDATION: 14 });
    expect(state.psi).toEqual(initial.psi);
    expect(state.ending_runtime).toEqual(initial.ending_runtime);
    expect(state.clock).toEqual({ day: 2, slot: 'PRE_WORK' });

    const expectedChoices = [path.decisions.plan, ...(path.decisions.signal ? [path.decisions.signal] : []),
      path.decisions.ramp, path.decisions.entrance, path.result.toLowerCase(), ...path.reaction,
      `reporting_return_${path.consequence}`, 'inspection_sequence_agreement', 'pushback_sequence', 'reinspection_accept_sequence',
      'report_verify_timeline', 'report_return_timeline_confirmed', path.decisions.evening];
    expect(state.event_runtime.choice_history.map(item => item.choice_id)).toEqual(expectedChoices);
    expect(new Set(state.event_runtime.applied_effect_ids).size).toBe(state.event_runtime.applied_effect_ids.length);

    const texts = trace.flatMap(item => item.presentation.flatMap(p => 'text_id' in p ? [p.text_id] : []));
    expect(texts).toContain(`ep01.pump.${path.result.toLowerCase()}`);
    expect(texts).toContain(`ep01.reporting_return.${path.consequence}`);
    expect(texts).toContain('ep01.reinspection.accept_sequence');
    expect(texts).toContain('ep01.report_return.timeline_confirmed');
    expect(eventCandidates(state, episodeContent, 'foundation')).toEqual([]);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it.each(paths)('replays and JSON-resumes PATH $name deterministically', path => {
    const baseline = playEpisode(path.decisions, { seed: 741 });
    expect(playEpisode(path.decisions, { seed: 741 })).toEqual(baseline);
    expect(playEpisode(path.decisions, { seed: 741, resumeEveryCommand: true })).toEqual(baseline);
    const original = new CoreEngine(baseline.state, episodeContent, episodeBounds);
    const resumed = new CoreEngine(JSON.parse(JSON.stringify(baseline.state)) as GameState, episodeContent, episodeBounds);
    expect(Array.from({ length: 3 }, () => original.dispatch({ type: 'draw_random' }).value))
      .toEqual(Array.from({ length: 3 }, () => resumed.dispatch({ type: 'draw_random' }).value));
  });

  it('resolves every presentation text in Korean without exposing internal result labels', () => {
    const translate = createTranslator(episodeContent.localizations, 'ko');
    for (const path of paths) for (const item of playEpisode(path.decisions).trace) for (const p of item.presentation) {
      if ('text_id' in p) expect(translate(p.text_id)).toBeTruthy();
      if (p.type === 'SHOW_CHOICE') for (const choice of p.choices) expect(translate(choice.text_id)).toBeTruthy();
    }
  });
});

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

describe('Episode 01 exhaustive reachable safety decisions', () => {
  it.each(cases)('$label resolves exactly one pump result and completes the realism chain', ({ decisions, result }) => {
    const { state, trace } = playEpisode(decisions);
    expect(state.flags.pump_result).toBe(result);
    expect(state.flags).toMatchObject({ inspection_closed: true, report_result: 'timeline_confirmed', episode01_completed: true });
    expect(state.event_runtime.finished_instances.every(i => i.status === 'COMPLETED')).toBe(true);
    for (const item of trace) for (const p of item.presentation) {
      if (p.type === 'SHOW_CHOICE' && [
        'e01_06_pump_arrival', 'e01_08_reactions', 'e01_08a_reporting_return', 'e01_08c_site_pushback',
        'e01_08d_reinspection', 'e01_08f_report_return',
      ].some(id => p.instance_id.endsWith(id))) expect(p.choices.filter(c => c.enabled)).toHaveLength(1);
    }
    if (decisions.signal === 'dismiss') {
      expect(state.flags).toMatchObject({ junho_opened_up: false, ramp_signal_known: false, reporting_return_state: 'suppressed' });
      expect(getRelation(state.relations, 'lim_junho', 'player')!.reporting).toBe(22);
    }
  });
});
