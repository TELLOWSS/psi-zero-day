import type { EventDefinition } from '../../src/domain';
import { ContentRegistry } from '../../src/content/registry';
import { CoreEngine, createRun } from '../../src/engine';
import { validFixture } from './content';
import type { Mutable } from './content';
import { bounds, emptyBundle, runOptions } from './run';

/** Synthetic graph only. Reuses TASK-001's two definitions, NPCs and localized fixture text. */
export function eventContent() {
  const input = validFixture();
  const first: EventDefinition = {
    ...input.events[0]!, runtime: { chapter_id: 'test.chapter', trigger: 'normal', repeat_policy: { kind: 'once' },
      required_flags: { known: true }, selection_policy: { priority: 2 }, missing_participant_policy: 'exclude' },
    entry_node_id: 'intro',
    dialogue: [
      { type: 'DIALOGUE', node_id: 'intro', text_id: 'fixture.text', speaker_role_id: 'subject', next_node_id: 'first', choice_ids: [] },
      { type: 'CHOICE', node_id: 'first', text_id: 'fixture.text', choice_ids: ['choose'] },
      { type: 'RESULT', node_id: 'result', text_id: 'fixture.text', choice_ids: [], next_node_id: 'second',
        effects: { ...emptyBundle(), stat_effects: [{ effect_id: 'result.stat', kind: 'stat', character_id: 'fixture.a', stat_id: 'test_stat', delta: 1 }] } },
      { type: 'CHOICE', node_id: 'second', text_id: 'fixture.text', choice_ids: ['again'] },
      { type: 'END', node_id: 'end', text_id: 'fixture.text', choice_ids: [], outcome: 'completed',
        effects: { ...emptyBundle(), flags: { finished: true } } },
    ],
    choices: [
      { choice_id: 'choose', text_id: 'fixture.text', requirements: [{ kind: 'flag', flag_id: 'known', equals: true }], next_node_id: 'result',
        effects: { ...emptyBundle(), immediate_effects: [{ effect_id: 'first.stat', kind: 'player_stat', stat_id: 'test_stat', delta: 2 }] } },
      { choice_id: 'again', text_id: 'fixture.text', requirements: [], next_node_id: 'end', effects: { ...emptyBundle(),
        followup_events: [{ followup_id: 'next', event_id: 'fixture.followup', delay: { days: 75, slot: 'MORNING' }, conditions: [], unmet_policy: 'defer' }] } },
    ],
  };
  const followup: EventDefinition = {
    ...input.events[1]!, runtime: { ...first.runtime!, trigger: 'followup', repeat_policy: { kind: 'repeatable' } },
    participants: [{ role_id: 'subject', selector: { stats: [], relations: [] } }],
    entry_node_id: 'intro', dialogue: [
      { type: 'DIALOGUE', node_id: 'intro', text_id: 'fixture.text', speaker_role_id: 'subject', next_node_id: 'end', choice_ids: [] },
      { type: 'END', node_id: 'end', text_id: 'fixture.text', choice_ids: [], outcome: 'completed' },
    ],
  };
  input.events = [structuredClone(first), structuredClone(followup)] as Mutable<EventDefinition>[];
  return input;
}
export function eventFixture(input = eventContent()) {
  const content = new ContentRegistry(input).getValidatedContent();
  const state = createRun(content, { ...runOptions(), chapter_id: 'test.chapter' }, bounds);
  return { content, state, engine: new CoreEngine(state, content, bounds) };
}
export const startCommand = { type: 'start_event' as const, event_id: 'fixture.event', instance_id: 'test.instance', chapter_id: 'test.chapter' };
export function firstChoice(engine: CoreEngine) {
  engine.dispatch(startCommand);
  engine.dispatch({ type: 'advance_event', instance_id: 'test.instance', node_id: 'intro' });
}
export function completeEvent(engine: CoreEngine) {
  firstChoice(engine);
  engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'first', choice_id: 'choose' });
  engine.dispatch({ type: 'advance_event', instance_id: 'test.instance', node_id: 'result' });
  engine.dispatch({ type: 'choose_event', instance_id: 'test.instance', node_id: 'second', choice_id: 'again' });
}
