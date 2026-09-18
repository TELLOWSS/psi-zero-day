import type { EventDefinition, GameState } from '../domain';

export interface EpisodeReviewEntry {
  readonly key: string;
  readonly event_id: string;
  readonly event_text_id: string;
  readonly choice_text_id: string;
  readonly result_text_id?: string;
}

/** Recounts the actual run; never scores the player or reveals unvisited branches. */
export function projectEpisodeReview(state: GameState, events: readonly EventDefinition[]): readonly EpisodeReviewEntry[] {
  const instances = new Map(state.event_runtime.finished_instances.map(item => [item.instance_id, item]));
  const definitions = new Map(events.map(event => [event.event_id, event]));
  return state.event_runtime.choice_history.flatMap((record, index) => {
    const instance = instances.get(record.instance_id);
    const event = instance && definitions.get(instance.event_id);
    const choice = event?.choices.find(item => item.choice_id === record.choice_id);
    if (!instance || !event || !choice) return [];
    const result = event.dialogue.find(node => node.node_id === choice.next_node_id
      && node.type === 'RESULT' && instance.visited_node_ids.includes(node.node_id));
    return [{
      key: `${record.instance_id}/${record.choice_id}/${index}`,
      event_id: event.event_id,
      event_text_id: event.title_text_id,
      choice_text_id: choice.text_id,
      ...(result ? { result_text_id: result.text_id } : {}),
    }];
  });
}
