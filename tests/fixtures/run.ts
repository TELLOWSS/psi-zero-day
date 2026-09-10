import { ContentRegistry } from '../../src/content/registry';
import { createRun, CoreEngine } from '../../src/engine';
import type { EffectContext, NewRunOptions, ProgressBounds } from '../../src/engine';
import type { EffectBundle } from '../../src/domain';
import { validFixture } from './content';

export const bounds: ProgressBounds = { FOUNDATION: { min: 0, max: 100 } }; // Test-only scale.
export const context: EffectContext = { event_id: 'fixture.event', event_instance_id: 'instance.1',
  bundle_id: 'choice.choose', choice_id: 'choose', participant_bindings: { subject: 'fixture.a' } };
export function emptyBundle(): EffectBundle {
  return { immediate_effects: [], hidden_effects: [], relationship_effects: [], stat_effects: [],
    flags: {}, ending_flags: {}, followup_events: [] };
}
export function runOptions(seed = 42): NewRunOptions {
  return {
    run_id: 'test.run', seed, playthrough: 1, rules_version: 'test.rules', clock: { day: 18, slot: 'PRE_WORK', display_time: '08:40' },
    player: { character_id: 'fixture.b', archetype_id: 'test.type', health: 10, fatigue: 0, stress: 0,
      money: 0, family: {}, company_evaluation: 0, reputation: 0, integrity: 0,
      career: { flags: {}, values: {} }, dark_path: { flags: {}, values: {} }, legal_status: {}, safety_record: {} },
    character_runtime: { 'fixture.a': { morale: 0, fatigue: 0, availability: { available: true }, revealed_fields: [] } },
    construction: { stage_id: 'FOUNDATION', progress_by_stage: { FOUNDATION: 10 }, milestones: [] },
    audio: { bgm: null, ambience: [], sfx_bus: [], event_bus: [],
      volumes: { master: 1, bgm: 1, ambience: 1, sfx: 1, event: 1 }, muted: false, suspended: false },
    flags: { count: 1, known: true, label: 'test' },
  };
}
export function runtimeFixture(seed = 42) {
  const content = new ContentRegistry(validFixture()).getValidatedContent();
  const state = createRun(content, runOptions(seed), bounds);
  return { content, state, engine: new CoreEngine(state, content, bounds) };
}
