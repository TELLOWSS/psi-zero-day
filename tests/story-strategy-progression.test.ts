import { expect, it } from 'vitest';
import { EpisodeSession } from '../src/app/episode-session';
import { episodeOptions, episodeBounds } from './helpers/episode01-playthrough';
import { projectStrategyActions, isStrategyFieldActionEvent } from '../src/app/strategy-actions';

it.each([0, 1, 2, 3])('completes the directed story with choice preference %i without a strategy dead end', preference => {
  const session = EpisodeSession.directed(episodeOptions(123 + preference), episodeBounds);
  expect(session.start(0)).toBe(true);
  let strategyChoices = 0;
  for (let step = 0; step < 900; step++) {
    const snapshot = session.getSnapshot();
    expect(snapshot.phase).not.toBe('error');
    if (snapshot.phase === 'complete') {
      expect(strategyChoices).toBeGreaterThan(5);
      return;
    }
    const command = snapshot.presentation.find(item => 'node_id' in item);
    if (!command) {
      const finished = snapshot.state?.event_runtime.finished_instances.at(-1);
      expect(finished).toBeDefined();
      expect(session.confirmFieldOutcome(finished!.instance_id, snapshot.revision)).toBe(true);
    } else if (command.type === 'SHOW_CHOICE') {
      const enabled = command.choices.filter(choice => choice.enabled);
      expect(enabled.length).toBeGreaterThan(0);
      const eventId = snapshot.state?.event_runtime.active_instance?.event_id ?? null;
      if (isStrategyFieldActionEvent(eventId)) {
        strategyChoices++;
        expect(projectStrategyActions(eventId, command).filter(action => action.enabled).length).toBe(enabled.length);
      }
      const choice = enabled[Math.min(preference, enabled.length - 1)]!;
      expect(session.dispatch({ type:'choose_event', instance_id:command.instance_id, node_id:command.node_id, choice_id:choice.choice_id }, snapshot.revision)).toBe(true);
    } else {
      expect(session.dispatch({ type:'advance_event', instance_id:command.instance_id, node_id:command.node_id }, snapshot.revision)).toBe(true);
    }
  }
  throw new Error(`Story stalled for preference ${preference}`);
});
