export function assembleEpisode01Consequences(baseEvents: readonly any[], additions: readonly any[]) {
  const gate = { kind: 'event_completed', event_id: 'e01_08a_reporting_return', minimum_count: 1 };
  return baseEvents.flatMap(event => {
    const next = event.event_id === 'e01_09_evening'
      ? { ...event, conditions: [...event.conditions, gate] }
      : event;
    return event.event_id === 'e01_08_reactions' ? [next, ...additions] : [next];
  });
}
