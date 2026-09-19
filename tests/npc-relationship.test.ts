import { describe, expect, it } from 'vitest';
import { ContentRegistry } from '../src/content/registry';
import { CoreEngine, applyEffectBundle, applyNpcRelationshipDelta, clampRelationship, createRun, evaluateCondition,
  getDialogueView, getNpcRelationship, inspectRelationshipDeltas, relationshipValues } from '../src/engine';
import type { EffectContext } from '../src/engine';
import type { GameState, RelationshipMetric } from '../src/domain';
import { copyData } from '../src/engine/data';
import { restoreRelationships, serializeRelationships } from '../src/persistence/relationships';
import { episodeBounds, episodeContent, episodeOptions, playEpisode } from './helpers/episode01-playthrough';
import { emptyBundle } from './fixtures/run';

const fresh = () => createRun(episodeContent, episodeOptions(), episodeBounds);
const context = (id = '1'): EffectContext => ({ event_id: 'e01_03_plan_breaks', event_instance_id: `test.relation.${id}`,
  choice_id: 'delegate_kang', bundle_id: 'choice.delegate_kang', participant_bindings: { lee: 'lee_jaehoon', kang: 'kang_taesik', yoon: 'yoon_sungho' } });
const delta = (state: GameState, metric: RelationshipMetric, amount: number, id = '1') => applyNpcRelationshipDelta(state,
  { npc_id: 'kang_taesik', metric, delta: amount, effect_id: 'kang_taesik.trust.increase' }, context(id), episodeContent, episodeBounds);
const normalPath = { plan: 'delegate_kang', ramp: 'check_self', entrance: 'request_delay', evening: 'rest' } as const;

describe('canonical bounded NPC relationships', () => {
  it('initializes authored values once with REPORT mapped to reporting and explicit COMPLIANCE', () => {
    const state = fresh();
    expect(relationshipValues(getNpcRelationship(state, 'kang_taesik'))).toEqual({ TRUST: 30, RESPECT: 25, REPORT: 30, COMPLIANCE: 50 });
    for (const npc of Object.keys(state.characters)) {
      const relation = getNpcRelationship(state, npc);
      expect(relation.bounds).toEqual({ min: 0, max: 100 });
      expect(relation.compliance).toBe(50);
      expect(inspectRelationshipDeltas(state, npc)).toEqual([]);
    }
    expect(() => getNpcRelationship(state, 'missing.npc')).toThrow('Unknown NPC');
    expect(() => getNpcRelationship(state, 'player')).toThrow('Unknown NPC');
  });

  it.each(['TRUST', 'RESPECT', 'REPORT', 'COMPLIANCE'] as const)('applies bounded positive and negative %s deltas with exact history', metric => {
    const initial = fresh();
    const before = relationshipValues(getNpcRelationship(initial, 'kang_taesik'))[metric];
    const positive = delta(initial, metric, 200);
    expect(relationshipValues(getNpcRelationship(positive, 'kang_taesik'))[metric]).toBe(100);
    const negative = delta(positive, metric, -250, '2');
    expect(relationshipValues(getNpcRelationship(negative, 'kang_taesik'))[metric]).toBe(0);
    const history = inspectRelationshipDeltas(negative, 'kang_taesik');
    expect(history.map(d => [d.before, d.after, d.requested_delta, d.applied_delta])).toEqual([[before, 100, 200, 100 - before], [100, 0, -250, -100]]);
    expect(history[0]!.source).toMatchObject({ event_id: 'e01_03_plan_breaks', choice_id: 'delegate_kang', at: { day: 1, slot: 'PRE_WORK' } });
    expect(negative.relations.filter(r => r.from_id === 'player')).toEqual(initial.relations.filter(r => r.from_id === 'player'));
    expect(initial.run.rng).toEqual(negative.run.rng);
    expect(inspectRelationshipDeltas(initial, 'kang_taesik')).toEqual([]);
  });

  it('records saturation with zero applied delta and blocks duplicate effect/history entries', () => {
    const first = delta(fresh(), 'TRUST', 100);
    const second = delta(first, 'TRUST', 4, '2');
    expect(inspectRelationshipDeltas(second, 'kang_taesik')[1]).toMatchObject({ requested_delta: 4, applied_delta: 0, before: 100, after: 100 });
    expect(delta(second, 'TRUST', 4, '2')).toBe(second);
    expect(inspectRelationshipDeltas(second, 'kang_taesik')).toHaveLength(2);
  });

  it('clamps explicitly and rejects invalid numeric inputs/bounds', () => {
    expect(clampRelationship(-8, { min: 0, max: 100 })).toBe(0);
    expect(clampRelationship(101, { min: 0, max: 100 })).toBe(100);
    expect(clampRelationship(28, { min: 0, max: 100 })).toBe(28);
    expect(() => clampRelationship(NaN, { min: 0, max: 100 })).toThrow();
    expect(() => clampRelationship(2, { min: 10, max: 0 })).toThrow();
  });

  it('uses COMPLIANCE in the existing data condition evaluator', () => {
    const state = delta(fresh(), 'COMPLIANCE', 7);
    expect(evaluateCondition(state, { kind: 'relation', from_id: 'kang_taesik', to_id: 'player', field: 'compliance', operator: 'gte', value: 57 })).toBe(true);
    expect(evaluateCondition(state, { kind: 'context_relation', from: { kind: 'participant', role_id: 'kang' }, to: { kind: 'player' },
      field: 'compliance', operator: 'gt', value: 57 }, context())).toBe(false);
  });

  it('rolls back values, relationship history and ledger if a later effect fails', () => {
    const state = fresh(); const before = JSON.stringify(state);
    expect(() => applyEffectBundle(state, { ...emptyBundle(), immediate_effects: [
      { kind: 'relation', effect_id: 'increase', from_id: 'kang_taesik', to_id: 'player', field: 'trust', delta: 8 },
      { kind: 'context_relation', effect_id: 'fail', from: { kind: 'participant', role_id: 'absent' }, to: { kind: 'player' }, field: 'respect', delta: 1 },
    ] }, context(), episodeContent, episodeBounds)).toThrow();
    expect(JSON.stringify(state)).toBe(before);
  });

  it('serializes/restores relationship values and every source delta after a full episode', () => {
    const run = playEpisode(normalPath);
    const restored = restoreRelationships(serializeRelationships(run.state.relations), episodeContent);
    expect(restored).toEqual(run.state.relations);
    expect(Object.isFrozen(restored)).toBe(true);
    expect(playEpisode(normalPath).state).toEqual(run.state);
    expect(playEpisode(normalPath, { resumeEveryCommand: true }).state).toEqual(run.state);
    expect(inspectRelationshipDeltas(run.state, 'kang_taesik')[0]!.source.choice_id).toBe('delegate_kang');
  });

  it.each(['bounds', 'value', 'history', 'npc', 'duplicate', 'source', 'missing'] as const)('rejects corrupt serialized %s data', corruption => {
    const state = playEpisode(normalPath).state;
    const saved = copyData(state.relations); const relation = saved.find(r => r.from_id === 'kang_taesik' && r.to_id === 'player')!;
    switch (corruption) {
      case 'bounds': relation.bounds!.max = 200; break;
      case 'value': relation.compliance = 120; break;
      case 'history': relation.delta_history![0]!.applied_delta = 2; break;
      case 'npc': relation.from_id = 'missing.npc'; break;
      case 'duplicate': saved.push(copyData(relation)); break;
      case 'source': relation.delta_history![0]!.source.event_id = 'missing.event'; break;
      case 'missing': saved.pop(); break;
    }
    expect(() => restoreRelationships(JSON.stringify(saved), episodeContent)).toThrow();
  });
});

describe('NPC dialogue projection and existing event execution', () => {
  function signal(content = episodeContent) {
    const run = playEpisode({ ...normalPath, plan: 'follow_junho', signal: 'listen_more' });
    const engine = new CoreEngine(run.checkpoints.e01_04_junho_signal!, content, episodeBounds);
    engine.dispatch({ type: 'start_event', event_id: 'e01_04_junho_signal', instance_id: 'test.signal', chapter_id: 'foundation' });
    return engine;
  }
  it('projects speaker, silhouette, response consequences and next transitions from JSON', () => {
    const engine = signal();
    const view = getDialogueView(engine.getState(), episodeContent)!;
    expect(view).toMatchObject({ speaker_id: 'lim_junho', text_id: 'ep01.junho.signal', visual_reference: { kind: 'character', id: 'lim_junho' }, next_node_id: 'detail' });
    engine.dispatch({ type: 'advance_event', instance_id: 'test.signal', node_id: 'signal' });
    expect(getDialogueView(engine.getState(), episodeContent)).toMatchObject({ text_id: 'ep01.junho.detail', next_node_id: 'listen' });
    engine.dispatch({ type: 'advance_event', instance_id: 'test.signal', node_id: 'detail' });
    const before = engine.getState(); const responses = getDialogueView(before, episodeContent)!;
    expect(responses.speaker_id).toBe('lim_junho');
    expect(responses.responses.map(r => r.choice_id)).toEqual(['listen_more', 'crosscheck_minseok', 'dismiss']);
    expect(responses.responses[0]!.consequences).not.toEqual(responses.responses[1]!.consequences);
    expect(engine.getState()).toBe(before);
  });

  it.each(['listen_more', 'dismiss'] as const)('applies %s response consequences through the same event command', choice => {
    const engine = signal();
    engine.dispatch({ type: 'advance_event', instance_id: 'test.signal', node_id: 'signal' });
    engine.dispatch({ type: 'advance_event', instance_id: 'test.signal', node_id: 'detail' });
    engine.dispatch({ type: 'choose_event', instance_id: 'test.signal', node_id: 'listen', choice_id: choice });
    const state = engine.getState();
    expect(getNpcRelationship(state, 'lim_junho').reporting).toBe(choice === 'listen_more' ? 36 : 28);
    expect(state.flags.ramp_signal_known).toBe(choice === 'listen_more');
    expect(state.event_runtime.completion_history.at(-1)?.event_id).toBe('e01_04_junho_signal');
  });

  it('exposes relationship/session requirements and rejects unmet responses without mutations', () => {
    const input = copyData(episodeContent);
    input.events[3]!.choices[0]!.requirements = [{ kind: 'context_relation', from: { kind: 'participant', role_id: 'junho' },
      to: { kind: 'player' }, field: 'reporting', operator: 'gte', value: 30 }, { kind: 'flag', flag_id: 'followed_junho', equals: true }];
    const content = new ContentRegistry(input).getValidatedContent(); const engine = signal(content);
    engine.dispatch({ type: 'advance_event', instance_id: 'test.signal', node_id: 'signal' });
    engine.dispatch({ type: 'advance_event', instance_id: 'test.signal', node_id: 'detail' });
    const state = engine.getState(); const view = getDialogueView(state, content)!;
    expect(view.responses[0]!.enabled).toBe(false);
    expect(view.responses[1]!.enabled).toBe(true);
    expect(view.responses[2]!.enabled).toBe(true);
    expect(view.responses[0]!.conditions).toHaveLength(2);
    expect(() => engine.dispatch({ type: 'choose_event', instance_id: 'test.signal', node_id: 'listen', choice_id: 'listen_more' })).toThrow();
    expect(engine.getState()).toBe(state);
    expect(JSON.parse(JSON.stringify(view))).toEqual(view);
  });

  it('changes later Kang dialogue after delegating versus negotiating with another NPC', () => {
    const delegated = playEpisode(normalPath).state;
    const negotiated = playEpisode({ ...normalPath, plan: 'negotiate_yoon' }).state;
    const reactions = (state: GameState) => state.event_runtime.finished_instances.find(i => i.event_id === 'e01_08_reactions')!.selected_choice_ids;
    expect(reactions(delegated)).toContain('kang.high');
    expect(reactions(negotiated)).toContain('kang.low');
    expect(getNpcRelationship(delegated, 'kang_taesik').trust).toBe(38);
    expect(getNpcRelationship(negotiated, 'kang_taesik').trust).toBe(30);
  });

  it.each(['npc', 'dialogue', 'portrait', 'policy', 'bounds'] as const)('rejects invalid dialogue/relationship %s content', variant => {
    const content = copyData(episodeContent);
    switch (variant) {
      case 'npc': content.events[3]!.participants[0]!.character_id = 'missing.npc'; break;
      case 'dialogue': content.events[3]!.choices[0]!.next_node_id = 'missing.dialogue'; break;
      case 'portrait': content.characters[4]!.asset_bindings.portrait = 'missing.portrait'; break;
      case 'policy': content.relationship_policy!.initial_compliance = 200; break;
      case 'bounds': content.relations[0]!.initial_state.trust = 101; break;
    }
    expect(() => new ContentRegistry(content)).toThrow();
  });
});
